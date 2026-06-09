import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Plus, MapPin, Users, BedDouble, Wrench, Loader2, Camera, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { formatRupiah } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery, useMutation } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/properties/$propertyId')({
  component: PropertyDetailPage,
})

function PropertyDetailPage() {
  const { propertyId } = Route.useParams()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const { data: property, loading: loadingProperty, refetch: refetchProperty } = useQuery({
    queryFn: () => api.properties.get(propertyId),
  })

  const { data: units, loading: loadingUnits } = useQuery({
    queryFn: () => api.units.list(propertyId),
  })

  const { data: tenants } = useQuery({
    queryFn: () => api.tenants.list(),
  })

  const { mutate: updateProperty } = useMutation({
    mutationFn: (data: { image: string }) => api.properties.update(propertyId, data),
    onSuccess: () => {
      refetchProperty()
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setUploadError('')
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran file foto maksimal 2MB')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await updateProperty({ image: reader.result as string })
      } catch (err: any) {
        setUploadError(err.message || 'Gagal mengupload foto')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  if (loadingProperty || loadingUnits) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Properti tidak ditemukan</p>
      </div>
    )
  }

  const statusColors = { available: 'success' as const, occupied: 'default' as const, maintenance: 'warning' as const }
  const statusLabels = { available: 'Tersedia', occupied: 'Terisi', maintenance: 'Maintenance' }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/properties' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="h-3 w-3" />
            {property.address}, {property.city}
          </div>
        </div>
        <Badge variant={property.type === 'kost' ? 'default' : 'secondary'}>
          {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
        </Badge>
      </div>

      {/* Property Cover Image Banner */}
      <div className="relative h-64 w-full rounded-2xl overflow-hidden border bg-slate-100 group shadow-sm flex items-center justify-center">
        {property.image ? (
          <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-2">
            <Building2 className="h-12 w-12 text-slate-300" />
            <p className="text-sm font-semibold text-slate-400">Belum ada foto properti</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
          <label className="cursor-pointer bg-white/90 hover:bg-white text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2">
            <Camera className="h-4 w-4 text-slate-700" />
            {uploading ? 'Mengupload...' : 'Ganti Foto Properti'}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
          {property.image && (
            <button
              type="button"
              onClick={async () => {
                if (confirm('Apakah Anda yakin ingin menghapus foto properti ini?')) {
                  setUploading(true)
                  try {
                    await updateProperty({ image: '' })
                  } catch (err: any) {
                    setUploadError(err.message || 'Gagal menghapus foto')
                  } finally {
                    setUploading(false)
                  }
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md border-0 cursor-pointer"
            >
              Hapus Foto
            </button>
          )}
        </div>
        {uploadError && (
          <div className="absolute bottom-4 left-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-xs font-medium shadow-md">
            {uploadError}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{property.occupiedUnits}</p>
              <p className="text-xs text-muted-foreground">Unit Terisi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BedDouble className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{property.totalUnits - property.occupiedUnits}</p>
              <p className="text-xs text-muted-foreground">Unit Tersedia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{units?.filter((u: any) => u.status === 'maintenance').length || 0}</p>
              <p className="text-xs text-muted-foreground">Maintenance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Unit</CardTitle>
          </div>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" />Tambah Unit</Button>
        </CardHeader>
        <CardContent>
          {units && units.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada unit di properti ini</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Kamar</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Harga/Bulan</TableHead>
                  <TableHead>Fasilitas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Penghuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units?.map((unit: any) => {
                  const tenant = tenants?.find((t: any) => t.unitId === unit.id)
                  return (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                      <TableCell>{unit.type}</TableCell>
                      <TableCell>{formatRupiah(unit.priceMonthly)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(unit.facilities || []).slice(0, 3).map((f: string) => (
                            <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                          ))}
                          {(unit.facilities || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">+{(unit.facilities || []).length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={statusColors[unit.status as keyof typeof statusColors]}>{statusLabels[unit.status as keyof typeof statusLabels]}</Badge></TableCell>
                      <TableCell>
                        {tenant ? (
                          <Link to="/dashboard/tenants/$tenantId" params={{ tenantId: tenant.id }} className="text-primary hover:underline text-sm">{tenant.fullName}</Link>
                        ) : <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
