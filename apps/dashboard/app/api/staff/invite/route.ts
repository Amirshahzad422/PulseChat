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
