import { db } from '../src/db';
import { tenants } from '../src/db/schema';

async function main() {
  console.log('Running modified tenants query...');
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
    .from(tenants);

  console.log('Success! QueryResult Count:', result.length);
  if (result.length > 0) {
    console.log('First Item keys:', Object.keys(result[0]));
    const mapped = result.map((t) => ({ ...t, image: null }));
    console.log('Mapped Item image:', mapped[0].image);
  }
}

main().catch(console.error);
