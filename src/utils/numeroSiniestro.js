// El id numérico interno (autoincrement, usado en PKs/FKs) nunca se expone tal cual:
// se muestra siempre como "MS" + el id con 6 dígitos. Pasados los 999999 siniestros,
// padStart no trunca nada: el número simplemente crece (MS1000000, MS1000001, ...),
// así que no hace falta ningún manejo especial para ese caso.
const PREFIJO = 'MS';
const DIGITOS = 6;

function formatear(id) {
  return `${PREFIJO}${String(id).padStart(DIGITOS, '0')}`;
}

// Acepta tanto "MS000482" como "482" o 482. Devuelve null si no se puede interpretar.
function parsear(numero) {
  if (typeof numero === 'number' && Number.isInteger(numero)) return numero;

  const limpio = String(numero ?? '').trim().toUpperCase();
  const sinPrefijo = limpio.startsWith(PREFIJO) ? limpio.slice(PREFIJO.length) : limpio;

  if (!/^\d+$/.test(sinPrefijo)) return null;

  const valor = parseInt(sinPrefijo, 10);
  return Number.isSafeInteger(valor) ? valor : null;
}

module.exports = { formatear, parsear, PREFIJO };
