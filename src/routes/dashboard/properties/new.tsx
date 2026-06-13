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
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'

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
    image: '',
  })
  const [imageError, setImageError] = useState('')
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload')

  const { mutate: createProperty, loading, error } = useMutation({
    mutationFn: (data: typeof formData) => api.properties.create(data),
    onSuccess: () => {
      navigate({ to: '/dashboard/properties' })
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError('')
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setImageError('Ukuran file foto maksimal 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.type) return
    createProperty(formData)
  }

  return (
    <DashboardBootstrap>
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

            <div className="space-y-2 pt-2">
              <Label>Foto Properti (Kost / Kontrakan)</Label>
              <div className="flex gap-2 mb-2">
                <Button 
                  type="button" 
                  variant={imageSource === 'upload' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => { setImageSource('upload'); setFormData((prev) => ({ ...prev, image: '' })); setImageError(''); }}
                  className="text-xs rounded-xl"
                >
                  Unggah Berkas
                </Button>
                <Button 
                  type="button" 
                  variant={imageSource === 'url' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => { setImageSource('url'); setFormData((prev) => ({ ...prev, image: '' })); setImageError(''); }}
                  className="text-xs rounded-xl"
                >
                  Link URL Foto
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {formData.image ? (
                  <div className="relative w-44 h-28 rounded-xl overflow-hidden border bg-slate-50">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 text-[10px] font-bold px-2.5 transition border-0 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="w-44 h-28 bg-slate-50 border border-dashed border-slate-250 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Belum ada foto
                  </div>
                )}
                <div className="space-y-1 w-full sm:w-auto flex-1">
                  {imageSource === 'upload' ? (
                    <>
                      <Input type="file" accept="image/*" onChange={handleImageChange} className="w-auto text-xs" />
                      <p className="text-[10px] text-slate-400 font-medium">Format: JPG, PNG, WEBP. Maksimal 2MB.</p>
                    </>
                  ) : (
                    <>
                      <Input 
                        type="url" 
                        placeholder="Tempel link foto di sini (contoh: https://contoh.com/foto.jpg)" 
                        value={formData.image} 
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })} 
                        className="w-full text-xs max-w-md" 
                      />
                      <p className="text-[10px] text-slate-400 font-medium">Masukkan URL gambar publik langsung (URL berakhiran .jpg, .png, dsb).</p>
                    </>
                  )}
                  {imageError && <p className="text-xs text-destructive">{imageError}</p>}
                </div>
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
    </DashboardBootstrap>
  )
}
