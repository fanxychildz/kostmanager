import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Calculator, Clock, Coins, Sparkles, TrendingUp } from "lucide-react";

export default function RevenueCalculator() {
  const [totalRooms, setTotalRooms] = useState<number>(15);
  const [averageRent, setAverageRent] = useState<number>(1500000);
  const [occupancyRate, setOccupancyRate] = useState<number>(90);

  // Math conversions
  const monthlyRevenue = useMemo(() => {
    return totalRooms * averageRent * (occupancyRate / 100);
  }, [totalRooms, averageRent, occupancyRate]);

  const yearlyRevenue = useMemo(() => {
    return monthlyRevenue * 12;
  }, [monthlyRevenue]);

  // Assumptions on automation savings
  const hoursSaved = useMemo(() => {
    return Math.round(totalRooms * 2.5 * (occupancyRate / 100)); // 2.5 hours saved per rented room
  }, [totalRooms, occupancyRate]);

  // Financial leakage prevented
  const leakagePrevented = useMemo(() => {
    return Math.round(monthlyRevenue * 0.05); // 5% typical leakage avoided
  }, [monthlyRevenue]);

  // IDR Formatter helper
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="kalkulator" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Simulasikan Pendapatan & Efisiensi Properti Anda
          </h2>
          <p className="text-slate-400 text-base md:text-lg font-medium">
            Temukan potensi pendapatan kotor maksimum yang bisa didapatkan dan hitung berapa banyak waktu berharga yang Anda hemat menggunakan sistem otomasi KostManager.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Sliders Control Panel (Takes 6 Cols) */}
          <div className="lg:col-span-6 bg-slate-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                <Calculator className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-sm tracking-wider uppercase text-slate-350">
                  Atur Parameter Properti Anda
                </span>
              </div>

              {/* Slider 1: Rooms */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 capitalize">
                    Jumlah Unit Kamar
                  </span>
                  <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg text-xs font-extrabold font-mono">
                    {totalRooms} Kamar
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  value={totalRooms}
                  onChange={(e) => setTotalRooms(Number(e.target.value))}
                  className="w-full select-none accent-blue-500 hover:accent-blue-600 focus:outline-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
                  <span>2 Kamar</span>
                  <span>100 Kamar</span>
                </div>
              </div>

              {/* Slider 2: Average Rent */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 capitalize">
                    Sewa Kamar / Bulan (Rata-rata)
                  </span>
                  <span className="bg-sky-600/20 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-lg text-xs font-extrabold font-mono">
                    {formatIDR(averageRent)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="5000000"
                  step="100000"
                  value={averageRent}
                  onChange={(e) => setAverageRent(Number(e.target.value))}
                  className="w-full accent-blue-500 hover:accent-blue-600 focus:outline-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
                  <span>Rp 500 Ribu</span>
                  <span>Rp 5 Juta</span>
                </div>
              </div>

              {/* Slider 3: Occupancy */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 capitalize">
                    Rata-rata Tingkat Okupansi
                  </span>
                  <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-lg text-xs font-extrabold font-mono">
                    {occupancyRate}% Terisi
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={occupancyRate}
                  onChange={(e) => setOccupancyRate(Number(e.target.value))}
                  className="w-full accent-blue-500 hover:accent-blue-600 focus:outline-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
                  <span>10% Terisi</span>
                  <span>100% Kamar Penuh</span>
                </div>
              </div>
            </div>

            {/* Note info */}
            <div className="mt-8 pt-4 border-t border-slate-900/60 flex gap-2 text-left">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-normal">
                Kalkulasi efisiensi didasarkan pada studi manajemen properti independen di Indonesia, di mana tingkat kehilangan tagihan tak tertagih rata-rata mencapai 5% tanpa sistem notifikasi penagihan berkala.
              </p>
            </div>
          </div>

          {/* Calculations Outputs (Takes 6 Cols) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Monthly gross income (Large Card) */}
            <div className="sm:col-span-2 bg-gradient-to-br from-blue-950 to-slate-950 border border-blue-900/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider block">
                  Simulasi Estimasi Pemasukan kotor
                </span>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                  Bulanan
                </span>
              </div>
              
              <div>
                <span className="text-xs text-slate-400 block font-medium mb-1">Pemasukan Kotor per Bulan</span>
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white block">
                  {formatIDR(monthlyRevenue)}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-mono">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Estimasi Tahunan: <strong>{formatIDR(yearlyRevenue)}</strong></span>
                </div>
              </div>
            </div>

            {/* Hours Saved widget */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono block">
                  {hoursSaved} Jam
                </span>
                <span className="text-xs font-bold text-slate-400 block mt-1">Waktu Bebas Dihemat</span>
                <p className="text-[10px] text-slate-500 leading-normal mt-2">
                  Dihitung dari otomasi penulisan tagihan, monitoring, penagihan WA, & rekap manual.
                </p>
              </div>
            </div>

            {/* Leakage saved widget */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono block">
                  {formatIDR(leakagePrevented)}
                </span>
                <span className="text-xs font-bold text-slate-400 block mt-1">Tagihan Selamat / Bulan</span>
                <p className="text-[10px] text-slate-500 leading-normal mt-2">
                  Mengurangi keterlambatan bayar tempo lewat notifikasi sistematis.
                </p>
              </div>
            </div>

            {/* Action Card inside outcomes */}
            <div className="sm:col-span-2 bg-blue-600 rounded-2xl p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <span className="font-extrabold text-xs text-blue-100 uppercase tracking-widest block leading-none">
                  Siap Melipatgandakan Efisiensi?
                </span>
                <p className="text-xs text-blue-100 font-medium">
                  Atasi keterlambatan bayar sewa dan rekap ribet hari ini.
                </p>
              </div>
              <button
                onClick={() => {
                  const element = document.getElementById("harga");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full sm:w-auto bg-white text-blue-600 hover:bg-slate-50 font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all shrink-0 cursor-pointer border-0"
                id="calc-action-btn"
              >
                Pilih Lisensi Paket Anda
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
