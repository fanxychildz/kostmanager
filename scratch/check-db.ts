import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:kostmanager.db',
});

async function main() {
  const propsCol = await client.execute('PRAGMA table_info(properties)');
  console.log('PROPERTIES COLUMNS:');
  console.log(propsCol.rows);
}

main().catch(console.error);
