import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Loader2, Download, DatabaseBackup, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { api } from '~/lib/api'
import { useAuth } from '~/lib/auth-context'
import { useMutation } from '~/lib/hooks'
import { authClient } from '~/lib/auth-client'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

function getInitials(name?: string | null) {
  if (!name) return 'KM'
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Backup Database Button ────────────────────────────────────────────────────
function BackupButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  const handleBackup = async () => {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/backup', { credentials: 'include' })

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(json.error || `HTTP ${res.status}`)
      }

      // Ambil nama file dari header Content-Disposition
      const disposition = res.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match?.[1] || `kostmanager-backup-${Date.now()}.db`

      // Trigger download di browser
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const sizeKB = Math.round(blob.size / 1024)
      const now = new Date().toLocaleString('id-ID')
      setLastBackup(`${now} — ${filename} (${sizeKB} KB)`)
      setStatus('success')
      setMessage(`✅ Berhasil! File ${filename} (${sizeKB} KB) sedang didownload.`)
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.message || 'Gagal download backup. Coba lagi.')
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleBackup}
        disabled={status === 'loading'}
        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm flex items-center gap-2 transition"
      >
        {status === 'loading' ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Mengunduh database...</>
        ) : (
          <><Download className="h-4 w-4" /> Download Backup Database Sekarang</>
        )}
      </Button>

      {status === 'success' && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
          <span>{message}</span>
        </div>
      )}

      {lastBackup && (
        <p className="text-[11px] text-slate-400 font-medium">
          📅 Backup terakhir sesi ini: {lastBackup}
        </p>
      )}

      <div className="text-[11px] text-slate-400 leading-relaxed">
        Atau akses langsung: <a href="/api/backup" target="_blank" className="text-blue-600 underline font-semibold hover:text-blue-800">/api/backup</a>
        {' '}(harus login sebagai owner)
      </div>
    </div>
  )
}


