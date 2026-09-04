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
// + "No posee aseguradora", para los casos sin cobertura
// ------------------------------------------------------
const NOMBRES_ASEGURADORAS = [
  'Seguros Rivadavia', 'Federación Patronal', 'Sancor Seguros', 'La Caja Seguros',
  'Zurich Argentina', 'San Cristóbal Seguros', 'Provincia Seguros', 'Sura Seguros',
  'Mercantil Andina', 'Orbis Seguros', 'Nación Seguros', 'Rio Uruguay Seguros',
  'Meridional Seguros', 'Prudencia Seguros', 'Copan Seguros', 'Sur Seguros',
  'Testimonio Seguros', 'Continental Seguros', 'Cooperación Seguros', 'Integrity Seguros',
];

const SIN_ASEGURADORA = 'No posee aseguradora';

function cuit(i) {
  const tipo = i % 2 === 0 ? '20' : '27';
  const numero = (30000000 + i * 111111).toString().padStart(8, '0').slice(0, 8);
  const verificador = i % 10;
  return `${tipo}${numero}${verificador}`;
}

function buildAseguradoras() {
  const conDatos = NOMBRES_ASEGURADORAS.map((nombre, i) => ({
    nombre,
    cuit: cuit(i),
    email: `contacto@${slug(nombre)}.com.ar`,
    sitioWeb: `https://www.${slug(nombre)}.com.ar`,
    // Las dos últimas simulan aseguradoras dadas de baja del catálogo
    activo: i < NOMBRES_ASEGURADORAS.length - 2,
  }));

  // Opción para quien no tiene cobertura: sin CUIT/email/sitio, siempre activa
  return [...conDatos, { nombre: SIN_ASEGURADORA, cuit: null, email: null, sitioWeb: null, activo: true }];
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
  { tipo: 'cedula_frente', color: '7c3aed', label: 'Cedula+Verde' },
];
const ESTADOS = ['pendiente', 'en_revision', 'falta_documentacion', 'presentado_compania', 'cerrado'];

