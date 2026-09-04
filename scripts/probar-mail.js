// Prueba que el proveedor de mail configurado en .env (Mailjet, Mailtrap, etc.) pueda
// mandar mails. Con Mailtrap el mail no llega a ninguna bandeja real: queda "atrapado" en
// tu inbox de Mailtrap (Email Testing), que es justo lo que sirve para probar sin spamear a nadie.
// Uso: npm run mail:test -- tu-mail@ejemplo.com
require('dotenv').config();
const mailService = require('../src/services/mail.service');

async function main() {
  const destinatario = process.argv[2];

  if (!destinatario) {
    console.error('Falta el destinatario. Uso: npm run mail:test -- tu-mail@ejemplo.com');
    process.exit(1);
  }

  console.log(`Verificando credenciales de ${process.env.SMTP_HOST || '(SMTP_HOST no configurado)'}...`);
  await mailService.verificarConexion();
  console.log('Credenciales OK.');

  console.log(`Enviando código de prueba a ${destinatario} desde ${process.env.MAIL_FROM}...`);
  await mailService.enviarCodigoVerificacion(destinatario, '123456');
  console.log('Mail enviado. Revisá la bandeja de entrada (y la carpeta de spam).');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nFalló el envío:');
    console.error(err.message);
    process.exit(1);
  });
