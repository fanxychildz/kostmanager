import { createFileRoute } from '@tanstack/react-router'
import { Clock, RefreshCw, CheckCircle, ArrowRight, X, Loader2, Wrench } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { api } from '~/lib/api'

type MaintenanceStatus = 'Pending' | 'In Progress' | 'Resolved'

interface MaintenanceItem {
  id: string
  tenantName: string
  unitNumber: string
  propertyName: string
  title: string
  description: string
  category: string
  priority: string
  status: MaintenanceStatus
  createdAt: string
  updates: Array<{ id: string; date: string; author: string; text: string }>
}

export const Route = createFileRoute('/dashboard/maintenance')({
  component: LandlordMaintenancePage,
})

function LandlordMaintenancePage() {
  const [items, setItems] = useState<MaintenanceItem[]>([])
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceItem | null>(null)
  const [maintenanceNoteText, setMaintenanceNoteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const normalizeItem = (row: any): MaintenanceItem => ({
    id: String(row.id),
    tenantName: String(row.tenantName ?? 'Penghuni'),
    unitNumber: String(row.unitNumber ?? '-'),
    propertyName: String(row.propertyName ?? 'Properti'),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    priority: String(row.priority),
    status: (() => {
      const s = String(row.status || '').toLowerCase()
      if (s === 'resolved') return 'Resolved'
      if (s === 'in_progress' || s === 'in progress') return 'In Progress'
      return 'Pending'
    })() as MaintenanceStatus,
    createdAt: String(row.createdAt || new Date().toISOString()),
    updates: Array.isArray(row.updates)
      ? row.updates.map((up: any) => ({
          id: String(up.id),
          date: String(up.date || up.createdAt || new Date().toISOString()),
          author: String(up.author || up.authorName || 'Tim'),
          text: String(up.text),
        }))
      : [],
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.maintenance.list().then(data => {
      if (!cancelled) {
        const normalized = (data as any[]).map(normalizeItem)
        setItems(normalized)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const changeRequestStatus = async (reqId: string, newStatus: MaintenanceStatus) => {
    setSaving(true)
    try {
      const dbStatusMap: Record<MaintenanceStatus, 'pending' | 'in_progress' | 'resolved'> = {
        'Pending': 'pending',
        'In Progress': 'in_progress',
        'Resolved': 'resolved',
      }
      const updatedRaw = await api.maintenance.updateStatus(reqId, {
        status: dbStatusMap[newStatus],
        noteText: `Status diperbarui menjadi ${newStatus}.`,
        repairCost: undefined,
      })
      const updated = normalizeItem(updatedRaw)
      const next = items.map(item => (item.id === reqId ? updated : item))
      setItems(next)
      setSelectedRequest(updated)
    } finally {
      setSaving(false)
    }
  }

  const handleAddMaintenanceUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !maintenanceNoteText.trim() || saving) return
    setSaving(true)
    try {
      const created = (await api.maintenance.addUpdate(selectedRequest.id, maintenanceNoteText)) as any
      const updated: MaintenanceItem = {
        ...selectedRequest,
        updates: [
          ...selectedRequest.updates,
          {
            id: String(created.id),
            date: String(created.createdAt || new Date().toISOString()),
            author: String(created.authorName || 'Pemilik Kost'),
            text: maintenanceNoteText,
          },
        ],
      }
      const next = items.map(item => (item.id === selectedRequest.id ? updated : item))
      setItems(next)
      setSelectedRequest(updated)
      setMaintenanceNoteText('')
    } finally {
      setSaving(false)
    }
  }

  const counts = useMemo(
    () => ({
      pending: items.filter(item => item.status === 'Pending').length,
      progress: items.filter(item => item.status === 'In Progress').length,
      resolved: items.filter(item => item.status === 'Resolved').length,
    }),
    [items],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  }

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Meja Keluhan Perbaikan</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Pantau, proses, dan tugaskan keluhan perbaikan dari penghuni kost.</p>
        </div>
      </div>

      {/* Kanban Board columns */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold"
      >
        {/* Column 1: Pending */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200">
            <span className="text-xs md:text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Diajukan / Pending
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              {counts.pending}
            </span>
          </div>

          <div className="space-y-3">
            {items.filter(item => item.status === 'Pending').map(req => (
              <motion.div
                key={req.id}
                variants={itemVariants}
                onClick={() => setSelectedRequest(req)}
                className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-blue-300 shadow-xs cursor-pointer transition hover:shadow-md"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span>{req.category}</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold ${req.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                    {req.priority === 'High' ? 'Urgent' : req.priority === 'Medium' ? 'Standar' : 'Ringan'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-1">{req.title}</h4>
                <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 mb-3 leading-relaxed">{req.description}</p>
                <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{req.tenantName} (Kamar {req.unitNumber})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200">
            <span className="text-xs md:text-sm text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin-slow" /> Sedang Diproses
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              {counts.progress}
            </span>
          </div>

          <div className="space-y-3">
            {items.filter(item => item.status === 'In Progress').map(req => (
              <motion.div
                key={req.id}
                variants={itemVariants}
                onClick={() => setSelectedRequest(req)}
                className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-blue-300 shadow-xs cursor-pointer transition hover:shadow-md"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span>{req.category}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">
                    {req.priority === 'High' ? 'Urgent' : req.priority === 'Medium' ? 'Standar' : 'Ringan'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-1">{req.title}</h4>
                <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 mb-3 leading-relaxed">{req.description}</p>
                <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{req.tenantName} (Kamar {req.unitNumber})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Column 3: Resolved */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200">
            <span className="text-xs md:text-sm text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Selesai / Resolved
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              {counts.resolved}
            </span>
          </div>

          <div className="space-y-3">
            {items.filter(item => item.status === 'Resolved').map(req => (
              <motion.div
                key={req.id}
                variants={itemVariants}
                onClick={() => setSelectedRequest(req)}
                className="border border-slate-200 rounded-2xl p-4 bg-slate-50 opacity-80 cursor-pointer hover:opacity-100 transition hover:shadow-xs"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span>{req.category}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    Selesai
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-1 line-through">{req.title}</h4>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mb-3 leading-relaxed">{req.description}</p>
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{req.tenantName} (Kamar {req.unitNumber})</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Pop up details sheet */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden text-xs md:text-sm text-slate-700">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 font-bold">
              <span className="bg-blue-100 text-blue-700 text-[10px] px-2.5 py-0.5 rounded-md uppercase">{selectedRequest.category}</span>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[480px] overflow-y-auto font-semibold">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm md:text-base mb-1 leading-tight">{selectedRequest.title}</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Pelapor: {selectedRequest.tenantName} (Kamar {selectedRequest.unitNumber}) &middot; Properti: {selectedRequest.propertyName}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-600 leading-relaxed font-medium">
                <h5 className="font-bold text-slate-800 mb-1">Deskripsi Kerusakan:</h5>
                {selectedRequest.description}
              </div>

              {/* Status toggles */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-y border-slate-100 py-3 font-bold">
                <span className="text-slate-500">Prioritas: <strong className="text-rose-700">{selectedRequest.priority}</strong></span>
                <div className="flex gap-1.5">
                  <button
                    disabled={saving}
                    onClick={() => changeRequestStatus(selectedRequest.id, 'Pending')}
                    className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${selectedRequest.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 border hover:bg-slate-100'}`}
                  >
                    Pending
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => changeRequestStatus(selectedRequest.id, 'In Progress')}
                    className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${selectedRequest.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-50 border hover:bg-slate-100'}`}
                  >
                    Proses
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => changeRequestStatus(selectedRequest.id, 'Resolved')}
                    className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${selectedRequest.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50 border hover:bg-slate-100'}`}
                  >
                    Selesai
                  </button>
                </div>
              </div>

              {/* Operational timeline log */}
              <div className="space-y-3">
                <h5 className="font-extrabold text-slate-800 text-[10px] tracking-wider uppercase">LOG PEMELIHARAAN OPERASIONAL</h5>
                <div className="relative border-l border-slate-200 pl-4 space-y-3 font-semibold text-xs">
                  {selectedRequest.updates.map((up) => (
                    <div key={up.id} className="relative">
                      <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 bg-slate-200 rounded-full border border-white"></div>
                      <div className="flex items-center gap-1.5 mb-0.5 text-slate-400 text-[10px] font-semibold">
                        <strong>{up.author}</strong>
                        <span>&middot;</span>
                        <span>{new Date(up.date).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 font-medium">{up.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form updating log */}
              <form onSubmit={handleAddMaintenanceUpdate} className="space-y-2 pt-2 border-t border-slate-150">
                <label className="text-xs font-bold text-slate-600">Posting Pembaruan Log Teknisi *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Menjadwalkan teknisi pipa besok jam 10 pagi."
                    className="flex-1 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 bg-slate-50 focus:bg-white font-semibold"
                    value={maintenanceNoteText}
                    onChange={e => setMaintenanceNoteText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 rounded-xl transition shrink-0 cursor-pointer disabled:opacity-70"
                  >
                    Kirim Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
