export interface Property {
  id: string
  name: string
  address: string
  city: string
  province: string
  type: 'kost' | 'kontrakan' | 'apartemen'
  totalUnits: number
  occupiedUnits: number
  createdAt: string
}

export interface Unit {
  id: string
  propertyId: string
  unitNumber: string
  type: string
  priceMonthly: number
  status: 'available' | 'occupied' | 'maintenance'
  facilities: string[]
  tenantId?: string
}

export interface Tenant {
  id: string
  unitId: string
  propertyId: string
  fullName: string
  ktpNumber: string
  phone: string
  email: string
  occupation?: string
  checkInDate: string
  checkOutDate?: string
  depositAmount: number
  status: 'active' | 'inactive' | 'blacklisted'
}

export interface Bill {
  id: string
  tenantId: string
  unitId: string
  periodMonth: number
  periodYear: number
  rentAmount: number
  electricityAmount: number
  waterAmount: number
  wifiAmount: number
  otherAmount: number
  totalAmount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  createdAt: string
  tenantName?: string
  unitNumber?: string
}

export interface Payment {
  id: string
  billId: string
  recordedBy: string
  paymentMethod: 'cash' | 'bank_transfer' | 'qris_manual' | 'other'
  amount: number
  paidAt: string
  notes?: string
  status: 'recorded' | 'void'
  tenantName?: string
  unitNumber?: string
}

export interface Notification {
  id: string
  recipientType: 'tenant' | 'owner'
  recipientId: string
  channel: 'email' | 'in_app'
  type: 'bill_reminder' | 'payment_confirm' | 'announcement' | 'overdue'
  relatedBillId?: string
  subject?: string
  messageContent: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  sentAt: string
}

export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    name: 'Kost Melati',
    address: 'Jl. Melati No. 15, RT 03/RW 05',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    type: 'kost',
    totalUnits: 12,
    occupiedUnits: 10,
    createdAt: '2024-01-15',
  },
  {
    id: 'prop-2',
    name: 'Kontrakan Mangga Besar',
    address: 'Jl. Mangga Besar Raya No. 42',
    city: 'Jakarta Barat',
    province: 'DKI Jakarta',
    type: 'kontrakan',
    totalUnits: 6,
    occupiedUnits: 5,
    createdAt: '2024-03-20',
  },
  {
    id: 'prop-3',
    name: 'Kost Anggrek',
    address: 'Jl. Anggrek Cakra No. 8',
    city: 'Bandung',
    province: 'Jawa Barat',
    type: 'kost',
    totalUnits: 20,
    occupiedUnits: 18,
    createdAt: '2024-06-10',
  },
]

