import { db } from '../src/db';
import { properties } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Testing properties list query...');
  try {
    const propertiesWithCounts = await db
      .select({
        id: properties.id,
        ownerId: properties.ownerId,
        name: properties.name,
        address: properties.address,
        city: properties.city,
        province: properties.province,
        type: properties.type,
        image: properties.image, // <--- ini kolom yang tidak ada di DB fisik
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
      })
      .from(properties);

    console.log('Success count:', propertiesWithCounts.length);
  } catch (e) {
    console.error('Error during query:', e);
  }
}

main().catch(console.error);
