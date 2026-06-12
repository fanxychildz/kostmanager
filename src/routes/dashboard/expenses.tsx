import { createFileRoute } from '@tanstack/react-router'
import { Plus, Loader2, TrendingDown, Trash2, Edit3 } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery, useMutation } from '~/lib/hooks'
import { selectCache } from '~/lib/cache'

export const Route = createFileRoute('/dashboard/expenses')({
  component: ExpensesPage,
})

const CATEGORIES: Record<string, string> = {
  operational: 'Operasional',
  repair: 'Perbaikan',
  utility: 'Utilitas',
  salary: 'Gaji Staf',
  other: 'Lainnya',
}

const CATEGORY_COLORS: Record<string, string> = {
  operational: 'bg-blue-100 text-blue-800 border-blue-200',
  repair: 'bg-amber-100 text-amber-800 border-amber-200',
  utility: 'bg-purple-100 text-purple-800 border-purple-200',
  salary: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  other: 'bg-slate-100 text-slate-800 border-slate-200',
}

function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    propertyId: '',
    title: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  const { data: properties } = selectCache.properties(() => api.properties.list())

  const { data: expenses, loading, refetch } = useQuery({
    queryFn: () => api.expenses.list(),
  })

  const { mutate: createExpense, loading: creating } = useMutation({
    mutationFn: (data: any) => api.expenses.create(data),
    onSuccess: () => {
      setDialogOpen(false)
      resetForm()
      refetch()
    },
  })

  const { mutate: updateExpense, loading: updating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.expenses.update(id, data),
    onSuccess: () => {
      setDialogOpen(false)
      resetForm()
      refetch()
    },
  })

  const { mutate: deleteExpense } = useMutation({
    mutationFn: (id: string) => api.expenses.delete(id),
    onSuccess: () => {
      refetch()
    },
  })

  const resetForm = () => {
    setFormData({
      propertyId: properties?.[0]?.id || '',
      title: '',
      amount: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setEditingExpenseId(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    if (properties?.length) {
      setFormData((prev) => ({ ...prev, propertyId: properties[0].id }))
    }
    setDialogOpen(true)
  }

  const handleOpenEdit = (expense: any) => {
    setEditingExpenseId(expense.id)
    setFormData({
      propertyId: expense.propertyId,
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      propertyId: formData.propertyId,
      title: formData.title,
      amount: parseInt(formData.amount),
      category: formData.category,
      date: formData.date,
      notes: formData.notes || null,
    }

    if (editingExpenseId) {
      updateExpense({ id: editingExpenseId, data: payload })
    } else {
      createExpense(payload)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran ini?')) {
      deleteExpense(id)
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleRowClick = (expenseId: string) => {
    if (isBulkMode) {
      if (selectedIds.includes(expenseId)) {
        setSelectedIds(selectedIds.filter(id => id !== expenseId))
      } else {
        setSelectedIds([...selectedIds, expenseId])
      }
    }
  }

  const handleSelectAll = () => {
    if (expenses) {
      if (selectedIds.length === expenses.length) {
        setSelectedIds([])
      } else {
        setSelectedIds(expenses.map((e: any) => e.id))
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} pengeluaran terpilih secara permanen?`)) return
    setDeleting(true)
    try {
      await api.expenses.deleteMultiple(selectedIds)
      setSelectedIds([])
      setIsBulkMode(false)
      await refetch()
    } catch (err) {
      alert('Gagal menghapus pengeluaran terpilih: ' + err)
    } finally {
      setDeleting(false)
    }
  }

  const totalAmount = expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0
  const avgAmount = expenses && expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Pencatatan Pengeluaran</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Kelola pengeluaran operasional dan pemeliharaan kos</p>
        </div>
        <div className="flex items-center gap-2">
          {expenses && expenses.length > 0 && (
            <Button
              variant={isBulkMode ? "outline" : "destructive"}
              onClick={() => {
                setIsBulkMode(!isBulkMode)
                setSelectedIds([])
              }}
              className="rounded-xl font-bold text-xs h-9"
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

          <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition">
            <Plus className="mr-2 h-4 w-4" />Catat Pengeluaran
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pengeluaran</p>
            <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalAmount)}</span>
          </div>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jumlah Transaksi</p>
            <span className="text-2xl font-extrabold text-slate-900">{expenses?.length || 0}</span>
          </div>
        </Card>
        <Card className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-rata Transaksi</p>
            <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(avgAmount)}</span>
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExpenseId ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Baru'}</DialogTitle>
            <DialogDescription>Masukkan detail pengeluaran operasional properti</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Properti</Label>
              <Select value={formData.propertyId} onValueChange={(value) => setFormData({ ...formData, propertyId: value })}>
                <SelectTrigger><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                <SelectContent>
                  {properties?.map((prop: any) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Judul Pengeluaran</Label>
              <Input
                placeholder="Contoh: Gaji Satpam, Beli Lampu Lorong"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operasional</SelectItem>
                    <SelectItem value="repair">Perbaikan</SelectItem>
                    <SelectItem value="utility">Utilitas (Air/Listrik/WiFi)</SelectItem>
                    <SelectItem value="salary">Gaji Staf</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan Tambahan (opsional)</Label>
              <Input
                placeholder="Detail pengeluaran..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={creating || updating}>
                {(creating || updating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {expenses && expenses.length === 0 ? (
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs">
          <CardContent className="p-12 text-center">
            <TrendingDown className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Belum ada catatan pengeluaran</h3>
            <p className="text-sm text-slate-400">Catat biaya operasional atau perbaikan pertama Anda</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {isBulkMode && (
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={!!(expenses && expenses.length > 0 && selectedIds.length === expenses.length)}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </TableHead>
                  )}
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Properti</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Catatan</TableHead>
                  {!isBulkMode && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense: any) => {
                  const propertyName = properties?.find((p: any) => p.id === expense.propertyId)?.name || 'Properti'
                  const isSelected = selectedIds.includes(expense.id)
                  return (
                    <TableRow 
                      key={expense.id}
                      onClick={() => handleRowClick(expense.id)}
                      className={`transition-colors ${
                        isBulkMode ? 'cursor-pointer hover:bg-slate-50/80' : ''
                      } ${isSelected && isBulkMode ? 'bg-blue-50/40 hover:bg-blue-50/60' : ''}`}
                    >
                      {isBulkMode && (
                        <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRowClick(expense.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-slate-600 font-semibold">{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-bold text-slate-800">{propertyName}</TableCell>
                      <TableCell className="font-bold text-slate-900">{expense.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase border ${CATEGORY_COLORS[expense.category]}`}>
                          {CATEGORIES[expense.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-extrabold text-rose-600">{formatRupiah(expense.amount)}</TableCell>
                      <TableCell className="text-slate-500 font-medium">{expense.notes || '-'}</TableCell>
                      {!isBulkMode && (
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(expense)} className="h-8 w-8 text-slate-600 hover:text-blue-600 rounded-lg">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="h-8 w-8 text-slate-600 hover:text-rose-600 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isBulkMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800">
          <div className="text-xs font-bold">
            <span className="text-blue-400">{selectedIds.length}</span> dari <span className="text-slate-300">{expenses?.length || 0}</span> terpilih
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition border border-slate-750 text-white"
            >
              {selectedIds.length === (expenses?.length || 0) ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </button>
            <button
              disabled={selectedIds.length === 0 || deleting}
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800/40 disabled:text-red-300/60 disabled:cursor-not-allowed rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 text-white"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Hapus Terpilih'}
            </button>
            <button
              onClick={() => {
                setIsBulkMode(false)
                setSelectedIds([])
              }}
              className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
