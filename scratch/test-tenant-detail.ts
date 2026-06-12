import { db } from '../src/db';
import { tenants, properties } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  console.log('Testing direct tenant detail query...');
  
  // Ambil ID tenant pertama di DB lokal
  const tenantRows = await db.select().from(tenants).limit(1);
  if (tenantRows.length === 0) {
    console.log('No tenants found in local database.');
    return;
  }
  
  const targetId = tenantRows[0].id;
  console.log('Target Tenant ID:', targetId);
  
  // Lakukan query persis seperti getTenant server action
  const result = await db
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
    .from(tenants)
    .where(eq(tenants.id, targetId));

  console.log('QueryResult Count:', result.length);
  if (result.length > 0) {
    console.log('Tenant Data:', result[0]);
    
    // Test check ownership query
    // Kita gunakan ownerId dummy dari property
    const propId = result[0].propertyId;
    const propRow = await db.select().from(properties).where(eq(properties.id, propId)).limit(1);
    if (propRow.length > 0) {
      console.log('Ownership check matches property:', propRow[0].name);
    } else {
      console.log('Property not found for id:', propId);
    }
  }
}

main().catch(console.error);
