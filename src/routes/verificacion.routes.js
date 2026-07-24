const { Router } = require('express');
const verificacionController = require('../controllers/verificacion.controller');
const { validate } = require('../middlewares/validate.middleware');
const { enviarCodigoSchema, confirmarCodigoSchema } = require('../validations/verificacion.validation');

const router = Router();

// Público: lo usa el formulario de carga de siniestros, antes de que exista sesión de admin
router.post('/enviar', validate(enviarCodigoSchema), verificacionController.enviar);
router.post('/confirmar', validate(confirmarCodigoSchema), verificacionController.confirmar);

module.exports = router;
