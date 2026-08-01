# PulseChat Phases 5-8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 4 missing dashboard sections (Conversations, Staff, Reports, Settings) so every sidebar link works.

**Architecture:** Server components fetch data via the existing `createClient()` server Supabase client; mutations that need service-role access (staff list/invite, settings) go through small API routes or an admin client. Recharts renders charts in client components fed server-fetched data. Each phase ends with `npm run build` + Chrome MCP verification, then commit + push to both remotes.

**Tech Stack:** Next.js 14 (App Router), @supabase/supabase-js, @supabase/ssr, recharts, lucide-react, Tailwind CSS, TypeScript.

## Global Constraints

- Server data access uses `createClient()` from `@/lib/supabase/server` (user session, RLS applies).
- Mutations needing RLS bypass use `createAdminClient()` from `@/lib/supabase/admin` (service role).
- All UI follows existing patterns: `rounded-lg border bg-white p-6 shadow-sm` cards, lucide icons, blue-600 primary buttons, `text-2xl font-bold` page headers.
- Account/bot IDs come from the logged-in user's `staff` row: `supabase.from('staff').select('account_id').eq('user_id', user?.id).single()`.
- Bot IDs for an account: `supabase.from('bots').select('id').eq('account_id', accountId)`.
- No comments in code unless the existing file has them. No emojis.
- Commit only after `npm run build` passes AND Chrome MCP verification passes. Push to BOTH remotes (`personal`, `verxeon`).
- DB migrations (`supabase/sql/*.sql`) must be run manually by the user in the Supabase SQL editor; note this in each phase's completion message.

---

### Task 1: Conversations list page

**Files:**
- Create: `apps/dashboard/app/dashboard/conversations/page.tsx`

**Interfaces:**
- Produces: `/dashboard/conversations` page accepting optional `?bot=<uuid>` and `?q=<search>` search params.

- [ ] **Step 1: Create the conversations list page**

```tsx
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
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build` in `apps/dashboard`
Expected: compiles, `/dashboard/conversations` listed as `ƒ` (dynamic).

- [ ] **Step 3: Chrome MCP verify list page**

Navigate to `http://localhost:3000/dashboard/conversations` (dev server running). Confirm the table renders (or empty state). Test the bot filter dropdown.

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/app/dashboard/conversations/page.tsx
git commit -m "feat: add conversations list page with bot filter and search"
```

---

### Task 2: Conversation thread viewer

**Files:**
- Create: `apps/dashboard/app/dashboard/conversations/[id]/page.tsx`

**Interfaces:**
- Consumes: conversation `id` from route param, produced by Task 1 links.
- Produces: `/dashboard/conversations/[id]` thread view.

- [ ] **Step 1: Create the thread viewer page**

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'

export default async function ConversationThreadPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: staff } = await supabase
    .from('staff')
    .select('account_id')
    .eq('user_id', user?.id)
    .single()

  const { data: bots } = await supabase
    .from('bots')
    .select('id')
    .eq('account_id', staff?.account_id)

  const botIdList = bots?.map((b) => b.id) || []

  const { data: conversation } = await supabase
    .from('conversations')
    .select(`id, visitor_session, started_at, bot_id, bots (name, brand_color)`)
    .eq('id', params.id)
    .single()

  const ownsConversation = conversation && botIdList.includes(conversation.bot_id)

  if (!ownsConversation) {
    return (
      <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Conversation not found</h3>
        <Link href="/dashboard/conversations" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Conversations
        </Link>
      </div>
    )
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  const botName = conversation.bots?.[0]?.name || 'Bot'
  const brandColor = conversation.bots?.[0]?.brand_color || '#3B82F6'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/conversations"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: brandColor }}
          >
            {botName.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-semibold">{botName}</h1>
            <p className="text-sm text-gray-600">
              {conversation.visitor_session} · started {new Date(conversation.started_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm p-6">
        {messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'visitor' ? 'justify-content-end flex-row-reverse' : ''}`}>
                {msg.role === 'bot' && (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {botName.charAt(0)}
                  </div>
                )}
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-lg px-4 py-2 text-sm ${
                      msg.role === 'visitor'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">No messages in this conversation.</p>
        )}
      </div>
    </div>
  )
}
```

Note: the visitor row uses `flex-row-reverse` so the bubble sits on the right; the timestamp stays under the bubble because it's inside the same column div.

- [ ] **Step 2: Verify build passes**

Run: `npm run build` in `apps/dashboard`
Expected: compiles.

- [ ] **Step 3: Chrome MCP verify thread view**

Open an existing conversation from the list. Confirm message bubbles render, visitor on right/blue, bot on left/gray with avatar, timestamps visible.

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/app/dashboard/conversations/[id]/page.tsx
git commit -m "feat: add conversation thread viewer"
```

