const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');
const cloudinaryService = require('./cloudinary.service');
const mailService = require('./mail.service');
const { registrarAuditoria } = require('../utils/auditoria');
const { formatear: formatearNumero, parsear: parsearNumero } = require('../utils/numeroSiniestro');

// El id numérico interno sigue siendo la PK/FK real; "numero" es solo el identificador
// public-facing (MS000482) que se agrega a la respuesta, nunca se guarda en la base.
function conNumero(siniestro) {
  return siniestro && { ...siniestro, numero: formatearNumero(siniestro.id) };
}

const FULL_INCLUDE = {
  titular: { include: { aseguradora: true } },
  conductor: true,
  productor: true,
  terceros: { include: { aseguradora: true } },
  evidencias: true,
};

async function create(data, admin) {
  const { titular, conductor, productor, terceros, omitirNotificacion, ...siniestroData } = data;

  const creado = await prisma.siniestro.create({
    data: {
      ...siniestroData,
      ...(titular ? { titular: { create: titular } } : {}),
      ...(conductor ? { conductor: { create: conductor } } : {}),
      ...(productor ? { productor: { create: productor } } : {}),
      ...(terceros?.length ? { terceros: { create: terceros } } : {}),
    },
    include: FULL_INCLUDE,
  });

  const resultado = conNumero(creado);

  // Confirmación por email: al productor de seguros si hay uno cargado, si no al titular del vehículo.
  // Se omite si lo carga un admin logueado (flujo interno del estudio) o si el wizard lo pide explícitamente
  // (omitirNotificacion, que manda el flujo skipVerification del panel): no tiene sentido mandarle mail a nadie.
  const evitarEmail = Boolean(admin) || Boolean(omitirNotificacion);
  const destinatario = !evitarEmail && (creado.productor?.email || creado.titular?.email);
  if (destinatario) {
    try {
      await mailService.enviarConfirmacionSiniestro(destinatario, resultado.numero);
    } catch (err) {
      console.error('No se pudo enviar el email de confirmación del siniestro:', err);
    }
  }

  // Aviso a la administradora: siempre se manda, sin importar quién cargó el siniestro
  // ni si se omitió la confirmación al asegurado.
  await notificarNuevoSiniestroAAdmin(creado, resultado.numero);

  return resultado;
}

// Avisa a todos los administradores (tabla Administrador, incluida la casilla
// direccion@misionsiniestros.com.ar) que se cargó un siniestro nuevo. Un fallo acá
// nunca debe hacer fallar la creación del siniestro.
async function notificarNuevoSiniestroAAdmin(siniestro, numero) {
  try {
    const admins = await prisma.administrador.findMany({ select: { email: true } });
    const destinatarios = admins.map((a) => a.email);

    if (!destinatarios.length) return;

    await mailService.enviarAvisoNuevoSiniestro(destinatarios, {
      numero,
      nombreAsegurado: siniestro.titular ? `${siniestro.titular.nombre} ${siniestro.titular.apellido}` : 'Sin datos de titular',
      fecha: siniestro.fechaSiniestro,
      hora: siniestro.horaSiniestro,
      lugar: `${siniestro.lugarCalle}, ${siniestro.lugarLocalidad}`,
    });
  } catch (err) {
    console.error('No se pudo enviar el aviso de siniestro nuevo a la administradora:', err);
  }
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
    // Busca por nombre/apellido del titular o por nombre del productor de seguros.
    // El filtro de productor pide esProductor: true para no traer siniestros que en la tabla
    // se muestran sin productor por tener el toggle apagado.
    ...(search
      ? {
          OR: [
            { titular: { nombre: { contains: search, mode: 'insensitive' } } },
            { titular: { apellido: { contains: search, mode: 'insensitive' } } },
            { productor: { esProductor: true, nombre: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  // Las relaciones 1-1 se ordenan por un campo de la tabla hija; el resto son columnas de Siniestro.
  const ORDEN_POR_RELACION = {
    titular: (dir) => ({ titular: { nombre: dir } }),
    productor: (dir) => ({ productor: { nombre: dir } }),
  };

  const orderBy = ORDEN_POR_RELACION[sortBy] ? ORDEN_POR_RELACION[sortBy](order) : { [sortBy]: order };

  const [data, total] = await Promise.all([
    prisma.siniestro.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        titular: { include: { aseguradora: true } },
        conductor: true,
        productor: true,
      },
    }),
    prisma.siniestro.count({ where }),
  ]);

  return {
    data: data.map(conNumero),
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

  return conNumero(siniestro);
}

async function updateEstado(id, estado) {
  await getById(id);

  const actualizado = await prisma.siniestro.update({
    where: { id },
    data: { estado, estadoActualizadoEn: new Date() },
    include: FULL_INCLUDE,
  });

  return conNumero(actualizado);
}

async function update(id, data, admin) {
  const existente = await getById(id);
  const { titular, conductor, ...siniestroData } = data;

  if (titular && existente.titular) {
    await registrarAuditoria({
      siniestroId: id,
      entidad: 'titular',
      entidadId: existente.titular.id,
      admin,
      anterior: existente.titular,
      nuevo: titular,
    });
  }

  if (conductor && existente.conductor) {
    await registrarAuditoria({
      siniestroId: id,
      entidad: 'conductor',
      entidadId: existente.conductor.id,
      admin,
      anterior: existente.conductor,
      nuevo: conductor,
    });
  }

  const actualizado = await prisma.siniestro.update({
    where: { id },
    data: {
      ...siniestroData,
      ...(titular ? { titular: { update: titular } } : {}),
      ...(conductor ? { conductor: { update: conductor } } : {}),
    },
    include: FULL_INCLUDE,
  });

  return conNumero(actualizado);
}

// Consulta pública (sin sesión de admin): solo devuelve datos si la credencial coincide con la
// matrícula del productor de seguros cargado en ese siniestro, o -si no hay productor cargado-
// con el DNI del titular del vehículo, a modo de "PIN" de acceso.
// "numero" acepta tanto el id crudo (482) como el formato public-facing (MS000482).
async function consultarPorNumeroYCredencial(numero, credencial) {
  const id = parsearNumero(numero);

  const siniestro =
    id !== null &&
    (await prisma.siniestro.findUnique({
      where: { id },
      include: { productor: true, titular: true },
    }));

  const credencialNormalizada = credencial.trim().toLowerCase();
  const matriculaCoincide =
    siniestro?.productor?.matricula && siniestro.productor.matricula.trim().toLowerCase() === credencialNormalizada;
  const dniCoincide = siniestro?.titular?.numDoc && siniestro.titular.numDoc.trim().toLowerCase() === credencialNormalizada;

  if (!siniestro || (!matriculaCoincide && !dniCoincide)) {
    throw new ApiError(404, 'No se encontró un reclamo con ese número de siniestro y esa matrícula/DNI');
  }

  return {
    numero: formatearNumero(siniestro.id),
    fechaCarga: siniestro.createdAt,
    fechaUltimoCambioEstado: siniestro.estadoActualizadoEn,
    estado: siniestro.estado,
  };
}

async function getAuditoria(id) {
  await getById(id);

  return prisma.registroAuditoria.findMany({
    where: { siniestroId: id },
    orderBy: { createdAt: 'desc' },
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

module.exports = { create, list, getById, updateEstado, update, remove, getAuditoria, consultarPorNumeroYCredencial };
