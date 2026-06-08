import { createFileRoute } from '@tanstack/react-router'
import { FileText, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/portal/')({
  component: PortalDashboard,
})

function PortalDashboard() {
  const { data: profile, loading } = useQuery({ queryFn: () => api.portal.profile() })
  const { data: bills } = useQuery({ queryFn: () => api.portal.bills() })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const tenant = profile?.tenant
  const unit = profile?.unit
  const allBills = bills ?? []
  const pendingBills = allBills.filter((b: any) => b.status !== 'paid')
  const paidBills = allBills.filter((b: any) => b.status === 'paid')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Halo, {tenant?.fullName?.split(' ')[0] ?? 'Penghuni'}!</h1>
        <p className="text-muted-foreground">
          Unit {unit?.unitNumber ?? '-'} &middot; {tenant?.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingBills.length}</p>
              <p className="text-xs text-muted-foreground">Tagihan Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{paidBills.length}</p>
              <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatRupiah(pendingBills.reduce((sum: number, b: any) => sum + b.totalAmount, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Total Belum Dibayar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tagihan Anda</CardTitle>
          <CardDescription>Daftar tagihan bulanan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {allBills.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada tagihan.</p>
          )}
          {allBills.map((bill: any) => (
            <div key={bill.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Tagihan {bill.periodMonth}/{bill.periodYear}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jatuh tempo: {formatDate(bill.dueDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatRupiah(bill.totalAmount)}</p>
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
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
