import { createFileRoute, Link } from '@tanstack/react-router'
import { Search, Loader2, FileText } from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/bills/')({
  component: BillsPage,
})

function BillsPage() {
  const { data: bills, loading, error } = useQuery({
    queryFn: () => api.bills.list(),
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tagihan</h1>
        <p className="text-muted-foreground">Kelola semua tagihan bulanan</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari tagihan..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="pending">Belum Dibayar</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="overdue">Jatuh Tempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {bills && bills.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada tagihan</h3>
            <p className="text-muted-foreground">Tagihan akan dibuat otomatis setiap bulan</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Penghuni</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Sewa</TableHead>
                  <TableHead>Utilitas</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills?.map((bill: any) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.tenantName || 'Unknown'}</TableCell>
                    <TableCell>{bill.unitNumber || 'N/A'}</TableCell>
                    <TableCell>{bill.periodMonth}/{bill.periodYear}</TableCell>
                    <TableCell className="text-sm">{formatRupiah(bill.rentAmount)}</TableCell>
                    <TableCell className="text-sm">{formatRupiah(bill.electricityAmount + bill.waterAmount + bill.wifiAmount + bill.otherAmount)}</TableCell>
                    <TableCell className="font-medium">{formatRupiah(bill.totalAmount)}</TableCell>
                    <TableCell className="text-sm">{formatDate(bill.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'destructive' : 'warning'}>
                        {bill.status === 'paid' ? 'Lunas' : bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Dibayar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/dashboard/bills/$billId" params={{ billId: bill.id }}>Detail</Link>
                      </Button>
                    </TableCell>
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
