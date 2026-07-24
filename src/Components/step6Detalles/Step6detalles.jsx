import React, { useState } from 'react';

export default function Step6detalles({ formData, setFormData, prevStep, onSubmit, enviando }) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.value.trim() !== "") setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.detallesAccidente || formData.detallesAccidente.trim() === "") {
      setError("Por favor, ingresá una descripción de los daños y cómo ocurrió el hecho");
      return;
    }
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">6. Información de los daños</h2>
        <p className="text-sm text-slate-500 mt-1">Detallá la mecánica del accidente y qué partes del vehículo resultaron afectadas.</p>
      </div>

      <div className="pt-2 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción narrativa del hecho</label>
          
          <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-md mb-4">
            <p className="text-xs text-blue-900 leading-relaxed font-medium">
              💡 <strong>Sugerencia para una rápida gestión:</strong> Describí cómo fue el impacto y asegurate de detallar con claridad las <strong>zonas afectadas de tu vehículo</strong> (ej: frente, paragolpes trasero, lateral izquierdo, ambas puertas derechas, óptica, etc.).
            </p>
          </div>

          <textarea
            name="detallesAccidente"
            value={formData?.detallesAccidente || ''}
            onChange={handleChange}
            rows={6}
            placeholder="Contanos qué pasó: Estaba detenido en el semáforo de la calle X cuando el vehículo tercero me chocó de atrás, dañando el paragolpes trasero y la tapa del baúl..."
            className={`w-full p-4 border ${error ? 'border-red-500' : 'border-slate-300'} rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-800 focus:outline-none transition resize-none shadow-sm`}
          />
          {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200">
        <button type="button" onClick={prevStep} disabled={enviando} className="px-6 py-2.5 text-slate-600 font-medium hover:underline disabled:opacity-50">
          ← Paso anterior
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-60 transition shadow-lg"
        >
          {enviando ? 'Enviando código...' : 'Confirmar y Enviar Reclamo'}
        </button>
      </div>
    </form>
  );
}