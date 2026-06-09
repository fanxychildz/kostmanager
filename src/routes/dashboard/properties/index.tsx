import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Building2, MapPin, Loader2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'
import { motion } from 'motion/react'

export const Route = createFileRoute('/dashboard/properties/')({
  component: PropertiesPage,
})

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
]

function PropertiesPage() {
  const { data: properties, loading, error } = useQuery({
    queryFn: () => api.properties.list(),
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive font-semibold">Gagal memuat properti: {error}</p>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Daftar Properti</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Kelola portofolio real estate dan ketersediaan unit Anda.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition" asChild>
          <Link to="/dashboard/properties/new">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            Tambah Properti
          </Link>
        </Button>
      </div>

      {!properties || properties.length === 0 ? (
        <Card className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <CardContent className="p-12 text-center flex flex-col items-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border">
              <Building2 className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Belum ada properti</h3>
            <p className="text-xs text-slate-450 mb-6 font-medium">Mulai kembangkan bisnis Anda dengan menambahkan kost atau kontrakan pertama.</p>
            <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold" asChild>
              <Link to="/dashboard/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Properti
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {properties?.map((property: any, index: number) => {
            const occupancyRate = property.totalUnits > 0 
              ? Math.round((property.occupiedUnits / property.totalUnits) * 100)
              : 0
            const coverImage = property.image || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]

            return (
              <motion.div key={property.id} variants={cardVariants}>
                <Link to="/dashboard/properties/$propertyId" params={{ propertyId: property.id }}>
                  <Card className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col group hover:shadow-md transition bg-white h-full cursor-pointer">
                    <div className="h-44 bg-slate-100 relative">
                      <img src={coverImage} alt={property.name} className="w-full h-full object-cover group-hover:scale-102 transition duration-500" />
                      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                        {property.type === 'kost' ? 'Kost' : property.type === 'kontrakan' ? 'Kontrakan' : 'Apartemen'}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition text-sm">{property.name}</h3>
                        <p className="text-[11px] text-slate-450 font-semibold mt-1.5 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> 
                          {property.address}, {property.city}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500">Okupansi Kamar</span>
                          <span className="text-slate-800">{property.occupiedUnits}/{property.totalUnits} Terisi</span>
                        </div>
                        <Progress value={occupancyRate} className="h-2 rounded-full overflow-hidden" />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-0.5">
                          <span>{occupancyRate}% Unit Terisi</span>
                          <span className="text-blue-650 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Detail <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
