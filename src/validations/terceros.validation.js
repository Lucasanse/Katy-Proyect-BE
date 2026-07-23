const { z } = require('zod');

const createTerceroSchema = z.object({
  body: z.object({
    dni: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    patente: z.string().optional(),
    aseguradora: z.string().optional(),
  }),
});

const updateTerceroSchema = z.object({
  body: z.object({
    dni: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    patente: z.string().optional(),
    aseguradora: z.string().optional(),
  }),
});

module.exports = { createTerceroSchema, updateTerceroSchema };
