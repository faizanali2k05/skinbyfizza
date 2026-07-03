'use strict';

const { verify } = require('./jwt');

/**
 * Require a valid access token. Populates req.user = { id, role }.
 * Responds 401 otherwise.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  const payload = verify(token);
  if (!payload || !payload.sub || payload.type !== 'access') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = { id: payload.sub, role: payload.role || 'user' };
  next();
}

/** Require one of the given roles (use after requireAuth). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/** Optional auth: sets req.user if a valid token is present, else continues. */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const payload = verify(header.replace(/^Bearer\s+/i, ''));
  if (payload && payload.sub) req.user = { id: payload.sub, role: payload.role || 'user' };
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
