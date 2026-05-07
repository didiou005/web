const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('🚧 Starting Database Reset...');

    // 1. Drop all tables
    console.log('🔥 Dropping tables...');
    await client.query(`
      DROP TABLE IF EXISTS complaint_comments CASCADE;
      DROP TABLE IF EXISTS complaint_status_history CASCADE;
      DROP TABLE IF EXISTS complaint_photos CASCADE;
      DROP TABLE IF EXISTS complaints CASCADE;
      DROP TABLE IF EXISTS team_members CASCADE;
      DROP TABLE IF EXISTS teams CASCADE;
      DROP TABLE IF EXISTS regions CASCADE;
      DROP TABLE IF EXISTS login_audit CASCADE;
      DROP TABLE IF EXISTS admin_users CASCADE;
      DROP TABLE IF EXISTS communes CASCADE;
    `);

    // 2. Read and Execute nadhif.sql
    console.log('📜 Executing nadhif.sql schema...');
    const sqlPath = path.join(__dirname, '..', 'nadhif.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons to execute statements could be risky with functions, 
    // but the file is mostly CREATE TABLEs and INSERTs. 
    // Usually pg driver can handle multiple statements if pass them in one go.
    await client.query(sqlContent);
    console.log('✅ Schema and base data created!');

    // 3. Seed Admin
    console.log('👤 Seeding Super Admin...');
    // We can require the seed script or just run the logic. 
    // Since seedAdmin.js connects its own pool, let's just run it as a child process or duplicate logic.
    // Simpler: run it as child process
    const { execSync } = require('child_process');
    try {
        execSync('node scripts/seedAdmin.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch(e) {
        console.error("Error running seedAdmin.js", e);
    }

    console.log('🚀 Database reset complete!');

  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
