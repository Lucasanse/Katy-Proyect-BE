import React, { useEffect, useState } from 'react';
import aseguradorasService from '../../services/aseguradoras.service.js';

export default function Step4tercero({ formData, setFormData, nextStep, prevStep }) {
  const [errors, setErrors] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [loadingAseguradoras, setLoadingAseguradoras] = useState(true);

  useEffect(() => {
    aseguradorasService
      .list()
      .then(setAseguradoras)
      .catch(() => setAseguradoras([]))
      .finally(() => setLoadingAseguradoras(false));
  }, []);

  const addTercero = () => {
    setFormData(prev => ({
      ...prev,
      terceros: [...(prev.terceros || []), { dni: '', nombre: '', apellido: '', patente: '', aseguradora: '' }]
    }));
    setErrors(prev => [...prev, {}]);
  };

  const removeTercero = (index) => {
    setFormData(prev => ({
      ...prev,
      terceros: prev.terceros.filter((_, i) => i !== index)
    }));
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const validateTerceroField = (field, value, index) => {
    if (!value || value.toString().trim() === "") return "Este campo es obligatorio";
    
    if (field === "dni") {
      const dniRegex = /^\d{6,9}$/;
      if (!dniRegex.test(value)) {
        return "El DNI debe tener entre 6 y 9 números";
      }
      
      const valTrim = value.toString().trim();
      if (parseInt(valTrim, 10) < 100000 || /^0+$/.test(valTrim)) {
        return "Número de documento inválido";
      }
      if (valTrim === formData?.titularNumDoc?.toString().trim()) {
        return "No puede ser igual al DNI del titular del vehículo";
      }
      if (!formData?.esMismoConductor && valTrim === formData?.conductorDocumento?.toString().trim()) {
        return "No puede ser igual al DNI del conductor propio";
      }
      const esDuplicado = formData?.terceros?.some((t, i) => i !== index && t.dni.toString().trim() === valTrim);
      if (esDuplicado) {
        return "Este DNI ya fue ingresado en otro tercero";
      }
    } else if (field === "patente") {
      const patenteRegex = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
      const patenteClean = value.toUpperCase().trim();
      
      if (!patenteRegex.test(patenteClean)) {
        return "Formato inválido. Debe ser XXX111 o XX111XX";
      }
      
      // Validación cruzada con la patente del titular
      if (patenteClean === formData?.titularPatente?.toUpperCase().trim()) {
        return "La patente no puede ser igual a la de tu vehículo (titular)";
      }
      
      // Validación cruzada para que no se repitan patentes entre los propios terceros
      const patenteDuplicada = formData?.terceros?.some((t, i) => i !== index && t.patente.toUpperCase().trim() === patenteClean);
      if (patenteDuplicada) {
        return "Esta patente ya fue registrada en otro tercero de la lista";
      }
    }
    return "";
  };

  const handleTerceroChange = (index, field, value) => {
    const cleanValue = field === "patente" ? value.toUpperCase() : value;
    const updated = [...formData.terceros];
    updated[index][field] = cleanValue;
    setFormData(prev => ({ ...prev, terceros: updated }));

    const updatedErrors = [...errors];
    if (!updatedErrors[index]) updatedErrors[index] = {};
    updatedErrors[index][field] = validateTerceroField(field, cleanValue, index);
    setErrors(updatedErrors);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.terceros || formData.terceros.length === 0) {
      nextStep();
      return;
    }

    let hasErrors = false;
    const newErrors = formData.terceros.map((tercero, index) => {
      const rowErrors = {};
      Object.keys(tercero).forEach((key) => {
        const error = validateTerceroField(key, tercero[key], index);
        if (error) {
          rowErrors[key] = error;
          hasErrors = true;
        }
      });
      return rowErrors;
    });

    setErrors(newErrors);
    if (!hasErrors) nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">4. Vehículos y Terceros Involucrados</h2>
          <p className="text-sm text-slate-500 mt-1">Registrá la información de los otros vehículos y conductores que participaron en el siniestro.</p>
        </div>
        <button 
          type="button" onClick={addTercero}
          className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-lg text-sm transition"
        >
          + Agregar otro tercero
        </button>
      </div>

      {(!formData.terceros || formData.terceros.length === 0) ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-500 text-sm">No hay terceros cargados.</p>
          <button type="button" onClick={addTercero} className="mt-2 text-blue-600 text-sm font-medium hover:underline">Hacé clic aquí para agregar uno</button>
        </div>
      ) : (
        <div className="space-y-6">
          {formData.terceros.map((tercero, index) => (
            <div key={index} className="p-5 bg-slate-50 border border-slate-200 rounded-xl relative">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">Vehículo / Tercero #{index + 1}</span>
                <button type="button" onClick={() => removeTercero(index)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                  Eliminar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Número de Documento (DNI)</label>
                  <input 
                    type="text" value={tercero.dni} onChange={(e) => handleTerceroChange(index, 'dni', e.target.value)} placeholder="Ej: 40123456"
                    maxLength={9}
                    className={`w-full mt-2 border-0 border-b-2 ${errors[index]?.dni ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none bg-transparent`}
                  />
                  {errors[index]?.dni && <span className="text-xs text-red-500 mt-1 block">{errors[index]?.dni}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Nombre</label>
                  <input 
                    type="text" value={tercero.nombre} onChange={(e) => handleTerceroChange(index, 'nombre', e.target.value)}
                    className={`w-full mt-2 border-0 border-b-2 ${errors[index]?.nombre ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none bg-transparent`}
                  />
                  {errors[index]?.nombre && <span className="text-xs text-red-500 mt-1 block">{errors[index]?.nombre}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Apellido</label>
                  <input 
                    type="text" value={tercero.apellido} onChange={(e) => handleTerceroChange(index, 'apellido', e.target.value)}
                    className={`w-full mt-2 border-0 border-b-2 ${errors[index]?.apellido ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none bg-transparent`}
                  />
                  {errors[index]?.apellido && <span className="text-xs text-red-500 mt-1 block">{errors[index]?.apellido}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Patente del vehículo</label>
                  <input 
                    type="text" value={tercero.patente} onChange={(e) => handleTerceroChange(index, 'patente', e.target.value)} placeholder="Ej: ABC123 o AB123CD"
                    className={`w-full mt-2 border-0 border-b-2 ${errors[index]?.patente ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 uppercase focus:outline-none bg-transparent`}
                  />
                  {errors[index]?.patente && <span className="text-xs text-red-500 mt-1 block">{errors[index]?.patente}</span>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Aseguradora del Tercero</label>
                  <select
                    value={tercero.aseguradora} onChange={(e) => handleTerceroChange(index, 'aseguradora', e.target.value)}
                    disabled={loadingAseguradoras}
                    className={`w-full mt-2 border-0 border-b-2 ${errors[index]?.aseguradora ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 bg-transparent focus:outline-none`}
                  >
                    <option value="">{loadingAseguradoras ? 'Cargando aseguradoras...' : 'Seleccioná una aseguradora...'}</option>
                    {aseguradoras.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  {errors[index]?.aseguradora && <span className="text-xs text-red-500 mt-1 block">{errors[index]?.aseguradora}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-slate-200">
        <button type="button" onClick={prevStep} className="px-6 py-2.5 text-slate-600 font-medium hover:underline">
          ← Paso anterior
        </button>
        <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-md">
          Siguiente
        </button>
      </div>
    </form>
  );
}