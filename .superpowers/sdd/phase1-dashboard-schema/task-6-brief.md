# Task 6: Build Dashboard Layout with Sidebar

## Goal
Create the dashboard layout with sidebar navigation.

## Files to Create
- `apps/dashboard/app/(dashboard)/layout.tsx`
- `apps/dashboard/app/(dashboard)/page.tsx`
- `apps/dashboard/components/ui/sidebar.tsx`
- `apps/dashboard/components/dashboard/nav-items.tsx`
- `apps/dashboard/lib/utils.ts`

## Requirements

### 1. apps/dashboard/components/dashboard/nav-items.tsx
```typescript
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react'

export const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bots', href: '/bots', icon: Bot },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]
```

### 2. apps/dashboard/components/ui/sidebar.tsx
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems } from '@/components/dashboard/nav-items'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <Bot className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-bold">PulseChat</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

### 3. apps/dashboard/lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 4. apps/dashboard/app/(dashboard)/layout.tsx
```tsx
import { Sidebar } from '@/components/ui/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        {children}
      </main>
    </div>
  )
}
```

### 5. apps/dashboard/app/(dashboard)/page.tsx
```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to PulseChat</p>
    </div>
  )
}
```

## Verification
1. Verify all 5 files exist
2. Run `npm run build` in apps/dashboard to verify no TypeScript errors

## Commit
```bash
git add apps/dashboard/app/(dashboard)/ apps/dashboard/components/ apps/dashboard/lib/utils.ts
git commit -m "feat: add dashboard layout with sidebar navigation"
```
