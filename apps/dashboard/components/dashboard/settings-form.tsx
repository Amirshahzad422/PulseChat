'use client'

import { useState } from 'react'
import { Building2, Bot, Save } from 'lucide-react'

interface SettingsFormProps {
  accountName: string
  accountEmail: string
  plan: string
  settings: {
    default_welcome_message: string
    default_brand_color: string
    default_persona: string
  }
}

export default function SettingsForm({ accountName, accountEmail, plan, settings }: SettingsFormProps) {
  const [name, setName] = useState(accountName)
  const [welcomeMessage, setWelcomeMessage] = useState(settings.default_welcome_message)
  const [brandColor, setBrandColor] = useState(settings.default_brand_color)
  const [persona, setPersona] = useState(settings.default_persona)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_name: name,
        default_welcome_message: welcomeMessage,
        default_brand_color: brandColor,
        default_persona: persona,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setStatus({ type: 'success', text: 'Settings saved.' })
    } else {
      setStatus({ type: 'error', text: data.error || 'Failed to save.' })
    }
    setLoading(false)
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Email</label>
            <input type="email" value={accountEmail} disabled className={`${inputClass} bg-gray-50`} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Bot Defaults</h2>
          <p className="text-sm text-gray-500">Applied to new bots</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Welcome Message</label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Brand Color</label>
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
                className={`${inputClass} w-32`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Persona</label>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {status && (
        <p className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {status.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
