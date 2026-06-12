import { createClient } from '@libsql/client';

const dbUrl = 'libsql://kost-management-fanxychildz.aws-us-west-2.turso.io';
const dbToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MjA3ODIsImlkIjoiMDE5ZWE3MTctMjAwMS03ZjZlLThkNTktZWNkYzcxMGRkMTU5IiwicmlkIjoiMjM1M2NkOTctMGRkMS00MDAxLTliYjAtZDE2OTkwMTIyZjAzIn0.Kn_e7FEKkmAvrJGK_23q4qw2oAq1JVjQfeguiuZ_Fe7Xa00pBqcAiQuZeJk3T6WiFlsTnyDAGxEaxyHpOrLiBw';

async function run() {
  const client = createClient({ url: 'file:kostmanager.db' });
  try {
    console.log('Querying properties table columns...');
    const res = await client.execute("SELECT * FROM properties LIMIT 1;");
    console.log('Columns:', res.columns);
    console.log('Rows:', res.rows);
  } catch (err: any) {
    console.error('Error:', err.message || err);
  } finally {
    client.close();
  }
}

run();