---

### Task 3: Push Phase 5

- [ ] **Step 1: Push to both remotes**

```bash
git push personal main
git push verxeon main
```

Expected: both succeed.

---

### Task 4: Staff - SQL migration + admin client + API routes

**Files:**
- Create: `supabase/sql/phase6-staff.sql`
- Create: `apps/dashboard/lib/supabase/admin.ts`
- Create: `apps/dashboard/app/api/staff/invite/route.ts`
- Create: `apps/dashboard/app/api/staff/[id]/route.ts`

**Interfaces:**
- Produces:
  - `createAdminClient(): SupabaseClient` — service-role client (RLS bypassed).
  - `POST /api/staff/invite` body `{ email: string, role: 'owner'|'editor'|'viewer' }` → `{ success: true }` or `{ error: string }` with 404/409/500.
  - `PATCH /api/staff/[id]` body `{ role: 'owner'|'editor'|'viewer' }`.
  - `DELETE /api/staff/[id]`.
- Consumes: `SUPABASE_SERVICE_ROLE_KEY` env var.

- [ ] **Step 1: Create the SQL migration**

`supabase/sql/phase6-staff.sql`:
```sql
-- Phase 6: Staff management
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email TEXT;
```

- [ ] **Step 2: Create the admin client helper**

`apps/dashboard/lib/supabase/admin.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 3: Create the invite API route**

`apps/dashboard/app/api/staff/invite/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    if (!email || !['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'email and a valid role are required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!staff) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    const admin = createAdminClient()

    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
    if (listError) {
      return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 })
    }

    const target = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!target) {
      return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })
    }

    const { error: insertError } = await admin.from('staff').insert({
      account_id: staff.account_id,
      user_id: target.id,
      email: target.email,
      name: target.user_metadata?.full_name || email.split('@')[0] || 'New Member',
      role,
    })

    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.code === '23505') {
        return NextResponse.json({ error: 'User is already on this team' }, { status: 409 })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Staff invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create the staff update/delete API route**

`apps/dashboard/app/api/staff/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { role } = await request.json()
    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('staff').update({ role }).eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Staff update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: target } = await admin.from('staff').select('role').eq('id', params.id).single()
    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove an owner' }, { status: 400 })
    }

    const { error } = await admin.from('staff').delete().eq('id', params.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Staff delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build` in `apps/dashboard`
Expected: compiles.

- [ ] **Step 6: Commit**

```bash
git add supabase/sql/phase6-staff.sql apps/dashboard/lib/supabase/admin.ts apps/dashboard/app/api/staff/
git commit -m "feat: add staff invite and management API routes"
```

---

### Task 5: Staff page UI

**Files:**
- Create: `apps/dashboard/app/dashboard/staff/page.tsx`
- Create: `apps/dashboard/components/dashboard/staff-manager.tsx`

**Interfaces:**
- Consumes: `createAdminClient()` from Task 4; API routes `POST /api/staff/invite`, `PATCH /api/staff/[id]`, `DELETE /api/staff/[id]` from Task 4.
- Produces: `/dashboard/staff` page.

- [ ] **Step 1: Create the staff page (server, fetches list)**

`apps/dashboard/app/dashboard/staff/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import StaffManager from '@/components/dashboard/staff-manager'
import { Users } from 'lucide-react'

export default async function StaffPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: currentStaff } = await supabase
    .from('staff')
    .select('id, account_id, role')
    .eq('user_id', user?.id)
    .single()

  const admin = createAdminClient()
  const { data: staffList } = await admin
    .from('staff')
    .select('*')
    .eq('account_id', currentStaff?.account_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Staff</h1>
      </div>

      {staffList && staffList.length > 0 ? (
        <div className="rounded-lg border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => (
                <tr key={member.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {(member.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{member.name}</span>
                      {member.user_id === user?.id && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.email || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={member.role}
                      disabled={member.role === 'owner'}
                      onChange={async (e) => {
                        await fetch(`/api/staff/${member.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ role: e.target.value }),
                        })
                        window.location.reload()
                      }}
                      className="rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                    >
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {member.role !== 'owner' && member.user_id !== user?.id && (
                      <button
                        onClick={async () => {
                          if (confirm(`Remove ${member.name} from the team?`)) {
                            await fetch(`/api/staff/${member.id}`, { method: 'DELETE' })
                            window.location.reload()
                          }
                        }}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No team members yet</h3>
        </div>
      )}

      <div className="mt-6">
        <StaffManager />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the add-member form (client component)**

