const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');

async function addToSiniestro(siniestroId, data) {
  const siniestro = await prisma.siniestro.findUnique({
    where: { id: siniestroId },
    include: { conductor: true },
  });

  if (!siniestro) {
    throw new ApiError(404, 'Siniestro no encontrado');
  }

  if (siniestro.conductor) {
    throw new ApiError(409, 'El siniestro ya tiene un conductor asociado');
  }

  return prisma.conductor.create({
    data: { ...data, siniestroId },
  });
}

async function update(id, data) {
  const conductor = await prisma.conductor.findUnique({ where: { id } });

  if (!conductor) {
    throw new ApiError(404, 'Conductor no encontrado');
  }

  return prisma.conductor.update({ where: { id }, data });
}

module.exports = { addToSiniestro, update };
