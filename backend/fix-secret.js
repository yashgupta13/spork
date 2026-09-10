import { Pool } from 'pg';
const pool = new Pool({ 
  connectionString: 'postgres://postgres.hbaogwkkuqgsxfhzuojs:bfjxT3S7VyFsvnkz@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await pool.query("UPDATE \"user\" SET \"device_secret\" = '7uMOj5e-pbGxE7bTCBEv7w8ZmUurLz8D'");
  console.log('Secret updated!');
  process.exit(0);
}
run();
