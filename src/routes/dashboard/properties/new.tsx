import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { api } from '~/lib/api'
import { useMutation } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/properties/new')({
  component: NewPropertyPage,
})

function NewPropertyPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    address: '',
    city: '',
    province: '',
  })

  const { mutate: createProperty, loading, error } = useMutation({
    mutationFn: (data: typeof formData) => api.properties.create(data),
    onSuccess: () => {
      navigate({ to: '/dashboard/properties' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.type) return
    createProperty(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/properties' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Properti Baru</h1>
          <p className="text-muted-foreground">Isi detail properti Anda</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Properti</CardTitle>
          <CardDescription>Masukkan informasi dasar tentang properti Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Properti</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Kost Melati"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Properti</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kost">Kost</SelectItem>
                    <SelectItem value="kontrakan">Kontrakan</SelectItem>
                    <SelectItem value="apartemen">Apartemen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Input
                id="address"
                placeholder="Jl. Contoh No. 123, RT/RW"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input
                  id="city"
                  placeholder="Contoh: Jakarta Selatan"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                <Select value={formData.province} onValueChange={(value) => setFormData({ ...formData, province: value })}>
                  <SelectTrigger><SelectValue placeholder="Pilih provinsi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DKI Jakarta">DKI Jakarta</SelectItem>
                    <SelectItem value="Jawa Barat">Jawa Barat</SelectItem>
                    <SelectItem value="Jawa Tengah">Jawa Tengah</SelectItem>
                    <SelectItem value="Jawa Timur">Jawa Timur</SelectItem>
                    <SelectItem value="Banten">Banten</SelectItem>
                    <SelectItem value="Bali">Bali</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Properti
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: '/dashboard/properties' })}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
