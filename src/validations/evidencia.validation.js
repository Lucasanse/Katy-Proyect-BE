const { z } = require('zod');

// Cantidad máxima de archivos aceptados por categoría (debe reflejar el paso de Adjuntos del wizard)
const LIMITES_POR_CATEGORIA = {
  patente: 1,
  danios: 8,
  dni_frente: 1,
  dni_dorso: 1,
  licencia_frente: 1,
  licencia_dorso: 1,
  cedula_frente: 1,
  cedula_dorso: 1,
  denuncia: 4,
  cobertura: 1,
  presupuesto: 4,
};

const CATEGORIAS_EVIDENCIA = Object.keys(LIMITES_POR_CATEGORIA);

const uploadEvidenciaSchema = z.object({
  body: z.object({
    siniestroId: z.coerce.number().int().positive(),
    tipoDocumento: z.enum(CATEGORIAS_EVIDENCIA, {
      message: `La categoría debe ser una de: ${CATEGORIAS_EVIDENCIA.join(', ')}`,
    }),
  }),
});

module.exports = { uploadEvidenciaSchema, LIMITES_POR_CATEGORIA, CATEGORIAS_EVIDENCIA };
