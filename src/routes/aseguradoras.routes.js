const { Router } = require('express');
const aseguradorasController = require('../controllers/aseguradoras.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createAseguradoraSchema, updateAseguradoraSchema } = require('../validations/aseguradoras.validation');

const router = Router();

router.use(requireAuth);

router.post('/', validate(createAseguradoraSchema), aseguradorasController.create);
router.get('/', aseguradorasController.list);
router.get('/:id', aseguradorasController.getById);
router.put('/:id', validate(updateAseguradoraSchema), aseguradorasController.update);
router.delete('/:id', aseguradorasController.remove);

module.exports = router;