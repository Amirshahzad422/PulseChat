'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Bot } from 'lucide-react'

export default function NewBotPage() {
  const [name, setName] = useState('')
  const [brandColor, setBrandColor] = useState('#3B82F6')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you?')
  const [personaInstructions, setPersonaInstructions] = useState('You are a helpful assistant.')
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedDefaults, setFetchedDefaults] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: staff } = await supabase
          .from('staff')
          .select('account_id')
          .eq('user_id', user.id)
          .single()
        if (!staff) return
        const { data: settings } = await supabase
          .from('account_settings')
          .select('*')
          .eq('account_id', staff.account_id)
          .maybeSingle()
        if (settings) {
          setWelcomeMessage((prev) => (prev === 'Hello! How can I help you?' ? settings.default_welcome_message : prev))
          setBrandColor((prev) => (prev === '#3B82F6' ? settings.default_brand_color : prev))
          setPersonaInstructions((prev) => (prev === 'You are a helpful assistant.' ? settings.default_persona : prev))
        }
      } finally {
        setFetchedDefaults(true)
      }
    }
    loadDefaults()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!staff) {
      setError('No account found')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('bots').insert({
      account_id: staff.account_id,
      name,
      brand_color: brandColor,
      avatar_url: avatarUrl || null,
      welcome_message: welcomeMessage,
      persona_instructions: personaInstructions,
      position,
      status: 'active',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/dashboard/bots')
    }
  }

  if (!fetchedDefaults) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/bots"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bots
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Bot className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Create Bot</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="My Support Bot"
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
              placeholder="https://example.com/avatar.png"
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
              placeholder="You are a support agent for Acme Inc, be friendly and concise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Widget Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as 'bottom-right' | 'bottom-left')}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Bot'}
            </button>
            <Link
              href="/dashboard/bots"
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
