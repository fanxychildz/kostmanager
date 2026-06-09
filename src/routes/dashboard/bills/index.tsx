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

  const { data: bills, loading, error } = useQuery({
    queryFn: () => api.bills.list(),
  })

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
              
              return (
                <motion.div 
                  key={bill.id}
                  variants={itemVariants}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition font-medium"
                >
                  <div className="flex items-center gap-3">
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
                      <div className="text-[9px] text-slate-400 font-semibold">
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
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      )}
    </div>
  )
}
