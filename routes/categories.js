const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json({ success: true, data: result.rows });
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nom obligatoire.' });
    const result = await pool.query('INSERT INTO categories (name, description) VALUES ($1,$2) RETURNING *', [name, description || null]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Catégorie déjà existante.' });
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  const result = await pool.query('UPDATE categories SET name = COALESCE($1,name), description = COALESCE($2,description) WHERE id = $3 RETURNING *', [name || null, description ?? null, req.params.id]);
  if (!result.rowCount) return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
  res.json({ success: true, data: result.rows[0] });
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
    res.json({ success: true, message: 'Catégorie supprimée.' });
  } catch {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
