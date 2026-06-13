import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/portal/bills/')({
  component: PortalBillsPage,
})

function PortalBillsPage() {
  const { data: bills, loading } = useQuery({ queryFn: () => api.portal.bills() })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const allBills = bills ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Detail Tagihan</h1>
        <p className="text-muted-foreground">Rincian tagihan bulanan Anda</p>
      </div>

      <div className="space-y-4">
        {allBills.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada tagihan.</p>
        )}
        {allBills.map((bill: any) => (
          <Card key={bill.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Periode {bill.periodMonth}/{bill.periodYear}</CardTitle>
                  <CardDescription>Jatuh tempo: {formatDate(bill.dueDate)}</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {bill.status !== 'paid' && (
                    <Link to="/portal/payments/$billId" params={{ billId: bill.id }}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer">
                        Bayar Sekarang
                      </Button>
                    </Link>
                  )}
                  <Badge
                    variant={
                      bill.status === 'paid' ? 'success' :
                      bill.status === 'overdue' ? 'destructive' :
                      'warning'
                    }
                  >
                    {bill.status === 'paid' ? 'Lunas' :
                     bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Dibayar'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow><TableCell>Sewa Kamar</TableCell><TableCell className="text-right">{formatRupiah(bill.rentAmount)}</TableCell></TableRow>
                  <TableRow><TableCell>Listrik</TableCell><TableCell className="text-right">{formatRupiah(bill.electricityAmount)}</TableCell></TableRow>
                  <TableRow><TableCell>Air</TableCell><TableCell className="text-right">{formatRupiah(bill.waterAmount)}</TableCell></TableRow>
                  <TableRow><TableCell>WiFi</TableCell><TableCell className="text-right">{formatRupiah(bill.wifiAmount)}</TableCell></TableRow>
                  <TableRow><TableCell>Lain-lain</TableCell><TableCell className="text-right">{formatRupiah(bill.otherAmount)}</TableCell></TableRow>
                  <TableRow className="bg-muted/50"><TableCell className="font-bold">Total</TableCell><TableCell className="text-right font-bold">{formatRupiah(bill.totalAmount)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
