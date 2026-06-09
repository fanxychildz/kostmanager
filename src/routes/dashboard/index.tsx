import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Loader2,
  TrendingDown,
  Clock,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { formatRupiah } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: properties, loading: loadingProperties } = useQuery({
    queryFn: () => api.properties.list(),
  })

  const { data: bills, loading: loadingBills } = useQuery({
    queryFn: () => api.bills.list(),
  })

  const { data: payments, loading: loadingPayments } = useQuery({
    queryFn: () => api.payments.list(),
  })

  const { data: units, loading: loadingUnits } = useQuery({
    queryFn: () => api.units.list(),
  })

  if (loadingProperties || loadingBills || loadingPayments || loadingUnits) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalUnits = properties?.reduce((sum: number, p: any) => sum + p.totalUnits, 0) || 0
  const occupiedUnits = properties?.reduce((sum: number, p: any) => sum + p.occupiedUnits, 0) || 0
  const availableUnits = units?.filter((u: any) => u.status === 'available').length || 0
  const maintenanceUnits = units?.filter((u: any) => u.status === 'maintenance').length || 0
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const totalIncome = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
  const totalPending = bills?.filter((b: any) => b.status === 'pending').reduce((sum: number, b: any) => sum + b.totalAmount, 0) || 0
  const totalOverdue = bills?.filter((b: any) => b.status === 'overdue').reduce((sum: number, b: any) => sum + b.totalAmount, 0) || 0
  const pendingCount = bills?.filter((b: any) => b.status === 'pending').length || 0
  const overdueCount = bills?.filter((b: any) => b.status === 'overdue').length || 0

  const recentBills = bills?.slice(0, 5) || []

  // Animation variants for card loading
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  }

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Ringkasan Portofolio</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Status real-time dan kontrol manajemen properti Anda.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-xs font-semibold rounded-xl" asChild>
            <Link to="/dashboard/bills">Kelola Tagihan</Link>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition" asChild>
            <Link to="/dashboard/properties">Kelola Properti</Link>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pendapatan</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(totalIncome)}</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-4 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Terverifikasi dari transfer & tunai</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tagihan Tunggakan</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-600">{formatRupiah(totalOverdue)}</span>
            </div>
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-4 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>{overdueCount} tagihan lewat jatuh tempo</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Belum Dibayar</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-600">{formatRupiah(totalPending)}</span>
            </div>
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-4 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>{pendingCount} tagihan status pending</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tingkat Hunian</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{occupancyRate}%</span>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={occupancyRate} className="h-2 rounded-full overflow-hidden" />
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-1">
              <span>{occupiedUnits} Terisi</span>
              <span>{totalUnits} Total Unit</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main stats layout */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Unit Status Card */}
        <Card className="lg:col-span-3 border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <CardHeader className="border-b border-slate-100 p-5">
            <CardTitle className="text-sm font-extrabold text-slate-900">Distribusi Status Kamar</CardTitle>
            <CardDescription className="text-xs">Kondisi unit properti saat ini</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Terisi
                </span>
                <span className="text-slate-800">{occupiedUnits} Unit</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Tersedia
                </span>
                <span className="text-slate-800">{availableUnits} Unit</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Dalam Perbaikan
                </span>
                <span className="text-slate-800">{maintenanceUnits} Unit</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <Button variant="outline" className="w-full text-xs font-semibold rounded-xl py-2" asChild>
                <Link to="/dashboard/properties">Lihat Kamar & Properti</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Property Occupancy summary */}
        <Card className="lg:col-span-4 border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <CardHeader className="border-b border-slate-100 p-5">
            <CardTitle className="text-sm font-extrabold text-slate-900">Kapasitas Properti Anda</CardTitle>
            <CardDescription className="text-xs">Rasio okupansi unit per properti</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3">
              {properties?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada data properti.</p>
              ) : (
                properties?.map((prop: any) => {
                  const rate = prop.totalUnits > 0 ? Math.round((prop.occupiedUnits / prop.totalUnits) * 100) : 0
                  return (
                    <div key={prop.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">{prop.name}</span>
                        <span className="text-slate-500">{prop.occupiedUnits}/{prop.totalUnits} Terisi ({rate}%)</span>
                      </div>
                      <Progress value={rate} className="h-1.5 rounded-full overflow-hidden" />
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bills section */}
      <Card className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
          <div>
            <CardTitle className="text-sm font-extrabold text-slate-900">Tagihan Terbaru</CardTitle>
            <CardDescription className="text-xs">Daftar tagihan bulanan penghuni</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold" asChild>
            <Link to="/dashboard/bills">Lihat Semua</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          {recentBills.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">Belum ada tagihan terdaftar.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBills.map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Users className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{bill.tenantName || 'Penghuni Kost'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Unit {bill.unitNumber || 'Kamar'} &middot; Periode {bill.periodMonth}/{bill.periodYear}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-slate-950">{formatRupiah(bill.totalAmount)}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block mt-1 ${
                      bill.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      bill.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {bill.status === 'paid' ? 'Lunas' :
                       bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Dibayar'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
