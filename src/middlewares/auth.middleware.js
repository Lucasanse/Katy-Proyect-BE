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

// Igual que requireAuth pero no rechaza la request si no hay token: permite
// que una misma ruta pública devuelva más datos cuando quien la llama es el admin logueado.
function optionalAuth(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: payload.sub, email: payload.email };
  } catch (err) {
    // Token inválido/expirado: seguimos como anónimo en vez de cortar la request
  }

  next();
}

module.exports = { requireAuth, optionalAuth, getTokenFromRequest };
