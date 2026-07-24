const jwt = require('jsonwebtoken');
const { ApiError } = require('./error.middleware');

function getTokenFromRequest(req) {
  if (req.cookies?.token) return req.cookies.token;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new ApiError(401, 'No autenticado'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(new ApiError(401, 'Token inválido o expirado'));
  }
}

module.exports = { requireAuth, getTokenFromRequest };
