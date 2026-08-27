const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

(async () => {
  try {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1,$2,$3,$4,'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', is_active = TRUE
       RETURNING id, email, first_name, last_name, role`,
      ['admin@bibliotheque.com', passwordHash, 'Admin', 'Bibliotheque']
    );
    console.log('Administrateur prêt :', result.rows[0]);
    console.log('Email: admin@bibliotheque.com');
    console.log('Mot de passe: Admin123!');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
