const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');

async function addToSiniestro(siniestroId, data) {
  const siniestro = await prisma.siniestro.findUnique({ where: { id: siniestroId } });

  if (!siniestro) {
    throw new ApiError(404, 'Siniestro no encontrado');
  }

  return prisma.tercero.create({ data: { ...data, siniestroId } });
}

async function listBySiniestro(siniestroId) {
  const siniestro = await prisma.siniestro.findUnique({ where: { id: siniestroId } });

  if (!siniestro) {
    throw new ApiError(404, 'Siniestro no encontrado');
  }

  return prisma.tercero.findMany({ where: { siniestroId } });
}

async function update(id, data) {
  const tercero = await prisma.tercero.findUnique({ where: { id } });

  if (!tercero) {
    throw new ApiError(404, 'Tercero no encontrado');
  }

  return prisma.tercero.update({ where: { id }, data });
}

async function remove(id) {
  const tercero = await prisma.tercero.findUnique({ where: { id } });

  if (!tercero) {
    throw new ApiError(404, 'Tercero no encontrado');
  }

  await prisma.tercero.delete({ where: { id } });
}

module.exports = { addToSiniestro, listBySiniestro, update, remove };
