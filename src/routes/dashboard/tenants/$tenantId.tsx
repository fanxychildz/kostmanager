import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Phone, Mail, Calendar, CreditCard, Building2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { Separator } from '~/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/tenants/$tenantId')({
  component: TenantDetailPage,
})

function TenantDetailPage() {
  const { tenantId } = Route.useParams()
  const navigate = useNavigate()

  const { data: tenant, loading, error } = useQuery({ queryFn: () => api.tenants.get(tenantId) })
  const { data: units } = useQuery({ queryFn: () => api.units.list() })
  const { data: properties } = useQuery({ queryFn: () => api.properties.list() })
  const { data: allBills } = useQuery({ queryFn: () => api.bills.list() })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Penghuni tidak ditemukan{error ? `: ${error}` : ''}</p>
      </div>
    )
  }

  const unit = units?.find((u: any) => u.id === tenant.unitId)
  const property = properties?.find((p: any) => p.id === tenant.propertyId)
  const bills = allBills?.filter((b: any) => b.tenantId === tenant.id) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/tenants' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {tenant.image && <AvatarImage src={tenant.image} alt={tenant.fullName} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {tenant.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{tenant.fullName}</h1>
            <p className="text-muted-foreground text-sm">{tenant.occupation || 'Pekerjaan tidak dicatat'}</p>
          </div>
        </div>
        <Badge variant={tenant.status === 'active' ? 'success' : 'secondary'}>
          {tenant.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Informasi Kontak</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{tenant.phone}</span></div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{tenant.email}</span></div>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Identitas KTP</h4>
              <p className="text-sm text-muted-foreground">{tenant.ktpNumber}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Informasi Sewa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{property?.name}</p>
                <p className="text-xs text-muted-foreground">Unit {unit?.unitNumber} ({unit?.type})</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm">Masuk: {formatDate(tenant.checkInDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Deposit: {formatRupiah(tenant.depositAmount)}</p>
                <p className="text-xs text-muted-foreground">Sewa: {formatRupiah(unit?.priceMonthly || 0)}/bulan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fasilitas Unit</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unit?.facilities?.map((f: string) => <Badge key={f} variant="outline">{f}</Badge>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Tagihan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Sewa</TableHead>
                <TableHead>Listrik</TableHead>
                <TableHead>Air</TableHead>
                <TableHead>WiFi</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.periodMonth}/{bill.periodYear}</TableCell>
                  <TableCell className="text-sm">{formatRupiah(bill.rentAmount)}</TableCell>
                  <TableCell className="text-sm">{formatRupiah(bill.electricityAmount)}</TableCell>
                  <TableCell className="text-sm">{formatRupiah(bill.waterAmount)}</TableCell>
                  <TableCell className="text-sm">{formatRupiah(bill.wifiAmount)}</TableCell>
                  <TableCell className="text-sm font-medium">{formatRupiah(bill.totalAmount)}</TableCell>
                  <TableCell className="text-sm">{formatDate(bill.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'destructive' : 'warning'}>
                      {bill.status === 'paid' ? 'Lunas' : bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Dibayar'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
