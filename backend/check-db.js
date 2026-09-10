import { Pool } from 'pg';
const pool = new Pool({ 
  connectionString: 'postgres://postgres.hbaogwkkuqgsxfhzuojs:bfjxT3S7VyFsvnkz@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  const res = await pool.query("SELECT * FROM client_data WHERE client_id = 'unknown'");
  console.log(res.rows);
  process.exit(0);
}
run();
