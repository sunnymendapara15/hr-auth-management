const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validateEmail, validatePassword } = require('../utils/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;

  const select = db.prepare('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?');
  const users = select.all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count || 0;

  res.json({ users, meta: { total, page, limit } });
});

router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Provide a valid email address.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ message: 'A user with that email already exists.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const insert = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
  const result = insert.run(name.trim(), normalizedEmail, hashed, role ? role.trim() : 'hr');

  const created = db
    .prepare('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json({ user: created });
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  const { name, email, password, role } = req.body || {};
  const target = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id);
  if (!target) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const fields = [];
  const values = [];

  if (name) {
    fields.push('name = ?');
    values.push(name.trim());
  }

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Provide a valid email address.' });
    }
    const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(normalizedEmail, id);
    if (conflict) {
      return res.status(409).json({ message: 'Another user already uses that email.' });
    }
    fields.push('email = ?');
    values.push(normalizedEmail);
  }

  if (password) {
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    fields.push('password = ?');
    values.push(hashed);
  }

  if (role) {
    fields.push('role = ?');
    values.push(role.trim());
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'Provide at least one field to update.' });
  }

  fields.push("updated_at = datetime('now')");
  const update = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  update.run(...values, id);

  const updated = db
    .prepare('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?')
    .get(id);
  res.json({ user: updated });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (!result.changes) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({ message: 'User deleted.' });
});

module.exports = router;
