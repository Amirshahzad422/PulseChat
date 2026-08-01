import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let role: unknown
    try {
      const body = await request.json()
      role = body.role
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof role !== 'string' || !['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
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

    const { data: target } = await admin
      .from('staff')
      .select('id, role')
      .eq('id', params.id)
      .eq('account_id', caller.account_id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (target.role === 'owner' && role !== 'owner') {
      const { count } = await admin
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', caller.account_id)
        .eq('role', 'owner')
      if (count === 1) {
        return NextResponse.json({ error: 'Cannot demote the last owner' }, { status: 400 })
      }
    }

    const { error } = await admin
      .from('staff')
      .update({ role })
      .eq('id', params.id)
      .eq('account_id', caller.account_id)

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

    const { data: target } = await admin
      .from('staff')
      .select('id, role')
      .eq('id', params.id)
      .eq('account_id', caller.account_id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove an owner' }, { status: 400 })
    }

    const { error } = await admin
      .from('staff')
      .delete()
      .eq('id', params.id)
      .eq('account_id', caller.account_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Staff delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
