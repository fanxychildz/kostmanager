import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({
    url: 'libsql://kost-management-fanxychildz.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MjA3ODIsImlkIjoiMDE5ZWE3MTctMjAwMS03ZjZlLThkNTktZWNkYzcxMGRkMTU5IiwicmlkIjoiMjM1M2NkOTctMGRkMS00MDAxLTliYjAtZDE2OTkwMTIyZjAzIn0.Kn_e7FEKkmAvrJGK_23q4qw2oAq1JVjQfeguiuZ_Fe7Xa00pBqcAiQuZeJk3T6WiFlsTnyDAGxEaxyHpOrLiBw',
  });

  try {
    console.log('--- Users ---');
    const usersRes = await client.execute("SELECT id, email, name, role FROM users;");
    console.log(usersRes.rows);

    console.log('\n--- Properties ---');
    const propRes = await client.execute("SELECT id, name, owner_id FROM properties;");
    console.log(propRes.rows);

    console.log('\n--- Tenants ---');
    const tenantRes = await client.execute("SELECT id, full_name, property_id, user_id FROM tenants;");
    console.log(tenantRes.rows);
  } catch (err: any) {
    console.error('Error:', err.message || err);
  } finally {
    client.close();
  }
}

run();
