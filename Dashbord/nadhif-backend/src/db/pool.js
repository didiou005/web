// src/db/pool.js
const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

async function initPool() {
  // Si on est en développement, crée le tunnel SSH
  if (process.env.NODE_ENV === 'development' && process.env.SSH_HOST) {
    const { createTunnel } = require('./sshTunnel');
    await createTunnel();
  }

  pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 10000,
    max: 10
  });

  // Test
  const client = await pool.connect();
  const result = await client.query('SELECT COUNT(*) FROM complaints');
  console.log('✅ PostgreSQL connecté -', result.rows[0].count, 'plaintes');
  client.release();

  return pool;
}

const poolPromise = initPool();

module.exports = poolPromise;
