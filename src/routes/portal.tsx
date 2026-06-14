import { createFileRoute, Outlet, useNavigate, redirect, useLocation } from '@tanstack/react-router'
import { LogOut, Building2, Clock } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { api } from '~/lib/api'
import { useAuth } from '~/lib/auth-context'

function isAuthPath(pathname: string) {
  return pathname.startsWith('/portal/login') || pathname.startsWith('/portal/register')
}

function getInitials(name?: string | null) {
  if (!name) return 'P'
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export const Route = createFileRoute('/portal')({
  beforeLoad: async ({ location }) => {
    const authPage = isAuthPath(location.pathname)
    const session = await api.auth.getSession()
    const isTenant = !!session && (session.user as { role?: string }).role === 'tenant'

    if (!isTenant && !authPage) {
      throw redirect({ to: '/portal/login' })
    }
    if (isTenant && authPage) {
      throw redirect({ to: '/portal' })
    }
  },
  component: PortalLayout,
})

function PortalLayout() {
  const navigate = useNavigate()
  const { user, signOut, refreshSession } = useAuth()
  const [currentTime, setCurrentTime] = useState<string>('')
  const location = useLocation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [updatingPhoto, setUpdatingPhoto] = useState(false)

  const formatTime = (date: Date) => {
    return date.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\./g, ':') + ' WIB'
  }

  useEffect(() => {
    if (isAuthPath(location.pathname)) return
    setCurrentTime(formatTime(new Date()))
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/portal/login' })
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUpdatingPhoto(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        await api.auth.updateProfile({ image: base64 })
        await refreshSession()
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
      alert('Gagal mengunggah foto profil.')
    } finally {
      setUpdatingPhoto(false)
    }
  }

  // If on login/register page, bypass layout wrapper
  const path = location.pathname
  if (isAuthPath(path)) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-between">
      {/* Global Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <img src="/logo-horizontal.png?v=6" alt="KeKost" className="h-9 w-auto object-contain" />
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[8px] font-bold border border-slate-200 uppercase">
              Portal Penghuni
            </span>
          </div>

          {/* Sync indicator clocks */}
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-1.5 border-r pr-4 border-slate-150">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{currentTime || 'Syncing System Time...'}</span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100 uppercase">
              ● Live Connection
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex items-center gap-2">
              <Avatar
                onClick={handleAvatarClick}
                className={`h-8 w-8 ring-2 ring-slate-100 cursor-pointer hover:opacity-80 transition-all ${updatingPhoto ? 'animate-pulse' : ''}`}
                title="Ganti Foto Profil"
              >
                {user?.image && <AvatarImage src={user.image} className="object-cover" />}
                <AvatarFallback className="text-xs bg-slate-900 text-white font-bold">
                  {updatingPhoto ? '...' : getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
                <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Penghuni Kost</span>
              </div>
            </div>
            
            <div className="h-6 w-px bg-slate-200" />

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut} 
              className="text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl cursor-pointer" 
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

        </div>
      </header>

      {/* Main layout container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-500">KeKost Portal Penghuni • Koneksi Enklav Lokal</p>
          </div>
          <div className="flex items-center gap-2">
            <span>v1.0.2</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
