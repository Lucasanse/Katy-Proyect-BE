const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      // Sin usuario/contraseña no mandamos "auth": algunos servidores (o un SMTP local de prueba) no lo esperan
      ...(SMTP_USER && SMTP_PASS ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
    });
  }
  return transporter;
}

async function enviarCodigoVerificacion(destinatario, codigo) {
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || 'no-reply@portal-reclamos.com',
    to: destinatario,
    subject: 'Código de verificación - Portal de Reclamos',
    text: `Tu código de verificación es: ${codigo}\n\nVence en 10 minutos. Si no lo pediste vos, ignorá este mensaje.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Portal de Reclamos</h2>
        <p>Tu código de verificación es:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">${codigo}</p>
        <p style="color: #6b7280; font-size: 13px;">Vence en 10 minutos. Si no lo pediste vos, podés ignorar este mensaje.</p>
      </div>
    `,
  });
}

module.exports = { enviarCodigoVerificacion };
