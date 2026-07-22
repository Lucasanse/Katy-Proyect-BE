require('dotenv').config();
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
  
  // Limpieza de tablas (el orden es importante para no romper relaciones)
  await prisma.evidencia.deleteMany();
  await prisma.tercero.deleteMany();
  await prisma.conductor.deleteMany();
  await prisma.titular.deleteMany();
  await prisma.productor.deleteMany();
  await prisma.siniestro.deleteMany();
  await prisma.administrador.deleteMany();

  // 1. Crear el usuario Administrador
  const admin = await prisma.administrador.upsert({
    where: { email: 'admin@tuseguro.com' },
    update: {},
    create: {
      email: 'admin@tuseguro.com',
      password: 'hash_falso_de_admin123', 
    },
  });
  console.log("Administrador creado:", admin.email);

  // 2. Siniestro A: El titular era quien manejaba (No enviamos el objeto conductor)
  const siniestroTitular = await prisma.siniestro.create({
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
  console.log("Siniestro 1 (Titular manejaba) creado con ID:", siniestroTitular.id);

  // 3. Siniestro B: Un conductor distinto al titular estaba manejando
  const siniestroConductorDistinto = await prisma.siniestro.create({
    data: {
      fechaSiniestro: '2026-07-21',
      horaSiniestro: '09:15',
      huboHeridos: false,
      lugarCalle: 'Güemes y Alberti',
      lugarLocalidad: 'Mar del Plata',
      lugarProvincia: 'Buenos Aires',
      latitud: -38.0155,
      longitud: -57.5326,
      detallesAccidente: 'Roce lateral al salir de un estacionamiento.',
      
      titular: {
        create: {
          tipoDoc: 'DNI',
          numDoc: '40111222',
          nombre: 'Lian',
          apellido: 'Martínez',
          patente: 'XYZ987',
          telefono: '2231112220',
          email: 'lian@email.com',
          seguro: 'Seguros Totales'
        }
      },

      // Aquí se crea el registro en la tabla Conductor
      conductor: {
        create: {
          nombreCompleto: 'Yamil García',
          documento: '38999888',
          telefono: '2239998880',
          email: 'yamil@email.com',
          vinculo: 'Amigo'
        }
      }
    }
  });

  console.log("Siniestro 2 (Conductor distinto) creado con ID:", siniestroConductorDistinto.id);
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