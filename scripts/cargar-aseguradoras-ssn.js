// Carga en la tabla Aseguradora el listado oficial de compañías de seguros
// habilitadas por la Superintendencia de Seguros de la Nación (SSN).
//
// El nombre de cada aseguradora sale del combo "Seleccionar una compañía" de
// https://service.ssn.gob.ar/consulta/consulta_entidades.php (fuente viva,
// con la razón social vigente hoy). El CUIT sale del dataset de datos
// abiertos de la SSN "Entidades aseguradoras y reaseguradoras activas"
// (https://datosabiertos.ssn.gob.ar/dataset/entidades-aseguradoras-y-reaseguradoras,
// snapshot al 12/25), cruzado por el código interno de 4 dígitos que la SSN
// le asigna a cada entidad (columna "cia_id" en ese dataset, mismo número
// que antecede al nombre en el combo). Ese código no cambia si la
// aseguradora se renombra, así que sirvió para linkear ambas fuentes aunque
// 6 de ellas ya figuran con otra razón social en el combo desde el snapshot.
//
// 3 entidades muy nuevas (LUMMA, RBT y ZONA ART) todavía no aparecen en el
// dataset de datos abiertos, así que quedan con cuit: null.
//
// Es idempotente: usa el nombre (columna única) para no duplicar aseguradoras
// que ya existan, así que se puede correr más de una vez sin problema.
//
// Uso:
//   node scripts/cargar-aseguradoras-ssn.js
require('dotenv').config();
const prisma = require('../src/prisma/client');

