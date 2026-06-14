import { useState } from "react";
import { motion } from "motion/react";
import { Check, Zap, PhoneCall } from "lucide-react";
import { PricingPlan } from "./types";
import { Link } from "@tanstack/react-router";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans: PricingPlan[] = [
    {
      name: "Gratis",
      priceMonthly: 0,
      priceYearly: 0,
      periodLabel: "selamanya",
      description: "Sempurna untuk merintis dan mengelola kos kecil mandiri.",
      features: [
        "Hingga 10 unit kamar",
        "Otomasi tagihan tertulis",
        "Pencatatan pembayaran kas",
        "Laporan laba rugi dasar",
        "Notifikasi penagihan email",
        "Bantuan via Group WA"
      ],
      ctaText: "Mulai Gratis Sekarang"
    },
    {
      name: "Pro",
      priceMonthly: 49000,
      priceYearly: 39000,
      periodLabel: "bulan",
      description: "Untuk pengelola aktif yang ingin serba otomatis & cepat.",
      features: [
        "Hingga 100 unit kamar",
        "Semua fitur paket Gratis",
        "Otomasi tagihan WhatsApp",
        "Export Laporan PDF & Excel",
        "Portal digital penghuni khusus",
        "Prioritas bantuan CS khusus"
      ],
      isPopular: true,
      ctaText: "Coba 14 Hari Gratis",
      badge: "Paling Populer"
    },
    {
      name: "Bisnis",
      priceMonthly: 149000,
      priceYearly: 119000,
      periodLabel: "bulan",
      description: "Pilihan terbaik bagi korporasi atau agen properti berskala besar.",
      features: [
        "Unit kamar tanpa batas (unlimited)",
        "Semua fitur paket Pro",
        "Akses multi-manajer / staf kasir",
        "Integrasi API & Webhook developer",
        "Dedicated account support 24/7",
        "SLA garansi sistem up-time 99.9%"
      ],
      ctaText: "Hubungi Penjualan (Sales)"
    }
  ];

  const formatPrice = (num: number) => {
    if (num === 0) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <section id="harga" className="py-24 bg-white relative">
      <div className="absolute inset-x-0 bottom-0 h-40 bg-slate-50 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full inline-block mb-3">
            Paket Langganan
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            Harga Transparan, Sesuai Kebutuhan
          </h2>
          <p className="text-slate-600 font-medium text-base md:text-lg">
            Tidak ada biaya siluman atau tersembunyi. Pilih paket yang paling pas untuk memaksimalkan efisiensi properti Anda.
          </p>

          {/* Interactive Toggle Pill switcher */}
          <div className="mt-10 inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-full border border-slate-200/50">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border-0 ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
              id="billing-cycle-monthly"
            >
              Bayar Bulanan
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border-0 flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
              id="billing-cycle-yearly"
            >
              Bayar Tahunan
              <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Layout Suite */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, idx) => {
            const currentPrice = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className={`relative bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all duration-300 ${
                  plan.isPopular
                    ? "border-blue-600 ring-4 ring-blue-500/10 shadow-2xl scale-100 md:scale-103 z-10"
                    : "border-slate-200/80 shadow-md hover:shadow-xl hover:border-slate-300"
                }`}
                id={`pricing-card-${plan.name}`}
              >
                {/* Popular Pill badge */}
                {plan.isPopular && plan.badge && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-extrabold text-[10px] uppercase px-4 py-1.5 rounded-full tracking-wider shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-6">
                  {/* Plan Identification */}
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="text-slate-500 font-medium text-xs mt-1 leading-normal">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing Rate Row */}
                  <div className="border-b border-slate-100 pb-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 font-mono tracking-tight transition-all duration-300">
                        {formatPrice(currentPrice)}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold uppercase font-sans">
                        / {plan.periodLabel}
                      </span>
                    </div>
                    {billingCycle === "yearly" && plan.priceMonthly > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">
                        Ditagih tahunan ({formatPrice(currentPrice * 12)})
                      </span>
                    )}
                  </div>

                  {/* Features Checklist */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-4">
                      Fitur yang Terintegrasi:
                    </span>
                    <ul className="space-y-3">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                          <div className={`p-0.5 rounded-full mt-0.5 shrink-0 flex items-center justify-center ${
                            plan.isPopular ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-slate-600 font-semibold leading-snug">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA Trigger Button */}
                <div className="pt-8">
                  {plan.name === "Bisnis" ? (
                    <a
                      href="https://wa.me/6285156469451?text=Halo%20Pak%20Taufiq%20Rusdhi%20(KeKost),%20saya%20tertarik%20dengan%20Paket%20Bisnis%20KeKost."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md cursor-pointer decoration-none"
                      id="pricing-cta-bisnis"
                    >
                      <PhoneCall className="w-4 h-4 shrink-0" />
                      {plan.ctaText}
                    </a>
                  ) : (
                    <Link
                      to="/register"
                      search={{ plan: plan.name.toLowerCase() as any }}
                      className={`w-full block py-3.5 px-4 rounded-xl font-extrabold text-sm text-center transition-all shadow-xs cursor-pointer decoration-none ${
                        plan.isPopular
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/15"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-850 border border-slate-200/40"
                      }`}
                      id={`pricing-cta-${plan.name}`}
                    >
                      {plan.ctaText}
                    </Link>
                  )}
                </div>

              </motion.div>
            );
          })}
        </div>


      </div>
    </section>
  );
}
