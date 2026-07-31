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
  { name: 'Bots', href: '/dashboard/bots', icon: Bot },
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen },
  { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
  { name: 'Staff', href: '/dashboard/staff', icon: Users },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]
