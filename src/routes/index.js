const { Router } = require('express');
const authRoutes = require('./auth.routes');
const siniestrosRoutes = require('./siniestros.routes');
const titularesRoutes = require('./titulares.routes');
const conductoresRoutes = require('./conductores.routes');
const tercerosRoutes = require('./terceros.routes');
const evidenciaRoutes = require('./evidencia.routes');
const aseguradorasRoutes = require('./aseguradoras.routes');
const verificacionRoutes = require('./verificacion.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/siniestros', siniestrosRoutes);
router.use('/titulares', titularesRoutes);
router.use('/conductores', conductoresRoutes);
router.use('/terceros', tercerosRoutes);
router.use('/evidencia', evidenciaRoutes);
router.use('/aseguradoras', aseguradorasRoutes);
router.use('/verificacion', verificacionRoutes);

module.exports = router;
