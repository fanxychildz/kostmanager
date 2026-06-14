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

export const Route = createFileRoute('/(auth)/register')({
  validateSearch: (search: Record<string, unknown>): { plan?: 'gratis' | 'pro' } => {
    return {
      plan: (search.plan as 'gratis' | 'pro') || undefined,
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { plan } = Route.useSearch()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, name, plan)
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError('Gagal mendaftar. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <Link to="/" className="inline-flex items-center mb-8 hover:opacity-90 transition-opacity">
            <img src="/logo-stacked-white.png?v=4" alt="KeKost" className="h-20 w-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-bold mb-4">Mulai kelola properti Anda hari ini</h2>
          <p className="text-primary-foreground/80">
            Daftar gratis dan rasakan kemudahan mengelola kost & kontrakan secara profesional.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center mb-8 justify-center hover:opacity-90 transition-opacity">
            <img src="/logo-stacked.png?v=4" alt="KeKost" className="h-20 w-auto object-contain" />
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Akun {plan === 'pro' ? 'Paket Pro' : 'Paket Gratis'}</CardTitle>
              <CardDescription>
                {plan === 'pro'
                  ? 'Coba Paket Pro gratis selama 14 hari, tanpa kartu kredit.'
                  : 'Mulai kelola hingga 10 unit kamar gratis selamanya.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="Nama lengkap Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Daftar
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Masuk di sini
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
