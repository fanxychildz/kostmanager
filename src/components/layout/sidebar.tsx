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
  Wrench,
  MessageSquare,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { useAuth } from '~/lib/auth-context'
import { useQuery } from '~/lib/hooks'
import { api } from '~/lib/api'

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

const bottomItems = [
  { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  // Real-time stats dynamically queried from DB
  const { data: properties } = useQuery({ queryFn: () => api.properties.list() })
  const { data: tenants } = useQuery({ queryFn: () => api.tenants.list() })

  const propertiesCount = properties?.length || 0
  const activeTenantsCount = tenants?.filter((t: any) => t.status === 'active').length || 0
  const totalUnits = properties?.reduce((sum: number, p: any) => sum + (p.totalUnits || 0), 0) || 0
  const occupiedUnits = properties?.reduce((sum: number, p: any) => sum + (p.occupiedUnits || 0), 0) || 0
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r bg-white">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5 h-16 px-6 border-b border-slate-100">
        <div className="p-2 bg-slate-900 rounded-xl text-white">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">KostManager</span>
          <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block mt-0.5">Admin Hub</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* User Account Details Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs leading-none text-white">Akun Pemilik</h4>
                <span className="text-[9px] text-blue-200 mt-1 block">KostManager Administrator</span>
              </div>
            </div>
            
            <div className="border-t border-slate-800 my-3"></div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Total Properti</span>
                <span className="font-semibold text-white">{propertiesCount}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Penghuni Aktif</span>
                <span className="font-semibold text-white">{activeTenantsCount}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Tingkat Hunian</span>
                <span className="font-semibold text-emerald-400">{occupancyRate}%</span>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="space-y-1.5 pt-4 border-t border-slate-100">
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Keluar
          </Button>
        </div>
      </div>
    </aside>
  )
}
