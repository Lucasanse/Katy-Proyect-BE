import React, { useState } from 'react';

const Step7Verificacion = ({ emailDestino, onVerificar, onReenviar, enviandoCodigo }) => {
  const [inputCodigo, setInputCodigo] = useState('');
  const [error, setError] = useState('');
  const [errorReenvio, setErrorReenvio] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerificando(true);
    try {
      await onVerificar(inputCodigo.trim());
    } catch (err) {
      setError(err.message || 'El código ingresado es incorrecto. Verifícalo e intenta nuevamente.');
    } finally {
      setVerificando(false);
    }
  };

  const handleReenviar = async () => {
    setErrorReenvio('');
    setReenviado(false);
    try {
      await onReenviar();
      setReenviado(true);
      setTimeout(() => setReenviado(false), 4000);
    } catch (err) {
      setErrorReenvio(err.message || 'No se pudo reenviar el código.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto text-center border border-gray-100">
      <div className="mb-6">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ✉️
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verificación de Seguridad</h2>
        <p className="text-gray-600 text-sm">
          Hemos enviado un código de 6 dígitos a <span className="font-semibold text-gray-800">{emailDestino}</span>.
          Por favor, ingrésalo para acceder a la carga de documentación.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            maxLength="6"
            value={inputCodigo}
            onChange={(e) => {
              setInputCodigo(e.target.value);
              setError('');
            }}
            placeholder="123456"
            className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              error
                ? 'border-red-500 focus:ring-red-200 bg-red-50'
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }`}
            required
          />
          {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={verificando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
        >
          {verificando ? 'Verificando...' : 'Validar Código y Continuar'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
        ¿No recibiste el correo? Revisá tu carpeta de Spam o{' '}
        <button
          type="button"
          onClick={handleReenviar}
          disabled={enviandoCodigo}
          className="text-blue-600 font-semibold hover:underline focus:outline-none disabled:opacity-60"
        >
          {enviandoCodigo ? 'Reenviando...' : 'haz clic aquí para reenviar'}
        </button>
        {reenviado && <p className="text-green-600 mt-2 font-medium">¡Nuevo código enviado con éxito!</p>}
        {errorReenvio && <p className="text-red-500 mt-2 font-medium">{errorReenvio}</p>}
      </div>
    </div>
  );
};

export default Step7Verificacion;
