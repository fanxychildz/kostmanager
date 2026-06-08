import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search, Phone, Mail, Loader2, Users } from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/tenants/')({
  component: TenantsPage,
})

function TenantsPage() {
  const { data: tenants, loading, error } = useQuery({
    queryFn: () => api.tenants.list(),
  })

  const { data: units } = useQuery({
    queryFn: () => api.units.list(),
  })

  const { data: properties } = useQuery({
    queryFn: () => api.properties.list(),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Penghuni</h1>
          <p className="text-muted-foreground">Kelola data penghuni properti Anda</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/tenants/new"><Plus className="mr-2 h-4 w-4" />Tambah Penghuni</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari penghuni..." className="pl-9" />
      </div>

      {tenants && tenants.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada penghuni</h3>
            <p className="text-muted-foreground mb-4">Tambahkan penghuni setelah unit tersedia</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Properti</TableHead>
                  <TableHead>Masuk</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants?.map((tenant: any) => {
                  const unit = units?.find((u: any) => u.id === tenant.unitId)
                  const property = properties?.find((p: any) => p.id === tenant.propertyId)
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <Link to="/dashboard/tenants/$tenantId" params={{ tenantId: tenant.id }} className="flex items-center gap-3 hover:underline">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {tenant.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{tenant.fullName}</p>
                            <p className="text-xs text-muted-foreground">{tenant.occupation || '-'}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{tenant.phone}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{tenant.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{unit?.unitNumber || '-'}</TableCell>
                      <TableCell className="text-sm">{property?.name || '-'}</TableCell>
                      <TableCell className="text-sm">{formatDate(tenant.checkInDate)}</TableCell>
                      <TableCell className="text-sm">{formatRupiah(tenant.depositAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={tenant.status === 'active' ? 'success' : tenant.status === 'inactive' ? 'secondary' : 'destructive'}>
                          {tenant.status === 'active' ? 'Aktif' : tenant.status === 'inactive' ? 'Nonaktif' : 'Blacklist'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
