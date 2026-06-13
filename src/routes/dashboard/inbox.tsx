import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Inbox,
  CheckCheck,
  Trash2,
  RefreshCw,
  Megaphone,
  MessageSquare,
  CreditCard,
  BarChart3,
  Mail,
  MailOpen,
  ChevronRight,
  User,
  Trash,
  Send,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { useQuery } from '~/lib/hooks'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'
import { api } from '~/lib/api'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { formatDate } from '~/lib/utils'

export const Route = createFileRoute('/dashboard/inbox')({
  component: InboxPage,
})

type InboxCategory = 'pengumuman' | 'chat' | 'pembayaran' | 'laporan' | 'lainnya'
type InboxPriority = 'normal' | 'penting'

interface InboxItem {
  id: string
  createdAt: string | Date
  updatedAt: string | Date
  userId: string
  propertyId: string | null
  senderId: string | null
  senderName: string
  recipientType: 'owner' | 'tenant'
  recipientPropertyId: string | null
  recipientTenantId: string | null
  subject: string
  body: string
  category: InboxCategory
  isRead: boolean
  readAt: string | Date | null
  priority: InboxPriority
  status: string
}

function getInitials(name?: string | null) {
  const source = name || 'Anonymous'
  const parts = source.split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.slice(0, 2).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function InboxPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeReadFilter, setActiveReadFilter] = useState<string>('all')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Real-time unread count
  const { data: inboxCountData, refetch: refetchCount } = useQuery({
    queryFn: () => api.inbox.count(),
  })
  
  // Inbox list query with dynamic cacheKey to react to filters immediately
  const { data: messages, loading, refetch: refetchList } = useQuery<InboxItem[]>({
    queryFn: async () => {
      const cat = activeCategory === 'all' ? undefined : activeCategory
      const isRead = activeReadFilter === 'all' ? undefined : (activeReadFilter === 'unread' ? false : true)
      return (await api.inbox.list({ category: cat, isRead })) as InboxItem[]
    },
    cacheKey: `inbox-list-${activeCategory}-${activeReadFilter}`,
    deps: [activeCategory, activeReadFilter],
  })

  const handleRefresh = async () => {
    await Promise.all([refetchList(), refetchCount()])
  }

  const handleMarkAllRead = async () => {
    setActionLoading(true)
    try {
      await api.inbox.markAllRead()
      await handleRefresh()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return // already read
    try {
      await api.inbox.markRead(id)
      await handleRefresh()
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return
    setActionLoading(true)
    try {
      await api.inbox.delete(id)
      if (selectedMessageId === id) {
        setSelectedMessageId(null)
      }
      await handleRefresh()
    } catch (err) {
      console.error('Failed to delete message:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const selectedMessage = messages?.find((msg) => msg.id === selectedMessageId)

  // Category Icons & Badges
  const getCategoryIcon = (cat: InboxCategory) => {
    switch (cat) {
      case 'pengumuman':
        return <Megaphone className="h-4 w-4" />
      case 'chat':
        return <MessageSquare className="h-4 w-4" />
      case 'pembayaran':
        return <CreditCard className="h-4 w-4" />
      case 'laporan':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <Inbox className="h-4 w-4" />
    }
  }

  const getCategoryColor = (cat: InboxCategory) => {
    switch (cat) {
      case 'pengumuman':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'chat':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pembayaran':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'laporan':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <DashboardBootstrap>
      <div className="space-y-6 flex flex-col h-auto md:h-[calc(100vh-8.5rem)]">
        {/* Top Header Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Inbox className="h-6 w-6 text-blue-600" />
              Inbox / Kotak Masuk
            </h1>
            <p className="text-sm text-slate-500">
              Pantau pemberitahuan terbaru, keluhan, pembayaran, dan informasi cabang.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2 h-9 border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={actionLoading || !messages || messages.length === 0}
              className="gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCheck className="h-4 w-4" />
              Tandai Semua Dibaca
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 bg-slate-50 p-2 rounded-2xl border border-slate-200/60">
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full md:w-auto"
          >
            <TabsList className="bg-transparent gap-1.5 p-0 grid grid-cols-6 h-auto w-full md:flex md:flex-row md:flex-nowrap md:w-auto md:h-10">
              <TabsTrigger value="all" className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm shrink-0 col-span-2 text-center justify-center w-full md:w-auto md:shrink">Semua</TabsTrigger>
              <TabsTrigger value="pengumuman" className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm shrink-0 col-span-2 text-center justify-center w-full md:w-auto md:shrink">Pengumuman</TabsTrigger>
              <TabsTrigger value="chat" className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm shrink-0 col-span-2 text-center justify-center w-full md:w-auto md:shrink">Chat</TabsTrigger>
              <TabsTrigger value="pembayaran" className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm shrink-0 col-span-3 text-center justify-center w-full md:w-auto md:shrink">Pembayaran</TabsTrigger>
              <TabsTrigger value="laporan" className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm shrink-0 col-span-3 text-center justify-center w-full md:w-auto md:shrink">Laporan</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold">Status:</span>
            <select
              value={activeReadFilter}
              onChange={(e) => setActiveReadFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="unread">Belum Dibaca</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>
        </div>

        {/* Split Pane View */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-visible md:overflow-hidden min-h-0">
          {/* Left Panel: List of Messages */}
          <div
            className={`flex-1 flex flex-col min-w-0 bg-white border border-slate-200/80 rounded-2xl overflow-visible md:overflow-hidden shadow-sm ${
              selectedMessageId ? 'hidden md:flex md:w-5/12 md:max-w-md shrink-0' : 'flex'
            }`}
          >
            <div className="flex-1 overflow-y-visible md:overflow-y-auto p-3 space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 border border-slate-100 rounded-xl animate-pulse space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-100 rounded w-24"></div>
                      <div className="h-4 bg-slate-100 rounded w-16"></div>
                    </div>
                    <div className="h-5 bg-slate-100 rounded w-40"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                  </div>
                ))
              ) : !messages || messages.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="inline-flex p-4 bg-slate-50 rounded-full text-slate-400">
                    <Inbox className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Inbox Kosong</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tidak ada pesan masuk yang memenuhi kriteria filter Anda saat ini.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelected = msg.id === selectedMessageId
                  const initials = getInitials(msg.senderName)
                  return (
                    <div
                      key={msg.id}
                      onClick={async () => {
                        setSelectedMessageId(msg.id)
                        await handleMarkRead(msg.id, msg.isRead)
                      }}
                      className={`group relative flex gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-150 select-none ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/45 shadow-sm'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Read status dot */}
                      {!msg.isRead && (
                        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                      )}

                      {/* Avatar Profile */}
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {initials}
                      </div>

                      {/* Summary text */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className={`text-xs truncate font-bold text-slate-700 ${!msg.isRead ? 'text-slate-900 font-extrabold' : ''}`}>
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <h4 className={`text-xs md:text-sm font-semibold truncate text-slate-900 ${!msg.isRead ? 'font-bold' : 'text-slate-700'}`}>
                          {msg.subject}
                        </h4>
                        <p className="text-xs text-slate-500 truncate leading-relaxed">
                          {msg.body}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 border capitalize ${getCategoryColor(msg.category)}`}>
                            {getCategoryIcon(msg.category)}
                            <span className="ml-1">{msg.category}</span>
                          </Badge>
                          {msg.priority === 'penting' && (
                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                              Penting
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Panel: Detail Message */}
          <div
            className={`flex-1 flex flex-col bg-white border border-slate-200/80 rounded-2xl overflow-visible md:overflow-hidden shadow-sm ${
              !selectedMessageId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedMessage ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0 bg-slate-50/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden gap-1 h-9 rounded-xl text-slate-600"
                    onClick={() => setSelectedMessageId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                  
                  <div className="flex items-center gap-1 ml-auto">
                    {/* Dynamic Reply Action */}
                    {selectedMessage.recipientTenantId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 h-9 rounded-xl border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50/40"
                        onClick={() => {
                          navigate({
                            to: '/dashboard/chat',
                            search: { tenantId: selectedMessage.recipientTenantId } as any
                          })
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Balas via Chat
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-rose-600 rounded-xl"
                      title="Hapus Pesan"
                      onClick={() => handleDelete(selectedMessage.id)}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="flex-1 overflow-y-visible md:overflow-y-auto p-6 space-y-6">
                  {/* Sender & Meta details */}
                  <div className="flex items-start justify-between gap-4 flex-wrap border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                        {getInitials(selectedMessage.senderName)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {selectedMessage.senderName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Role: {selectedMessage.recipientType === 'owner' ? 'Penghuni' : 'Pengelola'}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {formatDate(selectedMessage.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-xs px-2.5 py-1 border capitalize ${getCategoryColor(selectedMessage.category)}`}>
                        {getCategoryIcon(selectedMessage.category)}
                        <span className="ml-1.5">{selectedMessage.category}</span>
                      </Badge>
                      {selectedMessage.priority === 'penting' && (
                        <Badge variant="destructive" className="text-xs px-2.5 py-1 font-bold uppercase tracking-wider">
                          Penting
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Subject and Content */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {selectedMessage.subject}
                    </h2>
                    
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedMessage.body}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                  <Mail className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Detail Pesan</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Pilih salah satu pesan dari panel kiri untuk membaca detail isi pesan serta melakukan tindakan balasan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardBootstrap>
  )
}
