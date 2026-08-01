import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    let body: { email?: unknown; role?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { email, role } = body
    if (typeof email !== 'string' || typeof role !== 'string' || !['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'email and a valid role are required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from('staff')
      .select('account_id, role')
      .eq('user_id', user.id)
      .single()

    if (!caller) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }
    if (caller.role !== 'owner') {
      return NextResponse.json({ error: 'Only account owners can manage staff' }, { status: 403 })
    }

    const admin = createAdminClient()

    const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listError) {
      return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 })
    }

    const target = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!target) {
      return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })
    }

    const { error: insertError } = await admin.from('staff').insert({
      account_id: caller.account_id,
      user_id: target.id,
      email: target.email,
      name: target.user_metadata?.full_name || email.split('@')[0] || 'New Member',
      role,
    })

    if (insertError) {
      if (insertError.code === '23505') {
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
