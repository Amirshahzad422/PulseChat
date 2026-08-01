import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare, Search } from 'lucide-react'

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: { bot?: string; q?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: staff } = await supabase
    .from('staff')
    .select('account_id')
    .eq('user_id', user?.id)
    .single()

  const accountId = staff?.account_id

  const { data: bots } = await supabase
    .from('bots')
    .select('id, name')
    .eq('account_id', accountId)
    .order('name')

  const botIdList = bots?.map((b) => b.id) || []

  let query = supabase
    .from('conversations')
    .select(`
      id,
      visitor_session,
      started_at,
      bots (name, brand_color),
      messages (content, created_at)
    `)
    .in('bot_id', botIdList)
    .order('started_at', { ascending: false })
    .limit(50)

  if (searchParams.bot) {
    query = query.eq('bot_id', searchParams.bot)
  }
  if (searchParams.q) {
    query = query.ilike('visitor_session', `%${searchParams.q}%`)
  }

  const { data: conversations } = await query

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Conversations</h1>

      <form method="get" className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q}
            placeholder="Search visitor session..."
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          name="bot"
          defaultValue={searchParams.bot || ''}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All bots</option>
          {bots?.map((bot) => (
            <option key={bot.id} value={bot.id}>{bot.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Filter
        </button>
      </form>

      {conversations && conversations.length > 0 ? (
        <div className="rounded-lg border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Bot</th>
                <th className="px-4 py-3">Visitor</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Last Message</th>
                <th className="px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv) => {
                const msgCount = conv.messages?.length || 0
                const lastMsg = conv.messages?.reduce((a, b) =>
                  new Date(a.created_at) > new Date(b.created_at) ? a : b
                )
                return (
                  <tr key={conv.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/conversations/${conv.id}`} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: conv.bots?.[0]?.brand_color || '#3B82F6' }} />
                        <span className="font-medium">{conv.bots?.[0]?.name || 'Unknown Bot'}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <Link href={`/dashboard/conversations/${conv.id}`}>{conv.visitor_session}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{msgCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {lastMsg?.content || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(conv.started_at).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No conversations yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Conversations appear here when visitors chat with your bot.
          </p>
        </div>
      )}
    </div>
  )
}
