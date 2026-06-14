import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { Sidebar } from '~/components/layout/sidebar'
import { Header } from '~/components/layout/header'
import { api } from '~/lib/api'
import { useState, useEffect } from 'react'
import { preloadDashboardData, useQuery, useMutation } from '~/lib/hooks'
import { motion } from 'motion/react'
import { useAuth } from '~/lib/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

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
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const { data: invoices, loading: loadingInvoices, refetch: refetchInvoices } = useQuery({
    queryFn: () => api.ownerBilling.listInvoices(),
    cacheKey: 'ownerBilling.listInvoices',
    enabled: !!user && (user as any).role === 'owner',
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
            className="mb-8 flex items-center justify-center"
          >
            <img src="/logo-stacked-white.png?v=4" alt="KeKost" className="h-20 w-auto object-contain" />
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

  const u = user as any
  const isExpired = u && u.role === 'owner' && (
    u.subscriptionStatus === 'expired' || 
    (u.subscriptionExpiresAt && new Date() > new Date(u.subscriptionExpiresAt))
  )

  if (isExpired) {
    const pendingInvoices = (invoices || []).filter((inv: any) => inv.status === 'pending')
    const unverifiedInvoices = (invoices || []).filter((inv: any) => inv.status === 'pending_verification')

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden font-sans p-4">
        {/* Modern glowing backdrops */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full px-6 sm:px-8 py-10 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-md">
          {/* Locked Icon */}
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold tracking-tight mb-2">Masa Langganan Habis</h2>
          <p className="text-xs text-slate-400 font-semibold mb-6 leading-relaxed">
            Paket KeKost Anda telah kedaluwarsa. Silakan lakukan pembayaran di bawah atau hubungi Administrator untuk perpanjangan.
          </p>

          {uploadSuccess && (
            <div className="w-full flex items-start gap-2 rounded-xl bg-emerald-955/40 border border-emerald-800 p-3 text-left text-[11px] text-emerald-400 font-medium mb-4">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
              <span>Bukti transfer berhasil dikirim! Akun Anda akan aktif kembali setelah diverifikasi admin.</span>
            </div>
          )}

          {/* Active Status Info */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 w-full mb-4 text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Status Paket:</span>
              <span className="text-red-500 font-bold">Expired</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Batas Unit:</span>
              <span className="text-slate-200">Hingga 100 Unit</span>
            </div>
            {u.subscriptionExpiresAt && (
              <div className="flex justify-between text-slate-400">
                <span>Tanggal Berakhir:</span>
                <span className="text-slate-200">
                  {new Date(u.subscriptionExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {/* Pending Invoices Area */}
          {pendingInvoices.length > 0 ? (
            <div className="w-full mb-6 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tagihan Belum Dibayar</span>
              <div className="space-y-2">
                {pendingInvoices.map((inv: any) => (
                  <div key={inv.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold gap-3">
                    <div>
                      <span className="text-slate-200 block font-bold">Periode {getIndonesianMonthName(inv.periodMonth)} {inv.periodYear}</span>
                      <span className="text-slate-400 text-[10px] block mt-0.5">Rp {inv.amount.toLocaleString('id-ID')}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedInvoiceForPayment(inv)
                        setProofImageBase64('')
                        setUploadError('')
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold px-3 py-1.5 transition cursor-pointer"
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : unverifiedInvoices.length > 0 ? (
            <div className="w-full mb-6 bg-slate-900/30 border border-blue-900/30 rounded-2xl p-4 text-left text-xs font-semibold text-blue-400 flex flex-col gap-1.5">
              <span className="text-slate-200 font-bold block text-sm">Menunggu Verifikasi</span>
              <p className="text-[11px] text-slate-400 font-medium">Anda telah mengirimkan bukti transfer. Akun akan terbuka otomatis setelah dikonfirmasi.</p>
            </div>
          ) : (
            <div className="w-full mb-6 bg-slate-900/30 border border-slate-800 rounded-2xl p-4 text-left text-xs text-slate-400 font-medium">
              💡 Belum ada tagihan baru yang diterbitkan. Hubungi Taufiq Rusdhi untuk menerbitkan tagihan perpanjangan.
            </div>
          )}
          
          <div className="w-full space-y-3">
            <button 
              onClick={async () => {
                try {
                  await api.ownerBilling.simulateSubscriptionState('activate')
                  alert('Langganan berhasil diaktifkan kembali secara instan!')
                  window.location.reload()
                } catch (err) {
                  alert('Gagal mengaktifkan: ' + err)
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-3.5 transition cursor-pointer border-none shadow-lg shadow-emerald-600/20"
            >
              ⚡ Aktivasi Instan (Buka Kunci Dashboard)
            </button>
            <a 
              href="https://wa.me/6285156469451?text=Halo%20Pak%20Taufiq%20Rusdhi%20(Admin%20KeKost),%20saya%20ingin%20memperpanjang%20paket%20langganan%20saya."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold py-3.5 transition block text-center cursor-pointer border border-slate-850"
            >
              Hubungi Pak Taufiq Rusdhi (WhatsApp)
            </a>
            <button 
              onClick={async () => {
                await signOut()
                navigate({ to: '/login' })
              }}
              className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-xl text-xs font-bold py-3.5 transition cursor-pointer border border-slate-800"
            >
              Keluar Akun
            </button>
          </div>
        </div>

        {/* Upload Payment Proof Dialog */}
        <Dialog open={!!selectedInvoiceForPayment} onOpenChange={(isOpen) => { if (!isOpen) setSelectedInvoiceForPayment(null); }}>
          <DialogContent className="sm:max-w-[450px] bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <form onSubmit={handleUploadProofSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white">Konfirmasi Pembayaran</DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Silakan lakukan transfer bank ke rekening admin di bawah ini dan unggah foto bukti transfernya.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2.5 font-semibold text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Bank Tujuan:</span>
                  <span className="text-white font-extrabold">Bank BCA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">No. Rekening:</span>
                  <span className="text-white font-extrabold select-all">085156469451</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Atas Nama:</span>
                  <span className="text-white font-extrabold">Taufiq Rusdhi</span>
                </div>
                <div className="flex justify-between border-t pt-2 border-slate-800/80">
                  <span className="text-slate-500 font-medium">Jumlah Transfer:</span>
                  <span className="text-white font-black text-sm">
                    Rp {selectedInvoiceForPayment?.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proofFile" className="text-xs font-bold text-slate-350">Pilih Foto/Gambar Bukti Transfer</Label>
                <Input
                  id="proofFile"
                  type="file"
                  accept="image/*"
                  onChange={handleProofFileChange}
                  className="rounded-xl border-slate-800 text-xs px-3 py-2 bg-slate-950 text-white"
                  required
                />
                {proofImageBase64 && (
                  <div className="mt-2 border border-slate-800 rounded-xl overflow-hidden max-h-36 flex items-center justify-center bg-slate-950">
                    <img src={proofImageBase64} alt="Bukti Transfer" className="object-contain max-h-36" />
                  </div>
                )}
              </div>

              {uploadError && <p className="text-xs text-red-500 font-medium">{uploadError}</p>}

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedInvoiceForPayment(null)} className="rounded-xl text-xs py-2 px-4 bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-850 cursor-pointer">
                  Batal
                </Button>
                <Button type="submit" disabled={submitProofMutation.loading} className="rounded-xl text-xs py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer border-none">
                  {submitProofMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kirim Bukti Pembayaran
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
