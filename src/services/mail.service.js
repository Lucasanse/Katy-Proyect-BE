const MAILJET_API_URL = 'https://api.mailjet.com/v3.1/send';

// Devuelve las credenciales validadas. Tira error con un mensaje claro si falta algo,
// así en producción nos enteramos al arrancar y no cuando un usuario pide el código.
function leerConfig() {
  const { SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

  const faltantes = [];
  if (!MAIL_FROM) faltantes.push('MAIL_FROM');
  if (!SMTP_USER) faltantes.push('SMTP_USER');
  if (!SMTP_PASS) faltantes.push('SMTP_PASS');

  if (faltantes.length) {
    throw new Error(
      `Faltan variables de entorno para enviar mails: ${faltantes.join(', ')}. ` +
        'Revisá el .env.example para ver cómo configurar Mailjet.',
    );
  }

  // Mailjet usa la misma API Key / Secret Key para SMTP y para la API REST.
  return { apiKey: SMTP_USER, secretKey: SMTP_PASS };
}

function authHeader() {
  const { apiKey, secretKey } = leerConfig();
  return `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`;
}

// Remitente completo. Muchos proveedores rechazan el envío si el dominio de MAIL_FROM
// no está verificado en su panel, así que este valor tiene que coincidir con el dominio verificado.
function remitente() {
  return { Email: process.env.MAIL_FROM, Name: process.env.MAIL_FROM_NAME };
}

async function enviar(mensaje) {
  const response = await fetch(MAILJET_API_URL, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Messages: [mensaje] }),
  });

  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(`Mailjet respondió ${response.status}: ${detalle}`);
  }

  return response.json();
}

// Chequea que las credenciales de Mailjet sean válidas sin mandar ningún mail.
async function verificarConexion() {
  const response = await fetch('https://api.mailjet.com/v3/REST/apikey', {
    headers: { Authorization: authHeader() },
  });

  if (!response.ok) {
    throw new Error(`Credenciales de Mailjet inválidas (HTTP ${response.status})`);
  }
}

async function enviarCodigoVerificacion(destinatario, codigo) {
  await enviar({
    From: remitente(),
    To: [{ Email: destinatario }],
    Subject: 'Código de verificación - Misión Siniestros',
    TextPart: `Tu código de verificación es: ${codigo}\n\nVence en 10 minutos. Si no lo pediste vos, ignorá este mensaje.`,
    HTMLPart: `
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

  await enviar({
    From: remitente(),
    To: destinatarios.map((email) => ({ Email: email })),
    Subject: `Misión Siniestros - ${reclamos.length} reclamo(s) con más de 20 días sin avanzar`,
    TextPart: reclamos
      .map((r) => `${r.numeroSiniestro} - ${r.nombreAsegurado} - ${r.estado} - ${r.diasEnEseEstado} días`)
      .join('\n'),
    HTMLPart: `
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

  await enviar({
    From: remitente(),
    To: [{ Email: destinatario }],
    Subject: `Misión Siniestros - Reclamo ${numero} registrado`,
    TextPart: `Tu reclamo quedó registrado con el número: ${numero}\n\nGuardá este número: lo vas a necesitar para consultar el estado de tu reclamo en ${urlConsultas} (apartado "Consultar Reclamo"), junto con la matrícula del productor de seguros o, si no cargaste uno, tu DNI.`,
    HTMLPart: `
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
