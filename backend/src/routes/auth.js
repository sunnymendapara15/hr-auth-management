const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validateEmail, validatePassword } = require('../utils/validation');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'please-set-a-secret';
const TOKEN_EXPIRY = '8h';

function buildPayload(userRow) {
  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
    created_at: userRow.created_at
  };
}

function createToken(userRow) {
  return jwt.sign({ sub: userRow.id, email: userRow.email }, SECRET, { expiresIn: TOKEN_EXPIRY });
}

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
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
    return res.status(409).json({ message: 'That email is already registered.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const insert = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
  const result = insert.run(name.trim(), normalizedEmail, hashedPassword);
  const created = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  const token = createToken(created);
  res.status(201).json({ token, user: buildPayload(created) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Provide a valid email address.' });
  }

  const user = db
    .prepare('SELECT id, name, email, password, role, created_at FROM users WHERE email = ?')
    .get(normalizedEmail);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = createToken(user);
  res.json({ token, user: buildPayload(user) });
});

module.exports = router;
