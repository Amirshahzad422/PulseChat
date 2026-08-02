import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid settings body' }, { status: 400 })
    }

    const { account_name, default_welcome_message, default_brand_color, default_persona } = body as {
      account_name?: unknown
      default_welcome_message?: unknown
      default_brand_color?: unknown
      default_persona?: unknown
    }

    if (account_name !== undefined && typeof account_name !== 'string') {
      return NextResponse.json({ error: 'Invalid settings body' }, { status: 400 })
    }
    if (default_welcome_message !== undefined && typeof default_welcome_message !== 'string') {
      return NextResponse.json({ error: 'Invalid settings body' }, { status: 400 })
    }
    if (default_brand_color !== undefined && typeof default_brand_color !== 'string') {
      return NextResponse.json({ error: 'Invalid settings body' }, { status: 400 })
    }
    if (default_persona !== undefined && typeof default_persona !== 'string') {
      return NextResponse.json({ error: 'Invalid settings body' }, { status: 400 })
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

    if (account_name) {
      const { error } = await admin
        .from('accounts')
        .update({ name: account_name })
        .eq('id', staff.account_id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const settings = {
      default_welcome_message,
      default_brand_color,
      default_persona,
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
