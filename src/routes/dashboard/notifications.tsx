import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Bell, CheckCheck, Trash2, RefreshCw } from 'lucide-react'
import { useQuery } from '~/lib/hooks'
import { DashboardBootstrap } from '~/lib/dashboard-bootstrap'
import { api } from '~/lib/api'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { formatDate } from '~/lib/utils'

export const Route = createFileRoute('/dashboard/notifications')({
  component: NotificationsPage,
})

type NotificationRow = {
  id: string
  recipientType: 'tenant' | 'owner' | string
  channel: 'in_app' | 'email' | string
  type: string
  subject: string | null
  messageContent: string
  status: string
  createdAt: Date
}

type NotifQueryData = { list: NotificationRow[]; unreadCount: number }

function NotificationsPage() {
  const { data, loading, refetch } = useQuery<NotifQueryData>({
    queryFn: async () => {
      const list = await api.notifications.list({ recipientType: 'owner' })
      const rows: NotificationRow[] = (list || [])
        .filter((item: any) => item.recipientType === 'owner')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return { list: rows, unreadCount: rows.filter((item) => item.status !== 'delivered').length }
    },
  })

  const [localUnreadCount, setLocalUnreadCount] = useState(0)

  const notifications = data?.list ?? []
  const unreadCount = data?.unreadCount ?? localUnreadCount
  const inAppNotifs = notifications.filter((item) => item.channel === 'in_app')
  const emailNotifs = notifications.filter((item) => item.channel === 'email')

  const markAllAsRead = async () => {
    await Promise.all(
      notifications.map((item) => api.notifications.update(item.id, { status: 'delivered' })),
    )
    setLocalUnreadCount(0)
    await refetch()
  }

  const deleteNotification = async (id: string) => {
    await api.notifications.delete(id)
    await refetch()
  }

  return (
    <DashboardBootstrap>
      <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          <p className="text-muted-foreground">Kelola notifikasi kamu dan status pembacaan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              await refetch()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={markAllAsRead} disabled={notifications.length === 0}>
            <CheckCheck className="h-4 w-4" />
            Tandai sudah dibaca
          </Button>
        </div>
      </div>

      {unreadCount > 0 && (
        <Card className="border border-blue-100 bg-blue-50/50">
          <CardContent className="p-4 text-sm text-slate-600">
            Ada {unreadCount} notifikasi yang belum kamu baca.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="in_app">In-App</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">Memuat notifikasi...</CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">Belum ada notifikasi</CardContent>
            </Card>
          ) : (
            notifications.map((notif) => <NotificationRowCard key={notif.id} notification={notif} onDeleted={() => deleteNotification(notif.id)} onRefresh={refetch} />)
          )}
        </TabsContent>

        <TabsContent value="in_app" className="space-y-3 mt-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">Memuat notifikasi...</CardContent>
            </Card>
          ) : inAppNotifs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">Belum ada notifikasi in-app</CardContent>
            </Card>
          ) : (
            inAppNotifs.map((notif) => <NotificationRowCard key={notif.id} notification={notif} onDeleted={() => deleteNotification(notif.id)} onRefresh={refetch} />)
          )}
        </TabsContent>

        <TabsContent value="email" className="space-y-3 mt-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">Memuat notifikasi...</CardContent>
            </Card>
          ) : emailNotifs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">Belum ada notifikasi email</CardContent>
            </Card>
          ) : (
            emailNotifs.map((notif) => <NotificationRowCard key={notif.id} notification={notif} onDeleted={() => deleteNotification(notif.id)} onRefresh={refetch} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
    </DashboardBootstrap>
  )
}

function NotificationRowCard({
  notification,
  onDeleted,
  onRefresh,
}: {
  notification: NotificationRow
  onDeleted: () => void
  onRefresh?: () => void
}) {
  const navigate = useNavigate()
  const channelLabel = notification.channel === 'email' ? 'Email' : 'In-App'
  const statusColor =
    notification.status === 'delivered'
      ? 'text-emerald-600'
      : notification.status === 'sent'
        ? 'text-blue-600'
        : notification.status === 'failed'
          ? 'text-rose-600'
          : 'text-slate-500'

  const updatedAtLabel = formatDate(notification.createdAt)
  const isClickable = notification.id.startsWith('maint_')

  const handleNotificationClick = async () => {
    if (notification.status !== 'delivered') {
      try {
        await api.notifications.update(notification.id, { status: 'delivered' })
        onRefresh?.()
      } catch (err) {
        console.error('Gagal memperbarui status notifikasi:', err)
      }
    }

    if (isClickable) {
      const requestId = notification.id.split('_')[1]
      navigate({ to: '/dashboard/maintenance', search: { requestId } as any })
    }
  }

  return (
    <Card className={`border border-slate-200/80 transition duration-150 ${isClickable ? 'hover:border-blue-300 hover:shadow-md' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div
            onClick={isClickable ? handleNotificationClick : undefined}
            className={`space-y-1 flex-1 ${isClickable ? 'cursor-pointer hover:opacity-85' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {notification.subject ? (
                <p className="text-sm font-semibold text-slate-900">{notification.subject}</p>
              ) : (
                <p className="text-sm font-semibold text-slate-900">{channelLabel}</p>
              )}
              <span className={`text-xs font-medium ${statusColor}`}>{notification.status}</span>
            </div>
            <p className="text-sm text-muted-foreground">{notification.messageContent}</p>
            <p className="text-xs text-muted-foreground">{updatedAtLabel}</p>
            {isClickable && (
              <span className="text-[10px] text-blue-600 font-bold block mt-1 hover:underline">
                Klik untuk memproses keluhan &rarr;
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-rose-600 shrink-0"
            aria-label="Hapus notifikasi"
            onClick={onDeleted}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
