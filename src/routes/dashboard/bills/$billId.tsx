import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Printer, Download, Loader2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/bills/$billId')({
  component: BillDetailPage,
})

function BillDetailPage() {
  const { billId } = Route.useParams()
  const navigate = useNavigate()

  const { data: billPage, loading, error, refetch } = useQuery({
    queryFn: async () => api.payments.getPaymentsByBill({ billId } as any),
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !billPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Tagihan tidak ditemukan{error ? `: ${error}` : ''}</p>
      </div>
    )
  }

  const { bill, property, tenant, unit, payments } = billPage as any
  const totalPayments = (payments || [])
    .filter((p: any) => p.status === 'recorded')
    .reduce((sum: number, p: any) => sum + p.amount, 0)
  const remaining = Math.max(0, bill.totalAmount - totalPayments)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595.28, 841.89])
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const drawText = (text: string, x: number, y: number, size = 11, bold = false) => {
        const used = bold ? fontBold : font
        page.drawText(text, { x, y, size, font: used, color: rgb(0.15, 0.15, 0.15) })
      }

      const drawBox = (x: number, y: number, w: number, h: number) => {
        page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 1 })
      }

      const contentFontSize = 10.5
      const rowHeight = 22
      let cursorY = 790

      drawBox(40, 730, 515, 110)
      drawText('KostManager', 52, 812, 16, true)
      drawText('Kuitansi Pembayaran', 52, 794, 13, true)
      drawText(`Properti : ${property?.name ?? '-'}`, 52, 774, contentFontSize)
      drawText(`Alamat   : ${property?.address ?? '-'}`, 52, 756, contentFontSize)
      drawText(`Tanggal  : ${formatDate(new Date().toISOString())}`, 52, 738, contentFontSize)

      cursorY = 710
      drawBox(40, cursorY - 120, 515, 128)
      drawText('Penghuni', 52, cursorY, 11, true)
      drawText(`: ${tenant?.fullName ?? bill.tenantName ?? '-'}`, 200, cursorY, contentFontSize)
      cursorY -= 22
      drawText('Unit', 52, cursorY, 11, true)
      drawText(`: Kamar ${unit?.unitNumber ?? bill.unitNumber ?? '-'}`, 200, cursorY, contentFontSize)
      cursorY -= 22
      drawText('Periode', 52, cursorY, 11, true)
      drawText(`: ${bill.periodMonth}/${bill.periodYear}`, 200, cursorY, contentFontSize)
      cursorY -= 22
      drawText('Jatuh tempo', 52, cursorY, 11, true)
      drawText(`: ${formatDate(bill.dueDate)}`, 200, cursorY, contentFontSize)

      cursorY -= 26
      drawText('Rincian', 52, cursorY, 12, true)
      cursorY -= 18
      const startX = 52
      let rowY = cursorY
      const colX = [startX, startX + 260, startX + 360, startX + 460]
      const headers = ['Deskripsi', 'Metode', 'Jumlah', 'Tanggal']
      headers.forEach((h, i) => drawText(h, colX[i], rowY, 11, true))
      rowY -= rowHeight

      const rows: any[] = [
        { label: 'Total Tagihan', amount: bill.totalAmount, method: '-', date: formatDate(bill.createdAt) },
        ...(payments || []).map((p: any) => ({
          label: 'Pembayaran',
          amount: p.amount,
          method: p.paymentMethod === 'bank_transfer' ? 'Transfer Bank' : p.paymentMethod === 'cash' ? 'Cash' : p.paymentMethod === 'qris_manual' ? 'QRIS' : 'Lainnya',
          date: formatDate(p.paidAt),
        })),
        { label: 'Sisa Tagihan', amount: remaining, method: '-', date: '-' },
      ]

      rows.forEach((r) => {
        if (rowY < 90) return
        drawBox(40, rowY - 6, 515, rowHeight)
        drawText(r.label, colX[0], rowY, contentFontSize)
        drawText(r.method, colX[1], rowY, contentFontSize)
        drawText(formatRupiah(r.amount), colX[2], rowY, contentFontSize)
        drawText(r.date, colX[3], rowY, contentFontSize)
        rowY -= rowHeight
      })

      const summaryY = Math.min(rowY - 14, 100)
      drawBox(40, summaryY - 28, 515, 54)
      drawText(`Total dibayar : ${formatRupiah(totalPayments)}`, 52, summaryY, contentFontSize)
      drawText(`Sisa tagihan  : ${formatRupiah(remaining)}`, 52, summaryY - 22, contentFontSize)

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Gagal generate PDF', err)
      alert('Gagal generate PDF kuitansi.')
    }
  }

  return (
    <div className="space-y-6" id="kuitansi-area">
      <style>{`@media print { body { background: #fff; } #kuitansi-area * { color: #000 !important; border-color: #999 !important; } }`}</style>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/bills' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Tagihan</h1>
            <p className="text-muted-foreground">Periode {bill.periodMonth}/{bill.periodYear}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rincian Tagihan & Pembayaran</CardTitle>
              <Badge variant={bill.status === 'paid' || bill.status === 'partial' ? 'success' : bill.status === 'overdue' ? 'destructive' : 'warning'}>
                {bill.status === 'paid' ? 'Lunas' : bill.status === 'partial' ? 'Cicilan' : bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Dibayar'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow><TableCell className="font-medium">Sewa Kamar</TableCell><TableCell className="text-right">{formatRupiah(bill.rentAmount)}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Listrik</TableCell><TableCell className="text-right">{formatRupiah(bill.electricityAmount)}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Air</TableCell><TableCell className="text-right">{formatRupiah(bill.waterAmount)}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">WiFi</TableCell><TableCell className="text-right">{formatRupiah(bill.wifiAmount)}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Lain-lain</TableCell><TableCell className="text-right">{formatRupiah(bill.otherAmount)}</TableCell></TableRow>
                <TableRow className="bg-muted/50"><TableCell className="font-bold text-base">Total</TableCell><TableCell className="text-right font-bold text-base">{formatRupiah(bill.totalAmount)}</TableCell></TableRow>
              </TableBody>
            </Table>

            <div className="mt-6">
              <CardTitle className="mb-2">Riwayat Pembayaran</CardTitle>
              {(payments || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pembayaran tercatat.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payments || []).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{formatDate(p.paidAt)}</TableCell>
                        <TableCell className="text-sm">{p.paymentMethod}</TableCell>
                        <TableCell className="text-right font-medium text-success">{formatRupiah(p.amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Informasi Tagihan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">
                {bill.status === 'paid' ? 'Lunas' : bill.status === 'partial' ? 'Cicilan' : bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Dibayar'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Total Tagihan</p>
              <p className="font-medium">{formatRupiah(bill.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Dibayar</p>
              <p className="font-medium text-success">{formatRupiah(totalPayments)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sisa Tagihan</p>
              <p className="font-medium text-destructive">{formatRupiah(remaining)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Jatuh Tempo</p>
              <p className="font-medium">{formatDate(bill.dueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diterbitkan</p>
              <p className="font-medium">{formatDate(bill.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Informasi Penghuni & Properti</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Penghuni</h3>
              <div className="grid gap-2">
                <div><p className="text-sm text-muted-foreground">Nama</p><p className="font-medium">{tenant?.fullName ?? bill.tenantName}</p></div>
                <div><p className="text-sm text-muted-foreground">Unit</p><p className="font-medium">Kamar {unit?.unitNumber ?? bill.unitNumber ?? '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">No. HP</p><p className="font-medium">{tenant?.phone ?? '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{tenant?.email ?? '-'}</p></div>
              </div>
            </div>
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Properti</h3>
              <div className="grid gap-2">
                <div><p className="text-sm text-muted-foreground">Nama</p><p className="font-medium">{property?.name ?? '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Alamat</p><p className="font-medium">{property?.address ?? '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Kota</p><p className="font-medium">{property?.city ?? '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Provinsi</p><p className="font-medium">{property?.province ?? '-'}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
