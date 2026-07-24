require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slug(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function addDays(baseIso, days) {
  const date = new Date(`${baseIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// ------------------------------------------------------
// 20 ASEGURADORAS DE PRUEBA (las últimas 2 quedan inactivas
// para poder probar el borrado lógico apenas se corre el seed)
// ------------------------------------------------------
const NOMBRES_ASEGURADORAS = [
  'Seguros Rivadavia', 'Federación Patronal', 'Sancor Seguros', 'La Caja Seguros',
  'Zurich Argentina', 'San Cristóbal Seguros', 'Provincia Seguros', 'Sura Seguros',
  'Mercantil Andina', 'Orbis Seguros', 'Nación Seguros', 'Rio Uruguay Seguros',
  'Meridional Seguros', 'Prudencia Seguros', 'Copan Seguros', 'Sur Seguros',
  'Testimonio Seguros', 'Continental Seguros', 'Cooperación Seguros', 'Integrity Seguros',
];

function buildAseguradoras() {
  return NOMBRES_ASEGURADORAS.map((nombre, i) => ({
    nombre,
    telefono: `0810${(300 + i).toString().padStart(3, '0')}${(1000 + i * 37).toString().padStart(4, '0')}`,
    email: `contacto@${slug(nombre)}.com.ar`,
    sitioWeb: `https://www.${slug(nombre)}.com.ar`,
    // Las dos últimas simulan aseguradoras dadas de baja del catálogo
    activo: i < NOMBRES_ASEGURADORAS.length - 2,
  }));
}

// ------------------------------------------------------
// 20 SINIESTROS DE PRUEBA con datos variados: estados,
// conductor propio o no, productor o no, terceros, y evidencias
// (imágenes de placeholder para poder ver la galería en el detalle)
// ------------------------------------------------------
const NOMBRES = [
  'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Lucía', 'Diego', 'Sofía', 'Martín', 'Valentina',
  'Federico', 'Camila', 'Nicolás', 'Julieta', 'Tomás', 'Agustina', 'Franco', 'Micaela', 'Ignacio', 'Belén',
];
const APELLIDOS = [
  'Pérez', 'Fernández', 'Rodríguez', 'López', 'Martínez', 'García', 'Gómez', 'González', 'Sánchez', 'Romero',
  'Díaz', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina', 'Suárez',
];
const LOCALIDADES = [
  ['Av. Colón 1234', 'Mar del Plata'], ['Calle 12 y 51', 'La Plata'], ['Av. Independencia 850', 'Necochea'],
  ['Ruta 2 km 380', 'Miramar'], ['Av. Rivadavia 2200', 'Tandil'], ['Belgrano 430', 'Balcarce'],
  ['Av. Colón 900', 'Bahía Blanca'], ['San Martín 1500', 'Olavarría'], ['Av. del Valle 220', 'Pinamar'],
  ['Rivadavia 780', 'Azul'],
];
const HORAS = ['07:15', '08:30', '09:45', '11:00', '12:20', '14:10', '15:30', '17:45', '19:00', '21:15'];
const DETALLES = [
  'Frené en el semáforo y el vehículo de atrás me impactó en el paragolpes trasero.',
  'Al retroceder para estacionar, un tercero colisionó contra la parte lateral del vehículo.',
  'Cruce mal señalizado: el otro vehículo no respetó la prioridad de paso.',
  'Lluvia intensa, el auto de atrás no pudo frenar a tiempo en la avenida.',
  'Doble fila obligó a un cambio de carril brusco y terminó en colisión leve.',
];
const VINCULOS = ['Familiar', 'Amigo', 'Empleado', 'Cónyuge'];
const TIPOS_EVIDENCIA = [
  { tipo: 'foto_patente', color: '1d4ed8', label: 'Foto+Patente' },
  { tipo: 'dni_frente', color: '16a34a', label: 'DNI+Frente' },
  { tipo: 'dni_dorso', color: 'ca8a04', label: 'DNI+Dorso' },
  { tipo: 'fotos_danos', color: 'dc2626', label: 'Danos+Vehiculo' },
  { tipo: 'cedula_verde', color: '7c3aed', label: 'Cedula+Verde' },
];
const ESTADOS = ['pendiente', 'en_revision', 'cerrado'];

const LETRAS_PATENTE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function patente(i) {
  const letra = (offset) => LETRAS_PATENTE[(i + offset) % LETRAS_PATENTE.length];
  const numero = ((100 + i * 7) % 1000).toString().padStart(3, '0');

  return i % 2 === 0
    ? `${letra(0)}${letra(5)}${letra(11)}${numero}` // formato viejo: AAA111
    : `${letra(0)}${letra(3)}${numero}${letra(7)}${letra(9)}`; // formato nuevo: AA111AA
}

