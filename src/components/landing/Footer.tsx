import { Mail, MapPin, Shield, HelpCircle } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="bg-slate-955 text-slate-400 py-16 border-t border-slate-900 overflow-hidden bg-[#020617]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Upper footer split info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-900">
          
          {/* Col 1: Brand details (5 COLS) */}
          <div className="space-y-4 md:col-span-5 text-left">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center text-left group cursor-pointer border-0 bg-transparent p-0 hover:opacity-95 transition-opacity"
              id="footer-logo-btn"
            >
              <img src="/logo-horizontal-white.png?v=6" alt="KeKost" className="h-10 w-auto object-contain" />
            </button>
            
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm font-medium leading-relaxed">
              Platform pembantu manajemen operasional properti kost-kosan, kontrakan, wisma, dan sewa harian terbaik di Indonesia dengan keandalan otomasi invoice WhatsApp.
            </p>

            <div className="space-y-2 text-xs pt-2">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Jakarta Selatan, Daerah Khusus Ibukota Jakarta, Indonesia</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="w-4 h-4 text-slate-600 shrink-0" />
                <span>info@kekost.com</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation map links (3 COLS) */}
          <div className="space-y-4 md:col-span-3 text-left">
            <h5 className="font-black text-xs text-white uppercase tracking-widest">
              Akses Halaman
            </h5>
            <ul className="space-y-2.5 text-sm font-medium list-none p-0">
              <li>
                <button
                  onClick={() => handleScrollTo("fitur")}
                  className="hover:text-white transition-colors cursor-pointer text-xs border-0 bg-transparent text-slate-400 p-0 text-left"
                >
                  Daftar Fitur Unggulan
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo("cara-kerja")}
                  className="hover:text-white transition-colors cursor-pointer text-xs border-0 bg-transparent text-slate-400 p-0 text-left"
                >
                  Alur & Langkah Kerja
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Product plans & help (4 COLS) */}
          <div className="space-y-4 md:col-span-4 text-left">
            <h5 className="font-black text-xs text-white uppercase tracking-widest">
              Layanan & Legalitas
            </h5>
            <ul className="space-y-2.5 text-sm font-medium list-none p-0">
              <li>
                <button
                  onClick={() => handleScrollTo("harga")}
                  className="hover:text-white transition-colors cursor-pointer text-xs border-0 bg-transparent text-slate-400 p-0 text-left"
                >
                  Pilihan Harga & Lisensi Paket
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo("faq")}
                  className="hover:text-white transition-colors cursor-pointer text-xs border-0 bg-transparent text-slate-400 p-0 text-left"
                >
                  FAQ & Bantuan Pusat
                </button>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="w-4 h-4 text-slate-600" />
                <span>Terdaftar Resmi PSE Kominfo (Kemenkominfo)</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500">
                <HelpCircle className="w-4 h-4 text-slate-600" />
                <span>Sesuai Regulasi Hukum PDP Republik Indonesia</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Lower footer with legal copyright notes and BBI credit */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-550">
          <p>© {currentYear} KeKost SaaS Indonesia. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-slate-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-extrabold tracking-wider text-[9px]">
              100% KARYA ANAK BANGSA 🇮🇩
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
