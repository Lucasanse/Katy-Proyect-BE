const prisma = require('../prisma/client');

// Guarda un registro de auditoría con los campos que efectivamente cambiaron.
// No hace nada si no hay admin autenticado (ruta pública) o si no cambió nada.
async function registrarAuditoria({ siniestroId, entidad, entidadId, admin, anterior, nuevo }) {
  if (!admin || !anterior || !nuevo) return;

  const cambios = {};
  for (const campo of Object.keys(nuevo)) {
    const valorNuevo = nuevo[campo];
    if (valorNuevo === undefined) continue;
    const valorAnterior = anterior[campo];
    if (valorAnterior !== valorNuevo) {
      cambios[campo] = { anterior: valorAnterior ?? null, nuevo: valorNuevo };
    }
  }

  if (Object.keys(cambios).length === 0) return;

  await prisma.registroAuditoria.create({
    data: {
      siniestroId,
      entidad,
      entidadId,
      adminId: admin.id,
      adminEmail: admin.email,
      cambios,
    },
  });
}

module.exports = { registrarAuditoria };
