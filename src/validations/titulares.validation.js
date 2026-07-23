const { z } = require('zod');

const updateTitularSchema = z.object({
  body: z.object({
    tipoDoc: z.string().optional(),
    numDoc: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    patente: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    seguro: z.string().optional(),
  }),
});

module.exports = { updateTitularSchema };
