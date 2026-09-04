// Prueba puntualmente el mail que recibe la administradora (todos los admins de la tabla
// Administrador) cada vez que se carga un siniestro nuevo, con datos de ejemplo.
// Uso: npm run mail:test:siniestro -- tu-mail@ejemplo.com
require('dotenv').config();
const mailService = require('../src/services/mail.service');

async function main() {
  const destinatario = process.argv[2];

  if (!destinatario) {
    console.error('Falta el destinatario. Uso: npm run mail:test:siniestro -- tu-mail@ejemplo.com');
    process.exit(1);
  }

  console.log(`Verificando credenciales de ${process.env.SMTP_HOST || '(SMTP_HOST no configurado)'}...`);
  await mailService.verificarConexion();
  console.log('Credenciales OK.');

  console.log(`Enviando aviso de siniestro nuevo (de prueba) a ${destinatario}...`);
  await mailService.enviarAvisoNuevoSiniestro([destinatario], {
    numero: 'MS000999',
    nombreAsegurado: 'Juan Pérez',
    fecha: '2026-09-04',
    hora: '14:30',
    lugar: 'Av. Colón 1234, Mar del Plata',
  });
  console.log('Mail enviado. Revisá la bandeja de entrada (y la carpeta de spam, o tu inbox de Mailtrap).');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nFalló el envío:');
    console.error(err.message);
    process.exit(1);
  });
