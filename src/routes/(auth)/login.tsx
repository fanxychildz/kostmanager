import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Building2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { useAuth } from '~/lib/auth-context'
import { api } from '~/lib/api'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/(auth)/login')({
  component: LoginPage,
})

function LoginPage() {
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
      const session = await signIn(email, password)
      if (session && (session.user as { role?: string }).role === 'tenant') {
        await signOut()
        setError('Akun ini adalah akun penghuni. Silakan masuk melalui Portal Penghuni.')
        return
      }
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError('Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({ provider: 'google' })
    } catch (err) {
      setError('Login Google gagal')
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <Link to="/" className="flex items-center gap-2 mb-8 hover:opacity-90 transition-opacity">
            <Building2 className="h-8 w-8" />
            <span className="text-2xl font-bold">KostManager</span>
          </Link>
          <h2 className="text-3xl font-bold mb-4">Kelola properti Anda dengan lebih baik</h2>
          <p className="text-primary-foreground/80">
            Bergabung dengan 500+ pemilik kost yang sudah mengotomasi pengelolaan properti mereka.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center hover:opacity-90 transition-opacity">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">KostManager</span>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Masuk</CardTitle>
              <CardDescription>Masuk ke akun KostManager Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="/forgot-password" className="text-xs text-primary hover:underline">Lupa password?</a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
              >
                Masuk dengan Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Daftar sekarang
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
