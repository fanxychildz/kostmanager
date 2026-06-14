import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2, CreditCard, Trash2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

export const Route = createFileRoute('/dashboard/payments/incoming')({
  component: PaymentsIncomingPage,
})

function PaymentsIncomingPage() {
  const [proofDialogOpen, setProofDialogOpen] = useState(false)
  const [activeProofUrl, setActiveProofUrl] = useState('')
  const [activeTenantName, setActiveTenantName] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const handleViewProof = (url: string, name: string) => {
    setActiveProofUrl(url)
    setActiveTenantName(name)
    setProofDialogOpen(true)
  }

  const handleUpdateStatus = async (paymentId: string, newStatus: 'paid' | 'rejected') => {
    const actionLabel = newStatus === 'paid' ? 'mengonfirmasi' : 'menolak'
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} pembayaran ini?`)) return
    
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Gagal mengubah status')
      }
      refetch()
    } catch (err: any) {
      alert('Gagal mengubah status pembayaran: ' + err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pembayaran ini secara permanen? Status tagihan terkait akan diperbarui.')) return
    try {
      await api.payments.delete(id)
      await refetch()
    } catch (err) {
      alert('Gagal menghapus pembayaran: ' + err)
    }
  }

  const { data: payments, loading, refetch } = useQuery({
    queryFn: () => api.payments.list(),
    cacheKey: 'payments.list',
  })

  const paymentList = useMemo(() => {
    if (!payments) return []
    if (Array.isArray(payments)) return payments
    if ('items' in (payments as any) && Array.isArray((payments as any).items)) return (payments as any).items
    return []
  }, [payments])

  const pendingPayments = useMemo(() => {
    return paymentList
      .filter((p: any) => p.status === 'pending')
      .sort((a: any, b: any) => new Date(b.createdAt || b.paidAt).getTime() - new Date(a.createdAt || a.paidAt).getTime())
  }, [paymentList])

  const pendingCount = pendingPayments.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const methodLabels: Record<string, string> = { cash: 'Cash', bank_transfer: 'Transfer Bank', qris_manual: 'QRIS', other: 'Lainnya' }

  return (
    <DashboardBootstrap>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Antrean Pembayaran Masuk</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Konfirmasi atau tolak bukti transfer pembayaran pending</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 grid grid-cols-2 h-auto w-full md:inline-flex md:h-10 md:w-auto gap-1">
          <TabsTrigger value="all" asChild>
            <Link to="/dashboard/payments" className="text-xs font-semibold py-1.5 md:py-2 md:text-sm cursor-pointer justify-center flex items-center">
              Semua Pembayaran
            </Link>
          </TabsTrigger>
          <TabsTrigger value="pending" asChild>
            <Link to="/dashboard/payments/incoming" className="text-xs font-semibold py-1.5 md:py-2 md:text-sm cursor-pointer justify-center flex items-center relative">
              Pembayaran Masuk (Pending)
              {pendingCount > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
          </TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          {pendingPayments.length === 0 ? (
            <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs">
              <CardContent className="p-12 text-center">
                <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Tidak ada pembayaran masuk</h3>
                <p className="text-sm text-slate-400">Semua pembayaran masuk telah diproses.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Penghuni</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-slate-600 font-semibold">{formatDate(payment.paidAt)}</TableCell>
                        <TableCell className="font-bold text-slate-800">{payment.tenantName || 'Unknown'}</TableCell>
                        <TableCell className="font-bold text-slate-900">Unit {payment.unitNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase border bg-slate-50/50 text-slate-700 border-slate-200">
                            {methodLabels[payment.paymentMethod]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-extrabold text-emerald-600">{formatRupiah(payment.amount)}</TableCell>
                        <TableCell className="text-slate-500 font-medium">{payment.notes || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="warning" className="px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase border">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {payment.proofImage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-lg cursor-pointer"
                                onClick={() => handleViewProof(payment.proofImage, payment.tenantName)}
                              >
                                Bukti
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold text-xs rounded-lg cursor-pointer"
                              onClick={() => handleUpdateStatus(payment.id, 'paid')}
                              disabled={updatingStatus}
                            >
                              Konfirmasi
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-lg cursor-pointer"
                              onClick={() => handleUpdateStatus(payment.id, 'rejected')}
                              disabled={updatingStatus}
                            >
                              Tolak
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-600 hover:text-rose-600 rounded-lg cursor-pointer"
                              onClick={() => handleDeletePayment(payment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </Tabs>

      {/* Proof Preview Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bukti Transfer - {activeTenantName}</DialogTitle>
            <DialogDescription>
              Pratinjau berkas bukti transfer pembayaran dari penghuni
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center p-4 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
            <img
              src={activeProofUrl}
              alt="Bukti Transfer"
              className="max-h-[60vh] object-contain rounded-lg shadow-sm"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setProofDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardBootstrap>
  )
}
