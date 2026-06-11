import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Megaphone,
  Loader2,
  PlusCircle,
  Pencil,
  Trash2,
  ArrowRight,
  Users,
  Building2,
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'
import { selectCache } from './_cache'

export const Route = createFileRoute('/dashboard/announcements')({
  component: AnnouncementsPage,
})

type FormState = {
  propertyId: string
  title: string
  body: string
  channel: 'owner' | 'tenant' | 'all'
  audience: 'all' | 'property' | 'unit' | 'tenant'
  targetTenantId?: string
}



const initialForm: FormState = {
  propertyId: '',
  title: '',
  body: '',
  channel: 'all',
  audience: 'property',
  targetTenantId: '',
}

function AnnouncementsPage() {
  const { data: properties, loading } = selectCache.properties(() => api.properties.list())
  const { data: announcements, refetch } = useQuery<any>({
    queryFn: () => api.announcements.list(),
  })

  const [form, setForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)

  const propertyId = form.propertyId || properties?.[0]?.id
  const list = Array.isArray(announcements)
    ? announcements
    : announcements?.items || []
  const visible = propertyId ? list.filter((a: any) => a.propertyId === propertyId) : []

  const resetForm = () => setForm({ ...initialForm, propertyId: propertyId || '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) return
    setSaving(true)
    try {
      await api.announcements.create({
        propertyId,
        title: form.title,
        body: form.body,
        channel: form.channel,
        audience: form.audience,
        targetTenantId: form.targetTenantId || null,
      })
      resetForm()
      refetch()
    } catch (err) {
      alert('Gagal mempublikasikan pengumuman: ' + err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengumuman ini?')) return
    await api.announcements.delete(id)
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Papan Pengumuman</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Kelola pengumuman properti yang dikirim ke owner/tenant.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border border-slate-200 rounded-2xl bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 p-5">
            <CardTitle className="text-sm font-extrabold text-slate-900">Buat Pengumuman</CardTitle>
            <CardDescription className="text-xs">Isi detail pengumuman.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Properti</label>
                <Select value={propertyId} onValueChange={(value) => setForm({ ...form, propertyId: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih properti" />
                  </SelectTrigger>
                  <SelectContent>
                    {(properties || []).map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Judul</label>
                <Input
                  className="rounded-xl"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Judul pengumuman"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Isi</label>
                <Textarea
                  className="rounded-xl"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Tulis pengumuman..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Saluran</label>
                  <Select value={form.channel} onValueChange={(value: any) => setForm({ ...form, channel: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="tenant">Penghuni</SelectItem>
                      <SelectItem value="owner">Pemilik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Penerima</label>
                  <Select value={form.audience} onValueChange={(value: any) => setForm({ ...form, audience: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="property">Per Properti</SelectItem>
                      <SelectItem value="tenant">Per Penghuni</SelectItem>
                      <SelectItem value="unit">Per Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving || !propertyId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold py-2.5 transition cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Publikasikan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-slate-200 rounded-2xl bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 p-5">
            <CardTitle className="text-sm font-extrabold text-slate-900">Daftar Pengumuman</CardTitle>
            <CardDescription className="text-xs">Pengumuman yang pernah dibuat untuk properti ini.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : visible.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                Belum ada pengumuman untuk properti ini.
              </div>
            ) : (
              <div className="space-y-3">
                {visible.map((ann: any) => (
                  <div
                    key={ann.id}
                    className="border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Pengumuman</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{formatDate(ann.createdAt)}</span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 leading-tight">{ann.title}</p>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{ann.body}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-rose-600 rounded-lg cursor-pointer"
                          onClick={() => handleDelete(ann.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                      <Badge variant="outline" className="rounded-md">
                        {ann.channel === 'all' ? ' owner + tenant ' : ann.channel}
                      </Badge>
                      <Badge variant="outline" className="rounded-md">
                        <Building2 className="mr-1 h-3 w-3" />
                        Property
                      </Badge>
                      <span className="ml-auto text-[10px] text-slate-400">ID: {ann.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
