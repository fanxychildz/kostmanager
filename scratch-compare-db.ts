import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.slice(0, index).trim();
        let val = trimmed.slice(index + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function run() {
  const DATABASE_URL = process.env.DATABASE_URL;
  const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set in .env file!');
    process.exit(1);
  }

  const localClient = createClient({
    url: 'file:kostmanager.db',
  });

  const tursoClient = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  });

  try {
    console.log('--- Checking local SQLite ---');
    const localTables = await localClient.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    const localTableNames = localTables.rows.map(r => r.name as string);
    console.log('Local Tables:', localTableNames);

    console.log('\n--- Checking Turso ---');
    const tursoTables = await tursoClient.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    const tursoTableNames = tursoTables.rows.map(r => r.name as string);
    console.log('Turso Tables:', tursoTableNames);

    console.log('\n--- Row Counts Comparison ---');
    const allTableNames = Array.from(new Set([...localTableNames, ...tursoTableNames]));
    
    for (const table of allTableNames) {
      let localCount = 'N/A';
      let tursoCount = 'N/A';
      
      if (localTableNames.includes(table)) {
        try {
          const res = await localClient.execute(`SELECT COUNT(*) as count FROM ${table};`);
          localCount = String(res.rows[0].count);
        } catch (e: any) {
          localCount = `Error: ${e.message}`;
        }
      }

      if (tursoTableNames.includes(table)) {
        try {
          const res = await tursoClient.execute(`SELECT COUNT(*) as count FROM ${table};`);
          tursoCount = String(res.rows[0].count);
        } catch (e: any) {
          tursoCount = `Error: ${e.message}`;
        }
      }

      console.log(`Table: ${table.padEnd(25)} | Local: ${localCount.padEnd(10)} | Turso: ${tursoCount}`);
    }
  } catch (err: any) {
    console.error('Error:', err.message || err);
  } finally {
    localClient.close();
    tursoClient.close();
  }
}

run();
