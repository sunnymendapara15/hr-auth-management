const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'please-set-a-secret';

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header.' });
  }

  const token = header.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ message: 'Missing token.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired or invalid token.' });
  }
}

module.exports = { authenticate };
