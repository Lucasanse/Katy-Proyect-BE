const nodemailer = require('nodemailer');

let transporter;

// Devuelve la config SMTP validada. Tira error con un mensaje claro si falta algo,
// así en producción nos enteramos al arrancar y no cuando un usuario pide el código.
function leerConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

  const faltantes = [];
  if (!SMTP_HOST) faltantes.push('SMTP_HOST');
  if (!MAIL_FROM) faltantes.push('MAIL_FROM');
  // Los proveedores reales (Resend, Brevo, SendGrid, Gmail...) siempre piden credenciales.
  if (!SMTP_USER) faltantes.push('SMTP_USER');
  if (!SMTP_PASS) faltantes.push('SMTP_PASS');

  if (faltantes.length) {
    throw new Error(
      `Faltan variables de entorno para enviar mails: ${faltantes.join(', ')}. ` +
        'Revisá el .env.example para ver cómo configurar el proveedor SMTP.',
    );
  }

  const port = Number(SMTP_PORT) || 587;

  return {
    host: SMTP_HOST,
    port,
    // 465 usa TLS desde el saludo inicial; 587 y 2525 arrancan en claro y suben a TLS con STARTTLS.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Reusamos conexiones: el aviso diario de reclamos manda varios mails seguidos.
    pool: true,
    maxConnections: 3,
  };
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(leerConfig());
  }
  return transporter;
}

// Remitente completo. Muchos proveedores rechazan el envío si el dominio de MAIL_FROM
// no está verificado en su panel, así que este valor tiene que coincidir con el dominio verificado.
function remitente() {
  const email = process.env.MAIL_FROM;
  const nombre = process.env.MAIL_FROM_NAME;
  return nombre ? `"${nombre}" <${email}>` : email;
}

// Chequea que las credenciales SMTP sean válidas sin mandar ningún mail.
async function verificarConexion() {
  await getTransporter().verify();
}

async function enviarCodigoVerificacion(destinatario, codigo) {
  await getTransporter().sendMail({
    from: remitente(),
    to: destinatario,
    subject: 'Código de verificación - Misión Siniestros',
    text: `Tu código de verificación es: ${codigo}\n\nVence en 10 minutos. Si no lo pediste vos, ignorá este mensaje.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Misión Siniestros</h2>
        <p>Tu código de verificación es:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">${codigo}</p>
        <p style="color: #6b7280; font-size: 13px;">Vence en 10 minutos. Si no lo pediste vos, podés ignorar este mensaje.</p>
      </div>
    `,
  });
}

async function enviarAvisoReclamosAntiguos(destinatarios, reclamos) {
  if (!destinatarios.length || !reclamos.length) return;

  const panelUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';

  const filas = reclamos
    .map(
      (r) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${r.numeroSiniestro}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${r.nombreAsegurado}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${r.estado}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${r.diasEnEseEstado}</td>
        </tr>`,
    )
    .join('');

  await getTransporter().sendMail({
    from: remitente(),
    to: destinatarios.join(', '),
    subject: `Misión Siniestros - ${reclamos.length} reclamo(s) con más de 20 días sin avanzar`,
    text: reclamos
      .map((r) => `${r.numeroSiniestro} - ${r.nombreAsegurado} - ${r.estado} - ${r.diasEnEseEstado} días`)
      .join('\n'),
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Misión Siniestros</h2>
        <p>Los siguientes reclamos llevan más de 20 días en el mismo estado y necesitan revisión:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="text-align:left;background:#f1f5f9;">
              <th style="padding:6px 10px;">Siniestro</th>
              <th style="padding:6px 10px;">Asegurado</th>
              <th style="padding:6px 10px;">Estado</th>
              <th style="padding:6px 10px;">Días</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <p style="margin-top:16px;">
          <a href="${panelUrl}/admin" style="color:#1d4ed8;">Ir al panel de administración</a>
        </p>
      </div>
    `,
  });
}

async function enviarConfirmacionSiniestro(destinatario, numero) {
  const panelUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const urlConsultas = `${panelUrl}/consultas`;

  await getTransporter().sendMail({
    from: remitente(),
    to: destinatario,
    subject: `Misión Siniestros - Reclamo ${numero} registrado`,
    text: `Tu reclamo quedó registrado con el número: ${numero}\n\nGuardá este número: lo vas a necesitar para consultar el estado de tu reclamo en ${urlConsultas} (apartado "Consultar Reclamo"), junto con la matrícula del productor de seguros o, si no cargaste uno, tu DNI.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Misión Siniestros</h2>
        <p>Tu reclamo quedó registrado con el número:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #111827;">${numero}</p>
        <p style="color: #6b7280; font-size: 13px;">Guardá este número: lo vas a necesitar para consultar el estado de tu reclamo.</p>
        <p style="margin-top:16px;padding:12px;background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:4px;font-size:14px;">
          📍 Podés controlar el estado de tu siniestro en cualquier momento entrando a
          <a href="${urlConsultas}" style="color:#1d4ed8;">${urlConsultas}</a>, en el apartado "Consultar Reclamo",
          con este número y la matrícula del productor de seguros (o tu DNI, si no cargaste uno).
        </p>
      </div>
    `,
  });
}

module.exports = {
  verificarConexion,
  enviarCodigoVerificacion,
  enviarAvisoReclamosAntiguos,
  enviarConfirmacionSiniestro,
};
