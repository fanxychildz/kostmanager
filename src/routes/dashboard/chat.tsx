import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare, Sparkles, Send, Loader2, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/chat')({
  component: LandlordChatPage,
})

interface LocalChatMessage {
  id: string
  sender: 'Tenant' | 'Landlord'
  senderName: string
  tenantId: string
  message: string
  timestamp: string
  read: boolean
}

// Client-side dynamic AI suggestion writing assistant (heuristic engine in Indonesian)
function generateAISuggestion(messages: LocalChatMessage[], respondent: 'Tenant' | 'Landlord', tenantName: string) {
  if (messages.length === 0) {
    return respondent === 'Tenant' 
      ? `Halo Pak/Bu, saya ingin menginfokan mengenai sewa unit saya.`
      : `Halo ${tenantName}, ada yang bisa saya bantu hari ini?`
  }

  const lastMsg = messages[messages.length - 1]
  const text = lastMsg.message.toLowerCase()

  if (respondent === 'Landlord') {
    if (text.includes('bayar') || text.includes('sewa') || text.includes('tagihan') || text.includes('transfer')) {
      return `Halo ${tenantName}, baik pembayaran sewa Anda sudah saya terima dan verifikasi di mutasi bank. Terima kasih ya.`
    }
    if (text.includes('rusak') || text.includes('bocok') || text.includes('bocor') || text.includes('mati') || text.includes('perbaiki')) {
      return `Halo ${tenantName}, laporan kerusakannya sudah saya terima. Saya akan kirim teknisi untuk memeriksa kondisinya besok pagi jam 10.`
    }
    if (text.includes('halo') || text.includes('pagi') || text.includes('siang') || text.includes('sore')) {
      return `Halo juga ${tenantName}, ada yang bisa saya bantu terkait unit sewa Anda?`
    }
    return `Baik, terima kasih atas informasinya. Akan segera kami tindak lanjuti.`
  }
  return `Baik Pak/Bu, terima kasih banyak atas responnya.`
}

function LandlordChatPage() {
  const { data: tenants, loading: loadingTenants } = useQuery({ queryFn: () => api.tenants.list() })
  
  const [messages, setMessages] = useState<LocalChatMessage[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [chatInputText, setChatInputText] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [isSuggestingAI, setIsSuggestingAI] = useState(false)

  // Load messages from localStorage
  useEffect(() => {
    const storedMsgs = localStorage.getItem('km_messages')
    if (storedMsgs) {
      setMessages(JSON.parse(storedMsgs))
    }
  }, [])

  // Auto-select first tenant when tenants load
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id)
    }
  }, [tenants, selectedTenantId])

  const saveMessages = (data: LocalChatMessage[]) => {
    setMessages(data)
    localStorage.setItem('km_messages', JSON.stringify(data))
  }

  const sendLandlordMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInputText.trim() || !selectedTenantId) return

    const newMessage: LocalChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Landlord',
      senderName: 'Pemilik Kost',
      tenantId: selectedTenantId,
      message: chatInputText,
      timestamp: new Date().toISOString(),
      read: true
    }

    const updated = [...messages, newMessage]
    saveMessages(updated)
    setChatInputText('')
    setAiSuggestion('')
  }

  const triggerSmartAISuggestion = () => {
    setIsSuggestingAI(true)
    setTimeout(() => {
      const activeTenantName = tenants?.find((t: any) => t.id === selectedTenantId)?.fullName || 'Penghuni'
      const suggest = generateAISuggestion(chatThreadMessages, 'Landlord', activeTenantName)
      setAiSuggestion(suggest)
      setIsSuggestingAI(false)
    }, 400)
  }

  if (loadingTenants) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentTenant = tenants?.find((t: any) => t.id === selectedTenantId)
  const chatThreadMessages = messages.filter(m => m.tenantId === selectedTenantId)

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Chat Messenger</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">Komunikasi dua arah secara personal dengan penghuni kost Anda.</p>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left hand Sidebar: list of tenants */}
        <div className="md:w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Daftar Kontak Penghuni</span>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {!tenants || tenants.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-semibold">Belum ada penghuni kost terdaftar.</div>
            ) : (
              tenants.map((t: any) => {
                const isSelected = selectedTenantId === t.id
                const unreadCount = messages.filter(m => m.tenantId === t.id && !m.read && m.sender === 'Tenant').length
                
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTenantId(t.id)
                      setAiSuggestion('')
                      // Mark messages as read
                      const readMessages = messages.map(m => m.tenantId === t.id ? { ...m, read: true } : m)
                      saveMessages(readMessages)
                    }}
                    className={`w-full text-left p-4 flex items-center justify-between transition border-l-3 ${
                      isSelected 
                        ? 'bg-white border-blue-600 shadow-2xs' 
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-950 block text-xs md:text-sm">{t.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Kamar {t.unitId ? 'Aktif' : '-'} &middot; {t.phone}</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-blue-600 text-white rounded-full text-[9px] font-black h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right hand Content Panel: Chat details */}
        <div className="flex-1 flex flex-col bg-slate-50 justify-between">
          {currentTenant ? (
            <>
              {/* Header Profile Bar */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs uppercase">
                  {currentTenant.fullName.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs md:text-sm leading-none">{currentTenant.fullName}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Status Sewa Aktif &middot; Kontak: {currentTenant.email}</p>
                </div>
              </div>

              {/* Chat Thread logs */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[350px]">
                {chatThreadMessages.length === 0 ? (
                  <div className="text-center py-20 text-xs text-slate-400 font-semibold">Belum ada riwayat percakapan. Mulai percakapan pertama Anda.</div>
                ) : (
                  chatThreadMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'Landlord' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] text-slate-400 font-semibold">{msg.senderName}</span>
                        <span className="text-[8px] text-slate-350">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] shadow-xs leading-relaxed ${
                        msg.sender === 'Landlord' 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom input board & AI draft */}
              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                {/* Gemini smart draft */}
                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl">
                  <div className="flex items-center justify-between pb-1.5 font-bold">
                    <span className="text-[10px] text-blue-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      Gemini Smart Draft menulis balasan
                    </span>
                    <button
                      onClick={triggerSmartAISuggestion}
                      disabled={isSuggestingAI}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-2 py-1 rounded-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isSuggestingAI ? 'Drafting...' : 'Dapatkan Draf'}
                    </button>
                  </div>

                  {aiSuggestion && (
                    <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-blue-100 space-y-1.5 font-semibold">
                      <p className="leading-relaxed italic">"{aiSuggestion}"</p>
                      <button
                        onClick={() => {
                          setChatInputText(aiSuggestion)
                          setAiSuggestion('')
                        }}
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        Gunakan draf pesan ini
                      </button>
                    </div>
                  )}
                </div>

                {/* Form submit */}
                <form onSubmit={sendLandlordMessage} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-350 bg-slate-50 text-slate-800 font-semibold"
                    placeholder="Tulis balasan Anda..."
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 rounded-xl transition cursor-pointer"
                  >
                    Kirim
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 font-bold text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" /> Silakan pilih kontak penghuni di sebelah kiri untuk melihat pesan.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
