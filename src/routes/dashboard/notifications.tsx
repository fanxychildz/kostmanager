import { createFileRoute } from '@tanstack/react-router'
import { Bell, Mail, AlertCircle, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { formatDate } from '~/lib/utils'
import { api } from '~/lib/api'
import { useQuery } from '~/lib/hooks'

export const Route = createFileRoute('/dashboard/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  const { data: notifications, loading } = useQuery({
    queryFn: () => api.notifications.list(),
  })

  const typeIcons: Record<string, React.ReactNode> = {
    bill_reminder: <Bell className="h-4 w-4 text-primary" />,
    payment_confirm: <CheckCircle2 className="h-4 w-4 text-success" />,
    announcement: <Mail className="h-4 w-4 text-primary" />,
    overdue: <AlertCircle className="h-4 w-4 text-destructive" />,
  }
  const statusIcons: Record<string, React.ReactNode> = {
    queued: <Clock className="h-3 w-3 text-muted-foreground" />,
    sent: <CheckCircle2 className="h-3 w-3 text-primary" />,
    delivered: <CheckCircle2 className="h-3 w-3 text-success" />,
    failed: <XCircle className="h-3 w-3 text-destructive" />,
  }
  const statusLabels: Record<string, string> = { queued: 'Antrian', sent: 'Terkirim', delivered: 'Diterima', failed: 'Gagal' }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const allNotifs = notifications || []
  const inAppNotifs = allNotifs.filter((n: any) => n.channel === 'in_app')
  const emailNotifs = allNotifs.filter((n: any) => n.channel === 'email')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifikasi</h1>
        <p className="text-muted-foreground">Riwayat notifikasi email dan in-app</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="in_app">In-App</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {allNotifs.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">Belum ada notifikasi</CardContent></Card>
          ) : (
            allNotifs.map((notif: any) => (
              <Card key={notif.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">{typeIcons[notif.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {notif.subject && <p className="font-medium text-sm">{notif.subject}</p>}
                          <Badge variant="outline" className="text-xs">{notif.channel === 'email' ? 'Email' : 'In-App'}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">{statusIcons[notif.status]}{statusLabels[notif.status]}</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.messageContent}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(notif.sentAt || notif.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="in_app" className="space-y-3 mt-4">
          {inAppNotifs.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">Belum ada notifikasi in-app</CardContent></Card>
          ) : (
            inAppNotifs.map((notif: any) => (
              <Card key={notif.id}><CardContent className="p-4"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">{typeIcons[notif.type]}</div><div className="flex-1"><p className="text-sm text-muted-foreground">{notif.messageContent}</p><p className="text-xs text-muted-foreground mt-2">{formatDate(notif.sentAt || notif.createdAt)}</p></div></div></CardContent></Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="email" className="space-y-3 mt-4">
          {emailNotifs.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">Belum ada notifikasi email</CardContent></Card>
          ) : (
            emailNotifs.map((notif: any) => (
              <Card key={notif.id}><CardContent className="p-4"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">{typeIcons[notif.type]}</div><div className="flex-1"><p className="font-medium text-sm">{notif.subject}</p><p className="text-sm text-muted-foreground mt-1">{notif.messageContent}</p><p className="text-xs text-muted-foreground mt-2">{formatDate(notif.sentAt || notif.createdAt)}</p></div></div></CardContent></Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
