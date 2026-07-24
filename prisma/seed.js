require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

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
  await prisma.aseguradora.deleteMany();

  // 1. Crear el usuario Administrador
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.administrador.create({
    data: {
      email: 'admin@tuseguro.com',
      password: passwordHash,
    },
  });
  console.log("Administrador creado:", admin.email, "(password: admin123)");

  // 2. Crear aseguradoras de ejemplo (catálogo administrable)
  const aseguradoras = await prisma.aseguradora.createManyAndReturn({
    data: [
      {
        nombre: 'Seguros Rivadavia',
        telefono: '08101234567',
        email: 'contacto@rivadavia.com.ar',
        sitioWeb: 'https://www.segurosrivadavia.com',
      },
      {
        nombre: 'Federación Patronal',
        telefono: '08101234567',
        email: 'contacto@fedpatronal.com.ar',
        sitioWeb: 'https://www.fedpat.com.ar',
      },
      {
        nombre: 'Sancor Seguros',
        telefono: '08103337262',
        email: 'contacto@sancorseguros.com.ar',
        sitioWeb: 'https://www.sancorseguros.com.ar',
      },
      {
        nombre: 'La Caja Seguros',
        telefono: '08103322522',
        email: 'contacto@lacaja.com.ar',
        sitioWeb: 'https://www.lacaja.com.ar',
      },
      {
        nombre: 'Zurich Argentina',
        telefono: '08103099874',
        email: 'contacto@zurich.com.ar',
        sitioWeb: 'https://www.zurich.com.ar',
      },
      {
        nombre: 'San Cristóbal Seguros',
        telefono: '08103337262',
        email: 'contacto@sancristobal.com.ar',
        sitioWeb: 'https://www.sancristobal.com.ar',
      },
      {
        nombre: 'Provincia Seguros',
        telefono: '08103008888',
        email: 'contacto@provinciaseguros.com.ar',
        sitioWeb: 'https://www.provinciaseguros.com',
      },
    ],
  });
  console.log(`${aseguradoras.length} aseguradoras creadas`);

  const rivadavia = aseguradoras.find((a) => a.nombre === 'Seguros Rivadavia');
  const fedPatronal = aseguradoras.find((a) => a.nombre === 'Federación Patronal');

  // 3. Siniestro completo: titular, conductor, productor y tercero
  const siniestro = await prisma.siniestro.create({
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
          aseguradoraId: rivadavia.id
        }
      },

      conductor: {
        create: {
          nombreCompleto: 'Yamil García',
          documento: '38999888',
          telefono: '2239998880',
          email: 'yamil@email.com',
          vinculo: 'Amigo'
        }
      },

      productor: {
        create: {
          esProductor: true,
          nombre: 'Marcelo Sosa',
          matricula: 'PROD-4521',
          telefono: '2234445566',
          email: 'marcelo.sosa@seguros.com'
        }
      },

      terceros: {
        create: [
          {
            dni: '40987654',
            nombre: 'María',
            apellido: 'Gómez',
            patente: 'XYZ789',
            aseguradoraId: fedPatronal.id
          }
        ]
      }
    },
    include: {
      titular: { include: { aseguradora: true } },
      conductor: true,
      productor: true,
      terceros: { include: { aseguradora: true } },
    }
  });

  console.log("Siniestro creado con ID:", siniestro.id);
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