function buildEvidencias(siniestroIndex) {
  const cantidad = (siniestroIndex % 4); // 0 a 3 evidencias por siniestro
  return Array.from({ length: cantidad }, (_, j) => {
    const { tipo, color, label } = TIPOS_EVIDENCIA[(siniestroIndex + j) % TIPOS_EVIDENCIA.length];
    return {
      tipoDocumento: tipo,
      urlArchivo: `https://placehold.co/600x400/${color}/ffffff?text=${label}+%23${siniestroIndex + 1}`,
      publicId: `seed_siniestro${siniestroIndex + 1}_evidencia${j + 1}`,
    };
  });
}

function buildSiniestros(aseguradoras) {
  return Array.from({ length: 20 }, (_, i) => {
    const nombre = NOMBRES[i];
    const apellido = APELLIDOS[i];
    const [lugarCalle, lugarLocalidad] = LOCALIDADES[i % LOCALIDADES.length];
    const aseguradoraTitular = aseguradoras[i % aseguradoras.length];
    const tieneConductor = i % 2 === 0;
    const tieneProductor = i % 3 === 0;
    const cantidadTerceros = i % 3 === 1 ? 1 : i % 5 === 0 ? 2 : 0;

    const data = {
      fechaSiniestro: addDays('2026-05-01', i * 3),
      horaSiniestro: HORAS[i % HORAS.length],
      huboHeridos: i % 5 === 0,
      lugarCalle,
      lugarLocalidad,
      lugarProvincia: 'Buenos Aires',
      detallesAccidente: DETALLES[i % DETALLES.length],
      estado: ESTADOS[i % ESTADOS.length],

      titular: {
        create: {
          tipoDoc: 'DNI',
          numDoc: `${30000000 + i * 1111}`,
          nombre,
          apellido,
          patente: patente(i),
          telefono: `223${(4000000 + i * 123).toString().slice(0, 7)}`,
          email: `${slug(nombre)}.${slug(apellido)}@email.com`,
          aseguradoraId: aseguradoraTitular.id,
        },
      },

      evidencias: {
        create: buildEvidencias(i),
      },
    };

    if (tieneConductor) {
      const conductorNombre = NOMBRES[(i + 7) % NOMBRES.length];
      const conductorApellido = APELLIDOS[(i + 11) % APELLIDOS.length];
      data.conductor = {
        create: {
          nombreCompleto: `${conductorNombre} ${conductorApellido}`,
          documento: `${38000000 + i * 777}`,
          telefono: `223${(9000000 + i * 91).toString().slice(0, 7)}`,
          email: `${slug(conductorNombre)}.${slug(conductorApellido)}@email.com`,
          vinculo: VINCULOS[i % VINCULOS.length],
        },
      };
    }

    if (tieneProductor) {
      const productorNombre = NOMBRES[(i + 3) % NOMBRES.length];
      const productorApellido = APELLIDOS[(i + 5) % APELLIDOS.length];
      data.productor = {
        create: {
          esProductor: true,
          nombre: `${productorNombre} ${productorApellido}`,
          matricula: `PROD-${4000 + i}`,
          telefono: `223${(4445566 + i * 13).toString().slice(0, 7)}`,
          email: `${slug(productorNombre)}.${slug(productorApellido)}@seguros.com`,
        },
      };
    }

    if (cantidadTerceros > 0) {
      data.terceros = {
        create: Array.from({ length: cantidadTerceros }, (_, t) => {
          const terceroIndex = (i + t + 1) % NOMBRES.length;
          const terceroNombre = NOMBRES[terceroIndex];
          const terceroApellido = APELLIDOS[(terceroIndex + 2) % APELLIDOS.length];
          const aseguradoraTercero = aseguradoras[(i + t + 1) % aseguradoras.length];
          return {
            dni: `${40000000 + terceroIndex * 987}`,
            nombre: terceroNombre,
            apellido: terceroApellido,
            patente: patente(terceroIndex + 50),
            aseguradoraId: aseguradoraTercero.id,
          };
        }),
      };
    }

    return data;
  });
}

async function main() {
  console.log('Iniciando la carga de datos (Seed)...');

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
  console.log('Administrador creado:', admin.email, '(password: admin123)');

  // 2. Crear 20 aseguradoras de prueba (las últimas 2 quedan inactivas)
  const aseguradoras = await prisma.aseguradora.createManyAndReturn({
    data: buildAseguradoras(),
  });
  console.log(`${aseguradoras.length} aseguradoras creadas (2 inactivas de prueba)`);

  // 3. Crear 20 siniestros de prueba con datos variados
  const siniestrosData = buildSiniestros(aseguradoras);
  let creados = 0;
  for (const data of siniestrosData) {
    await prisma.siniestro.create({ data });
    creados += 1;
  }
  console.log(`${creados} siniestros creados`);

  console.log('¡Carga de datos finalizada!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
