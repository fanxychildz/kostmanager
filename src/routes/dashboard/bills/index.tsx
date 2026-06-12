import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Search, Loader2, FileText, Plus, ChevronRight, Trash2, Edit3 } from 'lucide-react'
import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery, useMutation, useDebounce } from '~/lib/hooks'
import { selectCache } from '~/lib/cache'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

export const Route = createFileRoute('/dashboard/bills/')({
  component: BillsPage,
})

const MONTHS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

const toInputDateString = (dateInput: Date | string | number) => {
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Animation variants defined outside component — stable references, no GC pressure
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 26 } }
}

function BillsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [refetching, setRefetching] = useState(false)

  const handleRefetch = async () => {
    if (refetching) return
    setRefetching(true)
    try {
      await refetch()
    } finally {
      setRefetching(false)
    }
  }

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingBillId, setEditingBillId] = useState<string | null>(null)

  // Queries
  const { data: bills, loading: loadingBills, error, refetch } = useQuery({
    queryFn: () => api.bills.list(),
    cacheKey: 'bills.list',
  })

  const { data: tenantsList, loading: loadingTenants } = selectCache.tenants(() => api.tenants.list())
  const { data: unitsList, loading: loadingUnitsCache } = selectCache.units(() => api.units.list())


  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    tenantId: '',
    unitId: '',
    periodMonth: (new Date().getMonth() + 1).toString(),
    periodYear: new Date().getFullYear().toString(),
    rentAmount: '0',
    electricityAmount: '0',
    waterAmount: '0',
    wifiAmount: '0',
    otherAmount: '0',
    dueDate: (() => {
      const date = new Date()
      date.setDate(date.getDate() + 7)
      return toInputDateString(date)
    })(),
  })

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    tenantName: '',
    unitNumber: '',
    periodMonth: '',
    periodYear: '',
    rentAmount: '0',
    electricityAmount: '0',
    waterAmount: '0',
    wifiAmount: '0',
    otherAmount: '0',
    dueDate: '',
    status: 'pending',
  })

  const { mutate: createBill, loading: creating } = useMutation({
    mutationFn: (data: any) => api.bills.create(data),
    onSuccess: () => {
      setCreateDialogOpen(false)
      resetCreateForm()
      handleRefetch()
    },
    onError: (err) => {
      alert('Gagal membuat tagihan: ' + err)
    },
  })

  const { mutate: updateBill, loading: updating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.bills.update(id, data),
    onSuccess: () => {
      setEditDialogOpen(false)
      setEditingBillId(null)
      handleRefetch()
    },
    onError: (err) => {
      alert('Gagal memperbarui tagihan: ' + err)
    },
  })

  const isBusy = loadingBills || loadingTenants || loadingUnitsCache || creating || updating || deleting || refetching

  const activeTenants = useMemo(
    () => tenantsList?.filter((t: any) => t.status === 'active') || [],
    [tenantsList]
  )

  const resetCreateForm = () => {
    setCreateFormData({
      tenantId: '',
      unitId: '',
      periodMonth: (new Date().getMonth() + 1).toString(),
      periodYear: new Date().getFullYear().toString(),
      rentAmount: '0',
      electricityAmount: '0',
      waterAmount: '0',
      wifiAmount: '0',
      otherAmount: '0',
      dueDate: (() => {
        const date = new Date()
        date.setDate(date.getDate() + 7)
        return toInputDateString(date)
      })(),
    })
  }

  const handleTenantSelect = (tenantId: string) => {
    const tenant = tenantsList?.find((t: any) => t.id === tenantId)
    if (!tenant) return

    const unit = unitsList?.find((u: any) => u.id === tenant.unitId)
    const rentVal = unit ? unit.priceMonthly.toString() : '0'

    setCreateFormData((prev) => ({
      ...prev,
      tenantId,
      unitId: tenant.unitId,
      rentAmount: rentVal,
    }))
  }

  const handleOpenEdit = (bill: any) => {
    setEditingBillId(bill.id)
    setEditFormData({
      tenantName: bill.tenantName || 'Penghuni Kost',
      unitNumber: bill.unitNumber || 'Kamar',
      periodMonth: bill.periodMonth.toString(),
      periodYear: bill.periodYear.toString(),
      rentAmount: bill.rentAmount.toString(),
      electricityAmount: bill.electricityAmount.toString(),
      waterAmount: bill.waterAmount.toString(),
      wifiAmount: bill.wifiAmount.toString(),
      otherAmount: bill.otherAmount.toString(),
      dueDate: toInputDateString(bill.dueDate),
      status: bill.status,
    })
    setEditDialogOpen(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createFormData.tenantId) {
      alert('Silakan pilih penghuni terlebih dahulu.')
      return
    }

    createBill({
      tenantId: createFormData.tenantId,
      unitId: createFormData.unitId,
      periodMonth: parseInt(createFormData.periodMonth),
      periodYear: parseInt(createFormData.periodYear),
      rentAmount: parseInt(createFormData.rentAmount || '0'),
      electricityAmount: parseInt(createFormData.electricityAmount || '0'),
      waterAmount: parseInt(createFormData.waterAmount || '0'),
      wifiAmount: parseInt(createFormData.wifiAmount || '0'),
      otherAmount: parseInt(createFormData.otherAmount || '0'),
      dueDate: createFormData.dueDate,
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBillId) return

    updateBill({
      id: editingBillId,
      data: {
        rentAmount: parseInt(editFormData.rentAmount || '0'),
        electricityAmount: parseInt(editFormData.electricityAmount || '0'),
        waterAmount: parseInt(editFormData.waterAmount || '0'),
        wifiAmount: parseInt(editFormData.wifiAmount || '0'),
        otherAmount: parseInt(editFormData.otherAmount || '0'),
        dueDate: editFormData.dueDate,
        status: editFormData.status,
      },
    })
  }

  const handleItemClick = (billId: string) => {
    if (isBusy) return
    if (isBulkMode) {
      if (selectedIds.includes(billId)) {
        setSelectedIds(selectedIds.filter(id => id !== billId))
      } else {
        setSelectedIds([...selectedIds, billId])
      }
    } else {
      navigate({ to: '/dashboard/bills/$billId', params: { billId } })
    }
  }

  const handleDeleteBill = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tagihan ini secara permanen? Semua riwayat pembayaran terkait akan hilang.')) return
    try {
      await api.bills.delete(id)
      await handleRefetch()
    } catch (err) {
      alert('Gagal menghapus tagihan: ' + err)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} tagihan terpilih secara permanen? Semua riwayat pembayaran terkait akan hilang.`)) return
    setDeleting(true)
    try {
      await api.bills.deleteMultiple(selectedIds)
      setSelectedIds([])
      setIsBulkMode(false)
      await handleRefetch()
    } catch (err) {
      alert('Gagal menghapus tagihan terpilih: ' + err)
    } finally {
      setDeleting(false)
    }
  }

  const createTotalAmount = useMemo(() =>
    parseInt(createFormData.rentAmount || '0') +
    parseInt(createFormData.electricityAmount || '0') +
    parseInt(createFormData.waterAmount || '0') +
    parseInt(createFormData.wifiAmount || '0') +
    parseInt(createFormData.otherAmount || '0'),
    [createFormData]
  )

  const editTotalAmount = useMemo(() =>
    parseInt(editFormData.rentAmount || '0') +
    parseInt(editFormData.electricityAmount || '0') +
    parseInt(editFormData.waterAmount || '0') +
    parseInt(editFormData.wifiAmount || '0') +
    parseInt(editFormData.otherAmount || '0'),
    [editFormData]
  )

  const currentYear = new Date().getFullYear()
  const YEARS = [
    (currentYear - 1).toString(),
    currentYear.toString(),
    (currentYear + 1).toString(),
  ]

  // Filter bills — debounced search + memoized to avoid recalculating on every render
  const filteredBills = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return bills?.filter((bill: any) => {
      const matchesSearch = !q ||
        (bill.tenantName || '').toLowerCase().includes(q) ||
        (bill.unitNumber || '').toLowerCase().includes(q)
      const matchesFilter = filter === 'all' || bill.status === filter
      return matchesSearch && matchesFilter
    }) || []
  }, [bills, debouncedSearch, filter])

  const initializing = loadingBills || loadingTenants || loadingUnitsCache

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive font-semibold">Gagal memuat tagihan: {error}</p>
      </div>
    )
  }

  // On hard refresh or cold start, keep blocking render until the core data
  // the table depends on is actually present. This avoids #310 where bills
  // can resolve before tenants/units and the list then renders with undefined relations.
  const coreDataMissing = !bills || !tenantsList || !unitsList
  if (coreDataMissing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DashboardBootstrap>
      <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Buku Keuangan & Tagihan</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Pantau pembayaran sewa bulanan dan status penagihan unit.</p>
        </div>
        <div className="flex items-center gap-2">
          {bills && bills.length > 0 && (
            <Button
              variant={isBulkMode ? "outline" : "destructive"}
              onClick={() => {
                setIsBulkMode(!isBulkMode)
                setSelectedIds([])
              }}
              className="rounded-xl font-bold text-xs h-9"
              disabled={isBusy}
            >
              {isBulkMode ? (
                'Batal'
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          )}

          <Button 
            onClick={() => {
              resetCreateForm()
              setCreateDialogOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition h-9"
            disabled={isBusy}
          >
            <Plus className="mr-1.5 h-4 w-4" />Buat Tagihan
          </Button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari penghuni atau nomor unit..." 
            className="pl-9 bg-white border-slate-200 rounded-xl text-xs font-semibold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isBusy}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'pending', label: 'Belum Dibayar' },
            { id: 'paid', label: 'Lunas' },
            { id: 'overdue', label: 'Jatuh Tempo' },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              disabled={isBusy}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                filter === opt.id 
                  ? 'bg-slate-950 border-slate-950 text-white shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              } ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Bill Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Buat Tagihan Baru</DialogTitle>
            <DialogDescription className="text-xs text-slate-550">
              Pilih penghuni kost aktif dan masukkan rincian tagihan bulanan mereka.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            {/* Select Tenant */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Pilih Penghuni Kost</Label>
              <Select value={createFormData.tenantId} onValueChange={handleTenantSelect}>
                <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                  <SelectValue placeholder="Pilih penghuni aktif..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {activeTenants.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs font-semibold">Tidak ada penghuni aktif</div>
                  ) : (
                    activeTenants.map((t: any) => {
                      const u = unitsList?.find((unit: any) => unit.id === t.unitId)
                      return (
                        <SelectItem key={t.id} value={t.id} className="text-xs font-semibold rounded-lg cursor-pointer">
                          {t.fullName} (Unit {u?.unitNumber || 'Kamar'})
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Period Month & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Bulan Periode</Label>
                <Select
                  value={createFormData.periodMonth}
                  onValueChange={(val) => setCreateFormData({ ...createFormData, periodMonth: val })}
                >
                  <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-850">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs font-semibold cursor-pointer">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Tahun Periode</Label>
                <Select
                  value={createFormData.periodYear}
                  onValueChange={(val) => setCreateFormData({ ...createFormData, periodYear: val })}
                >
                  <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-850">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y} className="text-xs font-semibold cursor-pointer">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rent Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Biaya Sewa Kamar (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={createFormData.rentAmount}
                onChange={(e) => setCreateFormData({ ...createFormData, rentAmount: e.target.value })}
                className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            {/* Utilities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-dashed border-slate-100 pt-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Biaya Listrik (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={createFormData.electricityAmount}
                  onChange={(e) => setCreateFormData({ ...createFormData, electricityAmount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Biaya Air (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={createFormData.waterAmount}
                  onChange={(e) => setCreateFormData({ ...createFormData, waterAmount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-dashed border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Biaya WiFi (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={createFormData.wifiAmount}
                  onChange={(e) => setCreateFormData({ ...createFormData, wifiAmount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Lain-lain (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={createFormData.otherAmount}
                  onChange={(e) => setCreateFormData({ ...createFormData, otherAmount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Tanggal Jatuh Tempo</Label>
              <Input
                type="date"
                value={createFormData.dueDate}
                onChange={(e) => setCreateFormData({ ...createFormData, dueDate: e.target.value })}
                className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            {/* Computed Total Display */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Total Tagihan</span>
              <strong className="font-black text-sm text-slate-900">{formatRupiah(createTotalAmount)}</strong>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-xl text-xs font-semibold">
                Batal
              </Button>
              <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Tagihan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Rincian Tagihan</DialogTitle>
            <DialogDescription className="text-xs text-slate-550">
              Perbarui rincian biaya sewa, utilitas, tanggal jatuh tempo, atau status pembayaran tagihan ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            {/* Info Tenant & Unit (Read-only) */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between text-xs font-semibold text-slate-700">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Penyewa</span>
                <span className="text-slate-800 font-extrabold">{editFormData.tenantName}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Unit</span>
                <span className="text-slate-800 font-extrabold">Kamar {editFormData.unitNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Periode</span>
                <span className="text-slate-800 font-extrabold">{editFormData.periodMonth}/{editFormData.periodYear}</span>
              </div>
            </div>

            {/* Rent Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Biaya Sewa Kamar (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={editFormData.rentAmount}
                onChange={(e) => setEditFormData({ ...editFormData, rentAmount: e.target.value })}
                className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            {/* Utilities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-dashed border-slate-100 pt-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Biaya Listrik (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editFormData.electricityAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, electricityAmount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Biaya Air (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editFormData.waterAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, waterAmount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-dashed border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Biaya WiFi (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editFormData.wifiAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, wifiAmount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Lain-lain (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editFormData.otherAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, otherAmount: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {/* Due Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Jatuh Tempo</Label>
                <Input
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  className="bg-white border-slate-200 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Status Pembayaran</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(val) => setEditFormData({ ...editFormData, status: val })}
                >
                  <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-semibold text-slate-850">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pending" className="text-xs font-semibold cursor-pointer">Belum Dibayar</SelectItem>
                    <SelectItem value="paid" className="text-xs font-semibold cursor-pointer">Lunas</SelectItem>
                    <SelectItem value="overdue" className="text-xs font-semibold cursor-pointer">Jatuh Tempo</SelectItem>
                    <SelectItem value="partial" className="text-xs font-semibold cursor-pointer">Dibayar Sebagian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Computed Total Display */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Total Tagihan</span>
              <strong className="font-black text-sm text-slate-900">{formatRupiah(editTotalAmount)}</strong>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl text-xs font-semibold">
                Batal
              </Button>
              <Button type="submit" disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bills list */}
      {!bills || bills.length === 0 ? (
        <Card className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <CardContent className="p-12 text-center flex flex-col items-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Belum ada tagihan</h3>
            <p className="text-xs text-slate-450 mb-4 font-medium">Buat tagihan pertama secara manual menggunakan tombol di atas.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs"
        >
          {filteredBills.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              Tidak ada tagihan yang cocok dengan filter atau pencarian Anda.
            </div>
          ) : (
            filteredBills.map((bill: any) => {
              const utilityAmount =
                (bill.electricityAmount || 0) +
                (bill.waterAmount || 0) +
                (bill.wifiAmount || 0) +
                (bill.otherAmount || 0)
              const isSelected = selectedIds.includes(bill.id)

              return (
                <motion.div 
                  key={bill.id}
                  variants={itemVariants}
                  onClick={() => handleItemClick(bill.id)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition font-medium cursor-pointer ${
                    isBulkMode ? 'hover:bg-slate-50/70' : 'hover:bg-slate-50/50'
                  } ${isSelected && isBulkMode ? 'bg-blue-50/30 border-l-4 border-l-blue-500 pl-3' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {isBulkMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by outer click
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                        disabled={isBusy}
                      />
                    )}
                    <div className={`p-2 rounded-xl border ${
                      bill.status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                      bill.status === 'overdue' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                      'bg-amber-50 border-amber-100 text-amber-600'
                    }`}>
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs md:text-sm flex items-center gap-2">
                        {bill.tenantName || 'Penghuni Kost'} 
                        <span className="text-[10px] text-slate-400 font-semibold">(Unit {bill.unitNumber || 'Kamar'})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Periode: {bill.periodMonth}/{bill.periodYear} &middot; Jatuh Tempo: {formatDate(bill.dueDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right space-y-0.5">
                      <div className="font-extrabold text-slate-950 text-xs md:text-sm">
                        {formatRupiah(bill.totalAmount)}
                      </div>
                      <div className="text-[9px] text-slate-450 font-semibold">
                        Sewa: {formatRupiah(bill.rentAmount)} + Utilitas: {formatRupiah(utilityAmount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bill.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        bill.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {bill.status === 'paid' ? 'Lunas' :
                         bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Dibayar'}
                      </span>

                      {!isBulkMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEdit(bill)
                          }}
                          className="h-8 w-8 text-slate-600 hover:text-blue-600 rounded-lg cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}

                      <Button variant="ghost" size="sm" disabled={isBusy} className={`h-7 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-50 ${isBusy ? 'pointer-events-none opacity-50' : ''}`} asChild>
                        <Link 
                          to="/dashboard/bills/$billId" 
                          params={{ billId: bill.id }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Detail <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      </Button>

                      {!isBulkMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBill(bill.id)
                          }}
                          className="h-8 w-8 text-slate-600 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      )}

      {isBulkMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800">
          <div className="text-xs font-bold">
            <span className="text-blue-400">{selectedIds.length}</span> dari <span className="text-slate-300">{filteredBills.length}</span> terpilih
          </div>
          <div className="flex items-center gap-2.5">
            <button
              disabled={isBusy}
              onClick={() => {
                if (selectedIds.length === filteredBills.length) {
                  setSelectedIds([])
                } else {
                  setSelectedIds(filteredBills.map((b: any) => b.id))
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-semibold cursor-pointer transition border border-slate-750 text-white"
            >
              {selectedIds.length === filteredBills.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </button>
            <button
              disabled={selectedIds.length === 0 || isBusy}
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800/40 disabled:text-red-300/60 disabled:cursor-not-allowed rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 text-white"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Hapus Terpilih'}
            </button>
            <button
              disabled={isBusy}
              onClick={() => {
                setIsBulkMode(false)
                setSelectedIds([])
              }}
              className="px-3 py-1.5 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold cursor-pointer transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
    </DashboardBootstrap>
  )
}
