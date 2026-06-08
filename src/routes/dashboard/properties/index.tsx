import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Building2, MapPin, Loader2 } from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/properties/')({
  component: PropertiesPage,
})

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
        <p className="text-destructive">Gagal memuat properti: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Properti</h1>
          <p className="text-muted-foreground">Kelola semua properti Anda</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Properti
          </Link>
        </Button>
      </div>

      {properties && properties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada properti</h3>
            <p className="text-muted-foreground mb-4">Mulai dengan menambahkan properti pertama Anda</p>
            <Button asChild>
              <Link to="/dashboard/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Properti
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property: any) => {
            const occupancyRate = property.totalUnits > 0 
              ? Math.round((property.occupiedUnits / property.totalUnits) * 100)
              : 0
            return (
              <Link key={property.id} to="/dashboard/properties/$propertyId" params={{ propertyId: property.id }}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={property.type === 'kost' ? 'default' : property.type === 'kontrakan' ? 'secondary' : 'outline'}>
                        {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{property.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-3 w-3" />
                      {property.city}, {property.province}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Okupansi</span>
                        <span className="font-medium">{property.occupiedUnits}/{property.totalUnits} unit</span>
                      </div>
                      <Progress value={occupancyRate} />
                      <p className="text-xs text-muted-foreground">{occupancyRate}% terisi</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
