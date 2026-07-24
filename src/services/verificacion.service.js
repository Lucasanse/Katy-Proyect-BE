import api from './api.js';

function enviarCodigo(email) {
  return api.post('/verificacion/enviar', { email });
}

function confirmarCodigo(email, codigo) {
  return api.post('/verificacion/confirmar', { email, codigo });
}

export default { enviarCodigo, confirmarCodigo };
