const MAILJET_API_URL = 'https://api.mailjet.com/v3.1/send';

// CORS_ORIGIN puede tener varios orígenes separados por coma; para armar links en los
// mails usamos el primero como URL "canónica" del panel.
function primerOrigen() {
  return (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
}

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

// ---------------------------------------------------------------------------
// Plantilla de mail
// ---------------------------------------------------------------------------
// Mismos colores/tipografías que la web (ver src/style.css del frontend):
// verde marca #2d3731 (fondo del header/footer del sitio) y fuentes Jost/Poppins,
// con degradación a fuentes de sistema porque no todos los clientes de mail
// cargan Google Fonts. Los logos se sirven desde el frontend (carpeta public/,
// sin hashear) para poder referenciarlos con una URL absoluta y estable.
const MARCA = '#2d3731';
const MARCA_SUAVE = '#f2f4f1';
const TEXTO = '#2d3731';
const TEXTO_SUAVE = '#797f7b';
const BORDE = '#e1e2e1';
const FUENTE = "'Jost', 'Poppins', Helvetica, Arial, sans-serif";

function logoHeaderUrl() {
  return `${primerOrigen()}/logo-mail-header.png`;
}

function logoFooterUrl() {
  return `${primerOrigen()}/logo-mail-footer.png`;
}

// Envuelve el contenido de cada mail en el mismo header/footer, para que todos
// los mails salgan con la misma identidad visual del sitio.
function layout(contenidoHtml) {
  const anio = new Date().getFullYear();

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Misión Siniestros</title>
      </head>
      <body style="margin:0;padding:0;background:${MARCA_SUAVE};font-family:${FUENTE};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MARCA_SUAVE};padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(45,55,49,0.12);">
                <tr>
                  <td align="center" style="background:${MARCA};padding:28px 24px;">
                    <img src="${logoHeaderUrl()}" width="180" alt="Misión Siniestros" style="display:block;width:180px;max-width:60%;height:auto;border:0;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 28px;color:${TEXTO};font-size:15px;line-height:1.55;">
                    ${contenidoHtml}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 24px 28px;border-top:1px solid ${BORDE};">
                    <img src="${logoFooterUrl()}" width="110" alt="Misión Siniestros" style="display:block;width:110px;max-width:45%;height:auto;border:0;margin:0 auto 10px;" />
                    <p style="margin:0;color:${TEXTO_SUAVE};font-size:12px;">
                      &copy; ${anio} Misión Siniestros. Todos los derechos reservados.
                    </p>
                    <p style="margin:4px 0 0;color:${TEXTO_SUAVE};font-size:12px;">
                      Contacto: <a href="mailto:misionsiniestros@gmail.com" style="color:${TEXTO_SUAVE};">misionsiniestros@gmail.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function boton(href, texto) {
  return `
    <a href="${href}" style="display:inline-block;background:${MARCA};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">
      ${texto}
    </a>
  `;
}

async function enviarCodigoVerificacion(destinatario, codigo) {
  await enviar({
    From: remitente(),
    To: [{ Email: destinatario }],
    Subject: 'Código de verificación - Misión Siniestros',
    TextPart: `Tu código de verificación es: ${codigo}\n\nVence en 10 minutos. Si no lo pediste vos, ignorá este mensaje.`,
    HTMLPart: layout(`
      <h1 style="margin:0 0 12px;font-family:'Poppins','Jost',Helvetica,Arial,sans-serif;font-size:20px;color:${TEXTO};">Tu código de verificación</h1>
      <p style="margin:0 0 20px;color:${TEXTO_SUAVE};">Usalo para continuar con tu trámite:</p>
      <p style="margin:0 0 20px;text-align:center;background:${MARCA_SUAVE};border-radius:8px;padding:18px;font-size:34px;font-weight:700;letter-spacing:8px;color:${TEXTO};">
        ${codigo}
      </p>
      <p style="margin:0;color:${TEXTO_SUAVE};font-size:13px;">
        Vence en 10 minutos. Si no lo pediste vos, podés ignorar este mensaje.
      </p>
    `),
  });
}

async function enviarAvisoReclamosAntiguos(destinatarios, reclamos) {
  if (!destinatarios.length || !reclamos.length) return;

  const panelUrl = primerOrigen();

  const filas = reclamos
    .map(
      (r) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDE};font-size:13px;">${r.numeroSiniestro}</td>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDE};font-size:13px;">${r.nombreAsegurado}</td>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDE};font-size:13px;">${r.estado}</td>
          <td style="padding:8px 10px;border-bottom:1px solid ${BORDE};font-size:13px;">${r.diasEnEseEstado}</td>
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
    HTMLPart: layout(`
      <h1 style="margin:0 0 12px;font-family:'Poppins','Jost',Helvetica,Arial,sans-serif;font-size:20px;color:${TEXTO};">Reclamos que necesitan revisión</h1>
      <p style="margin:0 0 20px;color:${TEXTO_SUAVE};">
        Los siguientes reclamos llevan más de 20 días en el mismo estado:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="text-align:left;background:${MARCA_SUAVE};">
            <th style="padding:8px 10px;font-size:12px;color:${TEXTO};">Siniestro</th>
            <th style="padding:8px 10px;font-size:12px;color:${TEXTO};">Asegurado</th>
            <th style="padding:8px 10px;font-size:12px;color:${TEXTO};">Estado</th>
            <th style="padding:8px 10px;font-size:12px;color:${TEXTO};">Días</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <div style="text-align:center;">
        ${boton(`${panelUrl}/admin`, 'Ir al panel de administración')}
      </div>
    `),
  });
}

