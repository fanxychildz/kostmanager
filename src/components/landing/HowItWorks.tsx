import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserPlus, 
  PlusSquare, 
  UserCheck, 
  BarChart3, 
  CheckCircle,
  ChevronRight
} from "lucide-react";
import { WorkflowStep } from "./types";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps: WorkflowStep[] = [
    {
      stepNumber: 1,
      title: "Daftar Akun Gratis",
      description: "Buat akun pengelola dengan alamat email Anda.",
      details: "Hanya butuh waktu sekitar 1 menit untuk mendaftarkan nama kost dan sistem profile Anda tanpa perlu memasukkan informasi kartu kredit sama sekali."
    },
    {
      stepNumber: 2,
      title: "Tambah Properti & Kamar",
      description: "Input data bangunan, lantai, dan nomor unit kamar.",
      details: "Buat pemisahan letak, fasilitas khusus (AC, Wi-Fi, Kamar Mandi Dalam), serta tetapkan harga sewa dasar masing-masing klasifikasi kamar dengan mudah."
    },
    {
      stepNumber: 3,
      title: "Daftarkan Data Penghuni",
      description: "Catat nama, kontak WhatsApp, dan periode sewa aktif.",
      details: "Masukkan masa tenggang sewa bulanan, tagihan pelengkap (seperti iuran sampah/listrik), serta lampiran foto KTP sewa demi kelengkapan dokumentasi."
    },
    {
      stepNumber: 4,
      title: "Kelola & Pantau Otomatis",
      description: "Biarkan sistem mengirim tagihan & merekap laporan.",
      details: "Setiap awal siklus, sistem akan mengirimkan tagihan sewa otomatis via WhatsApp. Pemasukan langsung direkap dan dimasukkan ke dalam chart laporan laba rugi."
    }
  ];

  const getStepIcon = (num: number, className: string) => {
    switch (num) {
      case 1:
        return <UserPlus className={className} />;
      case 2:
        return <PlusSquare className={className} />;
      case 3:
        return <UserCheck className={className} />;
      case 4:
        return <BarChart3 className={className} />;
      default:
        return <UserPlus className={className} />;
    }
  };

  return (
    <section id="cara-kerja" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full inline-block mb-3">
            Panduan Memulai
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-1000 tracking-tight mb-4 text-slate-950">
            Cara Kerja KeKost
          </h2>
          <p className="text-slate-600 font-medium text-base md:text-lg">
            Mulai kelola properti kos dan kontrakan Anda secara profesional hanya dalam 4 langkah mudah dan cepat.
          </p>
        </div>

        {/* Step Navigation & Interactive Viewport Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: 4 Stepper buttons list (Takes 6 column spaces) */}
          <div className="lg:col-span-6 space-y-4">
            {steps.map((step) => {
              const isActive = step.stepNumber === activeStep;
              return (
                <button
                  key={step.stepNumber}
                  onClick={() => setActiveStep(step.stepNumber)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative overflow-hidden ${
                    isActive
                      ? "bg-white border-blue-200/90 shadow-lg shadow-slate-100/80"
                      : "bg-transparent hover:bg-white/50 border-transparent hover:border-slate-200"
                  }`}
                  id={`workflow-step-btn-${step.stepNumber}`}
                >
                  {/* Left number badge */}
                  <div className={`p-3.5 rounded-xl font-mono text-sm font-extrabold shadow-sm transition-all duration-300 shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    0{step.stepNumber}
                  </div>

                  {/* Text labels */}
                  <div className="space-y-1">
                    <h3 className={`font-bold text-base sm:text-lg transition-colors leading-snug ${
                      isActive ? "text-blue-600 font-extrabold" : "text-slate-800"
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs sm:text-sm font-medium transition-colors ${
                      isActive ? "text-slate-600" : "text-slate-500"
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Active sliding arrow icon */}
                  {isActive && (
                    <div className="ml-auto text-blue-600 flex items-center justify-center p-1.5 self-center bg-blue-50 rounded-lg">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}

                  {/* Small absolute indicator block */}
                  {isActive && (
                    <motion.div
                      layoutId="stepperBarLeft"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Dynamic Live Viewport (Takes 6 column spaces) */}
          <div className="lg:col-span-6">
            <AnimatePresence mode="wait">
              {steps.map((step) => {
                if (step.stepNumber !== activeStep) return null;
                return (
                  <motion.div
                    key={step.stepNumber}
                    initial={{ opacity: 0, scale: 0.98, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl relative overflow-hidden"
                    id={`workflow-preview-panel-${step.stepNumber}`}
                  >
                    {/* Inner Graphic visual mapping */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 flex items-center justify-end p-5 text-blue-100">
                      {getStepIcon(step.stepNumber, "w-16 h-16")}
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold mb-4 capitalize">
                      {getStepIcon(step.stepNumber, "w-3 h-3 text-blue-600")}
                      <span>Langkah 0{step.stepNumber}</span>
                    </div>

                    <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                      {step.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                      {step.details}
                    </p>

                    {/* Step-specific visual mockup frames */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                      {step.stepNumber === 1 && (
                        <div className="space-y-2 text-xs">
                          <span className="font-bold text-[10px] text-slate-400 block uppercase">Registrasi Cepat (1 Menit)</span>
                          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
                            <div className="h-4 bg-slate-100 rounded-md w-1/3" />
                            <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full flex items-center px-2.5 text-slate-400 text-[10px]">example@email.com</div>
                            <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                            <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full flex items-center justify-between px-2.5 text-slate-400">
                              <span className="text-[10px]">• • • • • • • • •</span>
                            </div>
                            <div className="h-9 bg-blue-600 rounded-lg text-white font-bold flex items-center justify-center text-[10px]">Mulai Akun Gratis</div>
                          </div>
                        </div>
                      )}

                      {step.stepNumber === 2 && (
                        <div className="space-y-2 text-xs">
                          <span className="font-bold text-[10px] text-slate-400 block uppercase">Simulasi Tambah Properti</span>
                          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <span className="text-[9px] text-slate-400 block ml-0.5 mb-1.5 font-bold">Nama Kost:</span>
                              <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full flex items-center px-2.5 text-[10px] font-extrabold text-slate-700">Kost Cempaka Kemayoran</div>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block ml-0.5 mb-1.5 font-bold">Total Kamar:</span>
                              <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full flex items-center px-2.5 text-[10px] font-mono font-bold text-slate-700">12 Kamar</div>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block ml-0.5 mb-1.5 font-bold">WiFi Gratis:</span>
                              <div className="h-8 bg-slate-50 border border-slate-200 rounded-lg w-full flex items-center px-2.5 text-[10px] text-emerald-600 font-bold">✓ Tersedia</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {step.stepNumber === 3 && (
                        <div className="space-y-2 text-xs">
                          <span className="font-bold text-[10px] text-slate-400 block uppercase">Daftar Reservasi Penghuni</span>
                          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-extrabold text-[10px]">AS</div>
                              <div>
                                <span className="font-bold text-slate-800 block text-[10px] leading-none">Andi Setiawan</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">0812-9988-xxxx • Kamar B3</span>
                              </div>
                            </div>
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-extrabold">Aktif Terikat</span>
                          </div>
                        </div>
                      )}

                      {step.stepNumber === 4 && (
                        <div className="space-y-2 text-xs">
                          <span className="font-bold text-[10px] text-slate-400 block uppercase">Monitoring Tagihan Otomatis</span>
                          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-extrabold">
                              <span className="text-slate-500">Kolektibilitas Sewa</span>
                              <span className="text-emerald-600 font-mono">92% Sukses</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                              <div className="bg-emerald-500 h-full w-11/12" />
                              <div className="bg-amber-400 h-full w-1/12" />
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium block">
                              WhatsApp reminder terjadwal terbukti mempercepat pelunasan rata-rata 6 hari kerja lebih awal.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Checklist Confirmation */}
                    <div className="mt-6 flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50/50 border border-emerald-100/30 p-2.5 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Sistem siap dikonfigurasikan hari ini. Selalu aman & terbackup otomatis di cloud.</span>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