export const mockUnits: Unit[] = [
  { id: 'unit-1', propertyId: 'prop-1', unitNumber: '101', type: 'AC Single', priceMonthly: 1500000, status: 'occupied', facilities: ['AC', 'Kasur', 'Lemari', 'WiFi'], tenantId: 'tenant-1' },
  { id: 'unit-2', propertyId: 'prop-1', unitNumber: '102', type: 'AC Double', priceMonthly: 2000000, status: 'occupied', facilities: ['AC', 'Kasur', 'Lemari', 'WiFi', 'Kamar Mandi Dalam'], tenantId: 'tenant-2' },
  { id: 'unit-3', propertyId: 'prop-1', unitNumber: '103', type: 'Non-AC Single', priceMonthly: 1000000, status: 'available', facilities: ['Kipas Angin', 'Lemari'] },
  { id: 'unit-4', propertyId: 'prop-1', unitNumber: '104', type: 'AC Single', priceMonthly: 1500000, status: 'occupied', facilities: ['AC', 'Kasur', 'Lemari', 'WiFi'], tenantId: 'tenant-3' },
  { id: 'unit-5', propertyId: 'prop-1', unitNumber: '201', type: 'AC Double', priceMonthly: 2200000, status: 'occupied', facilities: ['AC', 'Kasur', 'Lemari', 'WiFi', 'Kamar Mandi Dalam', 'TV'], tenantId: 'tenant-4' },
  { id: 'unit-6', propertyId: 'prop-1', unitNumber: '202', type: 'Non-AC Single', priceMonthly: 1000000, status: 'maintenance', facilities: ['Kipas Angin', 'Lemari'] },
  { id: 'unit-7', propertyId: 'prop-2', unitNumber: 'A1', type: 'Kontrakan 2BR', priceMonthly: 3500000, status: 'occupied', facilities: ['2 Kamar Tidur', 'Dapur', 'Carport'], tenantId: 'tenant-5' },
  { id: 'unit-8', propertyId: 'prop-2', unitNumber: 'A2', type: 'Kontrakan 3BR', priceMonthly: 4500000, status: 'occupied', facilities: ['3 Kamar Tidur', 'Dapur', 'Garasi', 'Taman'], tenantId: 'tenant-6' },
  { id: 'unit-9', propertyId: 'prop-2', unitNumber: 'B1', type: 'Kontrakan 2BR', priceMonthly: 3500000, status: 'available', facilities: ['2 Kamar Tidur', 'Dapur', 'Carport'] },
  { id: 'unit-10', propertyId: 'prop-3', unitNumber: '101', type: 'AC Premium', priceMonthly: 2500000, status: 'occupied', facilities: ['AC', 'Kasur Queen', 'Lemari', 'WiFi', 'Kamar Mandi Dalam', 'Meja Kerja'], tenantId: 'tenant-7' },
]

export const mockTenants: Tenant[] = [
  { id: 'tenant-1', unitId: 'unit-1', propertyId: 'prop-1', fullName: 'Ahmad Fauzi', ktpNumber: '3174012345678901', phone: '081234567890', email: 'ahmad.fauzi@email.com', occupation: 'Karyawan Swasta', checkInDate: '2024-06-01', depositAmount: 1500000, status: 'active' },
  { id: 'tenant-2', unitId: 'unit-2', propertyId: 'prop-1', fullName: 'Siti Nurhaliza', ktpNumber: '3174023456789012', phone: '082345678901', email: 'siti.nur@email.com', occupation: 'Mahasiswa', checkInDate: '2024-03-15', depositAmount: 2000000, status: 'active' },
  { id: 'tenant-3', unitId: 'unit-4', propertyId: 'prop-1', fullName: 'Budi Santoso', ktpNumber: '3174034567890123', phone: '083456789012', email: 'budi.s@email.com', occupation: 'Freelancer', checkInDate: '2024-08-01', depositAmount: 1500000, status: 'active' },
  { id: 'tenant-4', unitId: 'unit-5', propertyId: 'prop-1', fullName: 'Dewi Lestari', ktpNumber: '3174045678901234', phone: '084567890123', email: 'dewi.l@email.com', occupation: 'Dokter', checkInDate: '2024-01-10', depositAmount: 2200000, status: 'active' },
  { id: 'tenant-5', unitId: 'unit-7', propertyId: 'prop-2', fullName: 'Rudi Hermawan', ktpNumber: '3174056789012345', phone: '085678901234', email: 'rudi.h@email.com', occupation: 'Wiraswasta', checkInDate: '2024-04-01', depositAmount: 7000000, status: 'active' },
  { id: 'tenant-6', unitId: 'unit-8', propertyId: 'prop-2', fullName: 'Rina Wati', ktpNumber: '3174067890123456', phone: '086789012345', email: 'rina.w@email.com', occupation: 'Guru', checkInDate: '2024-05-15', depositAmount: 9000000, status: 'active' },
  { id: 'tenant-7', unitId: 'unit-10', propertyId: 'prop-3', fullName: 'Joko Widodo', ktpNumber: '3273078901234567', phone: '087890123456', email: 'joko.w@email.com', occupation: 'Engineer', checkInDate: '2024-07-01', depositAmount: 2500000, status: 'active' },
]

