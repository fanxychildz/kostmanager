import { motion } from "motion/react";
import { 
  Building2, 
  Users, 
  Receipt, 
  CreditCard, 
  BellRing, 
  FileSpreadsheet,
  ArrowRight
} from "lucide-react";
import { Feature } from "./types";

export default function Features() {
  const coreFeatures: Feature[] = [
    {
      id: "prop",
      title: "Manajemen Properti",
      description: "Kelola banyak properti dan lokasi di seluruh kota dengan manajemen unit multi-kamar yang intuitif. Pantau status okupansi, renovasi, dan ketersediaan secara langsung/real-time.",
      iconName: "Building2",
      color: "blue",
      badge: "Utama"
    },
    {
      id: "tenant",
      title: "Database Penghuni",
      description: "Simpan arsip digital KTP, kontak darurat, profesi, masa sewa berkala penghuni dengan aman. Hubungi langsung penghuni lewat satu klik saja.",
      iconName: "Users",
      color: "indigo"
    },
    {
      id: "billing",
      title: "Tagihan Otomatis",
      description: "Otomatis kalkulasikan tagihan bulanan secara presisi: sewa dasar + token listrik + air bersih + WiFi + kebersihan.",
      iconName: "Receipt",
      color: "amber",
      badge: "Paling Disukai"
    },
    {
      id: "payment",
      title: "Catat Pembayaran",
      description: "Rekap pembayaran tunai maupun konfirmasi transfer bank instan ke kas rekening. Bukti pembayaran terunggah rapi dan otomatis meng-update ketersediaan unit.",
      iconName: "CreditCard",
      color: "emerald"
    },
    {
      id: "notification",
      title: "Otomasi Pengingat & Notifikasi",
      description: "Kirim tagihan otomatis dan notifikasi jatuh tempo via WhatsApp pesan serta email broadcast terjadwal tanpa mengetik ulang pesan manual.",
      iconName: "BellRing",
      color: "rose"
    },
    {
      id: "report",
      title: "Laporan & Export Data",
      description: "Analisis keuangan usaha kos Anda: okupansi rata-rata bulanan, rekap tagihan tertunda, kas masuk-keluar, & export ke CSV/Excel.",
      iconName: "FileSpreadsheet",
      color: "sky"
    }
  ];

  const getIcon = (name: string, color: string) => {
    const iconClass = "w-6 h-6 transition-all duration-300";
    
    switch (name) {
      case "Building2":
        return <Building2 className={`${iconClass} text-blue-600`} />;
      case "Users":
        return <Users className={`${iconClass} text-indigo-600`} />;
      case "Receipt":
        return <Receipt className={`${iconClass} text-amber-600`} />;
      case "CreditCard":
        return <CreditCard className={`${iconClass} text-emerald-600`} />;
      case "BellRing":
        return <BellRing className={`${iconClass} text-rose-600`} />;
      case "FileSpreadsheet":
        return <FileSpreadsheet className={`${iconClass} text-sky-600`} />;
      default:
        return <Building2 className={`${iconClass} text-blue-600`} />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50 border-blue-100",
          hoverAccent: "group-hover:border-blue-300 group-hover:shadow-blue-500/5",
          iconBg: "bg-blue-50 border-blue-100",
        };
      case "indigo":
        return {
          bg: "bg-indigo-50 border-indigo-100",
          hoverAccent: "group-hover:border-indigo-300 group-hover:shadow-indigo-500/5",
          iconBg: "bg-indigo-50 border-indigo-100",
        };
      case "amber":
        return {
          bg: "bg-amber-50 border-amber-100",
          hoverAccent: "group-hover:border-amber-300 group-hover:shadow-amber-500/5",
          iconBg: "bg-amber-50 border-amber-100",
        };
      case "emerald":
        return {
          bg: "bg-emerald-50 border-emerald-100",
          hoverAccent: "group-hover:border-emerald-300 group-hover:shadow-emerald-500/5",
          iconBg: "bg-emerald-50 border-emerald-100",
        };
      case "rose":
        return {
          bg: "bg-rose-50 border-rose-100",
          hoverAccent: "group-hover:border-rose-300 group-hover:shadow-rose-500/5",
          iconBg: "bg-rose-50 border-rose-100",
        };
      case "sky":
        return {
          bg: "bg-sky-50 border-sky-100",
          hoverAccent: "group-hover:border-sky-300 group-hover:shadow-sky-500/5",
          iconBg: "bg-sky-50 border-sky-100",
        };
      default:
        return {
          bg: "bg-blue-50 border-blue-100",
          hoverAccent: "group-hover:border-blue-300 group-hover:shadow-blue-500/5",
          iconBg: "bg-blue-50 border-blue-100",
        };
    }
  };

  return (
    <section id="fitur" className="py-24 bg-white relative">
      <div className="absolute inset-0 bg-radial from-slate-50 via-white to-white -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full inline-block mb-3">
            Kelebihan Platform
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            Semua yang Anda Butuhkan
          </h2>
          <p className="text-slate-600 font-medium text-base md:text-lg">
            Sistem manajemen kost & kontrakan terlengkap untuk mengoperasikan bisnis properti Anda secara modern, profesional, dan serba otomatis.
          </p>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {coreFeatures.map((feature, idx) => {
            const styles = getColorClasses(feature.color);
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -6 }}
                className={`group bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 hover:border-slate-300/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${styles.hoverAccent}`}
                id={`feature-card-${feature.id}`}
              >
                <div className="space-y-4">
                  
                  {/* Top line with Icon and Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl border transition-colors duration-300 shrink-0 ${styles.iconBg}`}>
                      {getIcon(feature.iconName, feature.color)}
                    </div>
                    {feature.badge && (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-blue-50 text-blue-600 font-sans border border-blue-100 shrink-0">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  {/* Copy */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight group-hover:text-blue-600 transition-colors duration-200">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Learn more trigger link */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-all">
                  <span className="tracking-wide">Pelajari Lebih Lanjut</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
