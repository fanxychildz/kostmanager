import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Menu, X, ArrowRight, User, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface NavigationProps {
  activeSection: string;
}

export default function Navigation({ activeSection }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const navItems = [
    { id: "fitur", label: "Fitur" },
    { id: "kalkulator", label: "Potential Revenue" },
    { id: "cara-kerja", label: "Cara Kerja" },
    { id: "harga", label: "Harga" },
    { id: "faq", label: "FAQ" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of navbar
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
    <>
      <header
        id="navbar-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/85 backdrop-blur-md shadow-sm border-b border-slate-100 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 text-left group cursor-pointer border-0 bg-transparent p-0"
              id="nav-logo-btn"
            >
              <div className="bg-blue-600 text-white p-2 rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-700 shadow-md shadow-blue-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                  Kost<span className="text-blue-600 font-semibold">Manager</span>
                </span>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1 flex items-center gap-1">
                  SaaS Indonesia
                </p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 bg-slate-100/60 p-1 rounded-full border border-slate-200/50">
              {navItems.map((item, idx) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleScrollTo(item.id)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 cursor-pointer border-0 bg-transparent whitespace-nowrap ${
                      isActive ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
                    }`}
                    id={`nav-item-${item.id}`}
                  >
                    {/* Hover sliding bg */}
                    {hoveredIndex === idx && (
                      <motion.span
                        layoutId="navHoverOutline"
                        className="absolute inset-0 bg-slate-200/80 rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Active highlight */}
                    {isActive && (
                      <motion.span
                        layoutId="navActiveBorder"
                        className="absolute bottom-0 left-1/3 right-1/3 h-0.5 bg-blue-600 rounded-full"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center gap-1.5 xl:gap-3">
              <button
                onClick={() => handleScrollTo("faq")}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-2.5 py-2 transition-colors cursor-pointer flex items-center gap-1 border-0 bg-transparent whitespace-nowrap"
                id="btn-nav-support"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Support Aktif
              </button>
              <Link
                to="/login"
                className="text-slate-700 hover:text-blue-600 text-xs font-semibold px-3 py-2 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 border border-transparent hover:border-slate-100 cursor-pointer whitespace-nowrap"
                id="btn-nav-login"
              >
                <User className="w-3.5 h-3.5" />
                Masuk
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-500/15 transition-all flex items-center gap-1 cursor-pointer decoration-none"
                id="btn-nav-cta"
              >
                <motion.span
                  whileHover={{ scale: 1.02, y: -0.5 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  Coba Gratis
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.span>
              </Link>
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-blue-600 rounded-xl hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
              id="btn-mobile-trigger"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900 z-45"
            />

            {/* Menu Body */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-4 right-4 bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 z-48 flex flex-col gap-5 lg:hidden overflow-hidden"
            >
              <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">
                Navigasi Menu
              </div>
              <div className="grid grid-cols-1 gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleScrollTo(item.id)}
                    className={`flex items-center justify-between text-left px-4 py-3 rounded-xl font-bold text-base transition-all border-0 bg-transparent cursor-pointer ${
                      activeSection === item.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                    id={`mobile-nav-item-${item.id}`}
                  >
                    <span>{item.label}</span>
                    {activeSection === item.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              <hr className="border-slate-100" />

              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer decoration-none"
                  id="mobile-btn-login"
                >
                  <User className="w-5 h-5" />
                  Masuk ke Aplikasi
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer decoration-none"
                  id="mobile-btn-cta"
                >
                  Coba Sekarang Gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Decorative Subtle Grid Badge */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5 text-left mt-2">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-xs text-slate-500 font-medium leading-relaxed">
                  Platform manajemen properti terbaik dengan otomasi WhatsApp invoice di Indonesia.
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
