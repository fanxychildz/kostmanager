import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from '~/components/layout/sidebar'
import { Header } from '~/components/layout/header'
import { api } from '~/lib/api'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await api.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    if ((session.user as { role?: string }).role === 'tenant') {
      throw redirect({ to: '/portal' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
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
