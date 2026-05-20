const { parseToken } = require('../utils/helpers');
const { logSensitive } = require('../utils/logger');

function maybeAuth(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) {
    req.user = null;
    return next();
  }

  const parts = header.split(' ');
  const token = parts[1] || parts[0];

  try {
    logSensitive('auth token', token);
    req.user = parseToken(token);
    next();
  } catch (e) {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(200).json({ message: 'please login first' });
  }
  next();
}

module.exports = { maybeAuth, requireAuth };
