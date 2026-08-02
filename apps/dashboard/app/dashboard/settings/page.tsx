import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/dashboard/settings-form'
import { CreditCard } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: staff } = await supabase
    .from('staff')
    .select('account_id')
    .eq('user_id', user?.id)
    .single()

  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', staff?.account_id)
    .single()

  const { data: settings } = await supabase
    .from('account_settings')
    .select('*')
    .eq('account_id', staff?.account_id)
    .maybeSingle()

  const planFeatures: Record<string, string[]> = {
    free: ['1 bot', '1,000 messages / mo', 'Community support'],
    pro: ['Unlimited bots', '50,000 messages / mo', 'Priority support', 'RAG knowledge base'],
    enterprise: ['Unlimited everything', 'Custom models', 'Dedicated support', 'SSO'],
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <SettingsForm
        accountName={account?.name || ''}
        accountEmail={account?.email || ''}
        plan={account?.plan || 'free'}
        settings={{
          default_welcome_message: settings?.default_welcome_message || 'Hello! How can I help you?',
          default_brand_color: settings?.default_brand_color || '#3B82F6',
          default_persona: settings?.default_persona || 'You are a helpful assistant.',
        }}
      />

      <div className="rounded-lg border bg-white p-6 shadow-sm mt-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Plan</h2>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 capitalize">
            {account?.plan || 'free'}
          </span>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          {(planFeatures[account?.plan || 'free'] || []).map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gray-500">
          Contact sales to upgrade your plan.
        </p>
      </div>
    </div>
  )
}
