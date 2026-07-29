const prisma = require('../prisma/client');
const { ApiError } = require('../middlewares/error.middleware');
const cloudinaryService = require('./cloudinary.service');
const { LIMITES_POR_CATEGORIA } = require('../validations/evidencia.validation');

async function upload({ siniestroId, tipoDocumento, file }) {
  if (!file) {
    throw new ApiError(400, 'Debe adjuntar un archivo');
  }

  const siniestro = await prisma.siniestro.findUnique({ where: { id: siniestroId } });

  if (!siniestro) {
    throw new ApiError(404, 'Siniestro no encontrado');
  }

  const limite = LIMITES_POR_CATEGORIA[tipoDocumento];
  if (limite) {
    const cantidadActual = await prisma.evidencia.count({ where: { siniestroId, tipoDocumento } });
    if (cantidadActual >= limite) {
      throw new ApiError(400, `Ya se alcanzó el máximo de ${limite} archivo(s) para la categoría "${tipoDocumento}"`);
    }
  }

  const result = await cloudinaryService.uploadBuffer(file.buffer, `siniestros/${siniestroId}`);

  return prisma.evidencia.create({
    data: {
      tipoDocumento,
      urlArchivo: result.secure_url,
      publicId: result.public_id,
      siniestroId,
    },
  });
}

async function remove(id) {
  const evidencia = await prisma.evidencia.findUnique({ where: { id } });

  if (!evidencia) {
    throw new ApiError(404, 'Evidencia no encontrada');
  }

  await cloudinaryService.destroy(evidencia.publicId);
  await prisma.evidencia.delete({ where: { id } });
}

module.exports = { upload, remove };
