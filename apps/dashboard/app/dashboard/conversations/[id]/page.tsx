import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'

export default async function ConversationThreadPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: staff } = await supabase
    .from('staff')
    .select('account_id')
    .eq('user_id', user?.id)
    .single()

  const { data: bots } = await supabase
    .from('bots')
    .select('id')
    .eq('account_id', staff?.account_id)

  const botIdList = bots?.map((b) => b.id) || []

  const { data: conversation } = await supabase
    .from('conversations')
    .select(`id, visitor_session, started_at, bot_id, bots (name, brand_color)`)
    .eq('id', params.id)
    .single()

  const ownsConversation = conversation && botIdList.includes(conversation.bot_id)

  if (!ownsConversation) {
    return (
      <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Conversation not found</h3>
        <Link href="/dashboard/conversations" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Conversations
        </Link>
      </div>
    )
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  const bot = Array.isArray(conversation.bots) ? conversation.bots[0] : conversation.bots
  const botName = bot?.name || 'Bot'
  const brandColor = bot?.brand_color || '#3B82F6'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/conversations"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: brandColor }}
          >
            {botName.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-semibold">{botName}</h1>
            <p className="text-sm text-gray-600">
              {conversation.visitor_session} · started {new Date(conversation.started_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm p-6">
        {messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'visitor' ? 'justify-content-end flex-row-reverse' : ''}`}>
                {msg.role === 'bot' && (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {botName.charAt(0)}
                  </div>
                )}
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-lg px-4 py-2 text-sm ${
                      msg.role === 'visitor'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">No messages in this conversation.</p>
        )}
      </div>
    </div>
  )
}
