const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');
const cloudinaryService = require('./cloudinary.service');

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

async function list({ page, limit, estado, fechaDesde, fechaHasta, search, sortBy, order }) {
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
    ...(search
      ? {
          titular: {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { apellido: { contains: search, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const orderBy = sortBy === 'titular' ? { titular: { nombre: order } } : { [sortBy]: order };

  const [data, total] = await Promise.all([
    prisma.siniestro.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
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

async function update(id, data) {
  await getById(id);
  const { titular, ...siniestroData } = data;

  return prisma.siniestro.update({
    where: { id },
    data: {
      ...siniestroData,
      ...(titular ? { titular: { update: titular } } : {}),
    },
    include: FULL_INCLUDE,
  });
}

async function remove(id) {
  const siniestro = await prisma.siniestro.findUnique({
    where: { id },
    include: { evidencias: true },
  });

  if (!siniestro) {
    throw new ApiError(404, 'Siniestro no encontrado');
  }

  // Borrado best-effort en Cloudinary: si alguna falla no debe trabar el borrado del siniestro
  await Promise.all(
    siniestro.evidencias.map((evidencia) =>
      cloudinaryService.destroy(evidencia.publicId).catch((err) => {
        console.error(`No se pudo borrar de Cloudinary la evidencia ${evidencia.publicId}:`, err);
      }),
    ),
  );

  await prisma.siniestro.delete({ where: { id } });
}

module.exports = { create, list, getById, updateEstado, update, remove };
