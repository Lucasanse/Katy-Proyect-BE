require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Uso: node scripts/crear-admin.js <email> <password>');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.administrador.upsert({
    where: { email },
    update: { password: passwordHash },
    create: { email, password: passwordHash },
  });

  console.log(`Administrador listo: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());