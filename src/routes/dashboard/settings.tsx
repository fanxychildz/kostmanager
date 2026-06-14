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
import { useQuery, useMutation } from '~/lib/hooks'
import { authClient } from '~/lib/auth-client'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '~/components/ui/dialog'

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

  const { data: invoices, loading: loadingInvoices, refetch: refetchInvoices } = useQuery({
    queryFn: () => api.ownerBilling.listInvoices(),
    cacheKey: 'ownerBilling.listInvoices',
  })

  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null)
  const [proofImageBase64, setProofImageBase64] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Gagal: Ukuran file foto maksimal 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProofImageBase64(reader.result as string)
      setUploadError('')
    }
    reader.readAsDataURL(file)
  }

  const submitProofMutation = useMutation({
    mutationFn: (variables: { invoiceId: string; proofImage: string }) =>
      api.ownerBilling.submitPaymentProof(variables),
    onSuccess: () => {
      setUploadSuccess(true)
      setSelectedInvoiceForPayment(null)
      setProofImageBase64('')
      refetchInvoices()
      setTimeout(() => setUploadSuccess(false), 5000)
    },
    onError: (err) => setUploadError(err),
  })

  const upgradeMutation = useMutation({
    mutationFn: () => api.ownerBilling.requestUpgrade(),
    onSuccess: () => {
      refetchInvoices()
      alert('Permintaan upgrade berhasil! Tagihan Paket Pro baru berstatus pending telah dibuat di bawah. Silakan klik tombol "Bayar & Upload Bukti" untuk menyelesaikan pembayaran dan mengirim struk transfer ke Admin.')
    },
    onError: (err) => alert('Gagal meminta upgrade: ' + err),
  })

  const handleUploadProofSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError('')
    if (!selectedInvoiceForPayment) return
    if (!proofImageBase64) {
      setUploadError('Silakan pilih foto/gambar bukti transfer terlebih dahulu.')
      return
    }
    submitProofMutation.mutate({
      invoiceId: selectedInvoiceForPayment.id,
      proofImage: proofImageBase64,
    })
  }

  const getIndonesianMonthName = (monthNum: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return months[monthNum - 1] || 'Bulan'
  }

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
        <TabsList className="bg-slate-100/80 p-1 grid grid-cols-6 h-auto w-full md:inline-flex md:h-10 md:w-auto gap-1">
          <TabsTrigger value="profile" className="col-span-2 text-xs font-semibold text-center justify-center py-1.5 md:py-2 md:text-sm">Profil</TabsTrigger>
          <TabsTrigger value="business" className="col-span-2 text-xs font-semibold text-center justify-center py-1.5 md:py-2 md:text-sm">Bisnis</TabsTrigger>
          <TabsTrigger value="notifications" className="col-span-2 text-xs font-semibold text-center justify-center py-1.5 md:py-2 md:text-sm">Notifikasi</TabsTrigger>
          <TabsTrigger value="security" className="col-span-3 text-xs font-semibold text-center justify-center py-1.5 md:py-2 md:text-sm">Keamanan</TabsTrigger>
          <TabsTrigger value="billing" className="col-span-3 text-xs font-semibold text-center justify-center py-1.5 md:py-2 md:text-sm">Billing</TabsTrigger>
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
            <CardHeader>
              <CardTitle>Langganan</CardTitle>
              <CardDescription>Kelola paket langganan dan tagihan akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {uploadSuccess && (
                <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                  <span>Bukti pembayaran berhasil diunggah! Mohon tunggu verifikasi oleh Administrator untuk memperpanjang paket Anda.</span>
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800">
                      {(user as any)?.subscriptionExpiresAt ? 'Paket Pro' : 'Paket Gratis'}
                    </p>
                    <Badge variant={(user as any)?.subscriptionStatus === 'active' ? 'success' : 'destructive'}>
                      {(user as any)?.subscriptionStatus === 'active' ? 'Aktif' : 'Expired'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(user as any)?.subscriptionExpiresAt ? 'Rp 49.000/bulan · Hingga 100 unit' : 'Rp 0 · Hingga 10 unit'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(user as any)?.subscriptionExpiresAt ? (
                      `Perpanjangan berikutnya: ${new Date((user as any).subscriptionExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    ) : (
                      'Masa Aktif: Tidak Terbatas'
                    )}
                  </p>
                </div>
                {(user as any)?.subscriptionExpiresAt ? (
                  <Button variant="outline" asChild>
                    <a 
                      href="https://wa.me/6285156469451?text=Halo%20Pak%20Taufiq%20Rusdhi%20(Admin%20KeKost),%20saya%20ingin%20memperpanjang%20paket%20langganan%20saya."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Hubungi Admin
                    </a>
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin melakukan upgrade ke Paket Pro? Ini akan menerbitkan invoice baru sebesar Rp 49.000 untuk bulan ini.')) {
                        upgradeMutation.mutate()
                      }
                    }}
                    disabled={upgradeMutation.loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-500/10 border-none"
                  >
                    {upgradeMutation.loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                    Upgrade ke Paket Pro
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-sm mb-3">Tagihan & Riwayat Pembayaran</h4>
                {loadingInvoices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !invoices || invoices.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed">
                    Belum ada riwayat tagihan langganan KeKost untuk akun Anda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoices.map((inv: any) => (
                      <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs p-3.5 rounded-xl border border-slate-200 bg-white gap-3 font-semibold">
                        <div className="space-y-1">
                          <span className="text-slate-800 font-extrabold text-sm block">
                            Periode {getIndonesianMonthName(inv.periodMonth)} {inv.periodYear}
                          </span>
                          <span className="text-slate-400 text-[10px] block">
                            Jatuh Tempo: {new Date(inv.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="font-black text-slate-900 text-sm">
                            Rp {inv.amount.toLocaleString('id-ID')}
                          </span>
                          <Badge variant={
                            inv.status === 'paid' ? 'success' :
                            inv.status === 'pending_verification' ? 'warning' : 'destructive'
                          }>
                            {inv.status === 'paid' ? 'Lunas' :
                             inv.status === 'pending_verification' ? 'Menunggu Verifikasi' : 'Belum Dibayar'}
                          </Badge>
                          
                          {inv.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedInvoiceForPayment(inv)
                                setProofImageBase64('')
                                setUploadError('')
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold py-1 h-7 cursor-pointer"
                            >
                              Bayar & Upload Bukti
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Payment Proof Dialog */}
      <Dialog open={!!selectedInvoiceForPayment} onOpenChange={(isOpen) => { if (!isOpen) setSelectedInvoiceForPayment(null); }}>
        <DialogContent className="sm:max-w-[450px] bg-white text-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200">
          <form onSubmit={handleUploadProofSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">Konfirmasi Pembayaran</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Silakan lakukan transfer bank ke rekening admin di bawah ini dan unggah foto bukti transfernya.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2.5 font-semibold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Bank Tujuan:</span>
                <span className="text-slate-800 font-extrabold">Bank BCA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">No. Rekening:</span>
                <span className="text-slate-800 font-extrabold select-all">085156469451</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Atas Nama:</span>
                <span className="text-slate-800 font-extrabold">Taufiq Rusdhi</span>
              </div>
              <div className="flex justify-between border-t pt-2 border-slate-150">
                <span className="text-slate-400 font-medium">Jumlah Transfer:</span>
                <span className="text-slate-900 font-black text-sm">
                  Rp {selectedInvoiceForPayment?.amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proofFile" className="text-xs font-bold text-slate-700">Pilih Foto/Gambar Bukti Transfer</Label>
              <Input
                id="proofFile"
                type="file"
                accept="image/*"
                onChange={handleProofFileChange}
                className="rounded-xl border-slate-250 text-xs px-3 py-2 bg-slate-50/50"
                required
              />
              {proofImageBase64 && (
                <div className="mt-2 border rounded-xl overflow-hidden max-h-36 flex items-center justify-center bg-slate-100">
                  <img src={proofImageBase64} alt="Bukti Transfer" className="object-contain max-h-36" />
                </div>
              )}
            </div>

            {uploadError && <p className="text-xs text-destructive font-medium">{uploadError}</p>}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setSelectedInvoiceForPayment(null)} className="rounded-xl text-xs py-2 px-4 cursor-pointer">
                Batal
              </Button>
              <Button type="submit" disabled={submitProofMutation.loading} className="rounded-xl text-xs py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer">
                {submitProofMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim Bukti Pembayaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardBootstrap>
  )
}
