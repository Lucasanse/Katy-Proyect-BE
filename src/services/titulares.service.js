const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');
const { registrarAuditoria } = require('../utils/auditoria');

async function update(id, data, admin) {
  const titular = await prisma.titular.findUnique({ where: { id } });

  if (!titular) {
    throw new ApiError(404, 'Titular no encontrado');
  }

  await registrarAuditoria({
    siniestroId: titular.siniestroId,
    entidad: 'titular',
    entidadId: id,
    admin,
    anterior: titular,
    nuevo: data,
  });

  return prisma.titular.update({ where: { id }, data, include: { aseguradora: true } });
}

module.exports = { update };
