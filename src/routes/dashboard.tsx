import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { Sidebar } from '~/components/layout/sidebar'
import { Header } from '~/components/layout/header'
import { api } from '~/lib/api'
import { useState, useEffect } from 'react'
import { preloadDashboardData } from '~/lib/hooks'
import { motion } from 'motion/react'
import { useAuth } from '~/lib/auth-context'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await api.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    const role = (session.user as any).role
    if (role === 'tenant') {
      throw redirect({ to: '/portal' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [preloading, setPreloading] = useState(true)

  useEffect(() => {
    let active = true
    async function init() {
      try {
        await preloadDashboardData()
      } catch (err) {
        console.error('Failed to preload data:', err)
      } finally {
        if (active) {
          // Add a tiny delay for a smoother visual transition
          setTimeout(() => {
            if (active) setPreloading(false)
          }, 800)
        }
      }
    }
    init()
    return () => {
      active = false
    }
  }, [])

  if (preloading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden">
        {/* Modern glowing backdrops */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-6">
          {/* Logo container with spring animation */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mb-8 flex items-center justify-center"
          >
            <img src="/logo-stacked-white.png?v=4" alt="KeKost" className="h-20 w-auto object-contain" />
          </motion.div>

          <h2 className="text-xl font-bold tracking-tight mb-2">Mempersiapkan KeKost</h2>
          <p className="text-xs text-slate-400 font-semibold mb-8">Mengambil data properti, unit, dan keuangan Anda...</p>
          
          {/* Custom linear animated progress bar */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ left: '-100%', width: '35%' }}
              animate={{ left: '100%' }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            />
          </div>
        </div>
      </div>
    )
  }

  const u = user as any
  const isExpired = u && u.role === 'owner' && (
    u.subscriptionStatus === 'expired' || 
    (u.subscriptionExpiresAt && new Date() > new Date(u.subscriptionExpiresAt))
  )

  if (isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden font-sans">
        {/* Modern glowing backdrops */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md px-8 py-10 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-md">
          {/* Locked Icon */}
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold tracking-tight mb-2">Masa Langganan Habis</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6 leading-relaxed">
            Paket KeKost Anda telah kedaluwarsa. Silakan hubungi Administrator atau lakukan perpanjangan langganan untuk mengaktifkan kembali dashboard Anda.
          </p>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 w-full mb-8 text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Status Paket:</span>
              <span className="text-red-500 font-bold">Expired</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Batas Unit:</span>
              <span className="text-slate-200">Hingga 100 Unit</span>
            </div>
            {u.subscriptionExpiresAt && (
              <div className="flex justify-between text-slate-400">
                <span>Tanggal Berakhir:</span>
                <span className="text-slate-200">
                  {new Date(u.subscriptionExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
          
          <div className="w-full space-y-3">
            <a 
              href="https://wa.me/6285156469451?text=Halo%20Pak%20Taufiq%20Rusdhi%20(Admin%20KeKost),%20saya%20ingin%20memperpanjang%20paket%20langganan%20saya."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-3.5 transition block text-center cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Hubungi Pak Taufiq Rusdhi (WhatsApp)
            </a>
            <button 
              onClick={async () => {
                await signOut()
                navigate({ to: '/login' })
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold py-3.5 transition cursor-pointer border border-slate-700"
            >
              Keluar Akun
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
