import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Printer, Download, Loader2, FileText, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery, useMutation } from '~/lib/hooks'
import { useState } from 'react'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'

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

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentFormData, setPaymentFormData] = useState({
    paymentMethod: 'bank_transfer',
    amount: '',
    paidAt: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const { mutate: createPayment, loading: creatingPayment } = useMutation({
    mutationFn: (data: any) => api.payments.create(data),
    onSuccess: () => {
      setPaymentDialogOpen(false)
      refetch()
    },
    onError: (err) => {
      alert('Gagal mencatat pembayaran: ' + err)
    }
  })

  const handleOpenPaymentDialog = () => {
    setPaymentFormData({
      paymentMethod: 'bank_transfer',
      amount: remaining.toString(),
      paidAt: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setPaymentDialogOpen(true)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPayment({
      billId: bill.id,
      paymentMethod: paymentFormData.paymentMethod,
      amount: parseInt(paymentFormData.amount),
      paidAt: paymentFormData.paidAt,
      notes: paymentFormData.notes || undefined,
    })
  }

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

      const drawText = (text: string, x: number, y: number, size = 11, bold = false, color = rgb(0.15, 0.15, 0.15)) => {
        const used = bold ? fontBold : font
        page.drawText(text, { x, y, size, font: used, color })
      }

      // 1. Accent top bar (blue)
      page.drawRectangle({
        x: 40,
        y: 810,
        width: 515,
        height: 6,
        color: rgb(0.12, 0.35, 0.8)
      })

      // 2. Logo & Brand
      drawText('KostManager', 40, 785, 18, true, rgb(0.12, 0.35, 0.8))
      drawText('Sistem Manajemen Hunian Pintar', 40, 772, 8, false, rgb(0.5, 0.5, 0.5))

      // 3. Invoice Title
      drawText('KUITANSI PEMBAYARAN', 370, 785, 14, true, rgb(0.08, 0.12, 0.17))
      drawText(`No: INV-${bill.id.substring(0, 8).toUpperCase()}`, 370, 770, 9.5, true, rgb(0.4, 0.4, 0.4))
      drawText(`Tanggal: ${formatDate(bill.createdAt)}`, 370, 755, 9, false, rgb(0.4, 0.4, 0.4))

      // 4. Horizontal Separator
      page.drawLine({
        start: { x: 40, y: 742 },
        end: { x: 555, y: 742 },
        color: rgb(0.9, 0.9, 0.9),
        thickness: 1
      })

      // 5. Info Card Section (y = 650 to 730, height 80)
      page.drawRectangle({
        x: 40,
        y: 650,
        width: 515,
        height: 80,
        color: rgb(0.97, 0.98, 1.0),
        borderColor: rgb(0.9, 0.93, 0.97),
        borderWidth: 1
      })

      // Inside Card - Pengelola
      drawText('PENGELOLA PROPERTI', 52, 715, 8, true, rgb(0.4, 0.5, 0.6))
      drawText(property?.name ?? '-', 52, 700, 10, true, rgb(0.08, 0.12, 0.17))
      drawText(property?.address ?? '-', 52, 687, 8.5, false, rgb(0.35, 0.4, 0.45))
      drawText(`${property?.city ?? ''}, ${property?.province ?? ''}`, 52, 674, 8.5, false, rgb(0.35, 0.4, 0.45))

      // Inside Card - Penyewa
      drawText('INFORMASI PENYEWA', 320, 715, 8, true, rgb(0.4, 0.5, 0.6))
      drawText(tenant?.fullName ?? bill.tenantName ?? '-', 320, 700, 10, true, rgb(0.08, 0.12, 0.17))
      drawText(`Kamar ${unit?.unitNumber ?? bill.unitNumber ?? '-'} (${unit?.type ?? '-'})`, 320, 687, 8.5, false, rgb(0.35, 0.4, 0.45))
      drawText(`Telp: ${tenant?.phone ?? '-'} | ${tenant?.email ?? '-'}`, 320, 674, 8.5, false, rgb(0.35, 0.4, 0.45))

      // 6. Items Table (starts at y = 620)
      let cursorY = 620
      // Table Header row background (dark slate)
      page.drawRectangle({
        x: 40,
        y: cursorY - 18,
        width: 515,
        height: 22,
        color: rgb(0.08, 0.12, 0.17)
      })

      const colX = [52, 260, 360, 460]
      const headers = ['DESKRIPSI', 'METODE', 'TANGGAL', 'JUMLAH']
      headers.forEach((h, i) => drawText(h, colX[i], cursorY - 12, 8.5, true, rgb(1, 1, 1)))

      // Table Rows calculation
      let rowY = cursorY - 36
      
      const rows: any[] = []
      if (bill.rentAmount > 0) {
        rows.push({ label: 'Sewa Kamar', method: '-', date: '-', amount: bill.rentAmount })
      }
      if (bill.electricityAmount > 0) {
        rows.push({ label: 'Biaya Listrik', method: '-', date: '-', amount: bill.electricityAmount })
      }
      if (bill.waterAmount > 0) {
        rows.push({ label: 'Biaya Air', method: '-', date: '-', amount: bill.waterAmount })
      }
      if (bill.wifiAmount > 0) {
        rows.push({ label: 'Biaya WiFi', method: '-', date: '-', amount: bill.wifiAmount })
      }
      if (bill.otherAmount > 0) {
        rows.push({ label: 'Biaya Lain-lain', method: '-', date: '-', amount: bill.otherAmount })
      }

      // Payments
      const recordedPayments = (payments || []).filter((p: any) => p.status === 'recorded')
      recordedPayments.forEach((p: any) => {
        rows.push({
          label: 'Pembayaran',
          method: p.paymentMethod === 'bank_transfer' ? 'Transfer' : p.paymentMethod === 'cash' ? 'Cash' : p.paymentMethod === 'qris_manual' ? 'QRIS' : 'Lainnya',
          date: formatDate(p.paidAt),
          amount: -p.amount,
          isPayment: true
        })
      })

      rows.forEach((r) => {
        if (rowY < 120) return // page overflow guard
        
        // Underline row
        page.drawLine({
          start: { x: 40, y: rowY - 6 },
          end: { x: 555, y: rowY - 6 },
          color: rgb(0.93, 0.93, 0.93),
          thickness: 0.8
        })

        // Draw values
        drawText(r.label, colX[0], rowY, contentFontSize, r.isPayment)
        drawText(r.method, colX[1], rowY, contentFontSize, false, rgb(0.4, 0.4, 0.4))
        drawText(r.date, colX[2], rowY, contentFontSize, false, rgb(0.4, 0.4, 0.4))
        
        const amountColor = r.isPayment ? rgb(0.1, 0.5, 0.2) : rgb(0.08, 0.12, 0.17)
        const amountStr = r.isPayment ? `-${formatRupiah(Math.abs(r.amount))}` : formatRupiah(r.amount)
        drawText(amountStr, colX[3], rowY, contentFontSize, r.isPayment, amountColor)

        rowY -= 22
      })

      // 7. Summary Box & Notes (y = rowY - 70 to rowY)
      const boxHeight = 62
      const boxY = rowY - 55
      
      // Notes on the left
      const noteY = rowY - 10
      drawText('Catatan Keuangan:', 40, noteY, 8.5, true, rgb(0.3, 0.3, 0.3))
      drawText(`* Pembayaran jatuh tempo pada ${formatDate(bill.dueDate)}.`, 40, noteY - 13, 7.5, false, rgb(0.45, 0.45, 0.45))
      drawText('* Kuitansi ini merupakan bukti pelunasan sewa yang sah.', 40, noteY - 24, 7.5, false, rgb(0.45, 0.45, 0.45))
      
      const statusColor = bill.status === 'paid' ? rgb(0.1, 0.5, 0.2) : rgb(0.8, 0.3, 0.1)
      const statusText = bill.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'
      drawText(`Status Tagihan: ${statusText}`, 40, noteY - 39, 8.5, true, statusColor)

      // Summary Box on the right
      page.drawRectangle({
        x: 335,
        y: boxY,
        width: 220,
        height: boxHeight,
        color: rgb(0.95, 0.97, 1.0),
        borderColor: rgb(0.8, 0.88, 0.98),
        borderWidth: 1
      })

      drawText('TOTAL TAGIHAN :', 347, boxY + 45, 8, true, rgb(0.4, 0.45, 0.5))
      drawText(formatRupiah(bill.totalAmount), 460, boxY + 45, 9, true, rgb(0.15, 0.15, 0.15))

      drawText('TOTAL DIBAYAR :', 347, boxY + 29, 8, true, rgb(0.1, 0.5, 0.2))
      drawText(formatRupiah(totalPayments), 460, boxY + 29, 9, true, rgb(0.1, 0.5, 0.2))

      page.drawLine({ start: { x: 345, y: boxY + 21 }, end: { x: 545, y: boxY + 21 }, color: rgb(0.8, 0.88, 0.98), thickness: 0.8 })

      drawText('SISA TAGIHAN  :', 347, boxY + 8, 9, true, remaining > 0 ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.5, 0.2))
      drawText(formatRupiah(remaining), 460, boxY + 8, 10, true, remaining > 0 ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.5, 0.2))

      // 8. Seal/Stamp & Signature Section (below table and summary box)
      const sigY = boxY - 30
      drawText(`${property?.city ?? 'Jakarta'}, ${formatDate(new Date().toISOString())}`, 380, sigY, 9, false, rgb(0.45, 0.45, 0.45))
      drawText('Pemilik/Pengelola Kost,', 380, sigY - 14, 9, true, rgb(0.08, 0.12, 0.17))

      // Draw Cap / Stamp (Center at x = 430, y = sigY - 50)
      const stampX = 430
      const stampY = sigY - 50
      
      const stampColor = rgb(0.12, 0.35, 0.8) // Stamp Blue
      page.drawCircle({ x: stampX, y: stampY, radius: 32, borderColor: stampColor, borderWidth: 1.5 })
      page.drawCircle({ x: stampX, y: stampY, radius: 28, borderColor: stampColor, borderWidth: 0.6 })
      
      const drawStampText = (txt: string, offX: number, offY: number, sz = 5.5, bld = true) => {
        const used = bld ? fontBold : font
        page.drawText(txt, { x: stampX + offX, y: stampY + offY, size: sz, font: used, color: stampColor })
      }
      
      drawStampText('KOST MANAGER', -22, 14, 5, true)
      drawStampText('LUNAS', -17, -4, 9, true)
      drawStampText('VERIFIED', -13, -19, 5, true)

      // Signature Underline name
      drawText(`Pengelola ${property?.name ?? 'Kost'}`, 380, sigY - 95, 9.5, true, rgb(0.08, 0.12, 0.17))
      page.drawLine({ start: { x: 380, y: sigY - 98 }, end: { x: 530, y: sigY - 98 }, color: rgb(0.08, 0.12, 0.17), thickness: 1 })

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
    <div id="kuitansi-area">
      {/* Screen view UI (Hidden when printing) */}
      <div className="print:hidden space-y-6">
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
            {bill.status !== 'paid' && (
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition h-9 animate-pulse" onClick={handleOpenPaymentDialog}>
                <Plus className="mr-1.5 h-4 w-4" /> Approve & Catat Bayar
              </Button>
            )}
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
                          <TableCell className="text-sm uppercase text-[10px] font-semibold">{p.paymentMethod === 'bank_transfer' ? 'Transfer Bank' : p.paymentMethod === 'cash' ? 'Cash' : p.paymentMethod === 'qris_manual' ? 'QRIS' : p.paymentMethod}</TableCell>
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

      {/* Printable receipt view (Hidden on screen, shown when printing) */}
      <div className="hidden print:block font-sans p-8 text-slate-900 bg-white" id="kuitansi-print-layout">
        {/* Brand Header */}
        <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-blue-600 tracking-tight leading-none">KostManager</h1>
            <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase mt-1">Sistem Hunian Kost Pintar</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-slate-900 leading-none">KUITANSI PEMBAYARAN</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1.5">No: INV-{bill.id.substring(0, 8).toUpperCase()}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Tanggal: {formatDate(bill.createdAt)}</p>
          </div>
        </div>

        {/* Property & Tenant Info Grid */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-xs leading-relaxed">
          <div>
            <h4 className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2">PENGELOLA PROPERTI</h4>
            <p className="font-bold text-slate-900 text-sm">{property?.name ?? '-'}</p>
            <p className="text-slate-500 font-semibold mt-1">{property?.address ?? '-'}</p>
            <p className="text-slate-500 font-semibold">{property?.city ?? ''}, {property?.province ?? ''}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2">INFORMASI PENYEWA</h4>
            <p className="font-bold text-slate-900 text-sm">{tenant?.fullName ?? bill.tenantName ?? '-'}</p>
            <p className="text-slate-500 font-semibold mt-1">Kamar {unit?.unitNumber ?? bill.unitNumber ?? '-'} ({unit?.type ?? '-'})</p>
            <p className="text-slate-500 font-semibold">No. HP: {tenant?.phone ?? '-'}</p>
            <p className="text-slate-500 font-semibold">Email: {tenant?.email ?? '-'}</p>
          </div>
        </div>

        {/* Breakdown Table */}
        <table className="w-full text-xs font-semibold mb-6 border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider">
              <th className="text-left py-2.5 px-4 rounded-l-xl">Deskripsi</th>
              <th className="text-left py-2.5 px-4">Metode</th>
              <th className="text-left py-2.5 px-4">Tanggal</th>
              <th className="text-right py-2.5 px-4 rounded-r-xl">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {/* Bill items */}
            {bill.rentAmount > 0 && (
              <tr>
                <td className="py-3 px-4 text-slate-900">Sewa Kamar</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-right text-slate-900 font-bold">{formatRupiah(bill.rentAmount)}</td>
              </tr>
            )}
            {bill.electricityAmount > 0 && (
              <tr>
                <td className="py-3 px-4 text-slate-900">Biaya Listrik</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-right text-slate-900 font-bold">{formatRupiah(bill.electricityAmount)}</td>
              </tr>
            )}
            {bill.waterAmount > 0 && (
              <tr>
                <td className="py-3 px-4 text-slate-900">Biaya Air</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-right text-slate-900 font-bold">{formatRupiah(bill.waterAmount)}</td>
              </tr>
            )}
            {bill.wifiAmount > 0 && (
              <tr>
                <td className="py-3 px-4 text-slate-900">Biaya WiFi</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-right text-slate-900 font-bold">{formatRupiah(bill.wifiAmount)}</td>
              </tr>
            )}
            {bill.otherAmount > 0 && (
              <tr>
                <td className="py-3 px-4 text-slate-900">Lain-lain</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-slate-400 font-medium">-</td>
                <td className="py-3 px-4 text-right text-slate-900 font-bold">{formatRupiah(bill.otherAmount)}</td>
              </tr>
            )}

            {/* Payment items */}
            {(payments || [])
              .filter((p: any) => p.status === 'recorded')
              .map((p: any) => (
                <tr key={p.id} className="bg-emerald-50/20 text-emerald-900">
                  <td className="py-3 px-4 font-bold text-emerald-800">Pembayaran</td>
                  <td className="py-3 px-4 font-semibold uppercase text-[10px] text-emerald-700">{p.paymentMethod === 'bank_transfer' ? 'Transfer' : p.paymentMethod === 'cash' ? 'Cash' : p.paymentMethod === 'qris_manual' ? 'QRIS' : p.paymentMethod}</td>
                  <td className="py-3 px-4 font-medium text-emerald-700">{formatDate(p.paidAt)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">-{formatRupiah(p.amount)}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Summary Box and Notes */}
        <div className="grid grid-cols-5 gap-6 items-start mt-4">
          {/* Left Column: Notes & Terms */}
          <div className="col-span-3 text-[10px] text-slate-500 leading-relaxed font-medium">
            <h5 className="font-bold text-slate-700 mb-1">Catatan Keuangan:</h5>
            <p>• Kuitansi ini diterbitkan secara sah oleh sistem manajemen hunian KostManager.</p>
            <p>• Jatuh tempo pembayaran tagihan ini adalah tanggal {formatDate(bill.dueDate)}.</p>
            <p>• Simpan bukti kuitansi digital ini sebagai bukti pelunasan sewa yang sah.</p>
            <p className="font-bold text-slate-800 mt-2.5">
              Status Tagihan: <span className={bill.status === 'paid' ? 'text-emerald-600 font-black' : 'text-amber-600 font-black'}>{bill.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}</span>
            </p>
          </div>

          {/* Right Column: Grand Total */}
          <div className="col-span-2 bg-blue-50/30 border border-blue-100 rounded-2xl p-4 space-y-2.5 text-right">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span>TOTAL TAGIHAN</span>
              <span className="text-slate-800 font-extrabold">{formatRupiah(bill.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-emerald-700">
              <span>TOTAL DIBAYAR</span>
              <span className="font-extrabold">{formatRupiah(totalPayments)}</span>
            </div>
            <div className="border-t border-blue-100 pt-2 flex justify-between items-center text-xs font-bold">
              <span>SISA TAGIHAN</span>
              <span className={`text-sm font-black ${remaining > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>{formatRupiah(remaining)}</span>
            </div>
          </div>
        </div>

        {/* Seal / Signature Section */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-60 relative text-xs">
            <p className="text-slate-400 font-semibold">{property?.city ?? 'Jakarta'}, {formatDate(new Date().toISOString())}</p>
            <p className="font-bold text-slate-900 mt-1">Pemilik/Pengelola Kost,</p>
            
            {/* CAP PEMILIK / STAMP STYLING */}
            <div className="h-24 flex items-center justify-center relative my-2">
              <div className="absolute border-2 border-dashed border-blue-600/80 rounded-full w-24 h-24 flex flex-col items-center justify-center rotate-6 scale-90 opacity-80 bg-white/50 shadow-xs">
                <div className="border border-solid border-blue-600/60 rounded-full w-[88px] h-[88px] flex flex-col items-center justify-center">
                  <span className="text-[5.5px] font-black tracking-widest text-blue-600 uppercase">KOST MANAGER</span>
                  <span className="text-xs font-black text-blue-600 my-0.5 tracking-wider">LUNAS</span>
                  <span className="text-[5.5px] font-black text-blue-600 uppercase tracking-widest">VERIFIED</span>
                </div>
              </div>
            </div>

            <p className="font-bold text-slate-900 underline mt-1">Pengelola {property?.name ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* Catat Pembayaran Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Approve & Catat Pembayaran</DialogTitle>
            <DialogDescription className="text-xs text-slate-550">
              Catat transaksi pembayaran untuk tagihan sewa ini agar status berubah menjadi Lunas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-2">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Metode Bayar</Label>
                <Select 
                  value={paymentFormData.paymentMethod} 
                  onValueChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
                >
                  <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-850">
                    <SelectValue placeholder="Pilih metode" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="bank_transfer" className="text-xs font-semibold cursor-pointer">Transfer Bank</SelectItem>
                    <SelectItem value="qris_manual" className="text-xs font-semibold cursor-pointer">QRIS</SelectItem>
                    <SelectItem value="cash" className="text-xs font-semibold cursor-pointer">Cash</SelectItem>
                    <SelectItem value="other" className="text-xs font-semibold cursor-pointer">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Jumlah Bayar (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Tanggal Bayar</Label>
              <Input
                type="date"
                value={paymentFormData.paidAt}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paidAt: e.target.value })}
                className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Catatan (opsional)</Label>
              <Input
                placeholder="Contoh: Transfer BCA a.n. Rania"
                value={paymentFormData.notes}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)} className="rounded-xl text-xs font-semibold">
                Batal
              </Button>
              <Button type="submit" disabled={creatingPayment} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">
                {creatingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Pembayaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
