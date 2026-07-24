import { useState } from 'react';
import aseguradorasService from '../../services/aseguradoras.service.js';

const EMPTY_FORM = { nombre: '', telefono: '', email: '', sitioWeb: '' };

export default function AseguradoraFormModal({ aseguradora, onClose, onSaved, onDeleted }) {
  const isEdit = Boolean(aseguradora);
  const [form, setForm] = useState(
    isEdit
      ? {
          nombre: aseguradora.nombre || '',
          telefono: aseguradora.telefono || '',
          email: aseguradora.email || '',
          sitioWeb: aseguradora.sitioWeb || '',
          activo: aseguradora.activo,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
        sitioWeb: form.sitioWeb.trim() || undefined,
      };
      const saved = isEdit
        ? await aseguradorasService.update(aseguradora.id, { ...payload, activo: form.activo })
        : await aseguradorasService.create(payload);
      onSaved(saved, isEdit ? 'edit' : 'create');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la aseguradora');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Dar de baja "${aseguradora.nombre}"? Podrás reactivarla más adelante desde este mismo formulario.`)) {
      return;
    }
    setError('');
    setDeleting(true);
    try {
      await aseguradorasService.remove(aseguradora.id);
      onDeleted(aseguradora.id);
    } catch (err) {
      setError(err.message || 'No se pudo dar de baja la aseguradora');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Editar aseguradora' : 'Nueva aseguradora'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2" aria-label="Cerrar">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sitio web</label>
            <input
              name="sitioWeb"
              value={form.sitioWeb}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-sm font-medium text-slate-700">Aseguradora activa</span>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, activo: !prev.activo }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.activo ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    form.activo ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center justify-between pt-2 gap-3">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {deleting ? 'Dando de baja...' : 'Dar de baja'}
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={saving || deleting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
