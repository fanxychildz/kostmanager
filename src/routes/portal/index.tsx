import { createFileRoute } from '@tanstack/react-router'
import { 
  Home, FileText, Wrench, MessageSquare, CreditCard, Camera, Info, 
  Sparkles, CheckCircle2, AlertCircle, Clock, Send, Mail, Phone, Calendar, ArrowUpRight, HelpCircle, Loader2
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Progress } from '~/components/ui/progress'
import { formatRupiah, formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/portal/')({
  component: PortalDashboard,
})

type TenantTab = 'lease' | 'billing' | 'maintenance' | 'chat'

interface PortalProfile {
  tenant: {
    id: string
    fullName: string
    email: string
    phone: string
    checkInDate: string | Date
    checkOutDate?: string | Date | null
    depositAmount: number
    unitNumber?: string
    unitId?: string
    propertyId?: string
  } | null
  unit: {
    id: string
    unitNumber?: string
    priceMonthly?: number
  } | null
  property: {
    id: string
    name?: string
  } | null
}

interface PortalBill {
  id: string
  periodMonth: number
  periodYear: number
  totalAmount: number
  status: string
  dueDate: string | Date
}

type PortalMaintenanceRequest = {
  id: string
  tenantId: string
  propertyId: string
  title: string
  description: string
  category: string
  priority: string
  status: 'Pending' | 'In Progress' | 'Resolved'
  createdAt: string
  updates: Array<{ id: string; date: string; author: string; text: string }>
}

type PortalChatMessage = {
  id: string
  sender: 'Tenant' | 'Landlord'
  senderName: string
  tenantId: string
  message: string
  timestamp: string
  read: boolean
}

type PortalTab = 'lease' | 'billing' | 'maintenance' | 'chat'

// Client-side dynamic AI suggestion writing assistant (heuristic engine in Indonesian)
function generateAISuggestion(messages: PortalChatMessage[], respondent: 'Tenant', tenantName: string) {
  if (messages.length === 0) {
    return `Halo Pak/Bu, saya ingin menginfokan mengenai sewa unit saya.`
  }

  const lastMsg = messages[messages.length - 1]
  const text = lastMsg.message.toLowerCase()

  if (respondent === 'Tenant') {
    if (text.includes('bayar') || text.includes('sewa') || text.includes('tagihan')) {
      return `Halo Pak/Bu, baik sewanya sudah saya transfer ya. Bukti transfer juga sudah saya unggah di menu tagihan. Terima kasih.`
    }
    if (text.includes('rusak') || text.includes('bocor') || text.includes('mati') || text.includes('perbaiki')) {
      return `Baik Pak/Bu, terima kasih responnya. Saya tunggu kedatangan teknisinya untuk perbaikan.`
    }
    if (text.includes('halo') || text.includes('pagi') || text.includes('siang') || text.includes('sore')) {
      return `Halo juga Pak/Bu, saya ingin menanyakan perihal perpanjangan kontrak sewa kamar saya.`
    }
    return `Baik Pak/Bu, terima kasih banyak atas informasinya. Saya mengerti.`
  }
  return `Baik Pak/Bu, terima kasih banyak atas responnya.`
}

