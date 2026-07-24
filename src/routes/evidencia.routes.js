const { Router } = require('express');
const evidenciaController = require('../controllers/evidencia.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { uploadEvidenciaSchema } = require('../validations/evidencia.validation');

const router = Router();

router.post('/upload', upload.single('archivo'), validate(uploadEvidenciaSchema), evidenciaController.upload);
router.delete('/:id', requireAuth, evidenciaController.remove);

module.exports = router;
