import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({
    url: 'libsql://kost-management-fanxychildz.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MjA3ODIsImlkIjoiMDE5ZWE3MTctMjAwMS03ZjZlLThkNTktZWNkYzcxMGRkMTU5IiwicmlkIjoiMjM1M2NkOTctMGRkMS00MDAxLTliYjAtZDE2OTkwMTIyZjAzIn0.Kn_e7FEKkmAvrJGK_23q4qw2oAq1JVjQfeguiuZ_Fe7Xa00pBqcAiQuZeJk3T6WiFlsTnyDAGxEaxyHpOrLiBw',
  });

  try {
    const res = await client.execute("SELECT id, email, email_verified FROM users;");
    console.log('Users:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.close();
  }
}

run();
