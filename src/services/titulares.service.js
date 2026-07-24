const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');

async function update(id, data) {
  const titular = await prisma.titular.findUnique({ where: { id } });

  if (!titular) {
    throw new ApiError(404, 'Titular no encontrado');
  }

  return prisma.titular.update({ where: { id }, data, include: { aseguradora: true } });
}

module.exports = { update };
