const otpService = require('../services/otp.service');
const mailService = require('../services/mail.service');
const { ApiError } = require('../middlewares/error.middleware');

async function enviar(req, res, next) {
  try {
    const { email } = req.body;
    const codigo = otpService.guardarCodigo(email);
    await mailService.enviarCodigoVerificacion(email, codigo);
    res.json({ enviado: true });
  } catch (err) {
    next(err);
  }
}

async function confirmar(req, res, next) {
  try {
    const { email, codigo } = req.body;
    const valido = otpService.verificarCodigo(email, codigo);

    if (!valido) {
      throw new ApiError(400, 'Código incorrecto o vencido');
    }

    res.json({ verificado: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { enviar, confirmar };