export const mockBills: Bill[] = [
  { id: 'bill-1', tenantId: 'tenant-1', unitId: 'unit-1', periodMonth: 5, periodYear: 2026, rentAmount: 1500000, electricityAmount: 250000, waterAmount: 75000, wifiAmount: 150000, otherAmount: 50000, totalAmount: 2025000, dueDate: '2026-05-05', status: 'paid', createdAt: '2026-04-25', tenantName: 'Ahmad Fauzi', unitNumber: '101' },
  { id: 'bill-2', tenantId: 'tenant-2', unitId: 'unit-2', periodMonth: 5, periodYear: 2026, rentAmount: 2000000, electricityAmount: 350000, waterAmount: 100000, wifiAmount: 150000, otherAmount: 50000, totalAmount: 2650000, dueDate: '2026-05-05', status: 'paid', createdAt: '2026-04-25', tenantName: 'Siti Nurhaliza', unitNumber: '102' },
  { id: 'bill-3', tenantId: 'tenant-3', unitId: 'unit-4', periodMonth: 5, periodYear: 2026, rentAmount: 1500000, electricityAmount: 200000, waterAmount: 75000, wifiAmount: 150000, otherAmount: 50000, totalAmount: 1975000, dueDate: '2026-05-05', status: 'overdue', createdAt: '2026-04-25', tenantName: 'Budi Santoso', unitNumber: '104' },
  { id: 'bill-4', tenantId: 'tenant-4', unitId: 'unit-5', periodMonth: 5, periodYear: 2026, rentAmount: 2200000, electricityAmount: 400000, waterAmount: 120000, wifiAmount: 150000, otherAmount: 50000, totalAmount: 2920000, dueDate: '2026-05-05', status: 'pending', createdAt: '2026-04-25', tenantName: 'Dewi Lestari', unitNumber: '201' },
  { id: 'bill-5', tenantId: 'tenant-5', unitId: 'unit-7', periodMonth: 5, periodYear: 2026, rentAmount: 3500000, electricityAmount: 500000, waterAmount: 150000, wifiAmount: 200000, otherAmount: 100000, totalAmount: 4450000, dueDate: '2026-05-05', status: 'paid', createdAt: '2026-04-25', tenantName: 'Rudi Hermawan', unitNumber: 'A1' },
  { id: 'bill-6', tenantId: 'tenant-6', unitId: 'unit-8', periodMonth: 5, periodYear: 2026, rentAmount: 4500000, electricityAmount: 600000, waterAmount: 200000, wifiAmount: 200000, otherAmount: 100000, totalAmount: 5600000, dueDate: '2026-05-05', status: 'pending', createdAt: '2026-04-25', tenantName: 'Rina Wati', unitNumber: 'A2' },
  { id: 'bill-7', tenantId: 'tenant-7', unitId: 'unit-10', periodMonth: 5, periodYear: 2026, rentAmount: 2500000, electricityAmount: 300000, waterAmount: 100000, wifiAmount: 200000, otherAmount: 75000, totalAmount: 3175000, dueDate: '2026-05-05', status: 'paid', createdAt: '2026-04-25', tenantName: 'Joko Widodo', unitNumber: '101' },
  { id: 'bill-8', tenantId: 'tenant-1', unitId: 'unit-1', periodMonth: 6, periodYear: 2026, rentAmount: 1500000, electricityAmount: 275000, waterAmount: 80000, wifiAmount: 150000, otherAmount: 50000, totalAmount: 2055000, dueDate: '2026-06-05', status: 'pending', createdAt: '2026-05-25', tenantName: 'Ahmad Fauzi', unitNumber: '101' },
  { id: 'bill-9', tenantId: 'tenant-2', unitId: 'unit-2', periodMonth: 6, periodYear: 2026, rentAmount: 2000000, electricityAmount: 320000, waterAmount: 95000, wifiAmount: 150000, otherAmount: 50000, totalAmount: 2615000, dueDate: '2026-06-05', status: 'pending', createdAt: '2026-05-25', tenantName: 'Siti Nurhaliza', unitNumber: '102' },
]

