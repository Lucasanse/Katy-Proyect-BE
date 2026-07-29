const { z } = require('zod');

const CUIT_REGEX = /^\d{11}$/;
const cuitField = z.string().regex(CUIT_REGEX, 'El CUIT debe tener 11 dígitos numéricos, sin guiones');

const createAseguradoraSchema = z.object({
  body: z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    cuit: cuitField.optional(),
    email: z.string().email().optional(),
    sitioWeb: z.string().optional(),
  }),
});

const updateAseguradoraSchema = z.object({
  body: z.object({
    nombre: z.string().min(1).optional(),
    cuit: cuitField.optional(),
    email: z.string().email().optional(),
    sitioWeb: z.string().optional(),
    activo: z.boolean().optional(),
  }),
});

module.exports = { createAseguradoraSchema, updateAseguradoraSchema };
