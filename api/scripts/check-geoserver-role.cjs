const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.resolve(__dirname, '..', '.env');
const databaseUrlLine = fs
  .readFileSync(envPath, 'utf8')
  .split(/\r?\n/)
  .find((line) => line.startsWith('DATABASE_URL='));

if (!databaseUrlLine) {
  throw new Error('DATABASE_URL missing');
}

const client = new Client({
  connectionString: databaseUrlLine.slice('DATABASE_URL='.length).trim(),
});

async function main() {
  await client.connect();
  const result = await client.query(
    `select rolcanlogin, rolpassword is not null as has_password
       from pg_roles
      where rolname = $1`,
    ['mgos_geoserver'],
  );
  console.log(JSON.stringify(result.rows[0] ?? null));
  await client.end();
}

main().catch(async (error) => {
  console.error(error.message);
  await client.end().catch(() => {});
  process.exitCode = 1;
});

