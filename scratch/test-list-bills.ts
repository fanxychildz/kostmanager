import { db } from '../src/db';
import { bills, tenants, units } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';

async function main() {
  console.log('Running bills query...');
  try {
    const rows = await db
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
      .orderBy(desc(bills.dueDate))
      .limit(5);

    console.log('Success! Rows count:', rows.length);
    console.log('First bill:', rows[0]);
  } catch (err) {
    console.error('Error during query:', err);
  }
}

main().catch(console.error);
