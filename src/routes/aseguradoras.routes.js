const { Router } = require('express');
const aseguradorasController = require('../controllers/aseguradoras.controller');
const { requireAuth, optionalAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createAseguradoraSchema, updateAseguradoraSchema } = require('../validations/aseguradoras.validation');

const router = Router();

// Catálogo de lectura pública: el formulario de carga de siniestros (sin login) lo necesita.
// Con optionalAuth, si quien llama es el admin logueado y pide incluirInactivas=true,
// el panel también puede listar las aseguradoras dadas de baja (borrado lógico).
router.get('/', optionalAuth, aseguradorasController.list);
router.get('/:id', optionalAuth, aseguradorasController.getById);

// Alta, edición y borrado quedan reservados al panel de administración
router.post('/', requireAuth, validate(createAseguradoraSchema), aseguradorasController.create);
router.put('/:id', requireAuth, validate(updateAseguradoraSchema), aseguradorasController.update);
router.delete('/:id', requireAuth, aseguradorasController.remove);

module.exports = router;