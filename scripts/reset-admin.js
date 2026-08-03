// Deja un único usuario administrador activo, borrando cualquier otro.
// A diferencia de prisma/seed.js, este script NO toca siniestros, aseguradoras
// ni ningún otro dato: sólo la tabla Administrador. Es seguro correrlo en producción.
//
// Uso:
//   node scripts/reset-admin.js
//   node scripts/reset-admin.js otro-mail@ejemplo.com "OtraPassword123!"
//
// Si no se pasan argumentos, usa los valores por defecto de abajo.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/prisma/client');

const DEFAULT_EMAIL = 'misionadministrador@gmail.com';
const DEFAULT_PASSWORD = 'vT@iKzn@9VxyYpFEy96P';

async function main() {
  const email = process.argv[2] || DEFAULT_EMAIL;
  const password = process.argv[3] || DEFAULT_PASSWORD;

  const passwordHash = await bcrypt.hash(password, 10);

  const eliminados = await prisma.administrador.deleteMany({
    where: { email: { not: email } },
  });

  const admin = await prisma.administrador.upsert({
    where: { email },
    update: { password: passwordHash },
    create: { email, password: passwordHash },
  });

  console.log(`Administradores eliminados: ${eliminados.count}`);
  console.log(`Administrador activo: ${admin.email} (id ${admin.id})`);
  console.log('Listo. A partir de ahora sólo ese usuario puede iniciar sesión en el panel.');
}

main()
  .catch((e) => {
    console.error('Falló el reseteo de administradores:');
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
