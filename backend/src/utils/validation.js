const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return typeof email === 'string' && emailRegex.test(email.trim());
}

function validatePassword(password) {
  return typeof password === 'string' && password.trim().length >= 8;
}

module.exports = { validateEmail, validatePassword };