// 191 aseguradoras: nombre (SSN, vigente) + CUIT (datos abiertos SSN, snapshot 12/25)
const ASEGURADORAS_SSN = [
  { nombre: "AFIANZADORA LATINOAMERICANA COMPAÑÍA DE SEGUROS S.A.", cuit: "30709187941" },
  { nombre: "AGROSALTA COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500064850" },
  { nombre: "ALBA COMPAÑÍA ARGENTINA DE SEGUROS SOCIEDAD ANONIMA", cuit: "33500057039" },
  { nombre: "ALLIANZ ARGENTINA COMPAÑIA DE SEGUROS S.A.", cuit: "30500037217" },
  { nombre: "ANDINA ART S.A.", cuit: "33716992999" },
  { nombre: "ANTARTIDA COMPAÑÍA ARGENTINA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30500051309" },
  { nombre: "ANTICIPAR COMPAÑÍA DE SEGUROS S.A.", cuit: "30711517495" },
  { nombre: "ARGOS COMPAÑÍA ARGENTINA DE SEGUROS GENERALES SOCIEDAD ANÓNIMA", cuit: "30500050795" },
  { nombre: "ARGOS MUTUAL DE SEGUROS DEL TRANSPORTE PÚBLICO DE PASAJEROS", cuit: "30696164203" },
  { nombre: "ART MUTUAL DE EMPLEADOS MECANICOS Y AFINES DEL TRANSPORTE AUTOMOTOR SAN FRANCISCO", cuit: "30717216586" },
  { nombre: "ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO", cuit: "30716211432" },
  { nombre: "ASEGURADORA DE BIENES Y SERVICIOS S.A.", cuit: "30715292382" },
  { nombre: "ASEGURADORA DE CREDITOS Y GARANTIAS SOCIEDAD ANONIMA", cuit: "30500064478" },
  { nombre: "ASEGURADORA DEL FINISTERRE COMPAÑÍA ARGENTINA DE SEGUROS S.A.", cuit: "30712340297" },
  { nombre: "ASEGURADORES DE CAUCIONES SOCIEDAD ANONIMA COMPAÑIA DE SEGUROS", cuit: "30518919349" },
  { nombre: "ASOCIACION MUTUAL DAN", cuit: "30500045198" },
  { nombre: "ASOCIART S.A. ASEGURADORA DE RIESGOS DEL TRABAJO", cuit: "30686273330" },
  { nombre: "ASSEKURANSA COMPAÑÍA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30709541036" },
  { nombre: "ASSURANT ARGENTINA COMPAÑÍA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30500045406" },
  { nombre: "ASV ARGENTINA SALUD, VIDA Y PATRIMONIALES COMPAÑIA DE SEGUROS S.A.", cuit: "30678184779" },
  { nombre: "ATM COMPAÑÍA DE SEGUROS S.A.", cuit: "30699408154" },
  { nombre: "BARBUSS RISK SEGUROS (ARGENTINA) S.A.", cuit: "30500017011" },
  { nombre: "BBVA SEGUROS ARGENTINA S.A.", cuit: "30500064230" },
  { nombre: "BENEFICIO S.A. COMPAÑIA DE SEGUROS", cuit: "30680827520" },
  { nombre: "BERKLEY INTERNATIONAL ASEGURADORA DE RIESGOS DEL TRABAJO SOCIEDAD ANONIMA", cuit: "30685893076" },
  { nombre: "BERKLEY INTERNATIONAL SEGUROS SOCIEDAD ANONIMA", cuit: "30500035788" },
  { nombre: "BHN SEGUROS GENERALES S.A.", cuit: "30693504186" },
  { nombre: "BHN VIDA S.A.", cuit: "30693503953" },
  { nombre: "BINARIA SEGUROS DE RETIRO S.A.", cuit: "30678158433" },
  { nombre: "BINARIA SEGUROS DE VIDA S.A.", cuit: "30678158506" },
  { nombre: "BIND SEGUROS S.A", cuit: "30711668302" },
  { nombre: "BONACORSI SEGUROS DE PERSONAS S.A.", cuit: "30651009495" },
  { nombre: "CAJA DE PREVISIÓN Y SEGURO MÉDICO DE LA PROVINCIA DE BS.AS", cuit: "30542265317" },
  { nombre: "CAJA DE SEGUROS S.A.", cuit: "30663205621" },
  { nombre: "CAJA POPULAR DE AHORROS DE LA PROVINCIA DE TUCUMAN", cuit: "30517999551" },
  { nombre: "CAMINOS PROTEGIDOS COMPAÑÍA DE SEGUROS S.A.", cuit: "30500043357" },
  { nombre: "CARUSO COMPAÑÍA ARGENTINA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30518309427" },
  { nombre: "CERTEZA COMPAÑIA DE SEGUROS S.A.", cuit: "30652834317" },
  { nombre: "CHUBB SEGUROS ARGENTINA S.A.", cuit: "30500016260" },
  { nombre: "CNP ASSURANCES COMPAÑIA DE SEGUROS S.A.", cuit: "30682408622" },
  { nombre: "COLON COMPAÑÍA DE SEGUROS SOCIEDAD ANONIMA", cuit: "30712497641" },
  { nombre: "COMARSEG COMPAÑIA ARGENTINA DE SEGUROS S.A.", cuit: "33711246989" },
  { nombre: "COMPAGNIE FRANCAISE D´ASSURANCE POUR LE COMMERCE EXTERIEUR (SUCURSAL ARGENTINA)", cuit: "30697250367" },
  { nombre: "COMPAÑIA ARGENTINA DE SEGUROS LATITUD SUR SOCIEDAD ANONIMA", cuit: "30500066381" },
  { nombre: "COMPAÑIA ARGENTINA DE SEGUROS VICTORIA SOCIEDAD ANONIMA", cuit: "30500032266" },
  { nombre: "COMPAÑÍA ASEGURADORA DEL SUR S.A.", cuit: "30712178147" },
  { nombre: "COMPAÑÍA DE SEGUROS DE JUJUY SOCIEDAD DEL ESTADO", cuit: "30717794784" },
  { nombre: "COMPAÑÍA DE SEGUROS EL NORTE SOCIEDAD ANONIMA", cuit: "30500040455" },
  { nombre: "COMPAÑIA DE SEGUROS EUROAMERICA S.A.", cuit: "30500049916" },
  { nombre: "COMPAÑÍA DE SEGUROS GENERALES DE LA PROVINCIA DE SANTA CRUZ SOCIEDAD ANÓNIMA", cuit: "33718192949" },
  { nombre: "COMPAÑIA DE SEGUROS INSUR S.A.", cuit: "30710345364" },
  { nombre: "COMPAÑIA DE SEGUROS LA MERCANTIL ANDINA SOCIEDAD ANONIMA", cuit: "30500036911" },
  { nombre: "COMPAÑÍA DE SEGUROS MAÑANA SOCIEDAD ANÓNIMA", cuit: "30628830092" },
  { nombre: "COMPAÑÍA MERCANTIL ASEGURADORA SOCIEDAD ANONIMA ARGENTINA DE SEGUROS", cuit: "30500032193" },
  { nombre: "CONFLUENCIA COMPAÑIA DE SEGUROS S.A.", cuit: "30711416060" },
  { nombre: "COOPERACION MUTUAL PATRONAL SOCIEDAD MUTUAL DE SEGUROS GENERALES", cuit: "30500047174" },
  { nombre: "COOPERATIVA DE SEGUROS LUZ Y FUERZA LIMITADA", cuit: "30518965715" },
  { nombre: "COPAN COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500051929" },
  { nombre: "COSENA SEGUROS S.A.", cuit: "30707201882" },
  { nombre: "CREDICOOP COMPAÑIA DE SEGUROS DE RETIRO S.A.", cuit: "33685226389" },
  { nombre: "CREDITO Y CAUCION S.A. COMPAÑÍA DE SEGUROS", cuit: "30687874354" },
  { nombre: "CRUZ SUIZA COMPAÑÍA DE SEGUROS S.A.", cuit: "30679888842" },
  { nombre: "DIGNA SEGUROS S.A.", cuit: "30712148582" },
  { nombre: "EDIFICAR SEGUROS SOCIEDAD ANÓNIMA", cuit: "30620833173" },
  { nombre: "EL PROGRESO SEGUROS SOCIEDAD ANONIMA", cuit: "30701829723" },
  { nombre: "EL SURCO COMPAÑÍA DE SEGUROS SOCIEDAD ANONIMA", cuit: "30500039430" },
  { nombre: "ESENCIA SEGUROS S.A.", cuit: "30715342371" },
  { nombre: "EVOLUCIÓN SEGUROS S.A.", cuit: "30500050620" },
  { nombre: "Experta Aseguradora de Riesgos del Trabajo SA", cuit: "30687156168" },
  { nombre: "EXPERTA SEGUROS S.A.", cuit: "30714590541" },
  { nombre: "FEDERACION PATRONAL SEGUROS DE RETIRO S.A.", cuit: "30628555903" },
  { nombre: "FEDERACIÓN PATRONAL SEGUROS S.A.U.", cuit: "33707366589" },
  { nombre: "FEDERADA COMPAÑÍA DE SEGUROS DE PERSONAS SAU", cuit: "30712484744" },
  { nombre: "FIANZAS Y CREDITO S. A. COMPAÑIA DE SEGUROS", cuit: "30500055053" },
  { nombre: "GALENO SEGUROS S.A.", cuit: "30714395196" },
  { nombre: "GALICIA RETIRO COMPAÑÌA DE SEGUROS SAU", cuit: "30622930087" },
  { nombre: "GALICIA SEGUROS DE RETIRO S.A.U.", cuit: "30643103652" },
  { nombre: "GALICIA SEGUROS SAU", cuit: "30687145522" },
  { nombre: "GARANTÍA MUTUAL DE SEGUROS DEL TRANSPORTE PÚBLICO DE PASAJEROS", cuit: "30696857837" },
  { nombre: "GESTION COMPAÑÍA ARGENTINA DE SEGUROS S.A.", cuit: "30714838810" },
  { nombre: "GGAL SEGUROS S.A.U.", cuit: "30663221317" },
  { nombre: "HAMBURGO COMPAÑIA DE SEGUROS SOCIEDAD ANONIMA", cuit: "30500057587" },
  { nombre: "HANSEATICA COMPAÑIA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30710233744" },
  { nombre: "HORIZONTE COMPAÑIA ARGENTINA DE SEGUROS GENERALES SOCIEDAD ANÓNIMA", cuit: "30500052089" },
  { nombre: "INCLUIR COMPAÑÍA DE SEGUROS DE PERSONAS SOCIEDAD ANÓNIMA", cuit: "33718094009" },
  { nombre: "INSTITUTO ASEGURADOR MERCANTIL COMPAÑIA ARGENTINA DE SEGUROS SOCIEDAD ANÓNIMA IAM", cuit: "30500063242" },
  { nombre: "INSTITUTO AUTÁRQUICO PROVINCIAL DEL SEGURO", cuit: "30500055509" },
  { nombre: "INSTITUTO AUTARQUICO PROVINCIAL DEL SEGURO DE ENTRE RIOS SEGURO DE RETIRO SOCIEDAD ANONIMA", cuit: "30630063481" },
  { nombre: "INSTITUTO DE SALTA COMPAÑÍA DE SEGUROS DE VIDA SAU", cuit: "30690674889" },
  { nombre: "INSTITUTO DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30707250484" },
  { nombre: "INTÉGRITY SEGUROS ARGENTINA S.A.", cuit: "30704961983" },
  { nombre: "LA DULCE COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500041443" },
  { nombre: "LA EQUIDAD SOCIAL COMPAÑÍA DE SEGUROS PATRIMONIALES S.A.", cuit: "30714947415" },
  { nombre: "LA EQUITATIVA DEL PLATA SOCIEDAD ANONIMA DE SEGUROS", cuit: "30515419760" },
  { nombre: "LA ESTRELLA S.A. COMPAñíA DE SEGUROS DE RETIRO", cuit: "30620920874" },
  { nombre: "LA HOLANDO SUDAMERICANA COMPAÑIA DE SEGUROS SOCIEDAD ANONIMA", cuit: "33500038069" },
  { nombre: "LA MERIDIONAL COMPAÑÍA ARGENTINA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30500051163" },
  { nombre: "LA NUEVA COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500041133" },
  { nombre: "LA PALABRA COMPAÑÍA DE SEGUROS DE PERSONAS S.A.", cuit: "30718247337" },
  { nombre: "LA PAZ COMPAÑÍA DE SEGUROS S.A.", cuit: "33718252119" },
  { nombre: "LA PERSEVERANCIA SEGUROS SOCIEDAD ANONIMA", cuit: "30500032886" },
  { nombre: "LA PREVISORA S.A. SEGUROS DE SEPELIO", cuit: "30681314306" },
  { nombre: "LA SEGUNDA ASEGURADORA DE RIESGOS DEL TRABAJO SOCIEDAD ANÓNIMA", cuit: "30689133483" },
  { nombre: "LA SEGUNDA COMPAÑIA DE SEGUROS DE PERSONAS SOCIEDAD ANÓNIMA", cuit: "30500034625" },
  { nombre: "LA SEGUNDA COOPERATIVA LIMITADA DE SEGUROS GENERALES", cuit: "30500017704" },
  { nombre: "LA SEGUNDA SEGUROS DE RETIRO SOCIEDAD ANONIMA", cuit: "30627558763" },
  { nombre: "LA TERRITORIAL VIDA Y SALUD COMPAÑÍA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30682500782" },
  { nombre: "LIBRA COMPAÑIA ARGENTINA DE SEGUROS S.A.", cuit: "30712332820" },
  { nombre: "LIDER MOTOS COMPAÑÍA DE SEGUROS S.A.", cuit: "33712349579" },
  { nombre: "LIDERAR COMPAÑIA GENERAL DE SEGUROS S.A.", cuit: "30500059490" },
  { nombre: "LIFE SEGUROS DE PERSONAS Y PATRIMONIALES S.A.", cuit: "30500051546" },
  { nombre: "LOGRAR COMPAÑÍA DE SEGUROS DE PERSONAS S.A.", cuit: "30718268636" },
  { nombre: "LOGRAR COMPAÑÍA DE SEGUROS PATRIMONIALES SOCIEDAD ANÓNIMA", cuit: "33718266489" },
  { nombre: "LUMMA COMPAÑÍA ARGENTINA DE SEGUROS PATRIMONIALES SOCIEDAD ANÓNIMA", cuit: null },
  { nombre: "MAPFRE ARGENTINA SEGUROS DE VIDA S.A.", cuit: "33700893729" },
  { nombre: "MAPFRE ARGENTINA SEGUROS S.A.", cuit: "30500007539" },
  { nombre: "METROPOL COMPAÑÍA ARGENTINA DE SEGUROS SOCIEDAD ANONIMA", cuit: "30500061339" },
  { nombre: "METROPOL SOCIEDAD DE SEGUROS MUTUOS", cuit: "30696880278" },
  { nombre: "MISTA SEGUROS S.A.", cuit: "30682088318" },
  { nombre: "MUTUAL DE EMPLEADOS Y OBREROS PETROLEROS PRIVADOS ART MUTUAL", cuit: "30715002953" },
  { nombre: "MUTUAL RIVADAVIA DE SEGUROS DEL TRANSPORTE PÚBLICO DE PASAJEROS", cuit: "30692103560" },
  { nombre: "N.S.A. SEGUROS GENERALES S.A.", cuit: "30712341447" },
  { nombre: "NACIÓN SEGUROS DE RETIRO S.A.", cuit: "30678582669" },
  { nombre: "NACIÓN SEGUROS S.A.", cuit: "30678561165" },
  { nombre: "NATIVA COMPAÑIA ARGENTINA DE SEGUROS S.A.", cuit: "30500051856" },
  { nombre: "NIVEL SEGUROS S.A.", cuit: "30690674641" },
  { nombre: "NOBLE COMPAÑÍA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30708127155" },
  { nombre: "NRE COMPAÑÍA DE SEGUROS PATRIMONIALES Y DE PERSONAS S.A", cuit: "30712337121" },
  { nombre: "OMINT S.A. COMPAÑÍA DE SEGUROS", cuit: "30714838926" },
  { nombre: "OPCIÓN SEGUROS S.A.", cuit: "30714358797" },
  { nombre: "ORÍGENES SEGUROS DE RETIRO S.A.", cuit: "30624421899" },
  { nombre: "PACÍFICO COMPAÑÍA DE SEGUROS S.A.", cuit: "30715141716" },
  { nombre: "PARANÁ ASEGURADORA DE RIESGOS DEL TRABAJO SOCIEDAD ANÓNIMA", cuit: "30718567420" },
  { nombre: "PARANÁ SOCIEDAD ANONIMA DE SEGUROS", cuit: "30500057102" },
  { nombre: "PIEVE SEGUROS SOCIEDAD ANONIMA", cuit: "30690671367" },
  { nombre: "PLENARIA SEGUROS S.A.", cuit: "30678608439" },
  { nombre: "PREMIAR COMPAÑÍA ARGENTINA DE SEGUROS S.A.", cuit: "30716529793" },
  { nombre: "PREVENCIÓN ASEGURADORA DE RIESGOS DEL TRABAJO S.A.", cuit: "30684361917" },
  { nombre: "PREVENCIÓN SEGUROS DE RETIRO SOCIEDAD ANÓNIMA", cuit: "30716030438" },
  { nombre: "PREVINCA SEGUROS SOCIEDAD ANONIMA", cuit: "30500066144" },
  { nombre: "PRODUCTORES DE FRUTAS ARGENTINAS COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500059180" },
  { nombre: "PROTECCIÓN MUTUAL DE SEGUROS DEL TRANSPORTE PÚBLICO DE PASAJEROS", cuit: "30694505690" },
  { nombre: "PROVIDENCIA COMPAÑIA ARGENTINA DE SEGUROS S.A.", cuit: "30677290478" },
  { nombre: "PROVINCIA ASEGURADORA DE RIESGOS DEL TRABAJO S.A.", cuit: "30688254090" },
  { nombre: "PROVINCIA SEGUROS DE VIDA S. A.", cuit: "30678832576" },
  { nombre: "PROVINCIA SEGUROS SOCIEDAD ANONIMA", cuit: "30527508165" },
  { nombre: "PROYECCION SEGUROS DE RETIRO S.A.", cuit: "33659131299" },
  { nombre: "PRUDENCIA COMPAÑIA ARGENTINA DE SEGUROS GENERALES SOCIEDAD ANÓNIMA", cuit: "30500043594" },
  { nombre: "QUALIA COMPAÑÍA DE SEGUROS S.A.", cuit: "30714496804" },
  { nombre: "RBT COMPAÑÍA DE SEGUROS PATRIMONIALES S.A.", cuit: null },
  { nombre: "RCI COMPAÑÍA DE SEGUROS DE PERSONAS SAU", cuit: "30717570592" },
  { nombre: "RECONQUISTA ASEGURADORA DE RIESGOS DEL TRABAJO SOCIEDAD ANONIMA", cuit: "30632781853" },
  { nombre: "RÍO URUGUAY COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500061711" },
  { nombre: "SAN CRISTÓBAL SEGURO DE RETIRO SOCIEDAD ANONIMA", cuit: "30624259269" },
  { nombre: "SAN CRISTÓBAL SOCIEDAD MUTUAL DE SEGUROS GENERALES", cuit: "34500045339" },
  { nombre: "SAN GERMAN SEGUROS S.A.", cuit: "30712344594" },
  { nombre: "SAN MARINO COMPAÑÍA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30714584223" },
  { nombre: "SAN PATRICIO SEGUROS S.A.", cuit: "30661912614" },
  { nombre: "SANCOR COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500049460" },
  { nombre: "SANTA LUCÍA S.A. COMPAÑÍA DE SEGUROS", cuit: "30663191930" },
  { nombre: "SANTÍSIMA TRINIDAD SEGUROS DE VIDA SOCIEDAD ANONIMA", cuit: "30628903391" },
  { nombre: "SEGURCOOP COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500057277" },
  { nombre: "SEGUROMETAL COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500055363" },
  { nombre: "SEGUROS BERNARDINO RIVADAVIA COOPERATIVA LIMITADA", cuit: "30500050310" },
  { nombre: "SEGUROS GALICIA S.A.", cuit: "30500000127" },
  { nombre: "SEGUROS MÉDICOS SAU", cuit: "30708340908" },
  { nombre: "SENTIR SEGUROS SOCIEDAD ANONIMA", cuit: "30562050775" },
  { nombre: "SERENA ASEGURADORA DE RIESGOS DEL TRABAJO S.A.U.", cuit: "30712341803" },
  { nombre: "SMG COMPAÑÍA ARGENTINA DE SEGUROS SAU", cuit: "30500031960" },
  { nombre: "SMG LIFE COMPAÑÍA DE SEGUROS DE RETIRO SAU", cuit: "30700964805" },
  { nombre: "SMG LIFE SEGUROS DE VIDA SAU", cuit: "30685843400" },
  { nombre: "SMSV COMPAÑIA ARGENTINA DE SEGUROS S.A.", cuit: "30708333189" },
  { nombre: "SOBERANA SEGUROS PATRIMONIALES S.A", cuit: "30562751668" },
  { nombre: "SOCIAL SAN JUAN SEGUROS DE PERSONAS S.A.", cuit: "30717019969" },
  { nombre: "SOL NACIENTE SEGUROS SOCIEDAD ANONIMA", cuit: "30682509550" },
  { nombre: "SOLVENCIA COMPAÑÍA DE SEGUROS DE RETIRO SOCIEDAD ANÓNIMA.", cuit: "30716406012" },
  { nombre: "STARR INDEMNITY & LIABILITY COMPANY, SUCURSAL ARGENTINA, DE SEGUROS", cuit: "30712122478" },
  { nombre: "STELLANTIS INSURANCE COMPAÑIA DE SEGUROS S.A.U.", cuit: "30715165577" },
  { nombre: "SUMICLI ASOCIACION MUTUAL DE SEGUROS", cuit: "33690685979" },
  { nombre: "SUPERVIELLE SEGUROS S.A.", cuit: "30682500855" },
  { nombre: "SWISS MEDICAL ART SAU", cuit: "33686262869" },
  { nombre: "TESTIMONIO COMPAÑÍA DE SEGUROS S.A.", cuit: "30686244330" },
  { nombre: "TRES PROVINCIAS SEGUROS DE PERSONAS S.A.", cuit: "30684193038" },
  { nombre: "TRIUNFO COOPERATIVA DE SEGUROS LIMITADA", cuit: "30500065776" },
  { nombre: "TUTELAR SEGUROS SOCIEDAD ANONIMA", cuit: "30711442754" },
  { nombre: "WARRANTY INSURANCE COMPANY ARGENTINA DE SEGUROS SOCIEDAD ANÓNIMA", cuit: "30500050000" },
  { nombre: "WORANZ COMPAÑÍA DE SEGUROS S.A.", cuit: "30712162488" },
  { nombre: "ZONA ASEGURADORA DE RIESGOS DEL TRABAJO S.A.", cuit: null },
  { nombre: "ZURICH ARGENTINA COMPAÑIA DE SEGUROS SOCIEDAD ANONIMA", cuit: "30500049770" },
  { nombre: "ZURICH INTERNATIONAL LIFE LIMITED SUCURSAL ARGENTINA", cuit: "30679657158" },
  { nombre: "ZURICH SANTANDER SEGUROS ARGENTINA S.A.", cuit: "30698965459" },
];

async function main() {
  console.log(`Cargando ${ASEGURADORAS_SSN.length} aseguradoras de la SSN...`);

  const existentes = await prisma.aseguradora.findMany({
    select: { nombre: true },
    where: { nombre: { in: ASEGURADORAS_SSN.map((a) => a.nombre) } },
  });
  const nombresExistentes = new Set(existentes.map((a) => a.nombre));
  const nuevas = ASEGURADORAS_SSN.filter((a) => !nombresExistentes.has(a.nombre));

  if (nuevas.length === 0) {
    console.log('No hay aseguradoras nuevas para agregar: todas ya estaban cargadas.');
    return;
  }

  const { count } = await prisma.aseguradora.createMany({
    data: nuevas,
    skipDuplicates: true,
  });

  const sinCuit = nuevas.filter((a) => !a.cuit).length;
  console.log(`${count} aseguradoras nuevas creadas (${sinCuit} sin CUIT: todavía no figuran en el dataset de datos abiertos de la SSN).`);
  console.log(`${nombresExistentes.size} ya existían y se dejaron sin tocar.`);
}

main()
  .catch((e) => {
    console.error('Falló la carga de aseguradoras de la SSN:');
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
