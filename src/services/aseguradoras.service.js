const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');

async function create(data) {
  return prisma.aseguradora.create({ data });
}

async function list({ incluirInactivas = false } = {}) {
  return prisma.aseguradora.findMany({
    where: incluirInactivas ? {} : { activo: true },
    orderBy: { nombre: 'asc' },
  });
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
  // Borrado lógico: hay siniestros históricos que referencian la aseguradora,
  // así que en vez de eliminar el registro lo marcamos como inactivo.
  await prisma.aseguradora.update({ where: { id }, data: { activo: false } });
}

module.exports = { create, list, getById, update, remove };