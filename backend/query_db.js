import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.POSTGRES_URL.split('?')[0], ssl: { rejectUnauthorized: false } });
async function run() {
  const res = await pool.query("SELECT * FROM client_data WHERE client_id = '9a94ae26406904fb' AND data_type = 'sms'");
  if (res.rows.length > 0) {
    const data = res.rows[0].data;
    console.log(`Length: ${data.length}, Preview: ${data.substring(0, 100)}`);
  } else {
    console.log("No row found.");
  }
  pool.end();
}
run();
