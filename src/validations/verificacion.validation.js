const { z } = require('zod');

const enviarCodigoSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
  }),
});

const confirmarCodigoSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    codigo: z.string().length(6, 'El código debe tener 6 dígitos'),
  }),
});

module.exports = { enviarCodigoSchema, confirmarCodigoSchema };
