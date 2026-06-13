import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from '~/components/layout/sidebar'
import { Header } from '~/components/layout/header'
import { api } from '~/lib/api'
import { useState, useEffect } from 'react'
import { preloadDashboardData } from '~/lib/hooks'
import { motion } from 'motion/react'

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
            className="mb-8 p-4.5 bg-white rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center"
          >
            <img src="/logo.jpg" alt="KeKost" className="h-20 w-auto object-contain" />
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