async function enviarConfirmacionSiniestro(destinatario, numero) {
  const panelUrl = primerOrigen();
  const urlConsultas = `${panelUrl}/consultas`;

  await enviar({
    From: remitente(),
    To: [{ Email: destinatario }],
    Subject: `Misión Siniestros - Reclamo ${numero} registrado`,
    TextPart: `Tu reclamo quedó registrado con el número: ${numero}\n\nGuardá este número: lo vas a necesitar para consultar el estado de tu reclamo en ${urlConsultas} (apartado "Consultar Reclamo"), junto con la matrícula del productor de seguros o, si no cargaste uno, tu DNI.`,
    HTMLPart: layout(`
      <h1 style="margin:0 0 12px;font-family:'Poppins','Jost',Helvetica,Arial,sans-serif;font-size:20px;color:${TEXTO};">Reclamo registrado</h1>
      <p style="margin:0 0 12px;color:${TEXTO_SUAVE};">Tu reclamo quedó registrado con el número:</p>
      <p style="margin:0 0 20px;text-align:center;background:${MARCA_SUAVE};border-radius:8px;padding:16px;font-size:28px;font-weight:700;letter-spacing:2px;color:${TEXTO};">
        ${numero}
      </p>
      <p style="margin:0 0 20px;color:${TEXTO_SUAVE};font-size:13px;">
        Guardá este número: lo vas a necesitar para consultar el estado de tu reclamo.
      </p>
      <p style="margin:0 0 24px;padding:14px 16px;background:${MARCA_SUAVE};border-left:4px solid ${MARCA};border-radius:6px;font-size:14px;color:${TEXTO};">
        Podés controlar el estado de tu siniestro en cualquier momento con este número y la matrícula
        del productor de seguros (o tu DNI, si no cargaste uno), en el apartado "Consultar Reclamo".
      </p>
      <div style="text-align:center;">
        ${boton(urlConsultas, 'Consultar mi reclamo')}
      </div>
    `),
  });
}

module.exports = {
  verificarConexion,
  enviarCodigoVerificacion,
  enviarAvisoReclamosAntiguos,
  enviarConfirmacionSiniestro,
};
