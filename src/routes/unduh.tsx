import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Download, ShieldCheck, Smartphone, Settings, Bell, MessageSquare, FileText, QrCode } from 'lucide-react'
import Footer from '~/components/landing/Footer'

export const Route = createFileRoute('/unduh')({
  component: UnduhPage,
})

function UnduhPage() {
  return (
    <div className="relative min-h-screen bg-[#fafbfd] text-slate-900 select-none antialiased flex flex-col justify-between">
      {/* Standalone Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md shadow-sm border-b border-slate-100 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img src="/logo-horizontal.png?v=7" alt="KeKost" className="h-9 md:h-10 w-auto object-contain" />
          </Link>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold text-slate-650 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
            <Link 
              to="/login"
              className="bg-blue-650 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs"
            >
              Masuk Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-blue-50/50 via-white to-[#fafbfd]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Text Callouts */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  <Smartphone className="h-3.5 w-3.5" />
                  Aplikasi Mobile Android
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  KeKost Sekarang Ada di Handphone Anda!
                </h1>
                
                <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                  Unduh aplikasi resmi KeKost untuk Android. Kelola kamar kost, pantau status tagihan pembayaran, kirim pengumuman, dan lakukan chat interaktif dengan penghuni lebih cepat dan mudah langsung dari genggaman.
                </p>

                {/* Download Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
                  <a 
                    href="/KeKost.apk?v=3" 
                    download
                    className="bg-slate-900 hover:bg-slate-950 text-white font-bold text-sm px-6 py-4 rounded-2xl flex items-center justify-center gap-2.5 transition shadow-md hover:shadow-lg group"
                  >
                    <Download className="h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
                    Unduh APK Sekarang
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">Android APK</span>
                  </a>
                  
                  <div className="flex items-center gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                    <QrCode className="h-10 w-10 text-slate-700 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-none">Scan untuk Unduh</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Arahkan kamera HP ke layar untuk mengunduh</p>
                    </div>
                  </div>
                </div>

                {/* Safety Badge */}
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold pt-1">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  Bebas Virus & Aman Terverifikasi (Play Protect Compatible)
                </div>
              </div>

              {/* Visual Mockup & QR Code details */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-72 h-[560px] bg-slate-900 rounded-[40px] shadow-2xl border-4 border-slate-800 p-2.5 flex flex-col justify-between overflow-hidden">
                  {/* Phone Speaker Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
                  </div>

                  {/* App Screen Mockup */}
                  <div className="flex-1 bg-white rounded-[32px] overflow-hidden flex flex-col relative z-10 pt-6">
                    {/* Mock App Header */}
                    <div className="bg-slate-950 px-4 py-3 flex items-center justify-between">
                      <img src="/logo-horizontal-white.png?v=7" alt="KeKost" className="h-5 w-auto object-contain" />
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>

                    {/* Mock Content */}
                    <div className="p-4 space-y-4 flex-1 overflow-hidden select-none">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold">Halo Pengelola</span>
                          <h4 className="text-xs font-bold text-slate-850 leading-none">KeKost Administrator</h4>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center font-black text-xs text-blue-600">KA</div>
                      </div>

                      {/* Mock Card */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3.5 rounded-2xl text-white space-y-3 shadow-sm">
                        <div className="flex justify-between items-center text-[10px] opacity-85 font-semibold">
                          <span>Total Unit Kost</span>
                          <span>Bulan Juni</span>
                        </div>
                        <h3 className="text-lg font-black tracking-tight">2 Unit Aktif</h3>
                        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full w-4/5 bg-white rounded-full"></div>
                        </div>
                      </div>

                      {/* Mock Notification Badge */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Bell className="h-3.5 w-3.5 text-blue-600" />
                          1 Pembayaran Pending
                        </span>
                        <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-md">Verifikasi</span>
                      </div>

                      {/* Mock Chat Preview */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                          Chat Baru: Budi Kamar 02
                        </span>
                        <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Installation Guide Section */}
        <section className="py-16 bg-white border-y border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Cara Menginstal Aplikasi (APK) di Android
              </h2>
              <p className="text-xs md:text-sm text-slate-550 max-w-lg mx-auto font-semibold">
                Ikuti langkah mudah berikut untuk memasang aplikasi KeKost di handphone Anda dengan cepat.
              </p>
            </div>

            <div className="mt-12 space-y-6">
              {[
                {
                  step: "1",
                  title: "Unduh Berkas APK",
                  desc: "Klik tombol 'Unduh APK Sekarang' di bagian atas halaman ini menggunakan browser handphone Android Anda."
                },
                {
                  step: "2",
                  title: "Buka Berkas Unduhan",
                  desc: "Setelah unduhan selesai, klik notifikasi berhasil unduh atau buka folder 'Unduhan/Downloads' di HP Anda dan ketuk berkas 'KeKost.apk'."
                },
                {
                  step: "3",
                  title: "Izinkan Sumber Tidak Dikenal",
                  desc: "Jika sistem Android Anda memunculkan peringatan keamanan, klik 'Pengaturan/Settings' dan centang 'Izinkan dari sumber ini' (Allow from this source)."
                },
                {
                  step: "4",
                  title: "Selesaikan Instalasi",
                  desc: "Kembali ke jendela instalasi dan klik 'Instal/Install'. Buka aplikasi setelah selesai, lalu masuk menggunakan akun KeKost Anda."
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                  <span className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                    {item.step}
                  </span>
                  <div className="text-left space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Highlights */}
        <section className="py-16 bg-[#fafbfd]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Fitur Unggulan KeKost Mobile
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-semibold">
                Rasakan kemudahan mengelola sewa kost langsung di genggaman Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Bell className="h-6 w-6 text-blue-600" />,
                  title: "Notifikasi Real-time",
                  desc: "Terima notifikasi instan langsung di handphone saat penyewa mengunggah bukti pembayaran, mengirim chat, atau mengajukan komplain perbaikan."
                },
                {
                  icon: <MessageSquare className="h-6 w-6 text-emerald-600" />,
                  title: "Chat & Komunikasi Lancar",
                  desc: "Komunikasi dua arah terintegrasi langsung antara Anda dan penghuni kost tanpa perlu membuka WhatsApp atau menyimpan nomor telepon."
                },
                {
                  icon: <FileText className="h-6 w-6 text-indigo-600" />,
                  title: "Pemantauan Keuangan Cepat",
                  desc: "Lihat status jatuh tempo tagihan, buat tagihan baru, dan lakukan konfirmasi pembayaran bukti transfer dari mana saja secara mobile."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200/60 p-6 rounded-2xl text-left space-y-4 shadow-xs">
                  <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-550 leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
