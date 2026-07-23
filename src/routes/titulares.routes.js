const { Router } = require('express');
const titularesController = require('../controllers/titulares.controller');
const { validate } = require('../middlewares/validate.middleware');
const { updateTitularSchema } = require('../validations/titulares.validation');

const router = Router();

router.put('/:id', validate(updateTitularSchema), titularesController.update);

module.exports = router;
