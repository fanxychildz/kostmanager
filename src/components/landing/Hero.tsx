import { motion, Variants } from "motion/react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

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
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-radial from-blue-50/70 via-slate-50 to-slate-50">
      {/* Decorative Grid Mesh & Ambient Flares (Very subtle, clean) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 -z-10" />
      
      {/* Soft blurred ambient glow circles */}
      <div className="absolute top-1/4 left-1/10 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute top-1/3 right-1/10 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl -z-10 animate-float" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto flex flex-col items-center"
        >


          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] mb-6"
          >
            Kelola Kost & Kontrakan <br />
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700">
              Tanpa Ribet
              <span className="absolute bottom-1 left-0 right-0 h-1.5 bg-blue-200 -z-10 rounded-full opacity-60" />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mb-10"
          >
            Otomatisasi tagihan, pantau okupansi, dan kelola semua unit properti Anda dari satu dashboard terpusat. Hemat waktu berharga, eliminasi kebocoran tagihan sewa.
          </motion.p>

          {/* Actions */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-16 w-full sm:w-auto"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleScrollTo("harga")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all cursor-pointer border-0"
              id="hero-btn-primary"
            >
              Mulai Gratis Sekarang
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>



          {/* Stats Bar Container (Premium white card with inner metrics grid) */}
          <motion.div
            variants={itemVariants}
            className="w-full bg-white rounded-3xl border border-slate-200/75 p-6 md:p-8 shadow-xl shadow-slate-100/70"
            id="hero-stats-panel"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 divide-x-0 sm:divide-x divide-slate-100 divide-y-0 text-center">
              {/* Stat 1 */}
              <div className="space-y-1.5 p-2">
                <p className="text-sm font-semibold text-slate-400 capitalize flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Pemilik Kost
                </p>
                <h4 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  500+
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Bermitra di Seluruh Daerah</p>
              </div>

              {/* Stat 2 */}
              <div className="space-y-1.5 p-2 pt-0 sm:pt-2">
                <p className="text-sm font-semibold text-slate-400 capitalize flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Unit Dikelola
                </p>
                <h4 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  5.000+
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Kamar Kos & Kontrakan Aktif</p>
              </div>

              {/* Stat 3 */}
              <div className="space-y-1.5 p-2 pt-0 lg:pt-2">
                <p className="text-sm font-semibold text-slate-400 capitalize flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Nilai Tagihan
                </p>
                <h4 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  Rp 2M+
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Diproses Setiap Bulannya</p>
              </div>

              {/* Stat 4 */}
              <div className="space-y-1.5 p-2 pt-0 lg:pt-2">
                <p className="text-sm font-semibold text-slate-400 capitalize flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Uptime
                </p>
                <h4 className="text-3xl md:text-4xl font-extrabold text-blue-600 tracking-tight font-mono">
                  99.5%
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Server Cepat & Selalu Online</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
