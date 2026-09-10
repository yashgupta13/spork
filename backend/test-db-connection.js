import { Pool } from 'pg';

// Test PostgreSQL connection with Supabase credentials
const connectionString = "postgres://postgres.hbaogwkkuqgsxfhzuojs:bfjxT3S7VyFsvnkz@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0]);

    // Test if we can query tables (they might not exist yet)
    try {
      const tablesResult = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      console.log('Existing tables:', tablesResult.rows.map(row => row.table_name));
    } catch (tableError) {
      console.log('⚠️ Could not query tables (might not exist yet):', tableError.message);
    }

    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});