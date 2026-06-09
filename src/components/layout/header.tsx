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
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  Clock,
  Wrench,
  MessageSquare,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { useAuth } from '~/lib/auth-context'

function getInitials(name?: string | null) {
  if (!name) return 'KM'
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Properti', href: '/dashboard/properties', icon: Building2 },
  { label: 'Penghuni', href: '/dashboard/tenants', icon: Users },
  { label: 'Tagihan', href: '/dashboard/bills', icon: FileText },
  { label: 'Pembayaran', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Laporan', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Notifikasi', href: '/dashboard/notifications', icon: Bell },
  { label: 'Keluhan Perbaikan', href: '/dashboard/maintenance', icon: Wrench },
  { label: 'Chat Penghuni', href: '/dashboard/chat', icon: MessageSquare },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  useEffect(() => {
    setCurrentTime(new Date().toUTCString())
    const interval = setInterval(() => {
      setCurrentTime(new Date().toUTCString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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

          {/* System Sync Clock Indicators */}
          <div className="hidden md:flex items-center gap-3 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-1.5 border-r pr-3 border-slate-100">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime || 'Syncing System Time...'}</span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100">
              ● LIVE LEDGER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 rounded-xl" asChild>
            <Link to="/dashboard/notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>

          <div className="h-6 w-px bg-slate-150" />

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-slate-100">
              <AvatarFallback className="text-xs bg-slate-900 text-white font-bold">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
              <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Pemilik Kost</span>
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
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 rounded-xl text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">KostManager</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Admin Hub</span>
                  </div>
                </div>
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
                        'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
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
