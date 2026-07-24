const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');

const FULL_INCLUDE = {
  titular: { include: { aseguradora: true } },
  conductor: true,
  productor: true,
  terceros: { include: { aseguradora: true } },
  evidencias: true,
};

async function create(data) {
  const { titular, conductor, productor, terceros, ...siniestroData } = data;

  return prisma.siniestro.create({
    data: {
      ...siniestroData,
      ...(titular ? { titular: { create: titular } } : {}),
      ...(conductor ? { conductor: { create: conductor } } : {}),
      ...(productor ? { productor: { create: productor } } : {}),
      ...(terceros?.length ? { terceros: { create: terceros } } : {}),
    },
    include: FULL_INCLUDE,
  });
}

async function list({ page, limit, estado, fechaDesde, fechaHasta }) {
  const where = {
    ...(estado ? { estado } : {}),
    ...(fechaDesde || fechaHasta
      ? {
          fechaSiniestro: {
            ...(fechaDesde ? { gte: fechaDesde } : {}),
            ...(fechaHasta ? { lte: fechaHasta } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.siniestro.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        titular: { include: { aseguradora: true } },
        conductor: true,
        _count: { select: { terceros: true, evidencias: true } },
      },
    }),
    prisma.siniestro.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function getById(id) {
  const siniestro = await prisma.siniestro.findUnique({
    where: { id },
    include: FULL_INCLUDE,
  });

  if (!siniestro) {
    throw new ApiError(404, 'Siniestro no encontrado');
  }

  return siniestro;
}

async function updateEstado(id, estado) {
  await getById(id);

  return prisma.siniestro.update({
    where: { id },
    data: { estado },
    include: FULL_INCLUDE,
  });
}

async function remove(id) {
  await getById(id);
  await prisma.siniestro.delete({ where: { id } });
}

module.exports = { create, list, getById, updateEstado, remove };
