import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api } from '~/lib/api'
import Navigation from '~/components/landing/Navigation'
import Hero from '~/components/landing/Hero'
import Features from '~/components/landing/Features'
import RevenueCalculator from '~/components/landing/RevenueCalculator'
import HowItWorks from '~/components/landing/HowItWorks'
import Pricing from '~/components/landing/Pricing'
import FAQ from '~/components/landing/FAQ'
import Footer from '~/components/landing/Footer'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("fitur")

  useEffect(() => {
    let cancelled = false
    api.auth.getSession()
      .then((session) => {
        if (!cancelled && session?.user) {
          navigate({ to: '/dashboard', replace: true })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (!ready) return

    const handleScroll = () => {
      const sections = ["fitur", "kalkulator", "cara-kerja", "harga", "faq"]
      const scrollPosition = window.scrollY + 220 

      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionId = sections[i]
        const el = document.getElementById(sectionId)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [ready])

  if (!ready) return null

  return (
    <div className="relative min-h-screen bg-[#fafbfd] text-slate-900 select-none antialiased">
      <Navigation activeSection={activeSection} />
      <Hero />
      <Features />
      <RevenueCalculator />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}
