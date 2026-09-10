import fs from 'fs';
import { Pool } from 'pg';
import path from 'path';

const sql = fs.readFileSync('drizzle/0000_solid_colossus.sql', 'utf8');

// Strip out the sslmode query params which override our ssl setting
const rawUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const safeUrl = rawUrl.split('?')[0];

const pool = new Pool({
  connectionString: safeUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(sql);
    console.log("Migration applied successfully!");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}
run();
