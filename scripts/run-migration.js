const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
    const sql = fs.readFileSync(path.join(__dirname, 'migrate-pos.sql'), 'utf8');

    try {
        console.log('🚀 Running POS migration...');
        await pool.query(sql);
        console.log('✅ Migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
