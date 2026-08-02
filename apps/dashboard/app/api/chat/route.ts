import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Rate limiting: simple in-memory store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30; // messages per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(botId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(botId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(botId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function ensureVisitorSession(visitorSession?: string): string {
  if (visitorSession && visitorSession.trim()) return visitorSession.trim();
  return 'visitor_' + Math.random().toString(36).slice(2, 11);
}

export async function POST(request: NextRequest) {
  try {
    const { bot_id, message, conversation_id, visitor_session } = await request.json();

    if (!bot_id || !message) {
      return NextResponse.json({ error: 'bot_id and message are required' }, { status: 400 });
    }

    // Rate limit check
    if (!checkRateLimit(bot_id)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
    }

    // Use service role key for server-side operations (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch bot config
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', bot_id)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (bot.status !== 'active') return NextResponse.json({ error: 'Bot is inactive' }, { status: 403 });

    const session = ensureVisitorSession(visitor_session);

    // 3. Resolve (or create) the conversation for this session.
    let conversationId: string | null = null;

    if (conversation_id) {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id, bot_id')
        .eq('id', conversation_id)
        .maybeSingle();
      if (existing && existing.bot_id === bot_id) {
        conversationId = existing.id;
      }
    }

    if (!conversationId) {
      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({ bot_id, visitor_session: session })
        .select('id')
        .single();
      if (createError || !created) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
      conversationId = created.id;
    }

    // 4. Save visitor message to database
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'visitor',
      content: message
    });

    // 5. Generate query embedding using Gemini text-embedding model
    let relevantDocs: { title: string; content: string; similarity: number }[] = [];

    try {
      const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const embeddingResult = await embeddingModel.embedContent({
        content: { role: 'user', parts: [{ text: message }] },
        outputDimensionality: 768
      } as any);
      const queryEmbedding = embeddingResult.embedding.values;

      // 3. Search knowledge base using pgvector similarity
      const { data: matches } = await supabase.rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_bot_id: bot_id,
        match_count: 3
      });

      if (matches && matches.length > 0) {
        relevantDocs = matches;
      }
    } catch (embeddingError) {
      console.error('Embedding/RAG error (continuing without RAG):', embeddingError);
      // Continue without RAG context
    }

    // 4. Build system prompt with persona + RAG context
    let systemPrompt = bot.persona_instructions || 'You are a helpful assistant.';

    if (relevantDocs.length > 0) {
      const contextBlocks = relevantDocs
        .map((doc, i) => `[Source ${i + 1}: ${doc.title}]\n${doc.content}`)
        .join('\n\n');
      systemPrompt += `\n\nUse the following knowledge base to answer the user's question. If the knowledge base doesn't contain relevant information, use your general knowledge but mention that the specific information wasn't found in your documents.\n\n--- Knowledge Base ---\n${contextBlocks}\n--- End Knowledge Base ---`;
    } else {
      systemPrompt += '\n\nNo specific knowledge base documents were found for this question. Answer using your general knowledge.';
    }

    // 5. Set up SSE streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            systemInstruction: systemPrompt
          });

          const chat = model.startChat({
            history: [],
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
            }
          });

          const result = await chat.sendMessageStream(message);

          for await (const chunk of result.stream) {
            // Filter out the model's internal reasoning/thinking parts so only
            // the final visible answer is streamed to the user.
            const parts = chunk.candidates?.[0]?.content?.parts ?? [];
            for (const part of parts) {
              const p = part as unknown as { thought?: boolean; thoughtSignature?: string; text?: string };
              const isThought = p.thought === true || typeof p.thoughtSignature === 'string';
              if (isThought || !p.text) continue;
              const text = p.text;
              if (text) {
                fullResponse += text;
                const sseData = `data: ${JSON.stringify({ token: text, done: false })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
              }
            }
          }

          // Send completion event
          const doneData = `data: ${JSON.stringify({ token: '', done: true })}\n\n`;
          controller.enqueue(encoder.encode(doneData));
          controller.close();

          // 6. Save bot response to database
          if (conversationId && fullResponse) {
            await supabase.from('messages').insert({
              conversation_id: conversationId,
              role: 'bot',
              content: fullResponse
            });
          }

        } catch (aiError: any) {
          console.error('Gemini streaming error:', aiError);
          const errorData = `data: ${JSON.stringify({ token: 'Sorry, I encountered an error. Please try again.', done: true })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'x-conversation-id': conversationId || '',
        'Access-Control-Expose-Headers': 'x-conversation-id',
      }
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
