const { Prisma } = require('@prisma/client');
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

// El código de error de Prisma para una violación de FK varía según versión/adapter (P2003, P2014, P2039...),
// así que además del code se valida el mensaje: la DB siempre reporta "foreign key" o "RESTRICT" en estos casos.
function esViolacionDeReferencia(err) {
  const codigosConocidos = ['P2003', 'P2014', 'P2039'];
  const tieneCodigoConocido = err instanceof Prisma.PrismaClientKnownRequestError && codigosConocidos.includes(err.code);
  const mensajeIndicaFK = /foreign key|restrict/i.test(err?.message || '');
  return tieneCodigoConocido || mensajeIndicaFK;
}

async function remove(id) {
  await getById(id);
  try {
    await prisma.aseguradora.delete({ where: { id } });
  } catch (err) {
    // Hay titulares que todavía la referencian (onDelete: Restrict): no se puede borrar
    if (esViolacionDeReferencia(err)) {
      throw new ApiError(
        409,
        'No se puede eliminar: hay siniestros que usan esta aseguradora. Podés desactivarla en su lugar desde el formulario.',
      );
    }
    throw err;
  }
}

module.exports = { create, list, getById, update, remove };