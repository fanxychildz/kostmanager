import { createFileRoute, redirect } from '@tanstack/react-router'
import { Check, X, FileText, Lock, Unlock, Loader2, ShieldAlert, DollarSign, Users, CheckCircle2, ChevronRight, AlertCircle, Sparkles } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery, useMutation } from '~/lib/hooks'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

export const Route = createFileRoute('/dashboard/admin-billing')({
  beforeLoad: async () => {
    const session = await api.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    if (session.user.email !== 'fanxychild1204@gmail.com') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminBillingPage,
})

function AdminBillingPage() {
  const [selectedOwner, setSelectedOwner] = useState<any>(null)
  
  // Modals state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [activeProofUrl, setActiveProofUrl] = useState('')
  const [activeInvoiceId, setActiveInvoiceId] = useState('')
  
  // Invoice form state
  const [newInvoiceData, setNewInvoiceData] = useState({
    amount: '99000',
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
  })

  // Queries
  const { data: owners, loading: loadingOwners, refetch: refetchOwners } = useQuery({
    queryFn: () => api.adminBilling.listOwners(),
    cacheKey: 'adminBilling.listOwners',
  })

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (invoiceId: string) => api.adminBilling.approvePayment(invoiceId),
    onSuccess: () => {
      setProofModalOpen(false)
      refetchOwners()
    },
    onError: (err) => alert('Gagal mengonfirmasi: ' + err),
  })

  const rejectMutation = useMutation({
    mutationFn: (invoiceId: string) => api.adminBilling.rejectPayment(invoiceId),
    onSuccess: () => {
      setProofModalOpen(false)
      refetchOwners()
    },
    onError: (err) => alert('Gagal menolak: ' + err),
  })

  const createInvoiceMutation = useMutation({
    mutationFn: (variables: { userId: string; amount: number; periodMonth: number; periodYear: number }) =>
      api.adminBilling.createInvoice(variables),
    onSuccess: () => {
      setInvoiceModalOpen(false)
      refetchOwners()
      alert('Invoice berhasil diterbitkan untuk pemilik kost!')
    },
    onError: (err) => alert('Gagal membuat invoice: ' + err),
  })

  const forceExpireMutation = useMutation({
    mutationFn: (userId: string) => api.adminBilling.forceExpire(userId),
    onSuccess: () => {
      refetchOwners()
      alert('Langganan pemilik kost berhasil di-lock (expired)!')
    },
    onError: (err) => alert('Gagal me-lock langganan: ' + err),
  })

  // Summary Metrics
  const metrics = useMemo(() => {
    if (!owners) return { total: 0, active: 0, expired: 0, pendingVerification: 0 }
    
    let active = 0
    let expired = 0
    let pendingVerification = 0

    owners.forEach((o: any) => {
      if (o.subscriptionStatus === 'active') active++
      else expired++

      const hasPendingVerification = (o.invoices || []).some((inv: any) => inv.status === 'pending_verification')
      if (hasPendingVerification) pendingVerification++
    })

    return {
      total: owners.length,
      active,
      expired,
      pendingVerification,
    }
  }, [owners])

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOwner) return
    
    createInvoiceMutation.mutate({
      userId: selectedOwner.id,
      amount: parseInt(newInvoiceData.amount, 10),
      periodMonth: Number(newInvoiceData.periodMonth),
      periodYear: Number(newInvoiceData.periodYear),
    })
  }

  const getIndonesianMonthName = (monthNum: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Buni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return months[monthNum - 1] || 'Bulan'
  }

  return (
    <DashboardBootstrap>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
          
          <div className="space-y-1.5 relative z-10">
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Platform Super Admin Panel
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">KeKost Billing & Subscriptions</h1>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xl">
              Panel khusus bagi Anda (Pemilik Aplikasi KeKost) untuk memantau status langganan pemilik kost (landlords), memvalidasi unggahan bukti transfer bank, dan menerbitkan tagihan secara manual.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        {loadingOwners ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="bg-white border-slate-200/60 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pemilik Kost</p>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></div>
                  <span className="text-2xl font-extrabold text-slate-900">{metrics.total}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-200/60 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Langganan Aktif</p>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
                  <span className="text-2xl font-extrabold text-emerald-600">{metrics.active}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-200/60 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Masa Aktif Habis (Locked)</p>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Lock className="w-4 h-4" /></div>
                  <span className="text-2xl font-extrabold text-red-600">{metrics.expired}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-amber-50 border-amber-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
              {metrics.pendingVerification > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              )}
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Butuh Verifikasi Bayar</p>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><ShieldAlert className="w-4 h-4" /></div>
                  <span className="text-2xl font-black text-amber-900">{metrics.pendingVerification}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Landlords Listing */}
        {!loadingOwners && owners && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Owners List Table */}
            <Card className="bg-white border-slate-200/60 rounded-2xl shadow-sm overflow-hidden md:col-span-2">
              <CardHeader className="border-b bg-slate-50/50 p-4">
                <CardTitle className="text-sm font-bold text-slate-800">Daftar Akun Pemilik Properti (Owner)</CardTitle>
                <CardDescription className="text-xs text-slate-400">Pilih pemilik untuk melihat rincian riwayat tagihannya</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Pemilik</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Masa Aktif</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {owners.map((o: any) => {
                      const isSelected = selectedOwner?.id === o.id
                      const hasPendingVerification = (o.invoices || []).some((inv: any) => inv.status === 'pending_verification')
                      return (
                        <TableRow 
                          key={o.id}
                          onClick={() => setSelectedOwner(o)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-slate-50/50'}`}
                        >
                          <TableCell className="font-semibold text-slate-800">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                {o.name}
                                {hasPendingVerification && (
                                  <Badge className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">BUKTI</Badge>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">{o.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={o.subscriptionStatus === 'active' ? 'success' : 'destructive'} className="text-[10px] font-bold">
                              {o.subscriptionStatus === 'active' ? 'Aktif' : 'Expired'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px] font-semibold text-slate-600">
                            {o.subscriptionExpiresAt ? (
                              new Date(o.subscriptionExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            ) : (
                              'Tidak Terbatas'
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {o.subscriptionStatus === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-[10px] rounded-xl cursor-pointer"
                                  onClick={() => {
                                    if (confirm(`Apakah Anda yakin ingin memblokir/mengunci akun ${o.name} secara paksa?`)) {
                                      forceExpireMutation.mutate(o.id)
                                    }
                                  }}
                                  disabled={forceExpireMutation.loading}
                                >
                                  Lock
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-[10px] font-bold rounded-xl cursor-pointer"
                                onClick={() => {
                                  setSelectedOwner(o)
                                  setInvoiceModalOpen(true)
                                }}
                              >
                                Tagih
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Selected Owner Detail Panel */}
            <Card className="bg-white border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="border-b bg-slate-50/50 p-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">Detail Riwayat Tagihan</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {selectedOwner ? selectedOwner.name : 'Pilih akun di tabel kiri'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {!selectedOwner ? (
                    <div className="text-center py-16 text-xs text-slate-400 font-semibold border border-dashed rounded-xl p-4 flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <span>Silakan pilih salah satu akun pemilik di sebelah kiri untuk mengelola tagihan langganan KeKost mereka.</span>
                    </div>
                  ) : !selectedOwner.invoices || selectedOwner.invoices.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-semibold bg-slate-50 border border-dashed rounded-xl p-4">
                      Belum ada riwayat tagihan yang dibuat untuk akun ini.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                      {selectedOwner.invoices.map((inv: any) => (
                        <div key={inv.id} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 space-y-2 text-xs font-semibold">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-slate-850 font-bold block text-sm">
                                Periode {getIndonesianMonthName(inv.periodMonth)} {inv.periodYear}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Jatuh Tempo: {new Date(inv.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <span className="text-sm font-black text-slate-900">
                              {formatRupiah(inv.amount)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2">
                            <Badge variant={
                              inv.status === 'paid' ? 'success' :
                              inv.status === 'pending_verification' ? 'warning' : 'destructive'
                            } className="text-[9px] font-black px-1.5 py-0.5 rounded-md">
                              {inv.status === 'paid' ? 'LUNAS' :
                               inv.status === 'pending_verification' ? 'BUTUH VERIFIKASI' : 'BELUM DIBAYAR'}
                            </Badge>

                            <div className="flex items-center gap-1.5">
                              {inv.status === 'pending_verification' && inv.proofImage && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setActiveProofUrl(inv.proofImage)
                                    setActiveInvoiceId(inv.id)
                                    setProofModalOpen(true)
                                  }}
                                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-extrabold h-7 py-0.5 cursor-pointer shadow-xs border-none"
                                >
                                  Cek Struk Bukti
                                </Button>
                              )}
                              {inv.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm('Lunas secara manual tanpa bukti transfer?')) {
                                      approveMutation.mutate(inv.id)
                                    }
                                  }}
                                  className="rounded-lg text-[10px] font-extrabold h-7 py-0.5 cursor-pointer border-slate-200"
                                >
                                  Set Lunas
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>
        )}

        {/* Modal: Create Invoice manually */}
        <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-white text-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200">
            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-black text-slate-900">Menerbitkan Tagihan Baru</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Buat invoice manual untuk pemilik kost: <strong className="text-slate-800">{selectedOwner?.name}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <Label htmlFor="amount">Nominal Tagihan (Rp)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={newInvoiceData.amount} 
                    onChange={e => setNewInvoiceData({...newInvoiceData, amount: e.target.value})}
                    className="rounded-xl border-slate-200 bg-slate-50/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="month">Bulan Periode</Label>
                    <select
                      id="month"
                      value={newInvoiceData.periodMonth}
                      onChange={e => setNewInvoiceData({...newInvoiceData, periodMonth: Number(e.target.value)})}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white text-slate-800"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{getIndonesianMonthName(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="year">Tahun Periode</Label>
                    <Input 
                      id="year" 
                      type="number" 
                      value={newInvoiceData.periodYear} 
                      onChange={e => setNewInvoiceData({...newInvoiceData, periodYear: Number(e.target.value)})}
                      className="rounded-xl border-slate-200 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setInvoiceModalOpen(false)} className="rounded-xl text-xs py-2 px-4 cursor-pointer">
                  Batal
                </Button>
                <Button type="submit" disabled={createInvoiceMutation.loading} className="rounded-xl text-xs py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer border-none">
                  {createInvoiceMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Terbitkan Tagihan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: View uploaded transfer receipt / proof */}
        <Dialog open={proofModalOpen} onOpenChange={setProofModalOpen}>
          <DialogContent className="sm:max-w-[450px] bg-white text-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200">
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-black text-slate-900">Verifikasi Struk Pembayaran</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Berikut adalah struk bukti transfer yang diunggah oleh pemilik kost.
                </DialogDescription>
              </DialogHeader>

              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] flex items-center justify-center bg-slate-100 p-2">
                {activeProofUrl ? (
                  <img src={activeProofUrl} alt="Struk Bukti Transfer" className="object-contain max-h-[280px]" />
                ) : (
                  <div className="text-center py-12 text-xs text-slate-400 font-semibold">Gambar tidak ditemukan</div>
                )}
              </div>

              <DialogFooter className="gap-2 pt-2 grid grid-cols-2">
                <Button 
                  type="button" 
                  onClick={() => rejectMutation.mutate(activeInvoiceId)} 
                  disabled={rejectMutation.loading || approveMutation.loading}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs py-2 px-4 cursor-pointer font-bold border border-rose-100"
                >
                  {rejectMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tolak Bukti (Reject)
                </Button>
                <Button 
                  type="button" 
                  onClick={() => approveMutation.mutate(activeInvoiceId)} 
                  disabled={approveMutation.loading || rejectMutation.loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs py-2 px-4 cursor-pointer font-bold border-none"
                >
                  {approveMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Konfirmasi Lunas (Approve)
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardBootstrap>
  )
}
