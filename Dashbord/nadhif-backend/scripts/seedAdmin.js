// scripts/seedAdmin.js
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const email = 'admin@nadhif.dz';
  const password = 'admin1234';
  const fullName = 'Super Administrateur';
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Vérifier si l'utilisateur existe déjà
    const check = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
    
    if (check.rows.length > 0) {
      console.log('L\'utilisateur super_admin existe déjà.');
      // Update password hash just in case
      await pool.query('UPDATE admin_users SET password_hash = $1 WHERE email = $2', [hash, email]);
      console.log('Mot de passe mis à jour.');
    } else {
      await pool.query(
        `INSERT INTO admin_users (email, full_name, password_hash, role, function) 
         VALUES ($1, $2, $3, $4, $5)`,
        [email, fullName, hash, 'super_admin', 'Directeur Général']
      );
      console.log('✅ Super Administrateur créé avec succès !');
      console.log('Email:', email);
      console.log('Password:', password);
    }
  } catch (error) {
    console.error('Erreur lors du seeding:', error);
  } finally {
    await pool.end();
  }
}

seed();