function PortalDashboard() {
  const [activeTab, setActiveTab] = useState<TenantTab>('lease')

  const {
    data: profile,
    loading: loadingProfile,
    refetch: refetchProfile,
  } = useQuery<PortalProfile>({ queryFn: () => api.portal.profile() })

  const {
    data: bills,
    loading: loadingBills,
    refetch: refetchBills,
  } = useQuery<PortalBill[]>({ queryFn: () => api.portal.bills() })

  const createRequest = async (data: {
    propertyId: string
    unitId: string
    title: string
    description: string
    category: string
    priority: string
    photoUrl?: string | null
  }) => api.portal.maintenance.create(data)

  const loadMaintenance = async (): Promise<PortalMaintenanceRequest[]> => {
    const all = await api.portal.maintenance.list()
    const tenantId = profile?.tenant?.id
    if (!tenantId) return []
    return all.filter((item: PortalMaintenanceRequest) => item.tenantId === tenantId)
  }

  const loadMessages = async (): Promise<PortalChatMessage[]> => {
    const tenantId = profile?.tenant?.id
    if (!tenantId) return []
    const list = await api.portal.chat.list({ tenantId })
    return (list as any[]).map((item) => ({
      ...item,
      timestamp: item.createdAt instanceof Date ? item.createdAt.toISOString() : (item.createdAt || item.timestamp || new Date().toISOString())
    })) as PortalChatMessage[]
  }
  const [maintenance, setMaintenance] = useState<PortalMaintenanceRequest[]>([])
  const [messages, setMessages] = useState<PortalChatMessage[]>([])

  const [payingBill, setPayingBill] = useState<PortalBill | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer')
  const [customReceiptUrl, setCustomReceiptUrl] = useState('')
  const [paymentMemo, setPaymentMemo] = useState('')

  const [showSubmitRequest, setShowSubmitRequest] = useState(false)
  const [newReqTitle, setNewReqTitle] = useState('')
  const [newReqCategory, setNewReqCategory] = useState('Plumbing')
  const [newReqPriority, setNewReqPriority] = useState('Medium')
  const [newReqDesc, setNewReqDesc] = useState('')

  const [chatText, setChatText] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [isSuggestingAI, setIsSuggestingAI] = useState(false)

  const tenant = profile?.tenant
  const unit = profile?.unit
  const property = profile?.property

  const chatListRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef(0)
  const prevActiveTabRef = useRef(activeTab)

  useEffect(() => {
    if (!tenant?.id) return
    let cancelled = false
    ;(async () => {
      const [maint, chat] = await Promise.all([loadMaintenance(), loadMessages()])
      if (cancelled) return
      setMaintenance(maint)
      setMessages(chat)
    })()
    return () => {
      cancelled = true
    }
  }, [tenant?.id])

  // Polling for incoming chat messages
  useEffect(() => {
    if (!tenant?.id || activeTab !== 'chat') return

    const interval = setInterval(async () => {
      const chat = await loadMessages()
      setMessages(chat)
    }, 5000)

    return () => clearInterval(interval)
  }, [tenant?.id, activeTab])

  // Auto-scroll chat container
  useEffect(() => {
    const isNewTab = activeTab === 'chat' && prevActiveTabRef.current !== 'chat'
    const hasNewMessages = messages.length > prevMessagesLengthRef.current

    if (isNewTab || (activeTab === 'chat' && hasNewMessages)) {
      setTimeout(() => {
        chatListRef.current?.scrollTo({ top: chatListRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    }

    prevMessagesLengthRef.current = messages.length
    prevActiveTabRef.current = activeTab
  }, [messages, activeTab])

  if (loadingProfile || loadingBills) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const allBills = bills ?? []
  const pendingBills = allBills.filter((b: PortalBill) => b.status !== 'paid')
  const myRequests = maintenance.filter((m) => m.tenantId === tenant?.id)
  const myMessages = messages.filter((m) => m.tenantId === tenant?.id)

  const pendingBillsCount = pendingBills.length
  const activeRequestsCount = myRequests.filter((m) => m.status !== 'Resolved').length

  // Lease Progress calculation
  let leasePercent = 0
  if (tenant?.checkInDate) {
    const start = new Date(tenant.checkInDate).getTime()
    const end = tenant.checkOutDate ? new Date(tenant.checkOutDate).getTime() : new Date().getTime() + 31536000000 // default 1 year ahead
    const now = new Date().getTime()
    const total = end - start
    const elapsed = now - start
    leasePercent = total > 0 ? Math.max(0, Math.min(100, Math.round((elapsed / total) * 100))) : 0
  }

  // Handle Payment proof submission (Mocked client-side overlay)
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingBill || !tenant?.id) return

    await api.portal.chat.sendMessage({
      tenantId: tenant.id,
      message: `🔔 PEMBERITAHUAN BAYAR: Saya telah mengirim bukti transfer untuk sewa periode ${payingBill.periodMonth}/${payingBill.periodYear} sebesar ${formatRupiah(payingBill.totalAmount)}. Metode: ${paymentMethod === 'bank_transfer' ? 'Transfer Bank' : paymentMethod === 'qris_manual' ? 'QRIS Manual' : 'Metode Lain'}.`,
      sender: 'Tenant',
      senderName: tenant.fullName || 'Penghuni',
    })

    const chat = await loadMessages()
    setMessages(chat)

    alert('Bukti pembayaran sewa Anda berhasil diunggah! Pemilik kost akan segera melakukan pengecekan mutasi bank dan mengubah status sewa Anda menjadi lunas.')
    setPayingBill(null)
    setCustomReceiptUrl('')
    setPaymentMemo('')
    refetchBills()
  }

  // Handle new repair ticket submission
  const handleMaintenanceRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReqTitle || !newReqDesc || !tenant?.id) return

    const newTicket: PortalMaintenanceRequest = {
      id: `ticket-${Date.now()}`,
      tenantId: tenant.id,
      propertyId: property?.id || '',
      title: newReqTitle,
      description: newReqDesc,
      category: newReqCategory,
      priority: newReqPriority,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updates: [
        {
          id: `update-${Date.now()}`,
          date: new Date().toISOString(),
          author: 'Penghuni',
          text: `Tiket keluhan berhasil dibuat. Pelapor: ${tenant.fullName}.`,
        },
      ],
    }

    const updatedMaintenance = await createRequest({
      propertyId: property?.id || '',
      unitId: unit?.id || '',
      title: newReqTitle,
      description: newReqDesc,
      category: newReqCategory,
      priority: newReqPriority,
      photoUrl: null,
    })

    const maint = await loadMaintenance()
    setMaintenance(maint)

    await api.portal.chat.sendMessage({
      tenantId: tenant.id,
      message: `🛠️ PEMBERITAHUAN PERBAIKAN: Saya membuka tiket perbaikan baru ("${newReqTitle}") kategori ${newReqCategory} dengan prioritas ${newReqPriority}.`,
      sender: 'Tenant',
      senderName: tenant.fullName,
    })

    const chat = await loadMessages()
    setMessages(chat)

    setNewReqTitle('')
    setNewReqDesc('')
    setShowSubmitRequest(false)
    refetchProfile()
  }

  // Smart Draft writer suggestion triggers
  const triggerAISuggestion = () => {
    setIsSuggestingAI(true)
    setTimeout(() => {
      const suggest = generateAISuggestion(myMessages, 'Tenant', tenant?.fullName || 'Penghuni')
      setAiSuggestion(suggest)
      setIsSuggestingAI(false)
    }, 400)
  }

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatText.trim() || !tenant?.id) return

    await api.portal.chat.sendMessage({
      tenantId: tenant.id,
      message: chatText.trim(),
      sender: 'Tenant',
      senderName: tenant.fullName,
    })

    const chat = await loadMessages()
    setMessages(chat)
    setChatText('')
    setAiSuggestion('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Profile details & Tabs selector */}
      <aside className="lg:col-span-1 space-y-5">
        {/* Profile details summary card */}
        <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 ring-2 ring-slate-850">
              <AvatarFallback className="text-sm bg-blue-100 text-slate-900 font-bold uppercase">
                {tenant?.fullName.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-bold text-sm tracking-tight text-white leading-none">{tenant?.fullName}</h4>
              <span className="text-[10px] text-blue-200 mt-1 block">Kamar {unit?.unitNumber || '-'}</span>
            </div>
          </div>

          <div className="border-t border-slate-800 py-3.5 space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>Properti:</span>
              <strong className="text-white">{property?.name || '-'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Sewa Bulanan:</span>
              <strong className="text-white">{formatRupiah(unit?.priceMonthly || 0)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Uang Jaminan:</span>
              <strong className="text-white">{formatRupiah(tenant?.depositAmount || 0)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Tagihan Belum Lunas:</span>
              <span className={`px-2 py-0.5 rounded font-black text-[10px] ${pendingBillsCount > 0 ? 'bg-red-500/20 text-red-300 animate-pulse' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {pendingBillsCount} Tagihan
              </span>
            </div>
          </div>
        </div>

        {/* Local tab selectors */}
        <nav className="flex flex-col gap-1.5 font-semibold">
          <button
            onClick={() => setActiveTab('lease')}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-xs md:text-sm transition-all cursor-pointer ${activeTab === 'lease' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Home className="w-4 h-4 shrink-0" /> Informasi Kontrak
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-xs md:text-sm transition-all cursor-pointer ${activeTab === 'billing' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <span className="flex items-center gap-3">
              <FileText className="w-4 h-4 shrink-0" /> Tagihan Sewa
            </span>
            {pendingBillsCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'billing' ? 'bg-white text-blue-600' : 'bg-amber-500 text-slate-900'}`}>{pendingBillsCount} Belum Lunas</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-xs md:text-sm transition-all cursor-pointer ${activeTab === 'maintenance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <span className="flex items-center gap-3">
              <Wrench className="w-4 h-4 shrink-0" /> Laporan Perbaikan
            </span>
            {activeRequestsCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'maintenance' ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'}`}>{activeRequestsCount}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-xs md:text-sm transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <span className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 shrink-0" /> Chat Pemilik Kost
            </span>
            <span className={`p-1 px-1.5 font-bold text-[10px] rounded-md flex items-center gap-1 ${activeTab === 'chat' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <Sparkles className="w-3 h-3 text-blue-600" /> AI Draft
            </span>
          </button>
        </nav>
      </aside>

      {/* Main Panel Content */}
      <main className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl min-h-[500px] overflow-hidden flex flex-col shadow-xs">
        <AnimatePresence mode="wait">
          {/* TAB A: MY LEASE */}
          {activeTab === 'lease' && (
            <motion.div 
              key="lease"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-6 flex-1 space-y-6"
            >
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">Perjanjian Kontrak Sewa Aktif</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Detail masa berlaku sewa dan aturan tata tertib hunian.</p>
              </div>

              {/* Progress of the tenure */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider">Durasi Kontrak Sewa</span>
                  <span className="text-slate-800">{leasePercent}% Berjalan</span>
                </div>
                <Progress value={leasePercent} className="h-2 rounded-full overflow-hidden bg-slate-200" />
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 font-medium block">Tanggal Masuk</span>
                    <strong className="text-slate-800">{tenant?.checkInDate ? formatDate(tenant.checkInDate) : '-'}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-medium block">Tanggal Berakhir</span>
                    <strong className="text-slate-800">{tenant?.checkOutDate ? formatDate(tenant.checkOutDate) : 'Selesai Sewa -'}</strong>
                  </div>
                </div>
              </div>

              {/* Contract Specifications Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 p-5 rounded-2xl text-xs space-y-3 bg-white">
                  <span className="font-extrabold text-slate-800 block text-sm">Tata Tertib Kost</span>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-500 font-medium">
                    <li>Jam malam tenang: 22.00 s/d 06.00 WIB</li>
                    <li>Pembuangan sampah: Selasa & Jumat pagi</li>
                    <li>Dilarang mengubah atau mengecat dinding kamar</li>
                    <li>Dilarang menyewakan kembali (sublet) unit sewa</li>
                  </ul>
                </div>

                <div className="border border-slate-200 p-5 rounded-2xl text-xs space-y-4 bg-slate-50/50">
                  <strong className="font-extrabold text-slate-800 block text-sm">Kontak Pengelola Kost</strong>
                  <div className="space-y-2.5 font-medium">
                    <div className="flex items-center gap-2 text-slate-650">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>support@kostmanager.net</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-650">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>+62 821-5555-0909</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="w-full bg-slate-900 text-white rounded-xl text-xs font-bold py-2 hover:bg-slate-800 transition block text-center cursor-pointer"
                  >
                    Hubungi Layanan Pengelola
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB B: BILLINGS & INVOICES */}
          {activeTab === 'billing' && (
            <motion.div 
              key="billing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-6 flex-1 space-y-6"
            >
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">Buku Riwayat Tagihan</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Lihat nominal tagihan bulanan dan unggah bukti transfer pembayaran.</p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                {allBills.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    Belum ada invoice tagihan bulanan yang diterbitkan untuk akun Anda.
                  </div>
                ) : (
                  allBills.map((bill: any) => {
                    const utility = bill.electricityAmount + bill.waterAmount + bill.wifiAmount + bill.otherAmount
                    return (
                      <div key={bill.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-semibold text-xs md:text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${bill.status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                            <CreditCard className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs md:text-sm">Tagihan Sewa Kamar {bill.periodMonth}/{bill.periodYear}</h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Jatuh Tempo: {formatDate(bill.dueDate)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right space-y-0.5">
                            <p className="font-extrabold text-slate-950 text-sm md:text-base">{formatRupiah(bill.totalAmount)}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">Sewa: {formatRupiah(bill.rentAmount)} + Utilitas: {formatRupiah(utility)}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              bill.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              bill.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {bill.status === 'paid' ? 'Lunas' :
                               bill.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Bayar'}
                            </span>

                            {bill.status !== 'paid' && (
                              <button
                                onClick={() => setPayingBill(bill)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] md:text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                              >
                                Bayar Sewa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* TAB C: MAINTENANCE ISSUES */}
          {activeTab === 'maintenance' && (
            <motion.div 
              key="maintenance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-6 flex-1 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">Pusat Bantuan & Perbaikan</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Ajukan keluhan kerusakan fasilitas kamar dan monitor pengerjaan.</p>
                </div>
                <button
                  onClick={() => setShowSubmitRequest(true)}
                  className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Wrench className="w-4 h-4" /> Lapor Kerusakan
                </button>
              </div>

              {/* List repair tickets */}
              <div className="space-y-4">
                {myRequests.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 border border-dashed rounded-2xl p-6 text-xs flex flex-col items-center justify-center gap-2">
                    <HelpCircle className="w-8 h-8 text-slate-300" />
                    <span>Fasilitas kamar Anda dalam kondisi baik. Belum ada keluhan perbaikan terdaftar.</span>
                  </div>
                ) : (
                  myRequests.map((req) => (
                    <div key={req.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3 font-semibold text-xs text-slate-750">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 uppercase tracking-wide font-bold">{req.category}</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                          req.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'Pending' ? 'Diajukan' :
                           req.status === 'In Progress' ? 'Diproses' : 'Selesai'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-xs md:text-sm">{req.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{req.description}</p>
                      </div>

                      <div className="border-t border-slate-200 pt-2 flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Diajukan: {new Date(req.createdAt).toLocaleDateString()}</span>
                        <span className="text-rose-650">{req.priority} Priority</span>
                      </div>

                      {/* Updates Timeline */}
                      {req.updates.length > 0 && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] space-y-1 leading-normal font-normal">
                          <strong className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Log Pemeliharaan Terbaru:</strong>
                          <p className="text-slate-600 font-medium">
                            <strong className="text-slate-900 font-bold">{req.updates[req.updates.length - 1].author}:</strong>{' '}
                            {req.updates[req.updates.length - 1].text}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB D: SECURE CHAT */}
          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col bg-slate-50 justify-between min-h-[450px]"
            >
              {/* Header Info */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs md:text-sm leading-none">Chat Pemilik Kost</h3>
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Messaging Active
                  </span>
                </div>
              </div>

              {/* Chat messages */}
              <div ref={chatListRef} className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[300px]">
                {myMessages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs font-semibold">Belum ada percakapan. Kirim pesan salam untuk menghubungi pemilik kost.</div>
                ) : (
                  myMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'Tenant' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[9px] text-slate-400 font-semibold">
                        <span>{msg.sender === 'Tenant' ? 'Saya' : 'Pemilik Kost'}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] shadow-xs leading-relaxed ${msg.sender === 'Tenant' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'}`}>
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Form & AI Draft Helper */}
              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                {/* AI Helper Widget */}
                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl">
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-[10px] text-blue-800 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      Gemini Smart Draft menulis pesan
                    </span>
                    <button
                      onClick={triggerAISuggestion}
                      disabled={isSuggestingAI}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-2 py-0.5 rounded transition cursor-pointer disabled:opacity-50"
                    >
                      {isSuggestingAI ? 'Drafting...' : 'Buat Draf Pesan'}
                    </button>
                  </div>

                  {aiSuggestion && (
                    <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-blue-100 space-y-1.5">
                      <p className="leading-relaxed italic font-semibold">"{aiSuggestion}"</p>
                      <button
                        onClick={() => {
                          setChatText(aiSuggestion)
                          setAiSuggestion('')
                        }}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        Gunakan draf pesan ini
                      </button>
                    </div>
                  )}
                </div>

                {/* Form input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-350 bg-slate-50 text-slate-800 font-semibold"
                    placeholder="Tulis pesan Anda..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 rounded-xl transition cursor-pointer"
                  >
                    Kirim
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* OVERLAY WINDOW MODALS */}
      {/* Modal 1: Payment proof upload */}
      {payingBill && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-xl overflow-hidden text-slate-700 font-semibold text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Unggah Bukti Transfer</h3>
              <button onClick={() => setPayingBill(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 border p-3.5 rounded-xl space-y-1.5 font-bold">
                <div className="flex justify-between">
                  <span>Tagihan Kamar:</span>
                  <strong className="text-slate-900">Periode {payingBill.periodMonth}/{payingBill.periodYear}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Bayar:</span>
                  <strong className="text-slate-900">{formatRupiah(payingBill.totalAmount)}</strong>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Pilih Metode Transfer</label>
                <select
                  required
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-800"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="bank_transfer">ACH/Transfer Bank Manual</option>
                  <option value="qris_manual">Pembayaran QRIS Manual</option>
                  <option value="cash">Pembayaran Tunai</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Bukti Transfer (Screenshot URL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  value={customReceiptUrl}
                  onChange={e => setCustomReceiptUrl(e.target.value)}
                />
                <span className="text-[9px] text-slate-400 block mt-1 font-medium">Anda dapat mengosongkan URL ini untuk simulasi pengiriman bukti transfer bank otomatis.</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Catatan Tambahan</label>
                <textarea
                  placeholder="Isi ID transaksi atau memo transfer bank..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs max-h-20 min-h-12"
                  value={paymentMemo}
                  onChange={e => setPaymentMemo(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer"
              >
                Kirim Bukti Pembayaran Ke Pemilik Kost
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Submit repair ticket */}
      {showSubmitRequest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-xl overflow-hidden text-slate-700 font-semibold text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Lapor Tiket Kerusakan</h3>
              <button onClick={() => setShowSubmitRequest(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleMaintenanceRequestSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Judul Masalah/Kerusakan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Stopkontak kamar mandi tidak menyala"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  value={newReqTitle}
                  onChange={e => setNewReqTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Kategori Masalah</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                    value={newReqCategory}
                    onChange={e => setNewReqCategory(e.target.value)}
                  >
                    <option value="Plumbing">Pipa/Air (Plumbing)</option>
                    <option value="Electrical">Kelistrikan (Electrical)</option>
                    <option value="HVAC">AC/Pendingin (HVAC)</option>
                    <option value="Appliances">Elektronik Kamar</option>
                    <option value="Structural">Dinding/Struktur</option>
                    <option value="Other">Masalah Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tingkat Darurat</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                    value={newReqPriority}
                    onChange={e => setNewReqPriority(e.target.value)}
                  >
                    <option value="Low">Low - Ringan</option>
                    <option value="Medium">Medium - Standar</option>
                    <option value="High">High - Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Deskripsi Kerusakan Detail *</label>
                <textarea
                  required
                  placeholder="Jelaskan kondisi kerusakan secara detail..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs max-h-24 min-h-20"
                  value={newReqDesc}
                  onChange={e => setNewReqDesc(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer"
              >
                Kirim Laporan Kerusakan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Small helper interface X button
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
