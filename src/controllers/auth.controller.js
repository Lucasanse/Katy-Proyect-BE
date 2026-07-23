const authService = require('../services/auth.service');

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, admin } = await authService.login(email, password);

    res.cookie('token', token, cookieOptions());
    res.json({ token, admin });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('token', cookieOptions());
    res.json({ message: 'Sesión finalizada' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const admin = await authService.getById(req.admin.id);
    res.json({ admin });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me };
