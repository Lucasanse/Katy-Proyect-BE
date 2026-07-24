import { useEffect, useMemo, useState } from 'react';
import aseguradorasService from '../../services/aseguradoras.service.js';
import AseguradoraFormModal from './AseguradoraFormModal.jsx';

export default function AseguradorasPanel() {
  const [aseguradoras, setAseguradoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState('asc');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  async function loadAseguradoras() {
    setLoading(true);
    setError('');
    try {
      const data = await aseguradorasService.list({ incluirInactivas: true });
      setAseguradoras(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las aseguradoras');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAseguradoras();
  }, []);

  const ordenadas = useMemo(() => {
    const busqueda = search.trim().toLowerCase();
    const filtradas = busqueda
      ? aseguradoras.filter((a) => a.nombre.toLowerCase().includes(busqueda))
      : aseguradoras;

    const copia = [...filtradas];
    copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    if (order === 'desc') copia.reverse();
    return copia;
  }, [aseguradoras, order, search]);

  function toggleOrder() {
    setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  function handleSaved(saved, mode) {
    setAseguradoras((prev) => (mode === 'create' ? [...prev, saved] : prev.map((a) => (a.id === saved.id ? saved : a))));
    setSelected(null);
    setCreating(false);
  }

  function handleDeleted(id) {
    setAseguradoras((prev) => prev.map((a) => (a.id === id ? { ...a, activo: false } : a)));
    setSelected(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-slate-900">Aseguradoras ({ordenadas.length})</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          <button
            onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Agregar aseguradora
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  onClick={toggleOrder}
                  className="text-left font-semibold text-slate-600 px-4 py-3 cursor-pointer select-none hover:text-blue-600"
                >
                  Nombre
                  <span className={`inline-block ml-1 text-[10px] ${order ? 'text-blue-600' : 'text-slate-300'}`}>
                    {order === 'asc' ? '▲' : '▼'}
                  </span>
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Teléfono</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Email</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Sitio web</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 px-4 py-8">
                    Cargando...
                  </td>
                </tr>
              ) : ordenadas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 px-4 py-8">
                    {search ? 'No hay aseguradoras que coincidan con la búsqueda.' : 'No hay aseguradoras cargadas.'}
                  </td>
                </tr>
              ) : (
                ordenadas.map((aseguradora) => (
                  <tr
                    key={aseguradora.id}
                    onClick={() => setSelected(aseguradora)}
                    className="cursor-pointer transition-colors border-l-4 border-transparent hover:bg-blue-100 hover:border-blue-500"
                  >
                    <td className="px-4 py-3 text-slate-800 font-medium">{aseguradora.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{aseguradora.telefono || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{aseguradora.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{aseguradora.sitioWeb || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          aseguradora.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {aseguradora.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <AseguradoraFormModal
          aseguradora={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {creating && (
        <AseguradoraFormModal aseguradora={null} onClose={() => setCreating(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
