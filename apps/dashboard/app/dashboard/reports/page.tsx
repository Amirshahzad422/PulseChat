import { createClient } from '@/lib/supabase/server'
import ReportsView from '@/components/dashboard/reports-view'

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: staff } = await supabase
    .from('staff')
    .select('account_id')
    .eq('user_id', user?.id)
    .single()

  const { data: bots } = await supabase
    .from('bots')
    .select('id, name, brand_color, status')
    .eq('account_id', staff?.account_id)

  const botIdList = bots?.map((b) => b.id) || []

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, bot_id, started_at, visitor_session')
    .in('bot_id', botIdList)
    .gte('started_at', since.toISOString())

  const convIds = conversations?.map((c) => c.id) || []
  const convById = new Map(conversations?.map((c) => [c.id, c]))

  const { data: messages } = convIds.length
    ? await supabase
        .from('messages')
        .select('conversation_id, created_at')
        .in('conversation_id', convIds)
        .gte('created_at', since.toISOString())
    : { data: [] }

  const dailyMap = new Map<string, number>()
  const botStats = new Map<string, { conversations: Set<string>; messages: number }>()
  bots?.forEach((b) => botStats.set(b.id, { conversations: new Set(), messages: 0 }))

  const visitors = new Set<string>()

  conversations?.forEach((c) => {
    const bot = botStats.get(c.bot_id)
    bot?.conversations.add(c.id)
    if (c.visitor_session) visitors.add(c.visitor_session)
  })

  messages?.forEach((m) => {
    const day = new Date(m.created_at).toISOString().slice(0, 10)
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1)

    const conv = convById.get(m.conversation_id)
    const bot = conv ? botStats.get(conv.bot_id) : undefined
    if (bot) bot.messages += 1
  })

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, messages]) => ({ date, messages }))

  const perBot = (bots || []).map((b) => {
    const s = botStats.get(b.id)!
    const convCount = s.conversations.size
    return {
      name: b.name,
      brandColor: b.brand_color,
      conversations: convCount,
      messages: s.messages,
      avg: convCount > 0 ? Math.round(s.messages / convCount) : 0,
    }
  })

  const data = {
    totalConversations: conversations?.length || 0,
    totalMessages: messages?.length || 0,
    activeBots: (bots || []).filter((b) => b.status === 'active').length,
    visitors: visitors.size,
    daily,
    perBot,
    rawRows: perBot.map((p) => [p.name, String(p.conversations), String(p.messages), String(p.avg)]),
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <ReportsView data={data} />
    </div>
  )
}
