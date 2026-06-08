import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Home, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { api } from '~/lib/api'
import { useAuth } from '~/lib/auth-context'

export const Route = createFileRoute('/portal/register')({
  component: PortalRegisterPage,
})

function PortalRegisterPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    setLoading(true)
    try {
      await api.portal.register({ email, password })
      await refreshSession()
      navigate({ to: '/portal' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar')
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
            <CardTitle>Daftar Akun</CardTitle>
            <CardDescription>Gunakan email yang didaftarkan oleh pemilik kost Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email Anda" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Minimal 8 karakter" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Daftar
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Sudah punya akun?{' '}
              <Link to="/portal/login" className="text-primary hover:underline font-medium">
                Masuk di sini
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
