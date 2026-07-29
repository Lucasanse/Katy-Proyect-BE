const { Router } = require('express');
const siniestrosController = require('../controllers/siniestros.controller');
const conductoresController = require('../controllers/conductores.controller');
const tercerosController = require('../controllers/terceros.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createSiniestroSchema,
  listSiniestrosSchema,
  updateEstadoSchema,
  updateSiniestroSchema,
  consultarSiniestroSchema,
} = require('../validations/siniestros.validation');
const { addConductorSchema } = require('../validations/conductores.validation');
const { createTerceroSchema } = require('../validations/terceros.validation');

const router = Router();

// Flujo del cliente: creación del reclamo (puede llegar completo o en pasos)
// optionalAuth: si lo crea un admin logueado (flujo interno del estudio) no hace falta el mail de confirmación
router.post('/', optionalAuth, validate(createSiniestroSchema), siniestrosController.create);
router.post('/:id/conductores', validate(addConductorSchema), conductoresController.addToSiniestro);
router.post('/:id/terceros', validate(createTerceroSchema), tercerosController.addToSiniestro);

// Consulta pública de estado (antes de "/:id" para que no lo intercepte como id)
router.get('/consulta', validate(consultarSiniestroSchema), siniestrosController.consultar);

// Panel de administrador
router.get('/', requireAuth, validate(listSiniestrosSchema), siniestrosController.list);
router.get('/:id/terceros', requireAuth, tercerosController.listBySiniestro);
router.get('/:id/auditoria', requireAuth, siniestrosController.getAuditoria);
router.get('/:id', requireAuth, siniestrosController.getById);
router.put('/:id/estado', requireAuth, validate(updateEstadoSchema), siniestrosController.updateEstado);
router.put('/:id', requireAuth, validate(updateSiniestroSchema), siniestrosController.update);
router.delete('/:id', requireAuth, siniestrosController.remove);

module.exports = router;