`apps/dashboard/components/dashboard/staff-manager.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'

export default function StaffManager() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'editor' | 'viewer'>('viewer')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await fetch('/api/staff/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })

    const data = await res.json()

    if (res.ok) {
      setMessage({ type: 'success', text: `${email} added to the team.` })
      setEmail('')
      setTimeout(() => window.location.reload(), 500)
    } else {
      setMessage({ type: 'error', text: data.error || 'Failed to add member.' })
    }
    setLoading(false)
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="h-6 w-6 text-blue-600" />
        <h2 className="text-lg font-semibold">Add Member</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="teammate@company.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'owner' | 'editor' | 'viewer')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Member'}
        </button>
      </form>

      {message && (
        <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build` in `apps/dashboard`
Expected: compiles.

- [ ] **Step 4: Chrome MCP verify staff page**

Navigate to `/dashboard/staff`. Confirm list renders with the "You" badge. Invite a member (use an existing auth user's email like `test@test.com` won't work since already member; try a non-member email and confirm the "no user found" error). Change a role via dropdown. If a second staff member exists, test remove.

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/app/dashboard/staff/page.tsx apps/dashboard/components/dashboard/staff-manager.tsx
git commit -m "feat: add staff management page"
```

---

### Task 6: Push Phase 6

- [ ] **Step 1: Push to both remotes**

```bash
git push personal main
git push verxeon main
```

Expected: both succeed. Note: user must run `supabase/sql/phase6-staff.sql` in the Supabase SQL editor before staff emails display.

---

### Task 7: Reports page

**Files:**
- Modify: `apps/dashboard/package.json` (add recharts)
- Create: `apps/dashboard/app/dashboard/reports/page.tsx`
- Create: `apps/dashboard/components/dashboard/reports-view.tsx`

**Interfaces:**
- Produces: `/dashboard/reports` page with `data` prop shape:
  ```ts
  interface ReportData {
    totalConversations: number
    totalMessages: number
    activeBots: number
    visitors: number
    daily: { date: string; messages: number }[]
    perBot: { name: string; brandColor: string; conversations: number; messages: number; avg: number }[]
    rawRows: string[][]  // for CSV export
  }
  ```

- [ ] **Step 1: Install recharts**

Run: `npm install recharts` in `apps/dashboard`

- [ ] **Step 2: Create the reports page (server, aggregates data)**

`apps/dashboard/app/dashboard/reports/page.tsx`:
```tsx
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
    .select('id, name, brand_color')
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
```

Note: `bots` was fetched with only `id, name, brand_color` — `b.status` doesn't exist on that object. Fix by adding `status` to the select:

```tsx
  const { data: bots } = await supabase
    .from('bots')
    .select('id, name, brand_color, status')
    .eq('account_id', staff?.account_id)
```

- [ ] **Step 3: Create the reports view (client, charts + CSV)**

`apps/dashboard/components/dashboard/reports-view.tsx`:
```tsx
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
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build` in `apps/dashboard`
Expected: compiles.

- [ ] **Step 5: Chrome MCP verify reports page**

Navigate to `/dashboard/reports`. Confirm 4 stat cards, line chart, bar chart, per-bot table render. Click "Export CSV" and confirm a file downloads (Chrome MCP: check network/download or just confirm the click succeeds).

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/package.json apps/dashboard/package-lock.json apps/dashboard/app/dashboard/reports/ apps/dashboard/components/dashboard/reports-view.tsx
git commit -m "feat: add reports page with analytics charts and CSV export"
```

Note: `package-lock.json` may be at repo root (`/package-lock.json`). Check and add the correct path.

- [ ] **Step 7: Push to both remotes**

```bash
git push personal main
git push verxeon main
```

---

### Task 8: Settings - SQL migration + API route

**Files:**
- Create: `supabase/sql/phase8-settings.sql`
- Create: `apps/dashboard/app/api/settings/route.ts`

**Interfaces:**
- Produces:
  - `PATCH /api/settings` body `{ account_name?, default_welcome_message?, default_brand_color?, default_persona? }` → `{ success: true }` or `{ error }`.
  - New `account_settings` table (one row per account) with RLS policies.
- Consumes: `createAdminClient()`.

- [ ] **Step 1: Create the SQL migration**

`supabase/sql/phase8-settings.sql`:
```sql
-- Phase 8: Settings
CREATE TABLE IF NOT EXISTS account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  default_welcome_message TEXT DEFAULT 'Hello! How can I help you?',
  default_brand_color TEXT DEFAULT '#3B82F6',
  default_persona TEXT DEFAULT 'You are a helpful assistant.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE account_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own account settings" ON account_settings
  FOR SELECT USING (
    account_id IN (SELECT account_id FROM staff WHERE user_id = auth.uid())
  );

CREATE POLICY "Users update own account settings" ON account_settings
  FOR UPDATE USING (
    account_id IN (SELECT account_id FROM staff WHERE user_id = auth.uid())
  );
```

