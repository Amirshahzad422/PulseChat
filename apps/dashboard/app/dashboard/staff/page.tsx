import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import StaffManager from '@/components/dashboard/staff-manager'
import StaffTable from '@/components/dashboard/staff-table'
import { Users } from 'lucide-react'

export default async function StaffPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: currentStaff } = await supabase
    .from('staff')
    .select('id, account_id, role')
    .eq('user_id', user?.id)
    .single()

  const currentUserRole = currentStaff?.role

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
        <StaffTable
          staffList={staffList}
          currentUserRole={currentUserRole}
          currentUserId={user?.id}
        />
      ) : (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No team members yet</h3>
        </div>
      )}

      {currentUserRole === 'owner' && (
        <div className="mt-6">
          <StaffManager />
        </div>
      )}
    </div>
  )
}
