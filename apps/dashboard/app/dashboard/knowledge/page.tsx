import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Plus, FileText, Globe, Trash2 } from 'lucide-react'

export default async function KnowledgePage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: staff } = await supabase
    .from('staff')
    .select('account_id')
    .eq('user_id', user?.id)
    .single()

  // Get bots with their knowledge sources
  const { data: bots } = await supabase
    .from('bots')
    .select(`
      id,
      name,
      knowledge_sources (
        id,
        source_type,
        title,
        uploaded_at
      )
    `)
    .eq('account_id', staff?.account_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
      </div>

      {bots && bots.length > 0 ? (
        <div className="space-y-6">
          {bots.map((bot) => (
            <div key={bot.id} className="rounded-lg border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: '#3B82F6' }}
                  >
                    {bot.name.charAt(0)}
                  </div>
                  <span className="font-medium">{bot.name}</span>
                </div>
                <Link
                  href={`/dashboard/knowledge/upload?bot=${bot.id}`}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Knowledge
                </Link>
              </div>

              <div className="p-4">
                {bot.knowledge_sources && bot.knowledge_sources.length > 0 ? (
                  <div className="space-y-2">
                    {bot.knowledge_sources.map((source: any) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {source.source_type === 'document' ? (
                            <FileText className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Globe className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <p className="font-medium">{source.title}</p>
                            <p className="text-sm text-gray-500">
                              {source.source_type} • {new Date(source.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No knowledge sources yet. Add documents or URLs to help your bot answer questions.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No bots yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Create a bot first, then add knowledge to it.
          </p>
          <Link
            href="/dashboard/bots/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Bot
          </Link>
        </div>
      )}
    </div>
  )
}