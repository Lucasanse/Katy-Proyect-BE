const { z } = require('zod');

const ESTADOS = ['pendiente', 'en_revision', 'cerrado'];

const titularSchema = z.object({
  tipoDoc: z.string(),
  numDoc: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  patente: z.string(),
  telefono: z.string(),
  email: z.string().email(),
  aseguradoraId: z.coerce.number().int().positive('Debe indicar la aseguradora'),
});

const conductorSchema = z.object({
  nombreCompleto: z.string(),
  documento: z.string(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  vinculo: z.string().optional(),
});

const productorSchema = z.object({
  esProductor: z.boolean().optional(),
  nombre: z.string().optional(),
  matricula: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
});

const terceroSchema = z.object({
  dni: z.string().optional(),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  patente: z.string().optional(),
  aseguradoraId: z.coerce.number().int().positive().optional(),
});

const createSiniestroSchema = z.object({
  body: z.object({
    fechaSiniestro: z.string().min(1, 'La fecha es requerida'),
    horaSiniestro: z.string().min(1, 'La hora es requerida'),
    huboHeridos: z.boolean().optional(),
    lugarCalle: z.string().min(1),
    lugarLocalidad: z.string().min(1),
    lugarProvincia: z.string().min(1),
    latitud: z.number().optional(),
    longitud: z.number().optional(),
    detallesAccidente: z.string().min(1),
    titular: titularSchema.optional(),
    conductor: conductorSchema.optional(),
    productor: productorSchema.optional(),
    terceros: z.array(terceroSchema).optional(),
  }),
});

const listSiniestrosSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    estado: z.enum(ESTADOS).optional(),
    fechaDesde: z.string().optional(),
    fechaHasta: z.string().optional(),
  }),
});

const updateEstadoSchema = z.object({
  body: z.object({
    estado: z.enum(ESTADOS, { message: `El estado debe ser uno de: ${ESTADOS.join(', ')}` }),
  }),
});

module.exports = {
  ESTADOS,
  titularSchema,
  conductorSchema,
  productorSchema,
  terceroSchema,
  createSiniestroSchema,
  listSiniestrosSchema,
  updateEstadoSchema,
};
