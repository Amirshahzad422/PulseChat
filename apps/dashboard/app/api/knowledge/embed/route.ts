import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { knowledge_id, content } = await request.json();

    if (!knowledge_id || !content) {
      return NextResponse.json({ error: 'knowledge_id and content are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate embedding using Gemini embedding model (768 dims to match VECTOR(768))
    const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Truncate content to fit within embedding model limits (~8000 tokens)
    const truncatedContent = content.substring(0, 30000);

    const result = await embeddingModel.embedContent({
      content: { role: 'user', parts: [{ text: truncatedContent }] },
      outputDimensionality: 768
    } as any);
    const embedding = result.embedding.values;

    // Update the knowledge source with the embedding
    const { error } = await supabase
      .from('knowledge_sources')
      .update({ embedding })
      .eq('id', knowledge_id);

    if (error) {
      console.error('Failed to save embedding:', error);
      return NextResponse.json({ error: 'Failed to save embedding' }, { status: 500 });
    }

    return NextResponse.json({ success: true, dimensions: embedding.length });

  } catch (error: any) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
