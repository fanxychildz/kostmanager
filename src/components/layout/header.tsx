import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Inbox,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  Wrench,
  MessageSquare,
  TrendingDown,
  Megaphone,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { useAuth } from '~/lib/auth-context'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

function getInitials(nameOrEmail?: string | null) {
  const source = nameOrEmail || 'KeKost'
  const parts = source.split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.slice(0, 2).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Properti', href: '/dashboard/properties', icon: Building2 },
  { label: 'Penghuni', href: '/dashboard/tenants', icon: Users },
  { label: 'Tagihan', href: '/dashboard/bills', icon: FileText },
  { label: 'Pembayaran', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Pengeluaran', href: '/dashboard/expenses', icon: TrendingDown },
  { label: 'Laporan', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
  { label: 'Keluhan Perbaikan', href: '/dashboard/maintenance', icon: Wrench },
  { label: 'Chat Penghuni', href: '/dashboard/chat', icon: MessageSquare },
  { label: 'Pengumuman', href: '/dashboard/announcements', icon: Megaphone },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const name = user?.name || user?.email || 'KeKost'
  const initials = getInitials(name)
  const displayLabel = name === 'KeKost' ? '' : name

  const { data: inboxCountData } = useQuery({ queryFn: () => api.inbox.count() })
  const unreadCount = inboxCountData?.count || 0

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-4 lg:px-6 lg:pl-72 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 rounded-xl relative" asChild>
            <Link to="/dashboard/inbox">
              <Inbox className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          </Button>

          <div className="h-6 w-px bg-slate-150" />

          <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-slate-100">
                {user?.image && <AvatarImage src={user.image} alt={name} className="object-cover" />}
                <AvatarFallback className="text-xs bg-slate-900 text-white font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">{displayLabel}</p>
                <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                  {(user as any)?.role === 'tenant' ? 'Penghuni' : 'Pemilik Kost'}
                </span>
              </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white p-4 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <Link 
                  to="/dashboard" 
                  className="flex items-center py-1 justify-start hover:opacity-95 transition-opacity" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/logo-horizontal.png?v=6" alt="KeKost" className="h-9 w-auto object-contain" />
                </Link>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5 text-slate-700" />
                </Button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </div>
                      {item.label === 'Inbox' && unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-1 ring-white">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-4">
              <Link
                to="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all text-slate-655 hover:bg-slate-100',
                  location.pathname === '/dashboard/settings' && 'bg-blue-600 text-white'
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                Pengaturan
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleSignOut()
                }}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
