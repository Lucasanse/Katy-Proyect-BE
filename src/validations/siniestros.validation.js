const { z } = require('zod');

const ESTADOS = ['pendiente', 'en_revision', 'falta_documentacion', 'presentado_compania', 'cerrado'];

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

// Si hubo heridos, hay que informar si intervino la policía y si intervino una ambulancia
function validarIntervenciones(body, ctx) {
  if (!body.huboHeridos) return;

  if (typeof body.intervencionPolicial !== 'boolean') {
    ctx.addIssue({
      code: 'custom',
      path: ['intervencionPolicial'],
      message: 'Debe indicar si hubo intervención policial',
    });
  }
  if (typeof body.intervencionAmbulancia !== 'boolean') {
    ctx.addIssue({
      code: 'custom',
      path: ['intervencionAmbulancia'],
      message: 'Debe indicar si hubo intervención de ambulancia',
    });
  }
}

const createSiniestroSchema = z.object({
  body: z
    .object({
      fechaSiniestro: z.string().min(1, 'La fecha es requerida'),
      horaSiniestro: z.string().min(1, 'La hora es requerida'),
      huboHeridos: z.boolean().optional(),
      intervencionPolicial: z.boolean().optional(),
      intervencionAmbulancia: z.boolean().optional(),
      tieneLicencia: z.boolean().optional(),
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
    })
    .superRefine(validarIntervenciones),
});

const SORT_FIELDS = ['createdAt', 'fechaSiniestro', 'titular'];

const listSiniestrosSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    estado: z.enum(ESTADOS).optional(),
    fechaDesde: z.string().optional(),
    fechaHasta: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(SORT_FIELDS).optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

const consultarSiniestroSchema = z.object({
  query: z.object({
    // Acepta tanto "MS000482" como "482": el parseo real ocurre en siniestros.service.js
    numero: z.string().min(1, 'El número de siniestro es requerido'),
    // Matrícula del productor de seguros, o DNI del titular si el siniestro no tiene productor cargado
    credencial: z.string().min(1, 'La matrícula o el DNI son requeridos'),
  }),
});

const updateEstadoSchema = z.object({
  body: z.object({
    estado: z.enum(ESTADOS, { message: `El estado debe ser uno de: ${ESTADOS.join(', ')}` }),
  }),
});

const updateSiniestroSchema = z.object({
  body: z
    .object({
      fechaSiniestro: z.string().min(1).optional(),
      horaSiniestro: z.string().min(1).optional(),
      huboHeridos: z.boolean().optional(),
      intervencionPolicial: z.boolean().optional(),
      intervencionAmbulancia: z.boolean().optional(),
      tieneLicencia: z.boolean().optional(),
      lugarCalle: z.string().min(1).optional(),
      lugarLocalidad: z.string().min(1).optional(),
      lugarProvincia: z.string().min(1).optional(),
      latitud: z.number().nullable().optional(),
      longitud: z.number().nullable().optional(),
      detallesAccidente: z.string().min(1).optional(),
      titular: titularSchema.partial().optional(),
      conductor: conductorSchema.partial().optional(),
    })
    .superRefine(validarIntervenciones),
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
  updateSiniestroSchema,
  consultarSiniestroSchema,
};
