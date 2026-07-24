// Guardado en memoria: alcanza para un código de un solo uso y vida corta.
// Si el server se reinicia, el usuario simplemente pide que le reenvíen el código.
const codigosPorEmail = new Map();
const VIGENCIA_MS = 10 * 60 * 1000;

function normalizar(email) {
  return email.trim().toLowerCase();
}

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function guardarCodigo(email) {
  const codigo = generarCodigo();
  codigosPorEmail.set(normalizar(email), { codigo, expiraEn: Date.now() + VIGENCIA_MS });
  return codigo;
}

function verificarCodigo(email, codigo) {
  const clave = normalizar(email);
  const entrada = codigosPorEmail.get(clave);

  if (!entrada) return false;

  if (Date.now() > entrada.expiraEn) {
    codigosPorEmail.delete(clave);
    return false;
  }

  const esValido = entrada.codigo === codigo;
  if (esValido) codigosPorEmail.delete(clave); // uso único

  return esValido;
}

module.exports = { guardarCodigo, verificarCodigo };