function SettingsPage() {
  const { user, refreshSession } = useAuth()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileMsg, setProfileMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  useEffect(() => {
    setName(user?.name ?? '')
    setPhone((user as any)?.phone ?? '')
  }, [user])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg('Gagal: Ukuran file foto maksimal 2MB')
      return
    }

    setUploading(true)
    setProfileMsg('')
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result as string
        const res = await authClient.updateUser({
          image: base64,
        } as any)
        if (res.error) throw new Error(res.error.message || 'Gagal mengupload foto')
        setProfileMsg('Foto profil berhasil diperbarui')
        await refreshSession()
      } catch (err: any) {
        setProfileMsg(`Gagal: ${err.message || err}`)
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.updateUser({
        name,
        phone,
      } as any)
      if (res.error) {
        throw new Error(res.error.message || 'Gagal mengubah profil')
      }
      return res.data
    },
    onSuccess: async () => {
      setProfileMsg('Profil berhasil disimpan')
      await refreshSession()
    },
    onError: (err: any) => setProfileMsg(`Gagal: ${err.message || err}`),
  })

  const passwordMutation = useMutation({
    mutationFn: () => api.auth.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setPasswordMsg('Password berhasil diganti')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => setPasswordMsg(`Gagal: ${err}`),
  })

  const handleChangePassword = () => {
    setPasswordMsg('')
    if (newPassword.length < 8) {
      setPasswordMsg('Password baru minimal 8 karakter')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Konfirmasi password tidak cocok')
      return
    }
    passwordMutation.mutate()
  }

  return (
    <DashboardBootstrap>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola akun dan preferensi Anda</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="business">Bisnis</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Profil Akun</CardTitle><CardDescription>Informasi pribadi Anda</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar 
                  className="h-16 w-16 cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-offset-2 ring-slate-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {user?.image && <AvatarImage src={user.image} alt={user.name} className="object-cover" />}
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ganti Foto
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ''} type="email" disabled /></div>
                <div className="space-y-2"><Label>No. HP</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
                <div className="space-y-2"><Label>Role</Label><Input value={(user as any)?.role === 'manager' ? 'Manager' : 'Owner'} disabled /></div>
              </div>
              {profileMsg && <p className="text-sm text-muted-foreground">{profileMsg}</p>}
              <Button onClick={() => { setProfileMsg(''); profileMutation.mutate() }} disabled={profileMutation.loading}>
                {profileMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader><CardTitle>Informasi Bisnis</CardTitle><CardDescription>Detail bisnis properti Anda</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Nama Bisnis</Label><Input defaultValue="Kost Melati Group" /></div>
                <div className="space-y-2"><Label>Tipe Bisnis</Label><Input defaultValue="Pemilik Kost" disabled /></div>
              </div>
              <Button disabled>Simpan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Preferensi Notifikasi</CardTitle><CardDescription>Atur notifikasi yang ingin Anda terima</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Notifikasi pembayaran baru', desc: 'Dapatkan notifikasi saat pembayaran dicatat' },
                { label: 'Reminder tagihan', desc: 'Reminder H-5 sebelum jatuh tempo' },
                { label: 'Laporan mingguan', desc: 'Ringkasan mingguan via email' },
                { label: 'Pengumuman produk', desc: 'Update fitur baru dan perbaikan' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
                  <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
              <Button disabled>Simpan Preferensi</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Keamanan</CardTitle><CardDescription>Kelola password dan keamanan akun</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Password Lama</Label><Input type="password" placeholder="Masukkan password lama" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
                <div className="space-y-2"><Label>Password Baru</Label><Input type="password" placeholder="Minimal 8 karakter" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                <div className="space-y-2"><Label>Konfirmasi Password Baru</Label><Input type="password" placeholder="Ulangi password baru" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                {passwordMsg && <p className="text-sm text-muted-foreground">{passwordMsg}</p>}
                <Button onClick={handleChangePassword} disabled={passwordMutation.loading}>
                  {passwordMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ganti Password
                </Button>
              </CardContent>
            </Card>

            {/* ── Backup Database ── */}
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <span>🗄️</span> Backup Database
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Download salinan database production (<code className="bg-amber-100 px-1 rounded text-xs">kostmanager.db</code>) dari server Vercel langsung ke komputer Anda.
                  Lakukan backup sebelum setiap deployment besar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-white p-4 text-xs text-amber-800 space-y-1.5 font-medium">
                  <p>⚠️ <strong>Penting:</strong> SQLite di Vercel serverless tidak persisten. Data bisa hilang saat restart/deploy jika belum ada external storage.</p>
                  <p>✅ Klik tombol di bawah untuk download database saat ini dari server Vercel.</p>
                  <p>📁 File akan tersimpan dengan nama: <code className="bg-amber-50 px-1 rounded">kostmanager-backup-YYYY-MM-DD-HHMM.db</code></p>
                </div>
                <BackupButton />
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="billing">
          <Card>
            <CardHeader><CardTitle>Langganan</CardTitle><CardDescription>Kelola paket langganan Anda</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary">
                <div>
                  <div className="flex items-center gap-2"><p className="font-bold">Paket Pro</p><Badge>Aktif</Badge></div>
                  <p className="text-sm text-muted-foreground">Rp 99.000/bulan &middot; Hingga 100 unit</p>
                  <p className="text-xs text-muted-foreground mt-1">Perpanjangan berikutnya: 1 Juli 2026</p>
                </div>
                <Button variant="outline">Kelola</Button>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Riwayat Pembayaran</h4>
                <div className="space-y-2">
                  {[
                    { date: '1 Juni 2026', amount: 'Rp 99.000', status: 'Akan datang' },
                    { date: '1 Mei 2026', amount: 'Rp 99.000', status: 'Lunas' },
                    { date: '1 April 2026', amount: 'Rp 99.000', status: 'Lunas' },
                  ].map((item) => (
                    <div key={item.date} className="flex items-center justify-between text-sm p-2 rounded border">
                      <span>{item.date}</span><span className="font-medium">{item.amount}</span>
                      <Badge variant={item.status === 'Lunas' ? 'success' : 'warning'}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardBootstrap>
  )
}
