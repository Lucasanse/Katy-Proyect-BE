const prisma = require('../prisma/client');
const mailService = require('./mail.service');
const { formatear: formatearNumero } = require('../utils/numeroSiniestro');

const DIAS_LIMITE = 20;
const ESTADOS_A_VIGILAR = ['pendiente', 'en_revision', 'falta_documentacion'];

function diasDesde(fecha) {
  const ms = Date.now() - new Date(fecha).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Busca siniestros estancados hace más de 20 días y todavía no notificados desde el último cambio de estado.
// La comparación notificadoEmailEn < estadoActualizadoEn se hace en memoria porque Prisma no permite
// comparar dos columnas de la misma fila directamente en el "where".
async function buscarReclamosAntiguosSinNotificar() {
  const limite = new Date(Date.now() - DIAS_LIMITE * 24 * 60 * 60 * 1000);

  const candidatos = await prisma.siniestro.findMany({
    where: {
      estado: { in: ESTADOS_A_VIGILAR },
      estadoActualizadoEn: { lte: limite },
    },
    include: { titular: true },
  });

  return candidatos.filter((s) => !s.notificadoEmailEn || s.notificadoEmailEn < s.estadoActualizadoEn);
}

// Envía el email diario a los administradores por los reclamos estancados y marca notificadoEmailEn
async function enviarAvisosReclamosAntiguos() {
  const siniestros = await buscarReclamosAntiguosSinNotificar();

  if (!siniestros.length) return { enviados: 0 };

  const admins = await prisma.administrador.findMany({ select: { email: true } });
  const destinatarios = admins.map((a) => a.email);

  const reclamos = siniestros.map((s) => ({
    numeroSiniestro: formatearNumero(s.id),
    nombreAsegurado: s.titular ? `${s.titular.nombre} ${s.titular.apellido}` : 'Sin datos de titular',
    estado: s.estado,
    diasEnEseEstado: diasDesde(s.estadoActualizadoEn),
  }));

  await mailService.enviarAvisoReclamosAntiguos(destinatarios, reclamos);

  const ahora = new Date();
  await prisma.siniestro.updateMany({
    where: { id: { in: siniestros.map((s) => s.id) } },
    data: { notificadoEmailEn: ahora },
  });

  return { enviados: siniestros.length };
}

module.exports = { enviarAvisosReclamosAntiguos, buscarReclamosAntiguosSinNotificar };
