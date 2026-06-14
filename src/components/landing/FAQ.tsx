import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, MessageSquare } from "lucide-react";
import { FAQItem } from "./types";

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>("1");

  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "Apakah benar-benar gratis?",
      answer: "Ya, benar! Paket Gratis (Free Plan) kami dapat digunakan selamanya tanpa batas waktu untuk portofolio properti Anda hingga maksimal 10 unit kamar. Anda tidak perlu menginput data kartu kredit apa pun saat mendaftar paket gratis."
    },
    {
      id: "2",
      question: "Bagaimana cara penghuni melakukan pembayaran?",
      answer: "Saat ini, penghuni membayar biaya sewa langsung ke rekening bank atau dompet digital pribadi Anda. Anda cukup mencatatnya di dashboard sebagai lunas dalam 1 klik. Sistem integrasi payment gateway (Virtual Account, QRIS) akan hadir di masa mendatang."
    },
    {
      id: "3",
      question: "Apakah kerahasiaan data properti dan penyewa saya aman?",
      answer: "Tentu saja. Semua transfer data dienkripsi dengan standar SSL/TLS di transit, dan database kami dienkripsi di server awan (AES-256). Kami patuh pada regulasi PSE Kominfo Republik Indonesia serta standar perlindungan privasi Data Pribadi (PDP)."
    },
    {
      id: "4",
      question: "Apakah aplikasi ini bisa diakses dengan baik lewat HP?",
      answer: "Ya! Aplikasi web KeKost dirancang penuh secara 'fully responsive'. Anda bisa mengakses dashboard, mengisi penyewa baru, merekap kas, maupun memicu notifikasi WhatsApp penagihan dengan lancar lewat browser HP (Safari/Chrome/Firefox), tablet, maupun PC."
    },
    {
      id: "5",
      question: "Berapa lama waktu untuk proses setup awal?",
      answer: "Rata-rata mitra pemilik baru kami hanya membutuhkan waktu 15 - 30 menit untuk setup awal: mendaftar, memasukkan nama properti, mendefinisikan nomor-nomor kamar, dan menginput penghuni aktif pertama mereka."
    }
  ];

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-24 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full inline-block mb-3">
            Bantuan FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            Pertanyaan Umum (FAQ)
          </h2>
          <p className="text-slate-600 font-medium text-base md:text-lg">
            Temukan jawaban langsung atas ragam pertanyaan mendasar yang kerap ditanyakan calon mitra pengelola seputar KeKost.
          </p>
        </div>

        {/* Accordions Frame */}
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                id={`faq-item-${faq.id}`}
              >
                {/* Trigger heading action */}
                <button
                  type="button"
                  onClick={() => handleToggle(faq.id)}
                  className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:bg-slate-55/50 transition-all cursor-pointer border-0 bg-transparent"
                >
                  <span className="leading-snug pr-2 text-slate-955 font-extrabold">
                    {faq.question}
                  </span>
                  
                  {/* Rotating Chevron circle box */}
                  <div className={`p-1.5 rounded-full transition-all duration-300 shrink-0 ${
                    isOpen ? "bg-blue-50 text-blue-600 rotate-180" : "bg-slate-50 text-slate-400"
                  }`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {/* Animated expandable content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-slate-100 text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Dynamic support box below FAQs */}
        <div className="mt-14 text-center bg-white p-6 rounded-3xl border border-slate-200/80 text-xs sm:text-sm shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-950 block">Punya pertanyaan khusus yang belum terjawab?</span>
              <p className="text-slate-500 font-medium text-[11px] sm:text-xs">Tim CS kami stand-by melayani live konsultasi bisnis properti Anda gratis.</p>
            </div>
          </div>
          <a
            href="mailto:support@kekost.com?subject=Tanya KeKost"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all shrink-0 cursor-pointer decoration-none text-center"
            id="faq-whatsapp-support"
          >
            Hubungi CS kami
          </a>
        </div>

      </div>
    </section>
  );
}
