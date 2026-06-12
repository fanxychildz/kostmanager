import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, RefreshCcw, Loader2 } from 'lucide-react'
import { formatRupiah } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Label } from '~/components/ui/label'
import { api } from '~/lib/api'
import { useQuery, useMutation } from '~/lib/hooks'
import { selectCache } from '~/lib/cache'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

type MeterType = 'electricity' | 'water'
type MeterReadingForm = {
  type: MeterType
  value: number
  readingDate: string
  tariffPerUnit: number
  notes?: string
  unitId: string
}

const meterTypeLabels: Record<MeterType, string> = { electricity: 'Listrik', water: 'Air' }

export const Route = createFileRoute('/dashboard/meters/')({
  component: MeterReadingsPage,
})

function MeterReadingsPage() {
  const [unitId, setUnitId] = useState('')
  const [type, setType] = useState<MeterType>('electricity')
  const [value, setValue] = useState('')
  const [tariffPerUnit, setTariffPerUnit] = useState('')
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: properties, loading: loadingProperties } = selectCache.properties(() => api.properties.list())
  const { data: units, loading: loadingUnits } = selectCache.units(() => api.units.list())

  const { data: readings, loading: loadingReadings, refetch } = useQuery({
    cacheKey: 'meterReadings.list',
    queryFn: async () => api.meterReadings.list(),
  })

  const initializingCache = loadingProperties || loadingUnits

  if (loadingReadings || initializingCache) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const createMutation = useMutation({
    mutationFn: async (payload: MeterReadingForm) => api.meterReadings.create(payload),
    onSuccess: () => {
      toast.success('Catatan meter berhasil ditambahkan')
      refetch()
      setUnitId('')
      setValue('')
      setTariffPerUnit('')
      setNotes('')
      setReadingDate(new Date().toISOString().slice(0, 10))
      setDialogOpen(false)
    },
    onError: (err: any) => toast.error(err?.message || String(err) || 'Gagal menyimpan catatan meter'),
  })

  const handleSubmit = () => {
    const tariff = Number.parseInt(tariffPerUnit || '0', 10)
    const meterValue = Number.parseInt(value || '0', 10)
    if (!unitId) {
      toast.error('Unit harus dipilih')
      return
    }
    if (meterValue < 0 || tariff < 0) {
      toast.error('Nilai meter dan tarif tidak boleh negatif')
      return
    }
    if (!readingDate) {
      toast.error('Tanggal pembacaan harus diisi')
      return
    }
    createMutation.mutate({
      type,
      value: meterValue,
      readingDate,
      tariffPerUnit: tariff,
      notes: notes || undefined,
      unitId,
    })
  }

  return (
    <DashboardBootstrap>
      <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catatan Meter</h1>
          <p className="text-muted-foreground">Pembacaan meter listrik dan air per unit.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={loadingReadings}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {loadingReadings ? 'Memuat...' : 'Segarkan'}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pembacaan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Pembacaan Meter</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unit-select">Pilih Unit</Label>
                  <Select value={unitId} onValueChange={setUnitId}>
                    <SelectTrigger id="unit-select">
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {(units || []).map((unit: any) => {
                        const property = properties?.find((p: any) => p.id === unit.propertyId)
                        return (
                          <SelectItem key={unit.id} value={unit.id}>
                            {property?.name} - Unit {unit.unitNumber}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-select">Jenis Meter</Label>
                  <Select value={type} onValueChange={(val) => setType(val as MeterType)}>
                    <SelectTrigger id="type-select">
                      <SelectValue placeholder="Jenis meter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electricity">Listrik</SelectItem>
                      <SelectItem value="water">Air</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meter-value">Nilai Meter</Label>
                  <Input
                    id="meter-value"
                    type="number"
                    inputMode="numeric"
                    placeholder="Nilai meter (misal 1500)"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tariff">Tarif per Satuan (Rp)</Label>
                  <Input
                    id="tariff"
                    type="number"
                    inputMode="numeric"
                    placeholder="Tarif per satuan (Rp)"
                    value={tariffPerUnit}
                    onChange={(event) => setTariffPerUnit(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reading-date">Tanggal Pembacaan</Label>
                  <Input id="reading-date" type="date" value={readingDate} onChange={(event) => setReadingDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (opsional)</Label>
                  <Input id="notes" placeholder="Catatan (opsional)" value={notes} onChange={(event) => setNotes(event.target.value)} />
                </div>
                <Button className="w-full mt-4" onClick={handleSubmit} disabled={createMutation.loading}>
                  {createMutation.loading ? 'Menyimpan...' : 'Simpan Pembacaan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembacaan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Properti</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead className="text-right">Tarif</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(readings || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Belum ada data pembacaan.
                  </TableCell>
                </TableRow>
              ) : (
                (readings || []).map((item: any) => {
                  const unit = units?.find((u: any) => u.id === item.unitId)
                  const property = properties?.find((p: any) => p.id === unit?.propertyId)
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.readingDate).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{property?.name || '-'}</TableCell>
                      <TableCell>{unit?.unitNumber || '-'}</TableCell>
                      <TableCell>{meterTypeLabels[item.type as MeterType] ?? item.type}</TableCell>
                      <TableCell className="text-right">{item.value}</TableCell>
                      <TableCell className="text-right">{formatRupiah(item.tariffPerUnit ?? 0)}</TableCell>
                      <TableCell className="text-right font-medium">{formatRupiah(item.value * (item.tariffPerUnit ?? 0))}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </DashboardBootstrap>
  )
}
