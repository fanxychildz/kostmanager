import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/bills/$billId')({
  component: BillDetailPage,
})

function BillDetailPage() {
  const { billId } = Route.useParams()
  const navigate = useNavigate()

  const { data: bill, loading, error } = useQuery({ queryFn: () => api.bills.get(billId) })
  const { data: tenants } = useQuery({ queryFn: () => api.tenants.list() })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Tagihan tidak ditemukan{error ? `: ${error}` : ''}</p>
      </div>
    )
  }

  const tenant = tenants?.find((t: any) => t.id === bill.tenantId)

  return (
    <div className="space-y-6">
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
          <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" />Cetak</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />PDF</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rincian Tagihan</CardTitle>
              <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'destructive' : 'warning'}>
                {bill.status === 'paid' ? 'Lunas' : bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Dibayar'}
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
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Jatuh tempo: <span className="font-medium text-foreground">{formatDate(bill.dueDate)}</span></p>
              <p>Diterbitkan: {formatDate(bill.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Informasi Penghuni</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-sm text-muted-foreground">Nama</p><p className="font-medium">{bill.tenantName}</p></div>
            <div><p className="text-sm text-muted-foreground">Unit</p><p className="font-medium">Kamar {bill.unitNumber}</p></div>
            <Separator />
            {tenant && (
              <>
                <div><p className="text-sm text-muted-foreground">No. HP</p><p className="font-medium">{tenant.phone}</p></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{tenant.email}</p></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
