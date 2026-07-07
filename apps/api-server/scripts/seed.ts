import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = readFileSync(resolve('backup/seed-defaults.sql'), 'utf8');
  await pool.query(sql);
  console.log('Seed complete.');
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });