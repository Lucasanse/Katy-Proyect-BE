const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');

async function login(email, password) {
  const admin = await prisma.administrador.findUnique({ where: { email } });

  if (!admin) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  const passwordMatches = await bcrypt.compare(password, admin.password);

  if (!passwordMatches) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  const token = jwt.sign(
    { sub: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );

  return { token, admin: { id: admin.id, email: admin.email } };
}

async function getById(id) {
  const admin = await prisma.administrador.findUnique({ where: { id } });

  if (!admin) {
    throw new ApiError(401, 'No autenticado');
  }

  return { id: admin.id, email: admin.email };
}

module.exports = { login, getById };