export const mockPayments: Payment[] = [
  { id: 'pay-1', billId: 'bill-1', recordedBy: 'user-1', paymentMethod: 'bank_transfer', amount: 2025000, paidAt: '2026-05-03', notes: 'Transfer BCA', status: 'recorded', tenantName: 'Ahmad Fauzi', unitNumber: '101' },
  { id: 'pay-2', billId: 'bill-2', recordedBy: 'user-1', paymentMethod: 'cash', amount: 2650000, paidAt: '2026-05-04', status: 'recorded', tenantName: 'Siti Nurhaliza', unitNumber: '102' },
  { id: 'pay-3', billId: 'bill-5', recordedBy: 'user-1', paymentMethod: 'bank_transfer', amount: 4450000, paidAt: '2026-05-02', notes: 'Transfer Mandiri', status: 'recorded', tenantName: 'Rudi Hermawan', unitNumber: 'A1' },
  { id: 'pay-4', billId: 'bill-7', recordedBy: 'user-1', paymentMethod: 'qris_manual', amount: 3175000, paidAt: '2026-05-05', status: 'recorded', tenantName: 'Joko Widodo', unitNumber: '101' },
]

export const mockNotifications: Notification[] = [
  { id: 'notif-1', recipientType: 'tenant', recipientId: 'tenant-1', channel: 'email', type: 'bill_reminder', relatedBillId: 'bill-8', subject: 'Tagihan Bulan Juni 2026', messageContent: 'Tagihan Anda untuk bulan Juni 2026 sebesar Rp 2.055.000 telah diterbitkan. Jatuh tempo tanggal 5 Juni 2026.', status: 'sent', sentAt: '2026-05-25T08:00:00Z' },
  { id: 'notif-2', recipientType: 'tenant', recipientId: 'tenant-3', channel: 'in_app', type: 'overdue', relatedBillId: 'bill-3', messageContent: 'Tagihan bulan Mei 2026 sebesar Rp 1.975.000 sudah melewati jatuh tempo. Segera lakukan pembayaran.', status: 'delivered', sentAt: '2026-05-06T08:00:00Z' },
  { id: 'notif-3', recipientType: 'owner', recipientId: 'user-1', channel: 'in_app', type: 'payment_confirm', relatedBillId: 'bill-1', messageContent: 'Pembayaran dari Ahmad Fauzi (Unit 101) sebesar Rp 2.025.000 telah dicatat.', status: 'delivered', sentAt: '2026-05-03T10:30:00Z' },
  { id: 'notif-4', recipientType: 'tenant', recipientId: 'tenant-2', channel: 'email', type: 'payment_confirm', relatedBillId: 'bill-2', subject: 'Konfirmasi Pembayaran', messageContent: 'Pembayaran Anda sebesar Rp 2.650.000 untuk tagihan bulan Mei 2026 telah tercatat. Terima kasih!', status: 'sent', sentAt: '2026-05-04T14:00:00Z' },
  { id: 'notif-5', recipientType: 'owner', recipientId: 'user-1', channel: 'in_app', type: 'announcement', messageContent: 'Laporan bulanan Mei 2026 sudah tersedia. Klik untuk melihat detail.', status: 'delivered', sentAt: '2026-05-28T09:00:00Z' },
]

export const dashboardMetrics = {
  totalIncome: 12275000,
  totalPending: 11190000,
  totalOverdue: 1975000,
  occupancyRate: 87,
  totalUnits: 38,
  occupiedUnits: 33,
  availableUnits: 3,
  maintenanceUnits: 2,
  monthlyIncome: [
    { month: 'Jan', amount: 18500000 },
    { month: 'Feb', amount: 19200000 },
    { month: 'Mar', amount: 20100000 },
    { month: 'Apr', amount: 19800000 },
    { month: 'Mei', amount: 21500000 },
    { month: 'Jun', amount: 12275000 },
  ],
}
