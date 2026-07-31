'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, FileText, Globe, Upload } from 'lucide-react'

export default function UploadKnowledgePage() {
  const searchParams = useSearchParams()
  const botId = searchParams.get('bot')
  
  const [sourceType, setSourceType] = useState<'document' | 'url'>('document')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!botId) {
      setError('No bot selected')
      return
    }
    
    setLoading(true)
    setError(null)

    let finalContent = content

    if (sourceType === 'url' && url) {
      finalContent = `URL: ${url}\n\n(Content would be fetched and stored here)`
    }

    const { error: insertError } = await supabase.from('knowledge_sources').insert({
      bot_id: botId,
      source_type: sourceType,
      title: title,
      content: finalContent,
      metadata: sourceType === 'url' ? { url } : {},
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/dashboard/knowledge')
    }
  }

  if (!botId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">No bot selected. Go back and select a bot.</p>
        <Link href="/dashboard/knowledge" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Knowledge Base
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/knowledge"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Base
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Add Knowledge</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setSourceType('document')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 border ${
              sourceType === 'document'
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            Upload Document
          </button>
          <button
            type="button"
            onClick={() => setSourceType('url')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 border ${
              sourceType === 'url'
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe className="h-4 w-4" />
            Add URL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Product FAQ, Pricing Page"
              required
            />
          </div>

          {sourceType === 'document' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none font-mono text-sm"
                placeholder="Paste your document content here..."
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Paste the text content your bot should use to answer questions.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">URL *</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="https://example.com/faq"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the URL of the page you want your bot to learn from.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Knowledge'}
            </button>
            <Link
              href="/dashboard/knowledge"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
