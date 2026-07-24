const { z } = require('zod');

const createAseguradoraSchema = z.object({
  body: z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    sitioWeb: z.string().optional(),
  }),
});

const updateAseguradoraSchema = z.object({
  body: z.object({
    nombre: z.string().min(1).optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    sitioWeb: z.string().optional(),
    activo: z.boolean().optional(),
  }),
});

module.exports = { createAseguradoraSchema, updateAseguradoraSchema };