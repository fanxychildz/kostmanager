import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { api } from '~/lib/api'
import { useQuery, useMutation } from '~/lib/hooks'
import { selectCache } from '~/lib/cache'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

export const Route = createFileRoute('/dashboard/tenants/new')({
  component: NewTenantPage,
})

function NewTenantPage() {
  const navigate = useNavigate()

  const { data: properties } = selectCache.properties(() => api.properties.list())
  const { data: units, loading: loadingUnits } = selectCache.units(() => api.units.list())

  const availableUnits = units?.filter((u: any) => u.status === 'available') ?? []

  const [unitId, setUnitId] = useState('')
  const [fullName, setFullName] = useState('')
  const [ktpNumber, setKtpNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [occupation, setOccupation] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      api.tenants.create({
        unitId,
        fullName,
        ktpNumber,
        phone,
        email,
        occupation: occupation || undefined,
        checkInDate: new Date(checkInDate).toISOString(),
        depositAmount: depositAmount ? Number(depositAmount) : 0,
      }),
    onSuccess: () => navigate({ to: '/dashboard/tenants' }),
    onError: (err) => setError(err),
  })

  const handleSave = () => {
    setError('')
    if (!unitId || !fullName || !ktpNumber || !phone || !email || !checkInDate) {
      setError('Lengkapi nama, KTP, kontak, unit, dan tanggal masuk')
      return
    }
    createMutation.mutate()
  }

  return (
    <DashboardBootstrap>
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/tenants' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Penghuni Baru</h1>
          <p className="text-muted-foreground">Isi data penghuni dan unit yang akan ditempati</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
            <CardDescription>Informasi identitas penghuni</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input id="fullName" placeholder="Sesuai KTP" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ktpNumber">Nomor KTP</Label>
              <Input id="ktpNumber" placeholder="16 digit nomor KTP" maxLength={16} value={ktpNumber} onChange={(e) => setKtpNumber(e.target.value)} />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">No. HP</Label>
                <Input id="phone" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Pekerjaan</Label>
              <Input id="occupation" placeholder="Contoh: Karyawan Swasta" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Sewa</CardTitle>
            <CardDescription>Detail unit dan periode kontrak</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Pilih Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger><SelectValue placeholder="Pilih unit kosong" /></SelectTrigger>
                <SelectContent>
                  {availableUnits.map((unit: any) => {
                    const property = properties?.find((p: any) => p.id === unit.propertyId)
                    return (
                      <SelectItem key={unit.id} value={unit.id}>
                        {property?.name} - Unit {unit.unitNumber} ({unit.type})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {availableUnits.length === 0 && (
                <p className="text-xs text-muted-foreground">Tidak ada unit kosong. Tambahkan unit terlebih dahulu.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkIn">Tanggal Masuk</Label>
              <Input id="checkIn" type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Uang Deposit</Label>
              <Input id="deposit" type="number" placeholder="Contoh: 1500000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={createMutation.loading}>
                {createMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Penghuni
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/dashboard/tenants' })}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardBootstrap>
  )
}
