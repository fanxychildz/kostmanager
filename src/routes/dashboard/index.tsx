import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { formatRupiah } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: properties, loading: loadingProperties } = useQuery({
    queryFn: () => api.properties.list(),
  })

  const { data: bills, loading: loadingBills } = useQuery({
    queryFn: () => api.bills.list(),
  })

  const { data: payments, loading: loadingPayments } = useQuery({
    queryFn: () => api.payments.list(),
  })

  const { data: units, loading: loadingUnits } = useQuery({
    queryFn: () => api.units.list(),
  })

  if (loadingProperties || loadingBills || loadingPayments || loadingUnits) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalUnits = properties?.reduce((sum: number, p: any) => sum + p.totalUnits, 0) || 0
  const occupiedUnits = properties?.reduce((sum: number, p: any) => sum + p.occupiedUnits, 0) || 0
  const availableUnits = units?.filter((u: any) => u.status === 'available').length || 0
  const maintenanceUnits = units?.filter((u: any) => u.status === 'maintenance').length || 0
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const totalIncome = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
  const totalPending = bills?.filter((b: any) => b.status === 'pending').reduce((sum: number, b: any) => sum + b.totalAmount, 0) || 0
  const totalOverdue = bills?.filter((b: any) => b.status === 'overdue').reduce((sum: number, b: any) => sum + b.totalAmount, 0) || 0
  const pendingCount = bills?.filter((b: any) => b.status === 'pending').length || 0
  const overdueCount = bills?.filter((b: any) => b.status === 'overdue').length || 0

  const recentBills = bills?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan bisnis properti Anda</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tunggakan</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalOverdue)}</div>
            <p className="text-xs text-muted-foreground">{overdueCount} tagihan jatuh tempo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Dibayar</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalPending)}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} tagihan pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Okupansi</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <Progress value={occupancyRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {occupiedUnits}/{totalUnits} unit terisi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Pemasukan Bulanan</CardTitle>
            <CardDescription>Grafik pemasukan 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <p>Grafik akan tersedia setelah ada data pembayaran</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Status Unit</CardTitle>
            <CardDescription>Distribusi unit properti Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  Terisi
                </span>
                <span className="font-medium">{occupiedUnits} unit</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  Tersedia
                </span>
                <span className="font-medium">{availableUnits} unit</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  Maintenance
                </span>
                <span className="font-medium">{maintenanceUnits} unit</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/properties">Lihat Semua Properti</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tagihan Terbaru</CardTitle>
            <CardDescription>Daftar tagihan yang baru diterbitkan</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/bills">Lihat Semua</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentBills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada tagihan</p>
          ) : (
            <div className="space-y-3">
              {recentBills.map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{bill.tenantName || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        Unit {bill.unitNumber || 'N/A'} &middot; Periode {bill.periodMonth}/{bill.periodYear}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatRupiah(bill.totalAmount)}</p>
                    <Badge
                      variant={
                        bill.status === 'paid' ? 'success' :
                        bill.status === 'overdue' ? 'destructive' :
                        bill.status === 'pending' ? 'warning' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {bill.status === 'paid' ? 'Lunas' :
                       bill.status === 'overdue' ? 'Jatuh Tempo' :
                       bill.status === 'pending' ? 'Belum Dibayar' : 'Sebagian'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
