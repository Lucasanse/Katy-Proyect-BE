import { useEffect, useState } from 'react';
import siniestrosService from '../../services/siniestros.service.js';
import aseguradorasService from '../../services/aseguradoras.service.js';

const PROVINCIAS = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad Autónoma de Buenos Aires',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
  'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-slate-500 uppercase mb-1';

export default function SiniestroEditModal({ siniestro, onClose, onSaved }) {
  const [aseguradoras, setAseguradoras] = useState([]);
  const [form, setForm] = useState({
    fechaSiniestro: siniestro.fechaSiniestro || '',
    horaSiniestro: siniestro.horaSiniestro || '',
    huboHeridos: Boolean(siniestro.huboHeridos),
    lugarCalle: siniestro.lugarCalle || '',
    lugarLocalidad: siniestro.lugarLocalidad || '',
    lugarProvincia: siniestro.lugarProvincia || '',
    latitud: siniestro.latitud ?? '',
    longitud: siniestro.longitud ?? '',
    detallesAccidente: siniestro.detallesAccidente || '',
    titularTipoDoc: siniestro.titular?.tipoDoc || 'DNI',
    titularNumDoc: siniestro.titular?.numDoc || '',
    titularNombre: siniestro.titular?.nombre || '',
    titularApellido: siniestro.titular?.apellido || '',
    titularPatente: siniestro.titular?.patente || '',
    titularTelefono: siniestro.titular?.telefono || '',
    titularEmail: siniestro.titular?.email || '',
    titularAseguradoraId: siniestro.titular?.aseguradora?.id || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    aseguradorasService.list({ incluirInactivas: true }).then(setAseguradoras).catch(() => setAseguradoras([]));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        fechaSiniestro: form.fechaSiniestro,
        horaSiniestro: form.horaSiniestro,
        huboHeridos: form.huboHeridos,
        lugarCalle: form.lugarCalle,
        lugarLocalidad: form.lugarLocalidad,
        lugarProvincia: form.lugarProvincia,
        latitud: form.latitud === '' ? null : Number(form.latitud),
        longitud: form.longitud === '' ? null : Number(form.longitud),
        detallesAccidente: form.detallesAccidente,
      };

      if (siniestro.titular) {
        payload.titular = {
          tipoDoc: form.titularTipoDoc,
          numDoc: form.titularNumDoc,
          nombre: form.titularNombre,
          apellido: form.titularApellido,
          patente: form.titularPatente,
          telefono: form.titularTelefono,
          email: form.titularEmail,
          aseguradoraId: Number(form.titularAseguradoraId),
        };
      }

      const actualizado = await siniestrosService.update(siniestro.id, payload);
      onSaved(actualizado);
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-900">Modificar siniestro #{siniestro.id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2" aria-label="Cerrar">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Datos del siniestro</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha</label>
                <input type="date" name="fechaSiniestro" value={form.fechaSiniestro} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Hora</label>
                <input type="time" name="horaSiniestro" value={form.horaSiniestro} onChange={handleChange} required className={inputClass} />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-700">¿Hubo heridos?</span>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, huboHeridos: !p.huboHeridos }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.huboHeridos ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      form.huboHeridos ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className={labelClass}>Calle</label>
                <input type="text" name="lugarCalle" value={form.lugarCalle} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Localidad</label>
                <input type="text" name="lugarLocalidad" value={form.lugarLocalidad} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Provincia</label>
                <select name="lugarProvincia" value={form.lugarProvincia} onChange={handleChange} required className={inputClass}>
                  <option value="">Seleccioná...</option>
                  {PROVINCIAS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div />
              <div>
                <label className={labelClass}>Latitud</label>
                <input type="number" step="any" name="latitud" value={form.latitud} onChange={handleChange} placeholder="Opcional" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Longitud</label>
                <input type="number" step="any" name="longitud" value={form.longitud} onChange={handleChange} placeholder="Opcional" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Detalles del accidente</label>
                <textarea name="detallesAccidente" value={form.detallesAccidente} onChange={handleChange} rows={4} required className={inputClass} />
              </div>
            </div>
          </div>

          {siniestro.titular && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Titular</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo Doc.</label>
                  <select name="titularTipoDoc" value={form.titularTipoDoc} onChange={handleChange} className={inputClass}>
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                    <option value="CUIL">CUIL</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Número de documento</label>
                  <input type="text" name="titularNumDoc" value={form.titularNumDoc} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input type="text" name="titularNombre" value={form.titularNombre} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Apellido</label>
                  <input type="text" name="titularApellido" value={form.titularApellido} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Patente</label>
                  <input type="text" name="titularPatente" value={form.titularPatente} onChange={handleChange} required className={`${inputClass} uppercase`} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input type="text" name="titularTelefono" value={form.titularTelefono} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="titularEmail" value={form.titularEmail} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Aseguradora</label>
                  <select name="titularAseguradoraId" value={form.titularAseguradoraId} onChange={handleChange} required className={inputClass}>
                    <option value="">Seleccioná...</option>
                    {aseguradoras.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                        {!a.activo ? ' (inactiva)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:underline">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
