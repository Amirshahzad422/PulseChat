'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Download, Activity, MessagesSquare, Bot, Users } from 'lucide-react'

interface ReportData {
  totalConversations: number
  totalMessages: number
  activeBots: number
  visitors: number
  daily: { date: string; messages: number }[]
  perBot: { name: string; brandColor: string; conversations: number; messages: number; avg: number }[]
  rawRows: string[][]
}

export default function ReportsView({ data }: { data: ReportData }) {
  const exportCsv = () => {
    const header = ['Bot', 'Conversations', 'Messages', 'Avg Messages/Conv']
    const csv = [header, ...data.rawRows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pulsechat-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = [
    { name: 'Total Conversations', value: data.totalConversations, icon: Activity, color: 'bg-blue-500' },
    { name: 'Total Messages', value: data.totalMessages, icon: MessagesSquare, color: 'bg-green-500' },
    { name: 'Active Bots', value: data.activeBots, icon: Bot, color: 'bg-purple-500' },
    { name: 'Visitors', value: data.visitors, icon: Users, color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className={`inline-flex rounded-lg p-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <p className="mt-4 text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Messages over time (last 30 days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="messages" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Messages per bot</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.perBot}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="messages" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
              <th className="px-4 py-3">Bot</th>
              <th className="px-4 py-3">Conversations</th>
              <th className="px-4 py-3">Messages</th>
              <th className="px-4 py-3">Avg / Conversation</th>
            </tr>
          </thead>
          <tbody>
            {data.perBot.map((bot) => (
              <tr key={bot.name} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: bot.brandColor }} />
                    <span className="font-medium">{bot.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{bot.conversations}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{bot.messages}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{bot.avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
