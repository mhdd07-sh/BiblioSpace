const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, address } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ success: false, message: 'Nom, prénom, email et mot de passe sont obligatoires.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rowCount) {
      return res.status(409).json({ success: false, message: 'Cette adresse email existe déjà.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, email, first_name, last_name, role, is_active`,
      [email.toLowerCase(), passwordHash, first_name, last_name, phone || null, address || null]
    );

    res.status(201).json({ success: true, message: 'Compte créé avec succès.', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });

    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (!result.rowCount) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });

    const user = result.rows[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Compte désactivé.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie.',
      token,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, first_name, last_name, phone, address, role, is_active, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json({ success: true, data: result.rows[0] });
});

module.exports = router;
