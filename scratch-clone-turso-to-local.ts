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
        // Strip quotes if any
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;


async function run() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  const backupFolder = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder, { recursive: true });
  }

  const backupFilename = `turso_backup_${dateStr}_${timeStr}.db`;
  const backupPath = path.join(backupFolder, backupFilename);
  const latestBackupPath = path.join(backupFolder, 'turso_backup_latest.db');

  console.log(`Starting backup of Turso database to: ${backupPath}`);

  // If backup file already exists, delete it to start fresh
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
  }

  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set in .env file!');
    process.exit(1);
  }

  const remoteClient = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  });

  const localClient = createClient({
    url: `file:${backupPath}`,
  });

  try {
    // Disable foreign keys check during import to avoid dependency ordering issues
    await localClient.execute('PRAGMA foreign_keys = OFF;');

    // 1. Get all tables structure from remote Turso
    console.log('Fetching table definitions from Turso...');
    const tablesRes = await remoteClient.execute(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );

    for (const tableRow of tablesRes.rows) {
      const tableName = tableRow.name as string;
      const createSql = tableRow.sql as string;

      console.log(`Recreating table: ${tableName}...`);
      await localClient.execute(createSql);

      // 2. Fetch all data for this table from Turso
      console.log(`Fetching rows for table: ${tableName}...`);
      const dataRes = await remoteClient.execute(`SELECT * FROM ${tableName};`);
      
      if (dataRes.rows.length > 0) {
        console.log(`Inserting ${dataRes.rows.length} rows into local table: ${tableName}...`);
        
        const columns = dataRes.columns;
        const columnNames = columns.join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const insertQuery = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders});`;

        // We insert in transaction or batch to make it very fast
        const statements = dataRes.rows.map((row) => {
          // Map row values to positional parameters
          const values = columns.map((colName) => row[colName]);
          return {
            sql: insertQuery,
            args: values,
          };
        });

        // LibSQL batch execution
        await localClient.batch(statements);
      } else {
        console.log(`Table ${tableName} is empty.`);
      }
    }

    // 3. Recreate all indexes
    console.log('Fetching indexes from Turso...');
    const indexesRes = await remoteClient.execute(
      "SELECT name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL;"
    );

    for (const indexRow of indexesRes.rows) {
      const indexName = indexRow.name as string;
      const indexSql = indexRow.sql as string;

      console.log(`Recreating index: ${indexName}...`);
      try {
        await localClient.execute(indexSql);
      } catch (err: any) {
        console.warn(`Could not create index ${indexName}: ${err.message}`);
      }
    }

    // Enable foreign keys check back
    await localClient.execute('PRAGMA foreign_keys = ON;');

    console.log('\n--- Backup Completed Successfully! ---');
    console.log(`Backup file created: ${backupPath} (${fs.statSync(backupPath).size} bytes)`);

    // Create a copy as 'turso_backup_latest.db' for easy reference
    fs.copyFileSync(backupPath, latestBackupPath);
    console.log(`Copied backup to: ${latestBackupPath}`);

    // Verify row counts in the backup
    console.log('\n--- Verifying Row Counts in Backup ---');
    for (const tableRow of tablesRes.rows) {
      const tableName = tableRow.name as string;
      const remoteCountRes = await remoteClient.execute(`SELECT COUNT(*) as count FROM ${tableName};`);
      const localCountRes = await localClient.execute(`SELECT COUNT(*) as count FROM ${tableName};`);
      const remoteCount = remoteCountRes.rows[0].count;
      const localCount = localCountRes.rows[0].count;
      
      const status = remoteCount === localCount ? 'OK' : 'MISMATCH ❌';
      console.log(`Table: ${tableName.padEnd(25)} | Turso: ${String(remoteCount).padEnd(6)} | Local Backup: ${String(localCount).padEnd(6)} | Status: ${status}`);
    }

  } catch (err: any) {
    console.error('Backup failed:', err.message || err);
  } finally {
    remoteClient.close();
    localClient.close();
  }
}

run();
