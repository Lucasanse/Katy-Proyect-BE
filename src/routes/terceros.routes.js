const { Router } = require('express');
const tercerosController = require('../controllers/terceros.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updateTerceroSchema } = require('../validations/terceros.validation');

const router = Router();

router.put('/:id', requireAuth, validate(updateTerceroSchema), tercerosController.update);
router.delete('/:id', requireAuth, tercerosController.remove);

module.exports = router;
