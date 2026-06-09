import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { Sidebar } from '~/components/layout/sidebar'
import { Header } from '~/components/layout/header'
import { api } from '~/lib/api'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
  let cancelled = false
  api.auth.getSession().then((session) => {
    if (cancelled) return
    if (!session) {
      navigate({ to: '/login' })
      return
    }
    setChecking(false)
  })
  return () => {
    cancelled = true
  }
  }, [navigate])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
