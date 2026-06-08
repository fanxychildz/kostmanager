import { createFileRoute } from '@tanstack/react-router'
import { Plus, Loader2, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery, useMutation } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/payments')({
  component: PaymentsPage,
})

function PaymentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    billId: '',
    paymentMethod: '',
    amount: '',
    paidAt: '',
    notes: '',
  })

  const { data: payments, loading, refetch } = useQuery({
    queryFn: () => api.payments.list(),
  })

  const { data: bills } = useQuery({
    queryFn: () => api.bills.list(),
  })

  const { mutate: createPayment, loading: creating } = useMutation({
    mutationFn: (data: any) => api.payments.create(data),
    onSuccess: () => {
      setDialogOpen(false)
      setFormData({ billId: '', paymentMethod: '', amount: '', paidAt: '', notes: '' })
      refetch()
    },
  })

  const methodLabels: Record<string, string> = { cash: 'Cash', bank_transfer: 'Transfer Bank', qris_manual: 'QRIS', other: 'Lainnya' }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPayment({
      billId: formData.billId,
      paymentMethod: formData.paymentMethod,
      amount: parseInt(formData.amount),
      paidAt: formData.paidAt,
      notes: formData.notes || undefined,
    })
  }

  const totalAmount = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
  const avgAmount = payments && payments.length > 0 ? Math.round(totalAmount / payments.length) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pembayaran</h1>
          <p className="text-muted-foreground">Catat dan pantau pembayaran penghuni</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Catat Pembayaran</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Pembayaran</DialogTitle>
              <DialogDescription>Input pembayaran dari penghuni</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Tagihan</Label>
                <Select value={formData.billId} onValueChange={(value) => setFormData({ ...formData, billId: value })}>
                  <SelectTrigger><SelectValue placeholder="Pilih tagihan" /></SelectTrigger>
                  <SelectContent>
                    {bills?.filter((b: any) => b.status !== 'paid').map((bill: any) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.tenantName || 'Unknown'} - Unit {bill.unitNumber || 'N/A'} ({bill.periodMonth}/{bill.periodYear}) - {formatRupiah(bill.totalAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Metode Bayar</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                      <SelectItem value="qris_manual">QRIS</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jumlah (Rp)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Bayar</Label>
                <Input
                  type="date"
                  value={formData.paidAt}
                  onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Input
                  placeholder="Contoh: Transfer BCA a.n. Ahmad"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Pembayaran
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Tercatat</p><p className="text-2xl font-bold text-success">{formatRupiah(totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Jumlah Transaksi</p><p className="text-2xl font-bold">{payments?.length || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Rata-rata Pembayaran</p><p className="text-2xl font-bold">{formatRupiah(avgAmount)}</p></CardContent></Card>
      </div>

      {payments && payments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada pembayaran</h3>
            <p className="text-muted-foreground">Catat pembayaran pertama Anda</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">{formatDate(payment.paidAt)}</TableCell>
                    <TableCell className="font-medium">{payment.tenantName || 'Unknown'}</TableCell>
                    <TableCell>{payment.unitNumber || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{methodLabels[payment.paymentMethod]}</Badge></TableCell>
                    <TableCell className="font-medium text-success">{formatRupiah(payment.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{payment.notes || '-'}</TableCell>
                    <TableCell><Badge variant={payment.status === 'recorded' ? 'success' : 'destructive'}>{payment.status === 'recorded' ? 'Tercatat' : 'Dibatalkan'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
