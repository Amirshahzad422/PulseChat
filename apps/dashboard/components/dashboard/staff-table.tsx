'use client'

export interface StaffMember {
  id: string
  account_id: string
  user_id: string
  email: string | null
  name: string | null
  role: string
  created_at: string
}

interface StaffTableProps {
  staffList: StaffMember[]
  currentUserRole: string | undefined
  currentUserId: string | undefined
}

export default function StaffTable({ staffList, currentUserRole, currentUserId }: StaffTableProps) {
  return (
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
                  {member.user_id === currentUserId && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      You
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{member.email || '—'}</td>
              <td className="px-4 py-3">
                {currentUserRole === 'owner' ? (
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
                ) : (
                  <span className="text-sm text-gray-700 capitalize">{member.role}</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {new Date(member.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                {currentUserRole === 'owner' && member.role !== 'owner' && member.user_id !== currentUserId && (
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
  )
}
