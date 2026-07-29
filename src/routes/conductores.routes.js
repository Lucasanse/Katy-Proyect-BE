const { Router } = require('express');
const conductoresController = require('../controllers/conductores.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { updateConductorSchema } = require('../validations/conductores.validation');

const router = Router();

router.put('/:id', requireAuth, validate(updateConductorSchema), conductoresController.update);

module.exports = router;
