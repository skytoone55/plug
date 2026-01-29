'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Droplets,
  ChevronLeft,
  ChevronRight,
  Building,
  UserCheck,
  Calendar,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[] // Rôles autorisés à voir ce menu
}

// Navigation selon les rôles
const allNavigation: NavItem[] = [
  // Commun à tous
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'installateur', 'technicien'] },

  // Admin + Installateur
  { name: 'Clients', href: '/dashboard/clients', icon: UserCheck, roles: ['admin', 'installateur'] },
  { name: 'Chantiers', href: '/dashboard/chantiers', icon: Building, roles: ['admin', 'installateur'] },

  // Admin seulement - Planning global
  { name: 'Planning', href: '/dashboard/planning', icon: Calendar, roles: ['admin'] },

  // Admin seulement - Rapports
  { name: 'Rapports Équilibrage', href: '/dashboard/rapport-list', icon: FileText, roles: ['admin'] },
  { name: 'Rapports Désembouage', href: '/dashboard/desembouage-list', icon: Droplets, roles: ['admin'] },

  // Admin seulement - Utilisateurs
  { name: 'Utilisateurs', href: '/dashboard/user-list', icon: Users, roles: ['admin'] },

  // Technicien seulement - Mes interventions
  { name: 'Mes Interventions', href: '/dashboard/mes-interventions', icon: ClipboardList, roles: ['technicien'] },

  // Installateur seulement - Mes rapports (vue différente)
  { name: 'Mes Rapports', href: '/dashboard/mes-rapports', icon: FileText, roles: ['installateur'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile) {
          setUserRole(profile.role)
        }
      }
    }
    fetchRole()
  }, [])

  // Filtrer la navigation selon le rôle
  const navigation = allNavigation.filter(item => {
    if (!userRole) return false
    return item.roles.includes(userRole)
  })

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/dashboard" className="text-xl font-bold text-sidebar-primary-foreground">
            PLUG2DRIVE
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors',
            collapsed ? 'mx-auto' : 'ml-auto'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Rôle affiché */}
      {!collapsed && userRole && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <span className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            userRole === 'admin' && 'bg-red-500/20 text-red-300',
            userRole === 'installateur' && 'bg-blue-500/20 text-blue-300',
            userRole === 'technicien' && 'bg-green-500/20 text-green-300'
          )}>
            {userRole === 'admin' && 'Administrateur'}
            {userRole === 'installateur' && 'Installateur'}
            {userRole === 'technicien' && 'Technicien'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50">PLUG2DRIVE v2.0</p>
        </div>
      )}
    </aside>
  )
}
