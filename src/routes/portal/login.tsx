import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Home, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { api } from '~/lib/api'
import { useAuth } from '~/lib/auth-context'

export const Route = createFileRoute('/portal/login')({
  component: PortalLoginPage,
})

function PortalLoginPage() {
  const navigate = useNavigate()
  const { signIn, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      const session = await api.auth.getSession()
      if (!session || (session.user as { role?: string }).role !== 'tenant') {
        await signOut()
        setError('Akun ini bukan akun penghuni.')
        return
      }
      navigate({ to: '/portal' })
    } catch {
      setError('Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Home className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Portal Penghuni</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Masuk</CardTitle>
            <CardDescription>Masuk untuk melihat tagihan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email Anda" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masuk
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Belum punya akun?{' '}
              <Link to="/portal/register" className="text-primary hover:underline font-medium">
                Daftar di sini
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
