import { motion } from "motion/react";
import { 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Smile 
} from "lucide-react";

export default function Benefits() {
  const benefitsList = [
    {
      title: "Hemat Waktu Hingga 80%",
      description: "Otomatisasi pengiriman invoice sewa dan pengingat tanggal jatuh tempo otomatis via WhatsApp menghemat waktu Anda secara drastis dari menagih manual.",
      icon: Clock,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      accent: "hover:border-blue-300 hover:shadow-blue-500/5"
    },
    {
      title: "Nol Kebocoran Keuangan",
      description: "Pencatatan meteran listrik/air, WiFi, denda keterlambatan, dan riwayat pembayaran tercatat transparan, mencegah manipulasi atau kelalaian pencatatan.",
      icon: ShieldCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      accent: "hover:border-emerald-300 hover:shadow-emerald-500/5"
    },
    {
      title: "Okupansi Kamar Maksimal",
      description: "Analisis grafik hunian real-time dan ketersediaan unit yang intuitif membantu Anda mengambil keputusan harga sewa terbaik serta meminimalkan kamar kosong.",
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      accent: "hover:border-indigo-300 hover:shadow-indigo-500/5"
    },
    {
      title: "Kepuasan Penghuni Meningkat",
      description: "Portal khusus penghuni mempermudah proses pembayaran sewa, melacak status keluhan perbaikan unit, dan berdiskusi langsung dengan Anda via chat.",
      icon: Smile,
      color: "text-rose-600 bg-rose-50 border-rose-100",
      accent: "hover:border-rose-300 hover:shadow-rose-500/5"
    }
  ];

  return (
    <section id="manfaat" className="py-20 bg-slate-50 relative overflow-hidden border-t border-slate-100">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-radial from-slate-100/50 via-slate-50 to-slate-50 -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full inline-block mb-3">
            Mengapa KostManager?
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            Mengapa Pemilik Kost Memilih Kami?
          </h2>
          <p className="text-slate-600 font-medium text-base md:text-lg">
            Lebih dari sekadar aplikasi pencatatan sewa biasa. Kami menghadirkan solusi operasional lengkap untuk melipatgandakan keuntungan dan efisiensi bisnis properti Anda.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {benefitsList.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-xs hover:shadow-lg transition-all duration-300 flex items-start gap-5 ${benefit.accent}`}
              >
                <div className={`p-4 rounded-2xl border shrink-0 ${benefit.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
