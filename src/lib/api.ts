import * as authActions from '~/server/auth-actions'
import * as chatActions from '~/server/chat'
import * as propertiesActions from '~/server/properties'
import * as unitsActions from '~/server/units'
import * as tenantsActions from '~/server/tenants'
import * as billsActions from '~/server/bills'
import * as paymentsActions from '~/server/payments'
import * as notificationsActions from '~/server/notifications'
import * as billingActions from '~/server/billing'
import * as usersActions from '~/server/users'
import * as portalActions from '~/server/portal'
import * as expensesActions from '~/server/expenses'
import * as maintenanceActions from '~/server/maintenance'
import * as announcementsActions from '~/server/announcements'
import * as meterReadingsActions from '~/server/meter-readings'
import * as inboxActions from '~/server/inbox'
import * as ownerBillingActions from '~/server/owner-billing'
import * as adminBillingActions from '~/server/admin-billing'


export const api = {
  auth: {
    signUp: (data: { email: string; password: string; name: string }) =>
      authActions.signUp({ data }),
    signIn: (data: { email: string; password: string }) =>
      authActions.signIn({ data }),
    signOut: () => authActions.signOut(),
    getSession: () => authActions.getSession(),
    signInSocial: (data: { provider: 'google'; callbackURL?: string }) =>
      authActions.signInSocial({ data }),
    updateProfile: (data: { name?: string; phone?: string; image?: string }) =>
      usersActions.updateProfile({ data }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      usersActions.changePassword({ data }),
  },
  properties: {
    list: () => propertiesActions.listProperties(),
    get: (id: string) => propertiesActions.getProperty({ data: { id } }),
    create: (data: any) => propertiesActions.createProperty({ data }),
    update: (id: string, data: any) => propertiesActions.updateProperty({ data: { id, ...data } }),
    delete: (id: string) => propertiesActions.deleteProperty({ data: { id } }),
  },
  units: {
    list: (propertyId?: string) => unitsActions.listUnits({ data: propertyId ? { propertyId } : undefined }),
    get: (id: string) => unitsActions.getUnit({ data: { id } }),
    create: (data: any) => unitsActions.createUnit({ data }),
    update: (id: string, data: any) => unitsActions.updateUnit({ data: { id, ...data } }),
    delete: (id: string) => unitsActions.deleteUnit({ data: { id } }),
  },
  tenants: {
    list: () => tenantsActions.listTenants(),
    get: (id: string) => tenantsActions.getTenant({ data: { id } }),
    create: (data: any) => tenantsActions.createTenant({ data }),
    update: (id: string, data: any) => tenantsActions.updateTenant({ data: { id, ...data } }),
    delete: (id: string) => tenantsActions.deleteTenant({ data: { id } }),
  },
  bills: {
    list: () => billsActions.listBills(),
    get: (id: string) => billsActions.getBill({ data: { id } }),
    create: (data: any) => billsActions.createBill({ data }),
    update: (id: string, data: any) => billsActions.updateBill({ data: { id, ...data } }),
    delete: (id: string) => billsActions.deleteBill({ data: { id } }),
    deleteMultiple: (ids: string[]) => billsActions.deleteMultipleBills({ data: { ids } }),
  },
  payments: {
    list: () => paymentsActions.listPayments(),
    get: (id: string) => paymentsActions.getPayment({ data: { id } }),
    getPaymentsByBill: (data: { billId: string }) => paymentsActions.getPaymentsByBill({ data }),
    create: (data: any) => paymentsActions.createPayment({ data }),
    update: (id: string, data: any) => paymentsActions.updatePayment({ data: { id, ...data } }),
    delete: (id: string) => paymentsActions.deletePayment({ data: { id } }),
    deleteMultiple: (ids: string[]) => paymentsActions.deleteMultiplePayments({ data: { ids } }),
  },
  inbox: {
    list: (params?: { propertyId?: string; category?: string; isRead?: boolean }) => inboxActions.listInbox({ data: params }),
    count: () => inboxActions.getInboxCount(),
    get: (id: string) => inboxActions.getInboxMessage({ data: { id } }),
    create: (data: any) => inboxActions.createInbox({ data }),
    markRead: (id: string) => inboxActions.markInboxRead({ data: { id } }),
    markAllRead: () => inboxActions.markAllInboxRead(),
    delete: (id: string) => inboxActions.deleteInbox({ data: { id } }),
  },

  notifications: {
    list: (params?: { recipientType?: string; channel?: string }) =>
      notificationsActions.listNotifications({ data: params }),
    get: (id: string) => notificationsActions.getNotification({ data: { id } }),
    create: (data: any) => notificationsActions.createNotification({ data }),
    update: (id: string, data: any) => notificationsActions.updateNotification({ data: { id, ...data } }),
    delete: (id: string) => notificationsActions.deleteNotification({ data: { id } }),
  },
  billing: {
    generate: () => billingActions.generateMonthlyBills(),
    checkOverdue: () => billingActions.checkOverdueBills(),
  },
  chat: {
    listConversations: () => chatActions.listTenantChatSummaries(),
    listMessages: (data: { tenantId: string }) => chatActions.listChatMessages({ data }),
    sendMessage: (data: { tenantId: string; message: string; sender: 'Tenant' | 'Landlord'; senderName: string }) => chatActions.sendChatMessage({ data }),
    markRead: (data: { tenantId: string }) => chatActions.markChatRead({ data }),
    deleteMessages: (data: { ids: string[]; tenantId: string }) => chatActions.deleteMultipleChatMessages({ data }),
    clearConversation: (data: { tenantId: string }) => chatActions.clearChatConversation({ data }),
  },
  portal: {
    chat: {
      list: (params?: { tenantId?: string }) =>
        params?.tenantId
          ? chatActions.listChatMessages({ data: { tenantId: params.tenantId } })
          : Promise.resolve([]),
      sendMessage: (data: {
        tenantId: string
        message: string
        sender: 'Tenant' | 'Landlord'
        senderName: string
      }) => chatActions.sendChatMessage({ data }),
      markRead: (data: { tenantId: string }) =>
        chatActions.markChatRead({ data }),
    },
    maintenance: {
      list: () =>
        portalActions.listPortalMaintenanceRequests(),
      get: (id: string) =>
        maintenanceActions.getMaintenanceRequest({ data: { id } }),
      create: (data: {
        title: string
        description: string
        category: string
        priority: string
        photoUrl?: string | null
      }) =>
        portalActions.createPortalMaintenanceRequest({ data }),
      updateStatus: (id: string, data: {
        status: 'pending' | 'in_progress' | 'resolved'
        noteText?: string | null
        repairCost?: number | null
      }) =>
        maintenanceActions.updateMaintenanceStatus({ data: { id, ...data } }),
      addUpdate: (id: string, text: string) =>
        maintenanceActions.addMaintenanceUpdate({ data: { id, text } }),
      delete: (id: string) =>
        portalActions.deletePortalMaintenanceRequest({ data: { id } }),
    },
    register: (data: { email: string; password: string }) =>
      portalActions.portalRegister({ data }),
    profile: () => portalActions.getPortalProfile(),
    bills: () => portalActions.getPortalBills(),
    announcements: {
      list: (params?: { page?: number; limit?: number }) =>
        (announcementsActions as any).listTenantAnnouncements?.({ data: params }) ?? Promise.resolve({ items: [], total: 0, page: 1, limit: 20 }),
    },
  },
  maintenance: {
    list: (params?: { status?: string; propertyId?: string }) =>
      maintenanceActions.listMaintenanceRequests({ data: params }),
    get: (id: string) =>
      maintenanceActions.getMaintenanceRequest({ data: { id } }),
    create: (data: {
      propertyId: string
      unitId: string
      title: string
      description: string
      category: string
      priority: string
      photoUrl?: string | null
    }) =>
      maintenanceActions.createMaintenanceRequest({ data }),
    updateStatus: (id: string, data: {
      status: 'pending' | 'in_progress' | 'resolved'
      noteText?: string | null
      repairCost?: number | null
    }) =>
      maintenanceActions.updateMaintenanceStatus({ data: { id, ...data } }),
    addUpdate: (id: string, text: string) =>
      maintenanceActions.addMaintenanceUpdate({ data: { id, text } }),
    delete: (id: string) =>
      maintenanceActions.deleteMaintenanceRequest({ data: { id } }),
    deleteMultiple: (ids: string[]) =>
      maintenanceActions.deleteMultipleMaintenanceRequests({ data: { ids } }),
  },
  expenses: {
    list: () => expensesActions.listExpenses(),
    create: (data: {
      propertyId: string
      title: string
      amount: number
      category: string
      date: string | Date
      notes?: string | null
    }) => expensesActions.createExpense({ data }),
    update: (id: string, data: {
      propertyId: string
      title: string
      amount: number
      category: string
      date: string | Date
      notes?: string | null
    }) => expensesActions.updateExpense({ data: { id, ...data } }),
    delete: (id: string) => expensesActions.deleteExpense({ data: { id } }),
    deleteMultiple: (ids: string[]) => expensesActions.deleteMultipleExpenses({ data: { ids } }),
  },
  announcements: {
    list: (params?: { propertyId?: string; audience?: string; page?: number; limit?: number }) =>
      announcementsActions.listOwnerAnnouncements({ data: params }),
    get: (id: string) => announcementsActions.getAnnouncement({ data: { id } }),
    create: (data: {
      propertyId: string
      title: string
      body: string
      channel: 'owner' | 'tenant' | 'all'
      audience: 'all' | 'property' | 'unit' | 'tenant'
      targetTenantId?: string | null
    }) => announcementsActions.createAnnouncement({ data }),
    update: (id: string, data: {
      title?: string
      body?: string
      channel?: 'owner' | 'tenant' | 'all'
      audience?: 'all' | 'property' | 'unit' | 'tenant'
      targetTenantId?: string | null
    }) => announcementsActions.updateAnnouncement({ data: { id, ...data } }),
    delete: (id: string) => announcementsActions.deleteAnnouncement({ data: { id } }),
  },
  meterReadings: {
    list: (params?: { unitId?: string; type?: 'electricity' | 'water' }) =>
      meterReadingsActions.listMeterReadings({ data: params }),
    create: (data: {
      type: 'electricity' | 'water'
      value: number
      readingDate: string
      tariffPerUnit: number
      notes?: string
      unitId: string
    }) => meterReadingsActions.createMeterReading({ data }),
  },
  ownerBilling: {
    listInvoices: () => ownerBillingActions.listInvoices(),
    submitPaymentProof: (data: { invoiceId: string; proofImage: string }) => ownerBillingActions.submitPaymentProof({ data }),
    simulateSubscriptionState: (action: 'expire' | 'activate') => ownerBillingActions.simulateSubscriptionState({ data: action }),
  },
  adminBilling: {
    listOwners: () => adminBillingActions.listAllOwners(),
    approvePayment: (invoiceId: string) => adminBillingActions.approveOwnerPayment({ data: invoiceId }),
    rejectPayment: (invoiceId: string) => adminBillingActions.rejectOwnerPayment({ data: invoiceId }),
    createInvoice: (data: { userId: string; amount: number; periodMonth: number; periodYear: number }) => adminBillingActions.createOwnerInvoiceManual({ data }),
    forceExpire: (userId: string) => adminBillingActions.forceExpireSubscription({ data: userId }),
  },
}


