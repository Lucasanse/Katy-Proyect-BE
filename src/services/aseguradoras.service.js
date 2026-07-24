const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');

async function create(data) {
  return prisma.aseguradora.create({ data });
}

async function list() {
  return prisma.aseguradora.findMany({ orderBy: { nombre: 'asc' } });
}

async function getById(id) {
  const aseguradora = await prisma.aseguradora.findUnique({ where: { id } });

  if (!aseguradora) {
    throw new ApiError(404, 'Aseguradora no encontrada');
  }

  return aseguradora;
}

async function update(id, data) {
  await getById(id);
  return prisma.aseguradora.update({ where: { id }, data });
}

async function remove(id) {
  await getById(id);
  await prisma.aseguradora.delete({ where: { id } });
}

module.exports = { create, list, getById, update, remove };