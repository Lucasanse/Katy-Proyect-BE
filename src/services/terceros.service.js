const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');
const { registrarAuditoria } = require('../utils/auditoria');

async function addToSiniestro(siniestroId, data) {
  const siniestro = await prisma.siniestro.findUnique({ where: { id: siniestroId } });

  if (!siniestro) {
    throw new ApiError(404, 'Siniestro no encontrado');
  }

  return prisma.tercero.create({ data: { ...data, siniestroId }, include: { aseguradora: true } });
}

async function listBySiniestro(siniestroId) {
  const siniestro = await prisma.siniestro.findUnique({ where: { id: siniestroId } });

  if (!siniestro) {
    throw new ApiError(404, 'Siniestro no encontrado');
  }

  return prisma.tercero.findMany({ where: { siniestroId }, include: { aseguradora: true } });
}

async function update(id, data, admin) {
  const tercero = await prisma.tercero.findUnique({ where: { id } });

  if (!tercero) {
    throw new ApiError(404, 'Tercero no encontrado');
  }

  await registrarAuditoria({
    siniestroId: tercero.siniestroId,
    entidad: 'tercero',
    entidadId: id,
    admin,
    anterior: tercero,
    nuevo: data,
  });

  return prisma.tercero.update({ where: { id }, data, include: { aseguradora: true } });
}

async function remove(id) {
  const tercero = await prisma.tercero.findUnique({ where: { id } });

  if (!tercero) {
    throw new ApiError(404, 'Tercero no encontrado');
  }

  await prisma.tercero.delete({ where: { id } });
}

module.exports = { addToSiniestro, listBySiniestro, update, remove };
