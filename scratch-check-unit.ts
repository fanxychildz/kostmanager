import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({
    url: 'libsql://kost-management-fanxychildz.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MjA3ODIsImlkIjoiMDE5ZWE3MTctMjAwMS03ZjZlLThkNTktZWNkYzcxMGRkMTU5IiwicmlkIjoiMjM1M2NkOTctMGRkMS00MDAxLTliYjAtZDE2OTkwMTIyZjAzIn0.Kn_e7FEKkmAvrJGK_23q4qw2oAq1JVjQfeguiuZ_Fe7Xa00pBqcAiQuZeJk3T6WiFlsTnyDAGxEaxyHpOrLiBw',
  });

  try {
    console.log('--- Unit Check ---');
    const unitRes = await client.execute({
      sql: "SELECT * FROM units WHERE id = ?;",
      args: ['-l_7nBe8sbMKsNoBYj5mP']
    });
    console.log(unitRes.rows);
  } catch (err: any) {
    console.error('Error:', err.message || err);
  } finally {
    client.close();
  }
}

run();
