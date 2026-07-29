require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const { enviarAvisosReclamosAntiguos } = require('./services/notificaciones.service');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

// Aviso diario (8am) de reclamos con más de 20 días sin avanzar de estado
cron.schedule('0 8 * * *', () => {
  enviarAvisosReclamosAntiguos().catch((err) => {
    console.error('No se pudo enviar el aviso de reclamos antiguos:', err);
  });
});

module.exports = app;
