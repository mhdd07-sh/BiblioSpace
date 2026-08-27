const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, async (_req, res) => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, phone, address, role, is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  res.json({ success: true, data: result.rows });
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { role, is_active } = req.body;
  const result = await pool.query(
    `UPDATE users SET role = COALESCE($1, role), is_active = COALESCE($2, is_active), updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, email, first_name, last_name, role, is_active`,
    [role || null, is_active === undefined ? null : is_active, req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  res.json({ success: true, data: result.rows[0] });
});

module.exports = router;
