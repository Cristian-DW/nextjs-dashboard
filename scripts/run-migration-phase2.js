const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
  const sql = fs.readFileSync(path.join(__dirname, 'migrate-phase2.sql'), 'utf8');
  try {
    console.log('🚀 Running Phase 2 migration...');
    await pool.query(sql);
    console.log('✅ Phase 2 migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