// Las 4 combinaciones posibles de intervención cuando hubo heridos, para cubrir todos los casos de prueba
const COMBINACIONES_INTERVENCION = [
  { intervencionPolicial: true, intervencionAmbulancia: true },
  { intervencionPolicial: true, intervencionAmbulancia: false },
  { intervencionPolicial: false, intervencionAmbulancia: true },
  { intervencionPolicial: false, intervencionAmbulancia: false },
];

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
  const sinAseguradora = aseguradoras.find((a) => a.nombre === SIN_ASEGURADORA);
  // Base aproximada Mar del Plata, con una pequeña variación por siniestro
  const BASE_LAT = -38.0055;
  const BASE_LNG = -57.5426;

  return Array.from({ length: 20 }, (_, i) => {
    const nombre = NOMBRES[i];
    const apellido = APELLIDOS[i];
    const [lugarCalle, lugarLocalidad] = LOCALIDADES[i % LOCALIDADES.length];
    // Los índices 2 y 15 quedan a propósito sin aseguradora real, para tener casos de prueba
    const sinAseguradoraForzada = (i === 2 || i === 15) && sinAseguradora;
    const aseguradoraTitular = sinAseguradoraForzada || aseguradoras[i % (aseguradoras.length - 1)];
    const tieneConductor = i % 2 === 0;
    const tieneProductor = i % 3 === 0;
    const cantidadTerceros = i % 3 === 1 ? 1 : i % 5 === 0 ? 2 : 0;
    // 1 de cada 3 siniestros tiene coordenadas cargadas; el resto queda sin marcar en el mapa
    const tieneCoordenadas = i % 3 === 0;

    const huboHeridos = i % 5 === 0;
    // Con/sin licencia repartido para tener ambos casos de prueba (7 de cada 20 sin licencia)
    const tieneLicencia = i % 3 !== 0;

    const data = {
      fechaSiniestro: addDays('2026-05-01', i * 3),
      horaSiniestro: HORAS[i % HORAS.length],
      huboHeridos,
      // Solo se informa intervención policial/ambulancia cuando hubo heridos
      ...(huboHeridos ? COMBINACIONES_INTERVENCION[(i / 5) % COMBINACIONES_INTERVENCION.length] : {}),
      tieneLicencia,
      lugarCalle,
      lugarLocalidad,
      lugarProvincia: 'Buenos Aires',
      ...(tieneCoordenadas
        ? { latitud: BASE_LAT + i * 0.003, longitud: BASE_LNG + i * 0.004 }
        : {}),
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
  await prisma.registroAuditoria.deleteMany();
  await prisma.evidencia.deleteMany();
  await prisma.tercero.deleteMany();
  await prisma.conductor.deleteMany();
  await prisma.titular.deleteMany();
  await prisma.productor.deleteMany();
  await prisma.siniestro.deleteMany();
  await prisma.administrador.deleteMany();
  await prisma.aseguradora.deleteMany();

  // 1. Crear el único usuario Administrador (no hay dueños por admin: ve todos los siniestros).
  // Para cambiar el mail/contraseña en un ambiente ya cargado, usar "npm run admin:reset"
  // en lugar de este seed (ese script no borra siniestros ni aseguradoras).
  const passwordHashAdmin = await bcrypt.hash('AdminSiniestros2026', 10);
  const admins = await prisma.administrador.createManyAndReturn({
    data: [
      { email: 'direccion@misionsiniestros.com.ar', password: passwordHashAdmin },
    ],
  });
  admins.forEach((a) => console.log('Administrador creado:', a.email));

  // 2. Crear 21 aseguradoras de prueba ("No posee aseguradora" incluida; las últimas 2 con nombre real quedan inactivas)
  const aseguradoras = await prisma.aseguradora.createManyAndReturn({
    data: buildAseguradoras(),
  });
  console.log(`${aseguradoras.length} aseguradoras creadas (2 inactivas de prueba + "No posee aseguradora")`);

  // 3. Crear 20 siniestros de prueba con datos variados
  const siniestrosData = buildSiniestros(aseguradoras);
  let creados = 0;
  const auditoriaSeed = [];

  for (const [i, data] of siniestrosData.entries()) {
    const creado = await prisma.siniestro.create({
      data,
      include: { titular: true, conductor: true, terceros: true },
    });
    creados += 1;

    // Dejamos algunos registros de auditoría de ejemplo, simulando ediciones ya hechas desde el panel
    if (i === 0 && creado.titular) {
      auditoriaSeed.push({
        siniestroId: creado.id,
        entidad: 'titular',
        entidadId: creado.titular.id,
        adminId: admins[0].id,
        adminEmail: admins[0].email,
        cambios: { telefono: { anterior: '2234000000', nuevo: creado.titular.telefono } },
      });
    }
    if (i === 1 && creado.conductor) {
      auditoriaSeed.push({
        siniestroId: creado.id,
        entidad: 'conductor',
        entidadId: creado.conductor.id,
        adminId: admins[1].id,
        adminEmail: admins[1].email,
        cambios: { vinculo: { anterior: 'Amigo', nuevo: creado.conductor.vinculo } },
      });
    }
    if (i === 6 && creado.terceros?.length) {
      auditoriaSeed.push({
        siniestroId: creado.id,
        entidad: 'tercero',
        entidadId: creado.terceros[0].id,
        adminId: admins[0].id,
        adminEmail: admins[0].email,
        cambios: { patente: { anterior: 'AAA000', nuevo: creado.terceros[0].patente } },
      });
    }
  }
  console.log(`${creados} siniestros creados`);

  if (auditoriaSeed.length) {
    await prisma.registroAuditoria.createMany({ data: auditoriaSeed });
    console.log(`${auditoriaSeed.length} registros de auditoría de ejemplo creados`);
  }

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
