// Deja la base de datos lista para producción:
//   1. Borra todos los siniestros y aseguradoras (y todo lo que cuelga de ellos: titulares,
//      conductores, productores, terceros, evidencias, auditoría) — son los datos de prueba.
//   2. Reinicia los IDs de esas tablas, así el próximo siniestro/aseguradora real que se
//      cargue vuelve a arrancar en 1 (Postgres no permite arrancar en 0).
//   3. Deja un único administrador: direccion@misionsiniestros.com.ar, con la contraseña
//      hasheada. Cualquier otro admin que exista se borra.
//
// ADVERTENCIA: es una operación permanente e irreversible. No lo corras sin estar seguro/a
// de contra qué base (DATABASE_URL) lo estás corriendo, e idealmente con un backup hecho
// antes (pg_dump, o un snapshot/branch si usás Neon).
//
// Uso:
//   node scripts/preparar-produccion.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/prisma/client');

const ADMIN_EMAIL = 'direccion@misionsiniestros.com.ar';
const ADMIN_PASSWORD = 'AdminSiniestros2026';

// Orden seguro para no romper foreign keys: primero lo que depende de Siniestro,
// después Siniestro, y Aseguradora al final (Titular la referencia con onDelete: Restrict).
const TABLAS_A_LIMPIAR = [
  { modelo: 'registroAuditoria', secuencia: 'RegistroAuditoria_id_seq' },
  { modelo: 'evidencia', secuencia: 'Evidencia_id_seq' },
  { modelo: 'tercero', secuencia: 'Tercero_id_seq' },
  { modelo: 'conductor', secuencia: 'Conductor_id_seq' },
  { modelo: 'titular', secuencia: 'Titular_id_seq' },
  { modelo: 'productor', secuencia: 'Productor_id_seq' },
  { modelo: 'siniestro', secuencia: 'Siniestro_id_seq' },
  { modelo: 'aseguradora', secuencia: 'Aseguradora_id_seq' },
];

async function main() {
  console.log('Borrando siniestros, aseguradoras y datos relacionados...');
  for (const { modelo } of TABLAS_A_LIMPIAR) {
    const { count } = await prisma[modelo].deleteMany();
    console.log(`  - ${modelo}: ${count} registro(s) borrados`);
  }

  console.log('Reiniciando IDs...');
  for (const { secuencia } of TABLAS_A_LIMPIAR) {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${secuencia}" RESTART WITH 1`);
  }
  console.log('  Listo: el próximo registro de cada tabla vuelve a arrancar en el id 1.');

  console.log('Dejando un único administrador...');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const eliminados = await prisma.administrador.deleteMany({ where: { email: { not: ADMIN_EMAIL } } });
  const admin = await prisma.administrador.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: passwordHash },
    create: { email: ADMIN_EMAIL, password: passwordHash },
  });
  console.log(`  - Administradores eliminados: ${eliminados.count}`);
  console.log(`  - Administrador activo: ${admin.email} (id ${admin.id})`);

  console.log('\n¡Listo! La base quedó preparada para producción.');
}

main()
  .catch((e) => {
    console.error('Falló la preparación para producción:');
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
