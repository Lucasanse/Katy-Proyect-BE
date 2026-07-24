const { z } = require('zod');

const uploadEvidenciaSchema = z.object({
  body: z.object({
    siniestroId: z.coerce.number().int().positive(),
    tipoDocumento: z.string().min(1),
  }),
});

module.exports = { uploadEvidenciaSchema };
