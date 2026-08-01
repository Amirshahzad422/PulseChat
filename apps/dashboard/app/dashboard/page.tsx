import { createClient } from '@/lib/supabase/server'
import { Bot, MessageSquare, MessagesSquare, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's account
  const { data: staff } = await supabase
    .from('staff')
    .select('account_id')
    .eq('user_id', user?.id)
    .single()

  const accountId = staff?.account_id

  // Get bot count
  const { count: botCount } = await supabase
    .from('bots')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)

  // Get bot IDs for this account
  const { data: botIds } = await supabase
    .from('bots')
    .select('id')
    .eq('account_id', accountId)

  const botIdList = botIds?.map(b => b.id) || []

  // Get conversation count
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .in('bot_id', botIdList)

  // Get message count
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .in('bot_id', botIdList)

  const conversationIds = conversations?.map(c => c.id) || []

  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)

  // Get recent conversations
  const { data: recentConversations } = await supabase
    .from('conversations')
    .select(`
      id,
      started_at,
      bots (name),
      messages (content, role, created_at)
    `)
    .in('bot_id', botIdList)
    .order('started_at', { ascending: false })
    .limit(5)

  const stats = [
    { name: 'Total Bots', value: botCount || 0, icon: Bot, color: 'bg-blue-500' },
    { name: 'Conversations', value: conversationCount || 0, icon: MessageSquare, color: 'bg-green-500' },
    { name: 'Messages', value: messageCount || 0, icon: MessagesSquare, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg ${stat.color} p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>

        {recentConversations && recentConversations.length > 0 ? (
          <div className="space-y-4">
            {recentConversations.map((conv) => {
              const lastMessage = conv.messages?.[conv.messages.length - 1]
              return (
                <div key={conv.id} className="flex items-start gap-3 border-b pb-4 last:border-0">
                  <div className="rounded-full bg-blue-100 p-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{conv.bots?.[0]?.name || 'Unknown Bot'}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(conv.started_at).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-4">No activity yet</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/dashboard/bots/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create New Bot
          </Link>
          <Link
            href="/dashboard/bots"
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            View All Bots
          </Link>
        </div>
      </div>
    </div>
  )
}
