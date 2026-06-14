import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ArrowLeft, Phone, Mail, Calendar, CreditCard, Building2, Loader2, Trash2, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { Separator } from '~/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { selectCache } from '~/lib/cache'
import { useQuery, useMutation } from '~/lib/hooks'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export const Route = createFileRoute('/dashboard/tenants/$tenantId')({
  component: TenantDetailPage,
})

function TenantDetailPage() {
  const { tenantId } = Route.useParams()
  const navigate = useNavigate()

  const { data: tenant, loading: loadingTenant, error, refetch: refetchTenant } = useQuery({
    queryFn: () => api.tenants.get(tenantId),
    deps: [tenantId],
  })

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus penghuni ini secara permanen? Unit kamar terkait akan otomatis kosong (Available) kembali.')) return
    try {
      await api.tenants.delete(tenantId)
      navigate({ to: '/dashboard/tenants' })
    } catch (err) {
      alert('Gagal menghapus penghuni: ' + err)
    }
  }

  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [ktpNumber, setKtpNumber] = useState('')
  const [occupation, setOccupation] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'blacklisted'>('active')
  const [saveError, setSaveError] = useState('')

  const handleOpenEdit = () => {
    if (!tenant) return
    const t = tenant as any
    setFullName(t.fullName || '')
    setPhone(t.phone || '')
    setEmail(t.email || '')
    setKtpNumber(t.ktpNumber || '')
    setOccupation(t.occupation || '')
    if (t.checkInDate) {
      const date = new Date(t.checkInDate)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      setCheckInDate(`${yyyy}-${mm}-${dd}`)
    } else {
      setCheckInDate('')
    }
    setDepositAmount(String(t.depositAmount || 0))
    setStatus(t.status || 'active')
    setSaveError('')
    setOpen(true)
  }

  const updateMutation = useMutation({
    mutationFn: (variables: {
      fullName: string
      phone: string
      email: string
      ktpNumber: string
      occupation: string
      checkInDate: string
      depositAmount: number
      status: string
    }) => api.tenants.update(tenantId, variables),
    onSuccess: () => {
      setOpen(false)
      refetchTenant()
    },
    onError: (err) => setSaveError(err),
  })

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError('')
    if (!fullName.trim() || !phone.trim() || !email.trim() || !ktpNumber.trim() || !checkInDate) {
      setSaveError('Nama lengkap, kontak, KTP, email, dan tanggal masuk harus diisi.')
      return
    }
    updateMutation.mutate({
      fullName,
      phone,
      email,
      ktpNumber,
      occupation,
      checkInDate: new Date(checkInDate).toISOString(),
      depositAmount: Number(depositAmount) || 0,
      status,
    })
  }
  const { data: units, loading: loadingUnits } = selectCache.units(() => api.units.list())
  const { data: properties, loading: loadingProperties } = selectCache.properties(() => api.properties.list())
  const { data: allBills, loading: loadingBills } = useQuery({
    queryFn: () => api.bills.list(),
    cacheKey: 'bills.list',
  })

  const t = tenant as any
  const unit = units?.find((u: any) => u.id === t?.unitId)
  const property = properties?.find((p: any) => p.id === t?.propertyId)
  const bills = allBills?.filter((b: any) => b.tenantId === t?.id) ?? []

  const facilities = useMemo(() => {
    const raw = unit?.facilities as any
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return raw.split(',').map((f: string) => f.trim()).filter(Boolean)
      }
    }
    return []
  }, [unit?.facilities])

  const initializing = loadingTenant || loadingUnits || loadingProperties || loadingBills

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive font-medium">
          {error ? `Error: ${error}` : 'Penghuni tidak ditemukan.'}
        </p>
        <Button variant="outline" onClick={() => navigate({ to: '/dashboard/tenants' })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar Penghuni
        </Button>
      </div>
    )
  }

  return (
    <DashboardBootstrap>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/tenants' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              {t.image && <AvatarImage src={t.image} alt={t.fullName} className="object-cover" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {t.fullName.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{t.fullName}</h1>
              <p className="text-muted-foreground text-sm">{t.occupation || 'Pekerjaan tidak dicatat'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto pl-12 sm:pl-0">
          <Badge variant={t.status === 'active' ? 'success' : 'secondary'}>
            {t.status === 'active' ? 'Aktif' : 'Nonaktif'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEdit}
            className="rounded-xl font-bold text-xs h-9 px-3 cursor-pointer"
          >
            <Pencil className="mr-1.5 h-4 w-4" /> Edit Data
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="rounded-xl font-bold text-xs h-9 px-3"
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Hapus
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Informasi Kontak</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{t.phone}</span></div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{t.email}</span></div>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Identitas KTP</h4>
              <p className="text-sm text-muted-foreground">{t.ktpNumber}</p>
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
                <p className="text-sm">Masuk: {formatDate(t.checkInDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Deposit: {formatRupiah(t.depositAmount)}</p>
                <p className="text-xs text-muted-foreground">Sewa: {formatRupiah(unit?.priceMonthly || 0)}/bulan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fasilitas Unit</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {facilities.map((f: string) => <Badge key={f} variant="outline">{f}</Badge>)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white text-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200">
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Edit Data Penghuni</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Ubah data pribadi, tanggal masuk, dan informasi sewa untuk penghuni ini.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-1.5">
                <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama sesuai KTP"
                  className="rounded-xl border-slate-250 text-xs px-3 py-2 bg-slate-50/50"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ktpNumber" className="text-xs font-bold text-slate-700">Nomor KTP</Label>
                <Input
                  id="ktpNumber"
                  value={ktpNumber}
                  onChange={(e) => setKtpNumber(e.target.value)}
                  placeholder="16 digit nomor KTP"
                  maxLength={16}
                  className="rounded-xl border-slate-250 text-xs px-3 py-2 bg-slate-50/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-700">No. HP</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="rounded-xl border-slate-250 text-xs px-3 py-2 bg-slate-50/50"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="rounded-xl border-slate-250 text-xs px-3 py-2 bg-slate-50/50"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="occupation" className="text-xs font-bold text-slate-700">Pekerjaan</Label>
                <Input
                  id="occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Contoh: Karyawan Swasta"
                  className="rounded-xl border-slate-250 text-xs px-3 py-2 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="checkInDate" className="text-xs font-bold text-slate-700">Tanggal Masuk</Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="rounded-xl border-slate-250 text-xs px-3 py-2 bg-slate-50/50"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="depositAmount" className="text-xs font-bold text-slate-700">Uang Deposit (Rp)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Contoh: 1500000"
                    className="rounded-xl border-slate-250 text-xs px-3 py-2 bg-slate-50/50"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="status" className="text-xs font-bold text-slate-700">Status Penghuni</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="flex h-9 w-full rounded-xl border border-slate-250 bg-white text-slate-800 px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                  <option value="blacklisted">Daftar Hitam (Blacklist)</option>
                </select>
              </div>
            </div>
            {saveError && <p className="text-xs text-destructive font-medium">{saveError}</p>}
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl text-xs py-2 px-4 cursor-pointer">Batal</Button>
              </DialogClose>
              <Button type="submit" disabled={updateMutation.loading} className="rounded-xl text-xs py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer">
                {updateMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardBootstrap>
  )
}
