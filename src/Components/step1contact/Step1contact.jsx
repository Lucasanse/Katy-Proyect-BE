import React, { useEffect, useState } from 'react';
import aseguradorasService from '../../services/aseguradoras.service.js';

export default function Step1contact({ formData, setFormData, nextStep }) {
  const [errors, setErrors] = useState({});
  const [aseguradoras, setAseguradoras] = useState([]);
  const [loadingAseguradoras, setLoadingAseguradoras] = useState(true);

  useEffect(() => {
    aseguradorasService
      .list()
      .then(setAseguradoras)
      .catch(() => setAseguradoras([]))
      .finally(() => setLoadingAseguradoras(false));
  }, []);

  const validateField = (name, value) => {
    let error = "";
    if (!value || value.toString().trim() === "") {
      return "Este campo es obligatorio";
    }

    if (name === "titularNumDoc") {
      const dniRegex = /^\d{6,9}$/;
      if (!dniRegex.test(value)) {
        error = "El DNI debe tener entre 6 y 9 números (sin puntos ni espacios)";
      } else if (parseInt(value, 10) < 100000 || /^0+$/.test(value)) {
        error = "Número de documento inválido";
      }
    } else if (name === "titularPatente") {
      const patenteRegex = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
      if (!patenteRegex.test(value.toUpperCase())) {
        error = "Formato inválido. Debe ser XXX111 o XX111XX";
      }
    } else if (name === "titularEmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = "Formato de correo electrónico inválido";
      }
    } else if (name === "titularTelefono") {
      const telRegex = /^\d+$/;
      if (!telRegex.test(value)) {
        error = "Solo se permiten números planos (sin espacios ni guiones)";
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = name === "titularPatente" ? value.toUpperCase() : value;
    
    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, cleanValue) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const fieldsToValidate = [
      'titularNumDoc', 'titularNombre', 'titularApellido', 
      'titularTelefono', 'titularEmail', 'titularPatente', 'titularSeguro'
    ];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">1. Datos del Damnificado (Titular del Vehículo)</h2>
        <p className="text-sm text-slate-500 mt-1">Por favor, registrá la información del propietario del coche afectado.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">Tipo Doc.</label>
          <select 
            name="titularTipoDoc" value={formData?.titularTipoDoc || 'DNI'} onChange={handleChange}
            className="w-full mt-2 border-0 border-b-2 border-slate-300 focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 bg-transparent"
          >
            <option value="DNI">DNI</option>
            <option value="CUIT">CUIT</option>
            <option value="CUIL">CUIL</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase">Número de Documento</label>
          <input 
            type="text" name="titularNumDoc" value={formData?.titularNumDoc || ''} onChange={handleChange} placeholder="Ej: 30123456"
            maxLength={9}
            className={`w-full mt-2 border-0 border-b-2 ${errors.titularNumDoc ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none`}
          />
          {errors.titularNumDoc && <span className="text-xs text-red-500 mt-1 block">{errors.titularNumDoc}</span>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">Nombre</label>
          <input 
            type="text" name="titularNombre" value={formData?.titularNombre || ''} onChange={handleChange}
            className={`w-full mt-2 border-0 border-b-2 ${errors.titularNombre ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none`}
          />
          {errors.titularNombre && <span className="text-xs text-red-500 mt-1 block">{errors.titularNombre}</span>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">Apellido</label>
          <input 
            type="text" name="titularApellido" value={formData?.titularApellido || ''} onChange={handleChange}
            className={`w-full mt-2 border-0 border-b-2 ${errors.titularApellido ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none`}
          />
          {errors.titularApellido && <span className="text-xs text-red-500 mt-1 block">{errors.titularApellido}</span>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">Patente del vehículo</label>
          <input 
            type="text" name="titularPatente" value={formData?.titularPatente || ''} onChange={handleChange} placeholder="Ej: ABC123 o AB123CD"
            className={`w-full mt-2 border-0 border-b-2 ${errors.titularPatente ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 uppercase focus:outline-none`}
          />
          {errors.titularPatente && <span className="text-xs text-red-500 mt-1 block">{errors.titularPatente}</span>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">Teléfono móvil</label>
          <input 
            type="tel" name="titularTelefono" value={formData?.titularTelefono || ''} onChange={handleChange} placeholder="Ej: 1123456789"
            className={`w-full mt-2 border-0 border-b-2 ${errors.titularTelefono ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none`}
          />
          {errors.titularTelefono && <span className="text-xs text-red-500 mt-1 block">{errors.titularTelefono}</span>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">E-mail</label>
          <input 
            type="email" name="titularEmail" value={formData?.titularEmail || ''} onChange={handleChange} placeholder="nombre@correo.com"
            className={`w-full mt-2 border-0 border-b-2 ${errors.titularEmail ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none`}
          />
          {errors.titularEmail && <span className="text-xs text-red-500 mt-1 block">{errors.titularEmail}</span>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">Compañía de seguros</label>
          <select
            name="titularSeguro" value={formData?.titularSeguro || ''} onChange={handleChange}
            disabled={loadingAseguradoras}
            className={`w-full mt-2 border-0 border-b-2 ${errors.titularSeguro ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 bg-transparent`}
          >
            <option value="">{loadingAseguradoras ? 'Cargando aseguradoras...' : 'Seleccioná tu aseguradora'}</option>
            {aseguradoras.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          {errors.titularSeguro && <span className="text-xs text-red-500 mt-1 block">{errors.titularSeguro}</span>}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">
          Siguiente
        </button>
      </div>
    </form>
  );
}