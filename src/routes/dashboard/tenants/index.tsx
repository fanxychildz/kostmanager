import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search, Phone, Mail, Loader2, Users, Calendar, ArrowUpRight, Trash2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery, useDebounce } from '~/lib/hooks'
import { selectCache } from '~/lib/cache'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

export const Route = createFileRoute('/dashboard/tenants/')({
  component: TenantsPage,
})

function TenantsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const { data: tenants, loading, error, refetch } = useQuery({
    queryFn: () => api.tenants.list(),
    cacheKey: 'tenants.list',
  })

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus penghuni ini secara permanen? Unit kamar terkait akan otomatis kosong (Available) kembali.')) return
    try {
      await api.tenants.delete(id)
      await refetch()
    } catch (err) {
      alert('Gagal menghapus penghuni: ' + err)
    }
  }

  // Use shared select-cache so units/properties are NOT re-fetched
  const { data: units, loading: loadingUnits } = selectCache.units(() => api.units.list())
  const { data: properties, loading: loadingProperties } = selectCache.properties(() => api.properties.list())

  // Pre-build O(1) lookup Maps instead of per-row .find() calls
  const unitMap = useMemo(() => new Map((units || []).map((u: any) => [u.id, u])), [units])
  const propertyMap = useMemo(() => new Map((properties || []).map((p: any) => [p.id, p])), [properties])

  // Memoized filter with debounced search — MUST be before any early return (Rules of Hooks)
  const filteredTenants = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return tenants || []
    return (tenants || []).filter((t: any) =>
      t.fullName.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.phone.includes(debouncedSearch)
    )
  }, [tenants, debouncedSearch])

  const initializing = loading || loadingUnits || loadingProperties

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }


  return (
    <DashboardBootstrap>
      <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Database Penghuni</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Kelola data penghuni, kontak, status sewa, dan deposit uang jaminan.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition animate-fade-in" asChild>
          <Link to="/dashboard/tenants/new">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            Tambah Penghuni
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Cari nama, email, atau telepon..." 
          className="pl-9 bg-white border-slate-200 rounded-xl text-xs font-semibold focus-visible:ring-slate-350"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {tenants && tenants.length === 0 ? (
        <Card className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <CardContent className="p-12 text-center flex flex-col items-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <Users className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Belum ada penghuni</h3>
            <p className="text-xs text-slate-450 mb-6 font-medium">Daftar penghuni kost akan tampil di sini setelah Anda mendaftarkan sewa kamar.</p>
            <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold" asChild>
              <Link to="/dashboard/tenants/new">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Penghuni
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs">
                  <th className="p-4">Rincian Penghuni</th>
                  <th className="p-4">Unit Terisi</th>
                  <th className="p-4">Periode Sewa</th>
                  <th className="p-4 text-right">Uang Jaminan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      Tidak ditemukan penghuni yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant: any) => {
                    const unit = unitMap.get(tenant.unitId)
                    const property = propertyMap.get(tenant.propertyId)
                    
                    return (
                      <tr key={tenant.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="p-4">
                          <Link 
                            to="/dashboard/tenants/$tenantId" 
                            params={{ tenantId: tenant.id }} 
                            className="flex items-center gap-3 group"
                          >
                            <Avatar className="h-9 w-9 ring-2 ring-slate-100">
                              {tenant.image && <AvatarImage src={tenant.image} alt={tenant.fullName} className="object-cover" />}
                              <AvatarFallback className="text-xs bg-slate-900 text-white font-bold">
                                {tenant.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition text-xs md:text-sm">{tenant.fullName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{tenant.occupation || 'Pekerjaan -'}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-xs">{property?.name || '-'}</div>
                          <div className="text-[10px] text-slate-450 mt-0.5">Kamar {unit?.unitNumber || '-'}</div>
                        </td>
                        <td className="p-4 text-[10px] text-slate-500 font-semibold space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(tenant.checkInDate)} s/d</span>
                          </div>
                          <div className="text-slate-400 pl-4">
                            {tenant.checkOutDate ? formatDate(tenant.checkOutDate) : 'Selesai Kontrak -'}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900 text-right text-xs md:text-sm">
                          {formatRupiah(tenant.depositAmount)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-[10px] rounded-md font-bold ${
                            tenant.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            tenant.status === 'inactive' ? 'bg-slate-100 text-slate-600' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {tenant.status === 'active' ? 'Aktif' :
                             tenant.status === 'inactive' ? 'Nonaktif' : 'Blacklist'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-bold" asChild>
                              <Link to="/dashboard/tenants/$tenantId" params={{ tenantId: tenant.id }}>
                                Detail <ArrowUpRight className="w-3 h-3 ml-0.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              onClick={() => handleDeleteTenant(tenant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </DashboardBootstrap>
  )
}
