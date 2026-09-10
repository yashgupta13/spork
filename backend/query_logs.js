import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.POSTGRES_URL.split('?')[0], ssl: { rejectUnauthorized: false } });
async function run() {
  const res = await pool.query("SELECT * FROM logs WHERE category = 'INFO' ORDER BY created_at DESC LIMIT 5");
  console.table(res.rows.map(r => ({ message: r.message })));
  pool.end();
}
run();
