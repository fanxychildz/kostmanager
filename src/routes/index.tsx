import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  ArrowRight,
  CheckCircle2,
  Shield,
  Smartphone,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { api } from '~/lib/api'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.auth.getSession()
      .then((session) => {
        if (!cancelled && session?.user) {
          navigate({ to: '/dashboard', replace: true })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (!ready) return null
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">KostManager</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#fitur" className="text-sm text-muted-foreground hover:text-foreground">Fitur</a>
            <a href="#cara-kerja" className="text-sm text-muted-foreground hover:text-foreground">Cara Kerja</a>
            <a href="#harga" className="text-sm text-muted-foreground hover:text-foreground">Harga</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Coba Gratis</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Platform #1 Manajemen Kost di Indonesia
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Kelola Kost & Kontrakan
            <br />
            <span className="text-primary">Tanpa Ribet</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Otomatisasi tagihan, pantau okupansi, dan kelola semua properti Anda dari satu dashboard. 
            Hemat waktu, tingkatkan pendapatan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/register">
                Mulai Gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/dashboard">Lihat Demo</Link>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: '500+', label: 'Pemilik Kost' },
              { value: '5.000+', label: 'Unit Dikelola' },
              { value: 'Rp 2M+', label: 'Tagihan/Bulan' },
              { value: '99.5%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fitur" className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Semua yang Anda Butuhkan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Fitur lengkap untuk mengelola bisnis kost dan kontrakan Anda secara profesional.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: 'Manajemen Properti', desc: 'Kelola banyak properti dengan banyak unit. Pantau status ketersediaan secara real-time.' },
              { icon: Users, title: 'Database Penghuni', desc: 'Simpan data KTP, kontak, pekerjaan, dan periode kontrak penghuni dengan aman.' },
              { icon: FileText, title: 'Tagihan Otomatis', desc: 'Generate tagihan bulanan otomatis: sewa + listrik + air + WiFi + kebersihan.' },
              { icon: CreditCard, title: 'Catat Pembayaran', desc: 'Catat pembayaran cash atau transfer bank langsung dari dashboard.' },
              { icon: Bell, title: 'Notifikasi Otomatis', desc: 'Kirim reminder tagihan dan konfirmasi pembayaran via email & in-app.' },
              { icon: BarChart3, title: 'Laporan & Export', desc: 'Laporan keuangan lengkap, export ke PDF dan Excel untuk analisis.' },
            ].map((feature) => (
              <Card key={feature.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Cara Kerja</h2>
            <p className="text-muted-foreground">Mulai kelola properti Anda dalam 4 langkah mudah.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Daftar Akun', desc: 'Buat akun gratis dengan email. Hanya 1 menit.' },
              { step: '2', title: 'Tambah Properti', desc: 'Input data properti dan unit-unit kamar Anda.' },
              { step: '3', title: 'Tambah Penghuni', desc: 'Catat data penghuni dan periode kontraknya.' },
              { step: '4', title: 'Kelola & Pantau', desc: 'Tagihan otomatis, pembayaran tercatat, laporan tersedia.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="harga" className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Harga Transparan</h2>
            <p className="text-muted-foreground">Pilih paket yang sesuai kebutuhan Anda.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Gratis',
                price: 'Rp 0',
                period: '/selamanya',
                desc: 'Untuk pemilik kost kecil',
                features: ['Hingga 10 unit', 'Tagihan otomatis', 'Catat pembayaran', 'Laporan dasar', 'Notifikasi email'],
                cta: 'Mulai Gratis',
                popular: false,
              },
              {
                name: 'Pro',
                price: 'Rp 99.000',
                period: '/bulan',
                desc: 'Untuk pengelola aktif',
                features: ['Hingga 100 unit', 'Semua fitur Gratis', 'Export PDF & Excel', 'Portal penghuni', 'Prioritas support'],
                cta: 'Coba 14 Hari Gratis',
                popular: true,
              },
              {
                name: 'Bisnis',
                price: 'Rp 249.000',
                period: '/bulan',
                desc: 'Untuk bisnis properti besar',
                features: ['Unit unlimited', 'Semua fitur Pro', 'Multi-manajer', 'API access', 'Dedicated support'],
                cta: 'Hubungi Kami',
                popular: false,
              },
            ].map((plan) => (
              <Card key={plan.name} className={plan.popular ? 'border-primary shadow-lg relative' : ''}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Paling Populer</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <Button className="w-full mb-6" variant={plan.popular ? 'default' : 'outline'} asChild>
                    <Link to="/register">{plan.cta}</Link>
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Apakah benar-benar gratis?', a: 'Ya! Paket Gratis bisa digunakan selamanya untuk hingga 10 unit. Tidak perlu kartu kredit.' },
              { q: 'Bagaimana cara penghuni membayar?', a: 'Saat ini penghuni membayar langsung ke Anda (cash/transfer). Anda tinggal mencatatnya di dashboard. Integrasi payment gateway akan hadir di Phase 2.' },
              { q: 'Apakah data saya aman?', a: 'Tentu. Semua data terenkripsi saat transit dan saat diam. Kami mematuhi regulasi PSE Kominfo dan sedang dalam proses sertifikasi PDP.' },
              { q: 'Bisa diakses dari HP?', a: 'Ya, aplikasi kami fully responsive dan bisa diakses dari browser HP, tablet, maupun desktop.' },
              { q: 'Berapa lama setup awal?', a: 'Rata-rata pemilik kost bisa setup lengkap dalam 15-30 menit. Kami juga menyediakan wizard onboarding yang memandu langkah demi langkah.' },
            ].map((faq) => (
              <Card key={faq.q}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Siap Kelola Kost Lebih Baik?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Bergabung dengan 500+ pemilik kost yang sudah menggunakan KostManager.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/register">
              Mulai Sekarang — Gratis! <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="py-12 px-4 border-t">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-bold">KostManager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Platform manajemen kost & kontrakan #1 di Indonesia.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Produk</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#fitur" className="hover:text-foreground">Fitur</a></li>
              <li><a href="#harga" className="hover:text-foreground">Harga</a></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Perusahaan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">Karir</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Bantuan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Pusat Bantuan</a></li>
              <li><a href="#" className="hover:text-foreground">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-foreground">Syarat & Ketentuan</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          &copy; 2026 KostManager. Hak cipta dilindungi.
        </div>
      </footer>
    </div>
  )
}
