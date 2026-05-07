const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Ensure .env is loaded

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function applyAutomation() {
  const client = await pool.connect();
  try {
    console.log('🚧 Applying Automation SQL...');

    const sqlPath = path.join(__dirname, 'automation.sql');
    if (!fs.existsSync(sqlPath)) {
        throw new Error('automation.sql file not found!');
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL content
    await client.query(sqlContent);
    
    console.log('✅ Automation SQL applied successfully!');
    console.log('   - Triggers created/updated.');
    console.log('   - Functions created/updated.');

  } catch (error) {
    console.error('❌ Error applying automation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

applyAutomation();
