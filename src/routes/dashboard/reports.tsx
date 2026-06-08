import { createFileRoute } from '@tanstack/react-router'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { formatRupiah } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  const { data: bills, loading } = useQuery({ queryFn: () => api.bills.list() })
  const { data: properties } = useQuery({ queryFn: () => api.properties.list() })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const allBills = bills ?? []
  const paidBills = allBills.filter((b: any) => b.status === 'paid')
  const totalPaid = paidBills.reduce((sum: number, b: any) => sum + b.totalAmount, 0)
  const totalPending = allBills.filter((b: any) => b.status === 'pending').reduce((sum: number, b: any) => sum + b.totalAmount, 0)
  const totalOverdue = allBills.filter((b: any) => b.status === 'overdue').reduce((sum: number, b: any) => sum + b.totalAmount, 0)

  const sumField = (field: string) => paidBills.reduce((sum: number, b: any) => sum + (b[field] || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="text-muted-foreground">Generate dan export laporan keuangan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>Pilih periode laporan yang ingin dilihat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Periode</Label>
              <Select><SelectTrigger><SelectValue placeholder="Pilih periode" /></SelectTrigger><SelectContent>
                <SelectItem value="this-month">Bulan Ini</SelectItem><SelectItem value="last-month">Bulan Lalu</SelectItem><SelectItem value="this-quarter">Kuartal Ini</SelectItem><SelectItem value="this-year">Tahun Ini</SelectItem>
              </SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Properti</Label>
              <Select><SelectTrigger><SelectValue placeholder="Semua properti" /></SelectTrigger><SelectContent>
                <SelectItem value="all">Semua Properti</SelectItem>
                {properties?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Tipe Laporan</Label>
              <Select><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger><SelectContent>
                <SelectItem value="financial">Keuangan</SelectItem><SelectItem value="occupancy">Okupansi</SelectItem><SelectItem value="bills">Tagihan</SelectItem>
              </SelectContent></Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Pendapatan</p><p className="text-2xl font-bold text-success">{formatRupiah(totalPaid)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Belum Dibayar</p><p className="text-2xl font-bold text-warning">{formatRupiah(totalPending)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Jatuh Tempo</p><p className="text-2xl font-bold text-destructive">{formatRupiah(totalOverdue)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ringkasan Keuangan</CardTitle><CardDescription>Berdasarkan tagihan lunas</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center text-sm"><span>Pendapatan Sewa</span><span className="font-medium">{formatRupiah(sumField('rentAmount'))}</span></div>
          <div className="flex justify-between items-center text-sm"><span>Pendapatan Listrik</span><span className="font-medium">{formatRupiah(sumField('electricityAmount'))}</span></div>
          <div className="flex justify-between items-center text-sm"><span>Pendapatan Air</span><span className="font-medium">{formatRupiah(sumField('waterAmount'))}</span></div>
          <div className="flex justify-between items-center text-sm"><span>Pendapatan WiFi</span><span className="font-medium">{formatRupiah(sumField('wifiAmount'))}</span></div>
          <div className="flex justify-between items-center text-sm"><span>Pendapatan Lain-lain</span><span className="font-medium">{formatRupiah(sumField('otherAmount'))}</span></div>
          <Separator />
          <div className="flex justify-between items-center"><span className="font-bold">Total Pendapatan</span><span className="font-bold text-lg text-success">{formatRupiah(totalPaid)}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Export Laporan</CardTitle><CardDescription>Download laporan dalam format yang Anda inginkan</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-2"><FileText className="h-8 w-8 text-destructive" /><span className="font-medium">Export PDF</span><span className="text-xs text-muted-foreground">Laporan lengkap siap cetak</span></Button>
            <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-2"><FileSpreadsheet className="h-8 w-8 text-success" /><span className="font-medium">Export Excel</span><span className="text-xs text-muted-foreground">Data mentah untuk analisis</span></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
