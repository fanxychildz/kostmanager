import { useState, useMemo, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  Search, 
  User, 
  Phone, 
  Check, 
  Send, 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  Smartphone, 
  MessageSquare,
  Lock,
  X
} from "lucide-react";
import { MockTenant } from "./types";

export default function DashboardDemo() {
  const [tenants, setTenants] = useState<MockTenant[]>([
    { id: "1", roomNumber: "A-101", name: "Budi Santoso", phone: "081234567xxx", monthlyRent: 1500000, status: "Belum Bayar", dueDate: "10-06-2026", notes: "Sewa reguler kamar A" },
    { id: "2", roomNumber: "A-102", name: "Siti Rahma", phone: "089876543xxx", monthlyRent: 1750000, status: "Lunas", dueDate: "05-06-2026", notes: "Kamar AC + kamar mandi dalam" },
    { id: "3", roomNumber: "B-201", name: "Rian Hidayat", phone: "085211223xxx", monthlyRent: 1200000, status: "Belum Bayar", dueDate: "12-06-2026", notes: "Mahasiswa UGM" },
    { id: "4", roomNumber: "B-202", name: "Dewi Lestari", phone: "081344556xxx", monthlyRent: 2000000, status: "Lunas", dueDate: "08-06-2026", notes: "Karyawan swasta" },
    { id: "5", roomNumber: "C-103", name: "Farhan Ammar", phone: "082355667xxx", monthlyRent: 1400000, status: "Belum Bayar", dueDate: "11-06-2026", notes: "Sewa motor parkir" },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Semua" | "Belum Bayar" | "Lunas">("Semua");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("1");
  const [isSendingWA, setIsSendingWA] = useState(false);
  const [waSentStatus, setWaSentStatus] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  // Form for new tenant
  const [newRoom, setNewRoom] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRent, setNewRent] = useState(1500000);
  const [newDueDate, setNewDueDate] = useState("15-06-2026");

  // Filter/search logic
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "Semua" ? true : t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  // Selected tenant memo
  const selectedTenant = useMemo(() => {
    return tenants.find((t) => t.id === selectedTenantId) || tenants[0];
  }, [tenants, selectedTenantId]);

  // Dynamic Dashboard Stats
  const stats = useMemo(() => {
    const totalPossible = tenants.reduce((acc, t) => acc + t.monthlyRent, 0);
    const totalCollected = tenants
      .filter((t) => t.status === "Lunas")
      .reduce((acc, t) => acc + t.monthlyRent, 0);
    const totalOutstanding = tenants
      .filter((t) => t.status === "Belum Bayar")
      .reduce((acc, t) => acc + t.monthlyRent, 0);
    
    const countLunas = tenants.filter((t) => t.status === "Lunas").length;
    const occupancyRate = totalPossible > 0 ? Math.round((countLunas / tenants.length) * 100) : 0;

    return {
      totalCollected,
      totalOutstanding,
      occupancyRate,
      activeCount: tenants.length,
    };
  }, [tenants]);

  // Format IDR Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Convert "10-06-2026" into proper Indonesian date description
  const parseIndoDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("-");
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  };

  // Action: Mark selected tenant as space
  const handleMarkPayment = (id: string, newStatus: "Lunas" | "Belum Bayar") => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    if (newStatus === "Lunas") {
      setIsConfettiActive(true);
      setTimeout(() => setIsConfettiActive(false), 2200);
    }
  };

  // Action: Send custom mock WhatsApp
  const handleSendWhatsApp = (tenant: MockTenant) => {
    if (!tenant) return;
    setIsSendingWA(true);
    setWaSentStatus(null);
    
    setTimeout(() => {
      setIsSendingWA(false);
      setWaSentStatus(`WhatsApp terkirim otomatis ke ${tenant.name}!`);
      
      // Update tenant state to indicate WA sent
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, whatsappSent: true } : t))
      );
      
      // Clear notification automatically
      setTimeout(() => setWaSentStatus(null), 5000);
    }, 1500);
  };

  // Action: Create a new tenant
  const handleAddTenant = (e: FormEvent) => {
    e.preventDefault();
    if (!newName || !newRoom) return;

    const newT: MockTenant = {
      id: String(tenants.length + 1),
      roomNumber: newRoom,
      name: newName,
      phone: newPhone || "081200000xxx",
      monthlyRent: Number(newRent),
      status: "Belum Bayar",
      dueDate: newDueDate,
    };

    setTenants((prev) => [...prev, newT]);
    setSelectedTenantId(newT.id);
    setShowAddModal(false);
    
    // reset form
    setNewName("");
    setNewRoom("");
    setNewPhone("");
    setNewRent(1500000);
  };

  return (
    <section id="demo" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Text */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Uji Coba Dashboard KostManager
          </h2>
          <p className="text-slate-600 font-medium text-base md:text-lg">
            Rasakan langsung interaktivitas platform kami! Kelola data kamar, kirim tagihan WhatsApp sewa, dan konfirmasi pembayaran dalam hitungan detik secara real-time.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-semibold">
            <Smartphone className="w-3.5 h-3.5" />
            Simulasi Interaktif: Coba ubah data di bawah!
          </div>
        </div>

        {/* Dashboard Shell Frame */}
        <div className="relative bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl p-4 sm:p-6 overflow-hidden">
          {/* Confetti Animation Layer */}
          <AnimatePresence>
            {isConfettiActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 pointer-events-none bg-blue-500/10 backdrop-blur-xs flex items-center justify-center"
              >
                <div className="text-center bg-slate-950/90 border border-emerald-500/30 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h5 className="font-extrabold text-white text-lg">Pembayaran Diproses!</h5>
                  <p className="text-xs text-slate-400">Pemasukan kas diperbarui & Kwitansi digital dikirim.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Decorative App Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="text-xs font-semibold font-mono text-slate-400 hidden sm:inline-block">
                app.kostmanager.com/dashboard/main
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Mode Simulasi Aktif
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Collected */}
            <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Total Terkumpul (Bulan Ini)
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-emerald-400 font-mono">
                  {formatIDR(stats.totalCollected)}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Outstanding */}
            <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Tagihan Belum Bayar
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-amber-500 font-mono">
                  {formatIDR(stats.totalOutstanding)}
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Kolektibilitas Sewa
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-blue-400 font-mono">
                  {stats.occupancyRate}%
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Core Interactive Layout Block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Box: Tenant List (Takes 7 Cols) */}
            <div className="lg:col-span-7 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
              
              {/* Filter tools */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
                <div className="relative w-full sm:w-auto flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari Penghuni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
                  {(["Semua", "Belum Bayar", "Lunas"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer border-0 ${
                        statusFilter === filter
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-slate-200 bg-transparent"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenant Table/Cards List */}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => {
                    const isSelected = tenant.id === selectedTenantId;
                    return (
                      <div
                        key={tenant.id}
                        onClick={() => setSelectedTenantId(tenant.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-slate-800 border-blue-600 shadow-md"
                            : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl text-xs font-bold leading-none ${
                            tenant.status === "Lunas"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {tenant.roomNumber}
                          </div>
                          
                          <div>
                            <span className="font-semibold text-sm block text-white">
                              {tenant.name}
                            </span>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              <span className="font-mono">{formatIDR(tenant.monthlyRent)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {tenant.dueDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {tenant.whatsappSent && (
                            <span className="text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/25 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                              <Send className="w-2.5 h-2.5" /> WA Terkirim
                            </span>
                          )}

                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-extrabold shadow-sm ${
                            tenant.status === "Lunas"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/20 animate-pulse-slow"
                          }`}>
                            {tenant.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    Tidak ada penghuni yang sesuai pencarian.
                  </div>
                )}
              </div>

              {/* Add New Tenant Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-250 hover:text-white font-bold py-3 px-4 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 transition-all text-xs cursor-pointer"
                id="demo-add-tenant-btn"
              >
                <Plus className="w-4 h-4 text-blue-500" />
                Tambah Kamar / Penghuni Baru (Simulasi)
              </button>

            </div>

            {/* Right Box: Action Center & Message Simulator (Takes 5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Action Operations card */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-4">
                  Detail & Tindakan Cepat
                </span>

                {selectedTenant ? (
                  <div className="space-y-4">
                    {/* Selected tenant details */}
                    <div className="flex items-start gap-3.5 bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-400 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base leading-none">
                            {selectedTenant.name}
                          </h4>
                          <span className="text-xs bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded-md">
                            {selectedTenant.roomNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {selectedTenant.phone}
                        </p>
                        <p className="text-xs text-slate-500 italic mt-1 font-medium">
                          &quot;{selectedTenant.notes || "Sewa bulanan kamar"}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Rent statistics inside card */}
                    <div className="grid grid-cols-2 gap-3.5 my-2">
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block font-bold leading-none mb-1">
                          Sewa Kamar
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {formatIDR(selectedTenant.monthlyRent)}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block font-bold leading-none mb-1">
                          Batas Jatuh Tempo
                        </span>
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {selectedTenant.dueDate}
                        </span>
                      </div>
                    </div>

                    {/* Operation Buttons */}
                    <div className="space-y-2.5 pt-2">
                      {/* WA Button */}
                      <button
                        onClick={() => handleSendWhatsApp(selectedTenant)}
                        disabled={isSendingWA}
                        className={`w-full flex items-center justify-center gap-2 font-bold text-xs py-3 rounded-xl border transition-all cursor-pointer ${
                          isSendingWA 
                            ? "bg-slate-800/50 border-slate-800/80 text-slate-500" 
                            : "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:text-emerald-300"
                        }`}
                        id="demo-action-wa"
                      >
                        <Send className="w-4 h-4 shrink-0" />
                        {isSendingWA ? "Mengirim Tagihan..." : "Kirim Tagihan WhatsApp"}
                      </button>

                      {/* Payment Status Toggle Button */}
                      {selectedTenant.status === "Belum Bayar" ? (
                        <button
                          onClick={() => handleMarkPayment(selectedTenant.id, "Lunas")}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/15 transition-all cursor-pointer border-0"
                          id="demo-action-pay-lunas"
                        >
                          <Check className="w-4 h-4 shrink-0" />
                          Konfirmasi Lunas & Kirim Kwitansi
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkPayment(selectedTenant.id, "Belum Bayar")}
                          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/85 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
                          id="demo-action-unpay"
                        >
                          Batalkan Pembayaran (Set Belum Bayar)
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs py-10 text-center">
                    Silakan pilih salah satu penghuni di list kiri.
                  </p>
                )}
              </div>

              {/* Simulated Mobile Notification Screen */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                    WhatsApp Automation Live Preview
                  </span>

                  {/* Simulated Messenger Alert Bubble */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-[11px] leading-relaxed relative">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-extrabold leading-none">
                        KM
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 block leading-none">Official KostManager Bot</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Automated System</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-slate-300 font-mono text-[10px] whitespace-pre-wrap">
                      {selectedTenant ? (
                        `Halo *${selectedTenant.name}*,\n` +
                        `Ini pengingat sewa *Kamar ${selectedTenant.roomNumber}* sebesar *${formatIDR(selectedTenant.monthlyRent)}* jatuh tempo pada *${parseIndoDate(selectedTenant.dueDate)}*.\n\n` +
                        `Pembayaran via transfer Bank Syariah Indonesia *123456789 A/N KostManager Pro*. Balas jika butuh bantuan.`
                      ) : (
                        "Pilih penghuni untuk melihat template pesan otomatis."
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulated Notification Alerts */}
                <AnimatePresence>
                  {waSentStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-3 bg-emerald-950/70 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-xs flex items-start gap-2"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-[11px] block text-white">Sukses Mengirim Simulasi!</span>
                        <p className="text-[10px] leading-snug text-slate-300 mt-0.5">{waSentStatus}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>

          {/* Locked Dashboard Mock Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-600" /> Enterprise-Grade Security (AES-256 Encrypted)
            </span>
            <span className="mt-2 sm:mt-0">
              KostManager Dashboard v2.0-beta. Buatan Indonesia 🇮🇩
            </span>
          </div>
        </div>

        {/* Modal: Add Tenant Simulator */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white text-slate-800 rounded-3xl max-w-md w-full border border-slate-200 p-6 shadow-2xl relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Tambah Penghuni Baru
                  </h4>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 cursor-pointer text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 border-0 bg-transparent"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddTenant} className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Nama Lengkap Penghuni
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Fauzi"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Room */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Nomor Kamar
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: B-303"
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Jatuh Tempo (DD-MM-YYYY)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 15-06-2026"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812xxxxxxxx"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Rent Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Sewa Bulanan (Rupiah)
                    </label>
                    <input
                      type="number"
                      required
                      value={newRent}
                      onChange={(e) => setNewRent(Number(e.target.value))}
                      className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all font-mono"
                    />
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Terformat otomatis: {formatIDR(newRent)}
                    </span>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 rounded-xl transition-all cursor-pointer border-0"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer border-0"
                    >
                      Simpan Kamar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
