import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare, Sparkles, Send, Loader2, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

type Sender = 'owner' | 'tenant'

interface ChatMessage {
  id: string
  sender: Sender
  senderName: string
  message: string
  read: boolean
  timestamp: string
}

export const Route = createFileRoute('/dashboard/chat')({
  component: ChatPage,
})

function ChatPage() {
  const { data: tenants, loading: loadingTenants } = useQuery({ queryFn: () => api.tenants.list() })
  const { data: allMessages, refetch: refetchSummaries } = useQuery<any[]>({ queryFn: () => api.chat.listConversations() })
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants?.[0]?.id ?? '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInputText, setChatInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTenant = tenants?.find((t: any) => t.id === selectedTenantId)
  const currentTenantLabel = selectedTenant ? `${selectedTenant.fullName} (${selectedTenant.phone})` : ''

  useEffect(() => {
    setIsBulkMode(false)
    setSelectedIds([])
  }, [selectedTenantId])

  const handleClearAllChat = async () => {
    if (!selectedTenantId) return
    if (!confirm('Apakah Anda yakin ingin menghapus seluruh riwayat obrolan dengan penghuni ini? Semua pesan akan dihapus secara permanen untuk kedua pihak.')) return
    setSending(true)
    try {
      await api.chat.clearConversation({ tenantId: selectedTenantId })
      setMessages([])
      refetchSummaries()
    } catch (err) {
      alert('Gagal membersihkan obrolan: ' + err)
    } finally {
      setSending(false)
    }
  }

  const handleBulkDeleteChats = async () => {
    if (!selectedTenantId || selectedIds.length === 0) return
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} pesan terpilih secara permanen?`)) return
    setSending(true)
    try {
      await api.chat.deleteMessages({ ids: selectedIds, tenantId: selectedTenantId })
      const next = messages.filter(m => !selectedIds.includes(m.id))
      setMessages(next)
      setSelectedIds([])
      setIsBulkMode(false)
      refetchSummaries()
    } catch (err) {
      alert('Gagal menghapus pesan terpilih: ' + err)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (tenants?.length) {
      setSelectedTenantId((current) => current || tenants[0].id)
    }
  }, [tenants])

  const loadMessages = async (tenantId: string) => {
    const data = await api.chat.listMessages({ tenantId });
    const normalized = (data as any[]).map((item) => ({
      ...item,
      sender: item.sender === 'Landlord' ? 'owner' : 'tenant',
      timestamp: item.createdAt instanceof Date ? item.createdAt.toISOString() : (item.createdAt || item.timestamp),
    }))
    setMessages(normalized as ChatMessage[])
    await api.chat.markRead({ tenantId })
    refetchSummaries()
  }

  useEffect(() => {
    if (selectedTenantId) {
      loadMessages(selectedTenantId)
    }
  }, [selectedTenantId])

  const prevTenantIdRef = useRef(selectedTenantId)
  const prevMessagesLengthRef = useRef(0)

  useEffect(() => {
    const isNewTenant = selectedTenantId !== prevTenantIdRef.current
    const hasNewMessages = messages.length > prevMessagesLengthRef.current

    if (isNewTenant || hasNewMessages) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    }

    prevTenantIdRef.current = selectedTenantId
    prevMessagesLengthRef.current = messages.length
  }, [messages, selectedTenantId])

  // Polling for incoming chat messages
  useEffect(() => {
    if (!selectedTenantId) return

    const interval = setInterval(() => {
      loadMessages(selectedTenantId)
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedTenantId])

  const sendMessage = async (message: string, sender: Sender) => {
    if (!selectedTenantId || !message.trim()) return
    setSending(true)
    try {
      const saved = await api.chat.sendMessage({
        tenantId: selectedTenantId,
        message: message.trim(),
        sender: sender === 'owner' ? 'Landlord' : 'Tenant',
        senderName: 'Pemilik Kost',
      })
      const next = [...messages, { 
        ...saved, 
        sender: saved.sender === 'Landlord' ? 'owner' : 'tenant',
        timestamp: saved.createdAt instanceof Date ? saved.createdAt.toISOString() : (saved.createdAt || new Date().toISOString()) 
      } as ChatMessage]
      setMessages(next)
      setChatInputText('')
      inputRef.current?.focus()
      refetchSummaries()
    } finally {
      setSending(false)
    }
  }

  const unreadTotal = messages.filter((m) => m.sender === 'tenant' && !m.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Chat Penghuni</h1>
        <p className="text-xs text-slate-400 font-semibold">Balas pesan penghuni secara langsung. Pesan masuk otomatis ditandai sudah dibaca.</p>
      </div>

      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col md:flex-row min-h-[520px]">
        <div className="md:w-72 border-r border-slate-200 bg-slate-50/70">
          <div className="p-3 border-b border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Kontak</p>
          </div>
          <div className="overflow-y-auto max-h-[460px] divide-y divide-slate-100">
            {loadingTenants ? (
              <div className="p-4 text-xs text-slate-500 font-semibold">Memuat daftar penghuni...</div>
            ) : tenants?.length ? (
              tenants.map((tenant) => {
                const isSelected = selectedTenantId === tenant.id
                
                const tenantMessages = allMessages?.filter((m: any) => m.tenantId === tenant.id) || []
                const lastMessage = tenantMessages[0]
                const unreadCount = tenantMessages.filter((m: any) => m.sender === 'Tenant' && !m.read).length

                return (
                  <button
                    key={tenant.id}
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={`w-full text-left p-4 flex items-center justify-between transition border-l-3 ${
                      isSelected
                        ? 'bg-white border-blue-600 shadow-2xs'
                        : 'border-transparent hover:bg-slate-55'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-950 text-xs md:text-sm truncate">{tenant.fullName}</span>
                        {unreadCount > 0 && (
                          <span className="bg-blue-650 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 truncate">
                        Kamar {tenant.unitId ? 'Aktif' : '-'} · {tenant.phone}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-1 truncate">
                        {lastMessage ? lastMessage.message : 'Belum ada pesan'}
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-xs text-slate-500 font-semibold">Belum ada penghuni.</div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedTenantId ? (
            <>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 overflow-x-hidden bg-slate-50/40">
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Percakapan dengan Penghuni</p>
                  {currentTenantLabel && (
                    <p className="text-[11px] text-slate-500 font-medium">{currentTenantLabel}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsBulkMode(!isBulkMode)
                          setSelectedIds([])
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer border ${
                          isBulkMode
                            ? 'bg-slate-100 border-slate-350 text-slate-700 hover:bg-slate-200'
                            : 'bg-white border-slate-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {isBulkMode ? 'Selesai Memilih' : 'Pilih Chat'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllChat}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold border border-red-200 transition cursor-pointer"
                      >
                        Hapus Semua Chat
                      </button>
                    </div>
                  )}
                  {unreadTotal > 0 && !isBulkMode ? (
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                      {unreadTotal} pesan baru
                    </span>
                  ) : null}
                </div>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 font-semibold">Belum ada pesan.</p>
                ) : (
                  messages.map((msg) => {
                    const isSelected = selectedIds.includes(msg.id)
                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          if (isBulkMode) {
                            if (isSelected) {
                              setSelectedIds(selectedIds.filter(id => id !== msg.id))
                            } else {
                              setSelectedIds([...selectedIds, msg.id])
                            }
                          }
                        }}
                        className={`flex items-start gap-3 w-full transition duration-150 ${
                          isBulkMode ? 'cursor-pointer hover:bg-slate-55 p-1.5 rounded-2xl' : ''
                        }`}
                      >
                        {isBulkMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by outer click
                            className="mt-4 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                        )}
                        <div className={`flex-1 flex flex-col ${msg.sender === 'owner' ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1 select-none">
                            <span className="text-[10px] text-slate-400 font-semibold">{msg.senderName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div
                            className={`px-3 py-2 rounded-2xl text-xs font-semibold shadow-xs transition ${
                              msg.sender === 'owner'
                                ? 'bg-slate-900 text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            } ${
                              isBulkMode && isSelected
                                ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50/20'
                                : ''
                            }`}
                          >
                            {msg.message.includes('[BUKTI_FOTO]:') ? (
                              <div className="space-y-2">
                                <div>{msg.message.split('[BUKTI_FOTO]:')[0].trim()}</div>
                                <img 
                                  src={msg.message.split('[BUKTI_FOTO]:')[1].trim()} 
                                  alt="Bukti Transfer" 
                                  className="max-w-xs max-h-60 rounded-xl object-contain border cursor-pointer hover:opacity-90 transition-opacity" 
                                  onClick={() => window.open(msg.message.split('[BUKTI_FOTO]:')[1].trim(), '_blank')}
                                />
                              </div>
                            ) : (
                              msg.message
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {isBulkMode ? (
                <div className="p-3 border-t border-slate-200 bg-slate-900 text-white flex items-center justify-between gap-4 rounded-b-2xl">
                  <div className="text-xs font-bold pl-2">
                    <span className="text-blue-400">{selectedIds.length}</span> dari <span className="text-slate-300">{messages.length}</span> pesan terpilih
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedIds.length === messages.length) {
                          setSelectedIds([])
                        } else {
                          setSelectedIds(messages.map(m => m.id))
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-slate-750"
                    >
                      {selectedIds.length === messages.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                    <button
                      type="button"
                      disabled={selectedIds.length === 0 || sending}
                      onClick={handleBulkDeleteChats}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800/45 disabled:text-red-300/60 disabled:cursor-not-allowed rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Hapus Terpilih'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkMode(false)
                        setSelectedIds([])
                      }}
                      className="px-3 py-1.5 text-slate-400 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!chatInputText.trim()) return
                    sendMessage(chatInputText, 'owner')
                  }}
                  className="p-3 border-t border-slate-200 flex gap-2"
                >
                  <input
                    ref={inputRef}
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    placeholder="Tulis balasan..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={sending || !chatInputText.trim()}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                  >
                    {sending ? 'Mengirim...' : 'Kirim'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-semibold">
              Pilih kontak terlebih dahulu
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPage