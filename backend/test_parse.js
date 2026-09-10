import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.POSTGRES_URL.split('?')[0], ssl: { rejectUnauthorized: false } });

function safeJsonParse(str, fallback = []) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function normalizeSmsList(list) {
  return list.map(item => ({
    address: String(item.address || ''),
    body: String(item.body || ''),
    date: new Date(item.date).toISOString(),
    read: Boolean(item.read),
    type: Number(item.type) || 0,
  }));
}

async function run() {
  const res = await pool.query("SELECT * FROM client_data WHERE client_id = '9a94ae26406904fb' AND data_type = 'sms'");
  const str = res.rows[0].data;
  const arr = safeJsonParse(str);
  console.log(`Parsed array length: ${arr.length}`);
  try {
    const normalized = normalizeSmsList(arr);
    console.log(`Normalized first item:`, normalized[0]);
  } catch(e) {
    console.error("ERROR NORMALIZING:", e);
  }
  pool.end();
}
run();
