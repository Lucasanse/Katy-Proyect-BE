const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Crear la conexión utilizando la URL de tu .env
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// Inicializar el adaptador y el cliente
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando la carga de datos (Seed)...");
  await prisma.evidencia.deleteMany();
  await prisma.tercero.deleteMany();
  await prisma.conductor.deleteMany();
  await prisma.titular.deleteMany();
  await prisma.siniestro.deleteMany();
  await prisma.productor.deleteMany();
  await prisma.administrador.deleteMany();

  // 1. Crear el usuario Administrador
  // En un entorno real, usarías bcrypt para hashear 'admin123'. 
  const admin = await prisma.administrador.upsert({
    where: { email: 'admin@tuseguro.com' },
    update: {},
    create: {
      email: 'admin@tuseguro.com',
      password: 'hash_falso_de_admin123', // Acá luego implementarás bcrypt
    },
  });
  console.log("Administradora creada:", admin.email);

  // 2. Crear un Siniestro de prueba con TODAS sus relaciones de una sola vez
  const siniestroPrueba = await prisma.siniestro.create({
    data: {
      fechaSiniestro: '2026-07-22',
      horaSiniestro: '14:30',
      huboHeridos: false,
      lugarCalle: 'Av. Colón 1234',
      lugarLocalidad: 'Mar del Plata',
      lugarProvincia: 'Buenos Aires',
      latitud: -38.0055,
      longitud: -57.5426,
      detallesAccidente: 'Frené en el semáforo y el vehículo de atrás me impactó en el paragolpes trasero.',
      
      // Relación 1 a 1: Titular
      titular: {
        create: {
          tipoDoc: 'DNI',
          numDoc: '35123456',
          nombre: 'Juan',
          apellido: 'Pérez',
          patente: 'AB123CD',
          telefono: '2234567890',
          email: 'juan.perez@email.com',
          seguro: 'Seguros Rivadavia'
        }
      },


      // Relación 1 a Muchos: Terceros
      terceros: {
        create: [
          {
            dni: '40987654',
            nombre: 'María',
            apellido: 'Gómez',
            patente: 'XYZ789',
            aseguradora: 'Federación Patronal'
          }
        ]
      },

      // Relación 1 a Muchos: Evidencias (Cloudinary URLs simuladas)
      evidencias: {
        create: [
          {
            tipoDocumento: 'foto_patente',
            urlArchivo: 'https://res.cloudinary.com/demo/image/upload/v1/patente_juan.jpg'
          },
          {
            tipoDocumento: 'daños_detalle',
            urlArchivo: 'https://res.cloudinary.com/demo/image/upload/v1/choque_trasero.jpg'
          }
        ]
      }
    }
  });

  console.log("Siniestro de prueba creado con ID:", siniestroPrueba.id);
  console.log("¡Carga de datos finalizada!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });