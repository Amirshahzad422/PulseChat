'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Bot, Trash2, Copy, Check } from 'lucide-react'

export default function EditBotPage() {
  const params = useParams()
  const botId = params.id as string

  const [name, setName] = useState('')
  const [brandColor, setBrandColor] = useState('#3B82F6')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [personaInstructions, setPersonaInstructions] = useState('')
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchBot()
  }, [botId])

  const fetchBot = async () => {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setName(data.name)
      setBrandColor(data.brand_color)
      setAvatarUrl(data.avatar_url || '')
      setWelcomeMessage(data.welcome_message)
      setPersonaInstructions(data.persona_instructions)
      setPosition(data.position)
      setStatus(data.status)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('bots')
      .update({
        name,
        brand_color: brandColor,
        avatar_url: avatarUrl || null,
        welcome_message: welcomeMessage,
        persona_instructions: personaInstructions,
        position,
        status,
      })
      .eq('id', botId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
    } else {
      router.push('/dashboard/bots')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bot? This cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', botId)

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard/bots')
    }
  }

  const embedSnippet = `<script src="http://localhost:3000/widget.js" data-bot-id="${botId}" async></script>`

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/bots"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bots
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold">Edit Bot</h1>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Brand Color</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="block w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Welcome Message</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Persona Instructions</label>
              <textarea
                value={personaInstructions}
                onChange={(e) => setPersonaInstructions(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as 'bottom-right' | 'bottom-left')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/dashboard/bots"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Embed Snippet */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Embed Snippet</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-xs text-gray-800 overflow-x-auto">
                {embedSnippet}
              </code>
              <button
                onClick={copyEmbed}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium mb-4">Live Preview</h3>

          {/* Preview of chat widget */}
          <div
            className="relative h-96 rounded-lg border bg-gray-100 overflow-hidden"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {/* Chat bubble */}
            <div
              className="absolute bottom-4 h-14 w-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: brandColor,
                ...(position === 'bottom-left'
                  ? { left: '1rem', right: 'auto' }
                  : { right: '1rem', left: 'auto' }),
              }}
            >
              <Bot className="h-6 w-6 text-white" />
            </div>

            {/* Chat window preview */}
            <div
              className="absolute bottom-20 w-80 rounded-lg shadow-xl overflow-hidden"
              style={{
                ...(position === 'bottom-left'
                  ? { left: '1rem', right: 'auto' }
                  : { right: '1rem', left: 'auto' }),
              }}
            >
              {/* Header */}
              <div className="p-4 text-white" style={{ backgroundColor: brandColor }}>
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{name || 'Bot Name'}</div>
                    <div className="text-xs opacity-80">Online</div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-white p-4 h-48 overflow-y-auto">
                <div className="flex gap-2 mb-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {name?.charAt(0) || 'B'}
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm max-w-[80%]">
                    {welcomeMessage || 'Hello! How can I help you?'}
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="border-t bg-white p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    disabled
                  />
                  <button
                    className="rounded-full px-4 py-2 text-white text-sm"
                    style={{ backgroundColor: brandColor }}
                    disabled
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
