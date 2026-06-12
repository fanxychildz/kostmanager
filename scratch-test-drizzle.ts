import { db } from './src/db';
import { bills, tenants, units, properties } from './src/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

async function run() {
  try {
    const ownerId = 'BHA26HuCyGL74XCq0pRoufbw1qWTaYZo'; // owner@demo.com ID

    console.log('1. Querying properties for owner via Drizzle...');
    const ownerProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.ownerId, ownerId));
    const propertyIds = ownerProperties.map((p) => p.id);
    console.log('Property IDs:', propertyIds);

    if (propertyIds.length === 0) {
      console.log('No properties found.');
      return;
    }

    console.log('2. Querying bills via Drizzle...');
    const conditions = [inArray(tenants.propertyId, propertyIds)];
    const billRows = await db
      .select({
        id: bills.id,
        tenantId: bills.tenantId,
        unitId: bills.unitId,
        periodMonth: bills.periodMonth,
        periodYear: bills.periodYear,
        rentAmount: bills.rentAmount,
        electricityAmount: bills.electricityAmount,
        waterAmount: bills.waterAmount,
        wifiAmount: bills.wifiAmount,
        otherAmount: bills.otherAmount,
        totalAmount: bills.totalAmount,
        dueDate: bills.dueDate,
        status: bills.status,
        createdAt: bills.createdAt,
        updatedAt: bills.updatedAt,
        tenantName: tenants.fullName,
        unitNumber: units.unitNumber,
      })
      .from(bills)
      .innerJoin(tenants, eq(tenants.id, bills.tenantId))
      .leftJoin(units, eq(units.id, bills.unitId))
      .where(and(...conditions))
      .orderBy(desc(bills.dueDate))
      .limit(200);

    console.log('Fetched bills count:', billRows.length);
    if (billRows.length > 0) {
      console.log('Sample bill:', billRows[0]);
    }

    console.log('3. Querying tenants via Drizzle...');
    const tenantRows = await db
      .select({
        id: tenants.id,
        userId: tenants.userId,
        unitId: tenants.unitId,
        propertyId: tenants.propertyId,
        fullName: tenants.fullName,
        ktpNumber: tenants.ktpNumber,
        ktpPhotoUrl: tenants.ktpPhotoUrl,
        phone: tenants.phone,
        email: tenants.email,
        occupation: tenants.occupation,
        checkInDate: tenants.checkInDate,
        checkOutDate: tenants.checkOutDate,
        depositAmount: tenants.depositAmount,
        status: tenants.status,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants);
    const filteredTenants = tenantRows.filter((t) => propertyIds.includes(t.propertyId));
    console.log('Filtered tenants count:', filteredTenants.length);

    console.log('4. Querying units via Drizzle...');
    const unitRows = await db.select().from(units);
    const filteredUnits = unitRows.filter((u) => propertyIds.includes(u.propertyId));
    console.log('Filtered units count:', filteredUnits.length);

    console.log('Success! All Drizzle queries completed successfully.');
  } catch (err: any) {
    console.error('Drizzle query failed with error:', err.message || err);
  }
}

run().then(() => process.exit(0));
