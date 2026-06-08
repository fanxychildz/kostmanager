import { createFileRoute, Outlet, Link, useLocation, useNavigate, redirect } from '@tanstack/react-router'
import { Home, FileText, LogOut } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
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

const navItems = [
  { label: 'Beranda', href: '/portal', icon: Home },
  { label: 'Tagihan', href: '/portal/bills', icon: FileText },
]

function PortalLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  if (isAuthPath(location.pathname)) {
    return <Outlet />
  }

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/portal/login' })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <span className="font-bold">Portal Penghuni</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            {navItems.map((item) => {
              const isActive = item.href === '/portal'
                ? location.pathname === '/portal'
                : location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-6 flex-1">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Ditenagai oleh <span className="font-medium text-primary">KostManager</span>
        </div>
      </footer>
    </div>
  )
}
