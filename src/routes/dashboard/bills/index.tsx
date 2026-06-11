import { createFileRoute, Link } from '@tanstack/react-router'
import { Search, Loader2, FileText, Plus, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'
import { motion } from 'motion/react'

export const Route = createFileRoute('/dashboard/bills/')({
  component: BillsPage,
})

function BillsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [search, setSearch] = useState('')
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  const { data: bills, loading, error, refetch } = useQuery({
    queryFn: () => api.bills.list(),
  })

  const handleItemClick = (billId: string) => {
    if (isBulkMode) {
      if (selectedIds.includes(billId)) {
        setSelectedIds(selectedIds.filter(id => id !== billId))
      } else {
        setSelectedIds([...selectedIds, billId])
      }
    }
  }

  const handleDeleteBill = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tagihan ini secara permanen? Semua riwayat pembayaran terkait akan hilang.')) return
    try {
      await api.bills.delete(id)
      await refetch()
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
      await refetch()
    } catch (err) {
      alert('Gagal menghapus tagihan terpilih: ' + err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
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

  // Filter bills
  const filteredBills = bills?.filter((bill: any) => {
    const matchesSearch = 
      (bill.tenantName || '').toLowerCase().includes(search.toLowerCase()) || 
      (bill.unitNumber || '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || bill.status === filter
    return matchesSearch && matchesFilter
  }) || []

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Buku Keuangan & Tagihan</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Pantau pembayaran sewa bulanan dan status penagihan unit.</p>
        </div>
        {bills && bills.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsBulkMode(!isBulkMode)
                setSelectedIds([])
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isBulkMode
                  ? 'bg-slate-100 border-slate-350 text-slate-700 hover:bg-slate-200'
                  : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isBulkMode ? 'Selesai Memilih' : 'Hapus Massal'}
            </button>
          </div>
        )}
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                filter === opt.id 
                  ? 'bg-slate-950 border-slate-950 text-white shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bills list */}
      {!bills || bills.length === 0 ? (
        <Card className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <CardContent className="p-12 text-center flex flex-col items-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Belum ada tagihan</h3>
            <p className="text-xs text-slate-450 mb-4 font-medium">Tagihan bulanan akan terbuat secara otomatis saat kontrak penghuni aktif.</p>
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
              const utilityAmount = bill.electricityAmount + bill.waterAmount + bill.wifiAmount + bill.otherAmount
              const isSelected = selectedIds.includes(bill.id)

              return (
                <motion.div 
                  key={bill.id}
                  variants={itemVariants}
                  onClick={() => handleItemClick(bill.id)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition font-medium ${
                    isBulkMode ? 'cursor-pointer hover:bg-slate-50/70' : 'hover:bg-slate-50/50'
                  } ${isSelected && isBulkMode ? 'bg-blue-50/30 border-l-4 border-l-blue-500 pl-3' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {isBulkMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by outer click
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
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

                      <Button variant="ghost" size="sm" className="h-7 text-blue-650 font-bold text-xs rounded-lg hover:bg-blue-50" asChild>
                        <Link to="/dashboard/bills/$billId" params={{ billId: bill.id }}>
                          Detail <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      </Button>

                      {!isBulkMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBill(bill.id)
                          }}
                          className="h-7 px-2 text-rose-650 hover:text-rose-850 hover:bg-rose-50 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Hapus
                        </button>
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
              onClick={() => {
                if (selectedIds.length === filteredBills.length) {
                  setSelectedIds([])
                } else {
                  setSelectedIds(filteredBills.map((b: any) => b.id))
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition border border-slate-750"
            >
              {selectedIds.length === filteredBills.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </button>
            <button
              disabled={selectedIds.length === 0 || deleting}
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-red-650 hover:bg-red-750 disabled:bg-red-800/40 disabled:text-red-350/60 disabled:cursor-not-allowed rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
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
