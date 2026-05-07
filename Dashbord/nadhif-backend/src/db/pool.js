// src/db/pool.js

const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

async function initPool() {

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
      rejectUnauthorized: false,
    },

    connectionTimeoutMillis: 10000,

    idleTimeoutMillis: 30000,

    max: 10,
  });

  // Test connexion
  const client = await pool.connect();

  const result = await client.query(
    'SELECT COUNT(*) FROM complaints'
  );

  console.log(
    '✅ PostgreSQL connecté -',
    result.rows[0].count,
    'plaintes'
  );

  client.release();

  return pool;
}

const poolPromise = initPool();

module.exports = poolPromise;