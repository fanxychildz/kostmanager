import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from './db'
import { users, properties, units, tenants, bills, payments } from './db/schema'
import { auth } from './server/auth'

const OWNER_EMAIL = 'owner@demo.com'
const OWNER_PASSWORD = 'password123'
const OWNER_NAME = 'Budi Wijaya'

// The first tenant stays claimable on the portal (userId left NULL).
const PORTAL_TENANT_EMAIL = 'tenant@demo.com'

type PropSpec = { name: string; address: string; city: string; province: string; type: 'kost' | 'kontrakan' | 'apartemen' }
type UnitSpec = { property: string; unitNumber: string; type: string; priceMonthly: number }
type TenantSpec = {
  email: string
  fullName: string
  ktpNumber: string
  phone: string
  occupation: string
  property: string
  unitNumber: string
  status: 'active' | 'inactive' | 'blacklisted'
  depositAmount: number
}

const PROPERTIES: PropSpec[] = [
  { name: 'Kost Melati', address: 'Jl. Melati No. 15, RT 03/RW 05', city: 'Jakarta Selatan', province: 'DKI Jakarta', type: 'kost' },
  { name: 'Kontrakan Mangga Besar', address: 'Jl. Mangga Besar Raya No. 42', city: 'Jakarta Barat', province: 'DKI Jakarta', type: 'kontrakan' },
]

const UNITS: UnitSpec[] = [
  { property: 'Kost Melati', unitNumber: '101', type: 'AC Single', priceMonthly: 1500000 },
  { property: 'Kost Melati', unitNumber: '102', type: 'AC Double', priceMonthly: 2000000 },
  { property: 'Kost Melati', unitNumber: '103', type: 'Non-AC Single', priceMonthly: 1000000 },
  { property: 'Kost Melati', unitNumber: '104', type: 'AC Single', priceMonthly: 1500000 },
  { property: 'Kost Melati', unitNumber: '105', type: 'AC Premium', priceMonthly: 2500000 },
  { property: 'Kontrakan Mangga Besar', unitNumber: 'A1', type: 'Kontrakan 2BR', priceMonthly: 3500000 },
  { property: 'Kontrakan Mangga Besar', unitNumber: 'A2', type: 'Kontrakan 3BR', priceMonthly: 4500000 },
]

const TENANTS: TenantSpec[] = [
  { email: PORTAL_TENANT_EMAIL, fullName: 'Ahmad Fauzi', ktpNumber: '3174012345678901', phone: '081234567890', occupation: 'Karyawan Swasta', property: 'Kost Melati', unitNumber: '101', status: 'active', depositAmount: 1500000 },
  { email: 'siti@demo.com', fullName: 'Siti Nurhaliza', ktpNumber: '3174023456789012', phone: '082345678901', occupation: 'Mahasiswa', property: 'Kost Melati', unitNumber: '102', status: 'active', depositAmount: 2000000 },
  { email: 'budi@demo.com', fullName: 'Budi Santoso', ktpNumber: '3174034567890123', phone: '083456789012', occupation: 'Freelancer', property: 'Kost Melati', unitNumber: '103', status: 'active', depositAmount: 1000000 },
  { email: 'dewi@demo.com', fullName: 'Dewi Lestari', ktpNumber: '3174045678901234', phone: '084567890123', occupation: 'Dokter', property: 'Kost Melati', unitNumber: '104', status: 'active', depositAmount: 1500000 },
  { email: 'rudi@demo.com', fullName: 'Rudi Hermawan', ktpNumber: '3174056789012345', phone: '085678901234', occupation: 'Wiraswasta', property: 'Kontrakan Mangga Besar', unitNumber: 'A1', status: 'active', depositAmount: 7000000 },
  { email: 'rina@demo.com', fullName: 'Rina Wati', ktpNumber: '3174067890123456', phone: '086789012345', occupation: 'Guru', property: 'Kontrakan Mangga Besar', unitNumber: 'A2', status: 'inactive', depositAmount: 9000000 },
]

// Per-tenant electricity charge (deterministic so re-runs are stable).
const ELECTRICITY = [250000, 350000, 200000, 400000, 500000, 300000]
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'qris_manual'] as const

