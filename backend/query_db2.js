import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.POSTGRES_URL.split('?')[0], ssl: { rejectUnauthorized: false } });
async function run() {
  const res = await pool.query("SELECT device_info FROM clients WHERE id = '9a94ae26406904fb'");
  if (res.rows.length > 0) {
    const data = res.rows[0].device_info;
    console.log(`DeviceInfo: ${data ? data.substring(0, 100) : 'null'}`);
  } else {
    console.log("No row found.");
  }
  pool.end();
}
run();
