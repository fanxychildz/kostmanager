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
    updateProfile: (data: { name?: string; phone?: string }) =>
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
  },
  payments: {
    list: () => paymentsActions.listPayments(),
    get: (id: string) => paymentsActions.getPayment({ data: { id } }),
    create: (data: any) => paymentsActions.createPayment({ data }),
    update: (id: string, data: any) => paymentsActions.updatePayment({ data: { id, ...data } }),
    delete: (id: string) => paymentsActions.deletePayment({ data: { id } }),
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
    listConversations: () => chatActions.listChatConversations(),
    listMessages: (data: { tenantId: string }) => chatActions.listChatMessages({ data }),
    sendMessage: (data: { tenantId: string; message: string; sender: 'Tenant' | 'Landlord'; senderName: string }) => chatActions.sendChatMessage({ data }),
    markRead: (data: { tenantId: string }) => chatActions.markChatRead({ data }),
  },
  portal: {
    chat: {
      list: (params?: { tenantId?: string }) =>
        params?.tenantId
          ? chatActions.listChatMessages({ data: { tenantId: params.tenantId } })
          : Promise.resolve([]),
      save: (messages: any[]) =>
        Promise.resolve({ ok: true, count: messages.length }),
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
      list: () => Promise.resolve([]),
      save: (data: any[]) => Promise.resolve({ ok: true, count: data.length }),
    },
    register: (data: { email: string; password: string }) =>
      portalActions.portalRegister({ data }),
    profile: () => portalActions.getPortalProfile(),
    bills: () => portalActions.getPortalBills(),
  },
}
