const { z } = require('zod');

const addConductorSchema = z.object({
  body: z.object({
    nombreCompleto: z.string().min(1),
    documento: z.string().min(1),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    vinculo: z.string().optional(),
  }),
});

const updateConductorSchema = z.object({
  body: z.object({
    nombreCompleto: z.string().optional(),
    documento: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    vinculo: z.string().optional(),
  }),
});

module.exports = { addConductorSchema, updateConductorSchema };