async function main() {
  const now = new Date()

  // 1. Owner account (better-auth hashes the password).
  let owner = (await db.select().from(users).where(eq(users.email, OWNER_EMAIL)))[0]
  if (!owner) {
    await auth.api.signUpEmail({ body: { email: OWNER_EMAIL, password: OWNER_PASSWORD, name: OWNER_NAME } })
    owner = (await db.select().from(users).where(eq(users.email, OWNER_EMAIL)))[0]
    console.log('✓ owner', OWNER_EMAIL)
  } else {
    console.log('• owner', OWNER_EMAIL)
  }

  // 2. Properties (find-or-create by name).
  const propByName = new Map<string, typeof properties.$inferSelect>()
  for (const spec of PROPERTIES) {
    let p = (await db.select().from(properties).where(and(eq(properties.ownerId, owner.id), eq(properties.name, spec.name))))[0]
    if (!p) {
      p = (await db.insert(properties).values({ id: nanoid(), ownerId: owner.id, ...spec, createdAt: now, updatedAt: now }).returning())[0]
      console.log('  ✓ property', spec.name)
    }
    propByName.set(spec.name, p)
  }

  // 3. Units (find-or-create by property + unitNumber).
  const unitByKey = new Map<string, typeof units.$inferSelect>()
  for (const spec of UNITS) {
    const property = propByName.get(spec.property)!
    let u = (await db.select().from(units).where(and(eq(units.propertyId, property.id), eq(units.unitNumber, spec.unitNumber))))[0]
    if (!u) {
      u = (
        await db
          .insert(units)
          .values({
            id: nanoid(),
            propertyId: property.id,
            unitNumber: spec.unitNumber,
            type: spec.type,
            priceMonthly: spec.priceMonthly,
            status: 'available',
            facilities: ['AC', 'WiFi', 'Kasur', 'Lemari'],
            createdAt: now,
            updatedAt: now,
          })
          .returning()
      )[0]
      console.log('  ✓ unit', spec.property, spec.unitNumber)
    }
    unitByKey.set(`${spec.property}/${spec.unitNumber}`, u)
  }

  // 4. Tenants (find-or-create by email). Keep PORTAL_TENANT_EMAIL claimable.
  let createdTenants = 0
  const tenantByEmail = new Map<string, typeof tenants.$inferSelect>()
  for (const spec of TENANTS) {
    let t = (await db.select().from(tenants).where(eq(tenants.email, spec.email)))[0]
    if (!t) {
      const unit = unitByKey.get(`${spec.property}/${spec.unitNumber}`)!
      t = (
        await db
          .insert(tenants)
          .values({
            id: nanoid(),
            unitId: unit.id,
            propertyId: unit.propertyId,
            fullName: spec.fullName,
            ktpNumber: spec.ktpNumber,
            phone: spec.phone,
            email: spec.email,
            occupation: spec.occupation,
            checkInDate: new Date(2025, 5, 1),
            depositAmount: spec.depositAmount,
            status: spec.status,
            createdAt: now,
            updatedAt: now,
          })
          .returning()
      )[0]
      // active tenant occupies its unit; inactive frees it
      await db
        .update(units)
        .set({ status: spec.status === 'active' ? 'occupied' : 'available', updatedAt: now })
        .where(eq(units.id, unit.id))
      createdTenants++
    }
    tenantByEmail.set(spec.email, t)
  }
  console.log(`✓ tenants: ${createdTenants} new, ${TENANTS.length} total`)

  // 5. Bills — 3 months per active tenant (Mar/Apr paid, May pending; one overdue).
  const periods: { month: number; year: number; status: 'paid' | 'pending' | 'overdue' }[] = [
    { month: 3, year: 2026, status: 'paid' },
    { month: 4, year: 2026, status: 'paid' },
    { month: 5, year: 2026, status: 'pending' },
  ]
  let createdBills = 0
  for (let i = 0; i < TENANTS.length; i++) {
    const spec = TENANTS[i]
    if (spec.status !== 'active') continue
    const t = tenantByEmail.get(spec.email)!
    const unit = unitByKey.get(`${spec.property}/${spec.unitNumber}`)!
    const electricity = ELECTRICITY[i % ELECTRICITY.length]
    for (const p of periods) {
      const exists = (
        await db
          .select()
          .from(bills)
          .where(and(eq(bills.tenantId, t.id), eq(bills.periodMonth, p.month), eq(bills.periodYear, p.year)))
      )[0]
      if (exists) continue
      // Budi (index 2) is the overdue example for May.
      const status = p.status === 'pending' && i === 2 ? 'overdue' : p.status
      const rent = unit.priceMonthly
      const water = 50000
      const wifi = 100000
      const other = 0
      const total = rent + electricity + water + wifi + other
      await db.insert(bills).values({
        id: nanoid(),
        tenantId: t.id,
        unitId: unit.id,
        periodMonth: p.month,
        periodYear: p.year,
        rentAmount: rent,
        electricityAmount: electricity,
        waterAmount: water,
        wifiAmount: wifi,
        otherAmount: other,
        totalAmount: total,
        dueDate: new Date(p.year, p.month - 1, 5),
        status,
        createdAt: now,
        updatedAt: now,
      })
      createdBills++
    }
  }
  console.log(`✓ bills: ${createdBills} new`)

  // 6. Payments — one recorded payment for every paid bill that lacks one.
  const paidBills = await db.select().from(bills).where(eq(bills.status, 'paid'))
  let createdPayments = 0
  let methodIdx = 0
  for (const bill of paidBills) {
    const already = (await db.select().from(payments).where(eq(payments.billId, bill.id)))[0]
    if (already) continue
    // only seed payments for this owner's tenants
    const t = (await db.select().from(tenants).where(eq(tenants.id, bill.tenantId)))[0]
    if (!t) continue
    const ownsIt = (await db.select().from(properties).where(and(eq(properties.id, t.propertyId), eq(properties.ownerId, owner.id))))[0]
    if (!ownsIt) continue

    const method = PAYMENT_METHODS[methodIdx % PAYMENT_METHODS.length]
    methodIdx++
    await db.insert(payments).values({
      id: nanoid(),
      billId: bill.id,
      recordedBy: owner.id,
      paymentMethod: method,
      amount: bill.totalAmount,
      paidAt: new Date(bill.periodYear, bill.periodMonth - 1, 3),
      notes: method === 'bank_transfer' ? 'Transfer BCA' : null,
      status: 'recorded',
      createdAt: now,
      updatedAt: now,
    })
    createdPayments++
  }
  console.log(`✓ payments: ${createdPayments} new`)

  console.log('\n=== DEMO CREDENTIALS ===')
  console.log('Owner  → /login            :', OWNER_EMAIL, '/', OWNER_PASSWORD)
  console.log('Tenant → /portal/register  :', PORTAL_TENANT_EMAIL, '(pick any password ≥ 8 chars)')
  process.exit(0)
}

main().catch((err) => {
  console.error('seed failed:', err)
  process.exit(1)
})
