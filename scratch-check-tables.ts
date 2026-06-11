import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({
    url: 'libsql://kost-management-fanxychildz.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MjA3ODIsImlkIjoiMDE5ZWE3MTctMjAwMS03ZjZlLThkNTktZWNkYzcxMGRkMTU5IiwicmlkIjoiMjM1M2NkOTctMGRkMS00MDAxLTliYjAtZDE2OTkwMTIyZjAzIn0.Kn_e7FEKkmAvrJGK_23q4qw2oAq1JVjQfeguiuZ_Fe7Xa00pBqcAiQuZeJk3T6WiFlsTnyDAGxEaxyHpOrLiBw',
  });

  try {
    const tablesRes = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Tables in database:', tablesRes.rows.map(r => r.name));

    for (const row of tablesRes.rows) {
      const tableName = row.name as string;
      const infoRes = await client.execute(`PRAGMA table_info(${tableName});`);
      console.log(`\nTable ${tableName} structure:`);
      console.log(infoRes.rows.map(r => `${r.name} (${r.type})` + (r.notnull ? ' NOT NULL' : '') + (r.pk ? ' PK' : '')));
    }
  } catch (err: any) {
    console.error('Error:', err.message || err);
  } finally {
    client.close();
  }
}

run();