- [ ] **Step 2: Create the settings API route**

`apps/dashboard/app/api/settings/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!staff) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    const admin = createAdminClient()

    if (body.account_name) {
      const { error } = await admin
        .from('accounts')
        .update({ name: body.account_name })
        .eq('id', staff.account_id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const settings = {
      default_welcome_message: body.default_welcome_message,
      default_brand_color: body.default_brand_color,
      default_persona: body.default_persona,
      updated_at: new Date().toISOString(),
    }

    if (Object.values(settings).some((v) => v !== undefined)) {
      const { error } = await admin.from('account_settings').upsert(
        { account_id: staff.account_id, ...settings },
        { onConflict: 'account_id' }
      )
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build` in `apps/dashboard`
Expected: compiles.

- [ ] **Step 4: Commit**

```bash
git add supabase/sql/phase8-settings.sql apps/dashboard/app/api/settings/route.ts
git commit -m "feat: add settings API and account_settings schema"
```

---

### Task 9: Settings page UI + bot defaults integration

**Files:**
- Create: `apps/dashboard/app/dashboard/settings/page.tsx`
- Create: `apps/dashboard/components/dashboard/settings-form.tsx`
- Modify: `apps/dashboard/app/dashboard/bots/new/page.tsx`

**Interfaces:**
- Consumes: `PATCH /api/settings` from Task 8; `account_settings` table (RLS-selectable) from Task 8.
- Produces: `/dashboard/settings` page.

- [ ] **Step 1: Create the settings page (server, fetches account + settings)**

`apps/dashboard/app/dashboard/settings/page.tsx`:
```tsx
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
```

- [ ] **Step 2: Create the settings form (client component)**

`apps/dashboard/components/dashboard/settings-form.tsx`:
```tsx
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
```

- [ ] **Step 3: Wire bot defaults into the new-bot form**

In `apps/dashboard/app/dashboard/bots/new/page.tsx`, add a `useEffect` that fetches `account_settings` for the user's account and pre-fills the default fields (only if the user hasn't typed custom values yet, so state stays untouched when the user starts typing immediately).

Add to the imports:
```tsx
import { useState, useEffect } from 'react'
```

After the existing `useState` declarations, add:
```tsx
  const [fetchedDefaults, setFetchedDefaults] = useState(false)

  useEffect(() => {
    const loadDefaults = async () => {
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
      setFetchedDefaults(true)
    }
    loadDefaults()
  }, [])
```

Right before the main `return` (after all hooks and the `handleSubmit` definition), add:
```tsx
  if (!fetchedDefaults) {
    return <div className="text-center py-8">Loading...</div>
  }
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build` in `apps/dashboard`
Expected: compiles. `useEffect` import added; the early return must come after all hooks (place it right before the main `return`).

- [ ] **Step 5: Chrome MCP verify settings page + bot defaults**

Navigate to `/dashboard/settings`. Edit the account name, change defaults, click Save → confirm success message and page reload shows persisted values. Then go to `/dashboard/bots/new` and confirm the default fields are pre-filled from settings (if settings differ from the hardcoded defaults).

- [ ] **Step 6: Commit + push**

```bash
git add apps/dashboard/app/dashboard/settings/ apps/dashboard/components/dashboard/settings-form.tsx apps/dashboard/app/dashboard/bots/new/page.tsx
git commit -m "feat: add settings page and bot defaults integration"
git push personal main
git push verxeon main
```

---

### Task 10: Full regression check

- [ ] **Step 1: Build the full project**

Run: `npm run build` in `apps/dashboard`
Expected: all routes compile, no type errors.

- [ ] **Step 2: Chrome MCP regression pass**

Navigate through: Dashboard → Bots → Knowledge → Conversations (list + thread) → Staff → Reports → Settings. Confirm no 404s and no console errors.

- [ ] **Step 3: Verify git is clean and both remotes match**

```bash
git status
git log --oneline -15
git push personal main
git push verxeon main
```

Expected: clean tree, both remotes up to date.

---

## Notes for the user

- Run these SQL files in the Supabase SQL editor when prompted:
  - `supabase/sql/phase6-staff.sql` (before testing Staff emails)
  - `supabase/sql/phase8-settings.sql` (before testing Settings page — the page gracefully shows defaults if the table doesn't exist yet, but saving will fail until it's created)
- The dev server must be running for Chrome MCP tests: `npm run dev` in `apps/dashboard`.
