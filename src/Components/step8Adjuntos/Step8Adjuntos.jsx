import React, { useEffect, useState } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS_LABEL = 'JPG, JPEG, PNG o PDF';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT_ATTR = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';

const categoriasDocumentacion = [
  { id: 'patente', label: 'Fotos de patente', req: true },
  { id: 'danios', label: 'Fotos de daños en detalle', multiple: true, maxFiles: 6, req: true },
  { id: 'dni_frente', label: 'DNI - Frente', req: true },
  { id: 'dni_dorso', label: 'DNI - Dorso', req: true },
  { id: 'licencia_frente', label: 'Licencia de Conducir - Frente', req: true },
  { id: 'licencia_dorso', label: 'Licencia de Conducir - Dorso', req: true },
  { id: 'cedula', label: 'Cédula Verde / Azul', req: true },
  { id: 'denuncia', label: 'Denuncia administrativa previa', req: false },
  { id: 'cobertura', label: 'Certificado de cobertura', req: false },
  { id: 'presupuesto', label: 'Presupuesto de reparación', req: false },
];

function validarArchivo(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" no es un formato permitido. Solo se aceptan ${ALLOWED_EXTENSIONS_LABEL}.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" pesa más de 5MB.`;
  }
  return null;
}

function FilePreview({ archivo, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!archivo || !archivo.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  return (
    <div className="relative">
      {previewUrl ? (
        <img src={previewUrl} alt={archivo.name} className="w-full h-24 object-cover rounded" />
      ) : (
        <div className="w-full h-24 flex items-center justify-center bg-slate-100 rounded text-xs text-slate-500 px-2 text-center">
          {archivo.name}
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-white border border-slate-300 rounded-full w-6 h-6 flex items-center justify-center text-xs text-red-600 hover:bg-red-50 shadow"
        aria-label="Quitar archivo"
      >
        &times;
      </button>
    </div>
  );
}

export default function Step8Adjuntos({ prevStep, onSubmitFinal, enviando, errorEnvio, siniestroCreado, onFinish }) {
  const [archivos, setArchivos] = useState({});
  const [erroresPorCategoria, setErroresPorCategoria] = useState({});
  const [errorFaltantes, setErrorFaltantes] = useState('');

  function handleFilesSelected(cat, fileList) {
    const nuevos = Array.from(fileList);
    const invalidos = [];
    const validos = [];

    for (const file of nuevos) {
      const error = validarArchivo(file);
      if (error) {
        invalidos.push(error);
      } else {
        validos.push(file);
      }
    }

    if (cat.multiple) {
      setArchivos((prev) => {
        const actuales = prev[cat.id] || [];
        const disponibles = cat.maxFiles - actuales.length;
        if (disponibles <= 0) {
          invalidos.push(`Ya alcanzaste el máximo de ${cat.maxFiles} archivos para esta categoría.`);
          return prev;
        }
        if (validos.length > disponibles) {
          invalidos.push(`Solo se agregaron ${disponibles} archivo(s): el máximo para esta categoría es ${cat.maxFiles}.`);
        }
        return { ...prev, [cat.id]: [...actuales, ...validos.slice(0, disponibles)] };
      });
    } else if (validos[0]) {
      setArchivos((prev) => ({ ...prev, [cat.id]: validos[0] }));
    }

    setErroresPorCategoria((prev) => ({ ...prev, [cat.id]: invalidos[0] || null }));
  }

  function handleRemoveFile(cat, index) {
    setArchivos((prev) => {
      if (cat.multiple) {
        const restantes = (prev[cat.id] || []).filter((_, i) => i !== index);
        return { ...prev, [cat.id]: restantes };
      }
      const next = { ...prev };
      delete next[cat.id];
      return next;
    });
    setErroresPorCategoria((prev) => ({ ...prev, [cat.id]: null }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const faltantes = categoriasDocumentacion.filter((cat) => {
      if (!cat.req) return false;
      const valor = archivos[cat.id];
      return cat.multiple ? !(valor && valor.length > 0) : !valor;
    });

    if (faltantes.length > 0) {
      setErrorFaltantes(`Faltan archivos obligatorios: ${faltantes.map((c) => c.label).join(', ')}.`);
      return;
    }

    setErrorFaltantes('');
    onSubmitFinal(archivos);
  }

  if (siniestroCreado) {
    return (
      <div className="bg-white p-8 rounded-lg text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Reclamo registrado con éxito!</h2>
        <p className="text-gray-600 mb-6">
          Tu siniestro quedó cargado con el número <strong>#{siniestroCreado.id}</strong>. Nos pondremos en contacto a la brevedad.
        </p>
        {onFinish && (
          <button
            type="button"
            onClick={onFinish}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow transition-colors"
          >
            Volver al inicio
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-100">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">Último paso</span>
        <h2 className="text-2xl font-bold text-gray-800 mt-1">Gestión de Archivos Adjuntos</h2>
        <p className="text-gray-600 text-sm mt-1">
          Adjuntá la evidencia y documentación. Formatos aceptados: {ALLOWED_EXTENSIONS_LABEL} (máx. 5MB por archivo).
          Los marcados como <strong>Obligatorio</strong> son necesarios para poder enviar el reclamo; el resto es opcional.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {categoriasDocumentacion.map((cat) => {
            const valor = archivos[cat.id];
            const lista = cat.multiple ? valor || [] : valor ? [valor] : [];
            const error = erroresPorCategoria[cat.id];
            const puedeAgregarMas = cat.multiple ? lista.length < cat.maxFiles : lista.length === 0;

            return (
              <div
                key={cat.id}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col justify-between hover:border-blue-400 transition-colors bg-gray-50/50"
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <label className="font-semibold text-gray-700 text-sm">{cat.label}</label>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {cat.req && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Obligatorio</span>
                    )}
                    {cat.multiple && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                        {lista.length}/{cat.maxFiles}
                      </span>
                    )}
                  </div>
                </div>

                {lista.length > 0 && (
                  <div className={`grid ${cat.multiple ? 'grid-cols-3' : 'grid-cols-1'} gap-2 mb-3`}>
                    {lista.map((archivo, index) => (
                      <FilePreview key={`${archivo.name}-${index}`} archivo={archivo} onRemove={() => handleRemoveFile(cat, index)} />
                    ))}
                  </div>
                )}

                {puedeAgregarMas && (
                  <div className="bg-white border border-gray-200 rounded p-4 text-center">
                    <label className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded border border-blue-200 cursor-pointer font-medium hover:bg-blue-100 transition-colors inline-block">
                      {cat.multiple ? 'Agregar archivo(s)' : 'Seleccionar archivo'}
                      <input
                        type="file"
                        accept={ACCEPT_ATTR}
                        multiple={cat.multiple}
                        className="hidden"
                        onChange={(e) => e.target.files.length && handleFilesSelected(cat, e.target.files)}
                      />
                    </label>
                  </div>
                )}

                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
              </div>
            );
          })}
        </div>

        {errorFaltantes && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{errorFaltantes}</p>
        )}

        {errorEnvio && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{errorEnvio}</p>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={enviando}
            className="px-6 py-2.5 text-slate-600 font-medium hover:underline disabled:opacity-50"
          >
            ← Paso anterior
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg shadow transition-colors"
          >
            {enviando ? 'Enviando...' : 'Confirmar y Enviar Siniestro'}
          </button>
        </div>
      </form>
    </div>
  );
}
