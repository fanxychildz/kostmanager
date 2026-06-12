import { createClient } from '@libsql/client';

const dbUrl = 'libsql://kost-management-fanxychildz.aws-us-west-2.turso.io';
const dbToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MjA3ODIsImlkIjoiMDE5ZWE3MTctMjAwMS03ZjZlLThkNTktZWNkYzcxMGRkMTU5IiwicmlkIjoiMjM1M2NkOTctMGRkMS00MDAxLTliYjAtZDE2OTkwMTIyZjAzIn0.Kn_e7FEKkmAvrJGK_23q4qw2oAq1JVjQfeguiuZ_Fe7Xa00pBqcAiQuZeJk3T6WiFlsTnyDAGxEaxyHpOrLiBw';

async function run() {
  const client = createClient({ url: dbUrl, authToken: dbToken });
  try {
    const ownerId = 'BHA26HuCyGL74XCq0pRoufbw1qWTaYZo'; // owner@demo.com ID

    console.log('1. Fetching owner properties...');
    const propsRes = await client.execute({
      sql: 'SELECT id FROM properties WHERE owner_id = ?;',
      args: [ownerId],
    });
    const propertyIds = propsRes.rows.map(r => r.id as string);
    console.log('Property IDs:', propertyIds);

    if (propertyIds.length === 0) {
      console.log('No properties found.');
      return;
    }

    console.log('2. Fetching bills...');
    // Simulated listBills query
    const placeholders = propertyIds.map(() => '?').join(',');
    const billsRes = await client.execute({
      sql: `SELECT bills.id, bills.tenant_id, bills.unit_id, bills.period_month, bills.period_year, 
            bills.rent_amount, bills.electricity_amount, bills.water_amount, bills.wifi_amount, 
            bills.other_amount, bills.total_amount, bills.due_date, bills.status, 
            bills.created_at, bills.updated_at, tenants.full_name as tenantName, units.unit_number as unitNumber 
            FROM bills 
            INNER JOIN tenants ON tenants.id = bills.tenant_id 
            LEFT JOIN units ON units.id = bills.unit_id 
            WHERE tenants.property_id IN (${placeholders}) 
            ORDER BY bills.due_date DESC LIMIT 200;`,
      args: propertyIds,
    });
    console.log('Fetched bills:', billsRes.rows.length);

    console.log('3. Fetching tenants...');
    const tenantsRes = await client.execute({
      sql: `SELECT id, user_id, unit_id, property_id, full_name, ktp_number, ktp_photo_url, 
            phone, email, occupation, check_in_date, check_out_date, deposit_amount, status, 
            created_at, updated_at FROM tenants;`,
      args: []
    });
    console.log('Fetched tenants:', tenantsRes.rows.length);

    console.log('4. Fetching units...');
    const unitsRes = await client.execute({
      sql: `SELECT id, property_id, unit_number, type, price_monthly, status, facilities, created_at, updated_at FROM units;`,
      args: []
    });
    console.log('Fetched units:', unitsRes.rows.length);

    console.log('5. Fetching properties with counts (simulating listProperties)...');
    const propsCountsRes = await client.execute({
      sql: `SELECT properties.id, properties.owner_id, properties.name, properties.address, properties.city, 
            properties.province, properties.type, properties.created_at, properties.updated_at, 
            count(units.id) as totalUnits, sum(case when units.status = 'occupied' then 1 else 0 end) as occupiedUnits 
            FROM properties 
            LEFT JOIN units ON units.property_id = properties.id 
            WHERE properties.owner_id = ? 
            GROUP BY properties.id;`,
      args: [ownerId]
    });
    console.log('Fetched properties with counts:', propsCountsRes.rows);

    console.log('Success! All queries executed without error.');
  } catch (err: any) {
    console.error('CRASHED WITH ERROR:', err.message || err);
  } finally {
    client.close();
  }
}

run();
