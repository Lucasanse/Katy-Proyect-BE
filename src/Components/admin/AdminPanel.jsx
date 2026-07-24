import { useEffect, useState } from 'react';
import EstadoBadge, { ESTADO_LABELS } from './EstadoBadge.jsx';
import SiniestroDetalle from './SiniestroDetalle.jsx';
import AseguradorasPanel from './AseguradorasPanel.jsx';
import Wizard from '../wizard/Wizard.jsx';
import siniestrosService from '../../services/siniestros.service.js';
import { formatearFecha } from '../../utils/formatearFecha.js';
import authService from '../../services/auth.service.js';

const TABS = [
  { id: 'siniestros', label: 'Siniestros' },
  { id: 'aseguradoras', label: 'Aseguradoras' },
  { id: 'cargar', label: 'Cargar siniestro' },
];

function SortIcon({ active, order }) {
  return (
    <span className={`inline-block ml-1 text-[10px] ${active ? 'text-blue-600' : 'text-slate-300'}`}>
      {active && order === 'asc' ? '▲' : '▼'}
    </span>
  );
}

function SiniestrosTab() {
  const [siniestros, setSiniestros] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedSiniestro, setSelectedSiniestro] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  async function loadSiniestros() {
    setLoading(true);
    setError('');
    try {
      const result = await siniestrosService.list({
        page,
        limit: 10,
        estado: estadoFiltro || undefined,
        search: debouncedSearch || undefined,
        sortBy,
        order,
      });
      setSiniestros(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los siniestros');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSiniestros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, estadoFiltro, debouncedSearch, sortBy, order]);

  function handleSort(field) {
    setPage(1);
    if (sortBy === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('asc');
    }
  }

  async function handleRowClick(id) {
    setSelectedId(id);
    setDetalleLoading(true);
    try {
      const siniestro = await siniestrosService.getById(id);
      setSelectedSiniestro(siniestro);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle del siniestro');
      setSelectedId(null);
    } finally {
      setDetalleLoading(false);
    }
  }

  function handleEstadoUpdated(actualizado) {
    setSiniestros((prev) => prev.map((s) => (s.id === actualizado.id ? { ...s, estado: actualizado.estado } : s)));
  }

  function handleUpdated(actualizado) {
    setSiniestros((prev) =>
      prev.map((s) =>
        s.id === actualizado.id
          ? {
              ...s,
              fechaSiniestro: actualizado.fechaSiniestro,
              horaSiniestro: actualizado.horaSiniestro,
              lugarCalle: actualizado.lugarCalle,
              lugarLocalidad: actualizado.lugarLocalidad,
              titular: actualizado.titular,
            }
          : s,
      ),
    );
  }

  function handleDeleted() {
    setSelectedId(null);
    setSelectedSiniestro(null);
    loadSiniestros();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-slate-900">Siniestros ({meta.total})</h2>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por titular..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />

          <select
            value={estadoFiltro}
            onChange={(e) => {
              setPage(1);
              setEstadoFiltro(e.target.value);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
                <th className="text-left font-semibold text-slate-600 px-4 py-3">ID</th>
                <th
                  onClick={() => handleSort('fechaSiniestro')}
                  className="text-left font-semibold text-slate-600 px-4 py-3 cursor-pointer select-none hover:text-blue-600"
                >
                  Fecha
                  <SortIcon active={sortBy === 'fechaSiniestro'} order={order} />
                </th>
                <th
                  onClick={() => handleSort('titular')}
                  className="text-left font-semibold text-slate-600 px-4 py-3 cursor-pointer select-none hover:text-blue-600"
                >
                  Titular
                  <SortIcon active={sortBy === 'titular'} order={order} />
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Lugar</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Evidencias</th>
                <th className="text-left font-semibold text-slate-600 px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 px-4 py-8">
                    Cargando...
                  </td>
                </tr>
              ) : siniestros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 px-4 py-8">
                    No hay siniestros para mostrar.
                  </td>
                </tr>
              ) : (
                siniestros.map((siniestro) => (
                  <tr
                    key={siniestro.id}
                    onClick={() => handleRowClick(siniestro.id)}
                    className="cursor-pointer transition-colors border-l-4 border-transparent hover:bg-blue-100 hover:border-blue-500"
                  >
                    <td className="px-4 py-3 text-slate-800 font-medium">#{siniestro.id}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatearFecha(siniestro.fechaSiniestro)} {siniestro.horaSiniestro}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {siniestro.titular ? `${siniestro.titular.nombre} ${siniestro.titular.apellido}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {siniestro.lugarCalle}, {siniestro.lugarLocalidad}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{siniestro._count?.evidencias ?? 0}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={siniestro.estado} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={meta.page <= 1}
            className="text-sm font-medium text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            Página {meta.page} de {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={meta.page >= meta.totalPages}
            className="text-sm font-medium text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>

      {selectedId && !detalleLoading && selectedSiniestro && (
        <SiniestroDetalle
          siniestro={selectedSiniestro}
          onClose={() => {
            setSelectedId(null);
            setSelectedSiniestro(null);
          }}
          onEstadoUpdated={handleEstadoUpdated}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

export default function AdminPanel({ admin, onLogout }) {
  const [tab, setTab] = useState('siniestros');

  async function handleLogout() {
    await authService.logout();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-slate-900">Panel de Administración</h1>
            <p className="text-xs text-slate-500">{admin?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'cargar' ? (
        <Wizard skipVerification onCancel={() => setTab('siniestros')} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {tab === 'siniestros' ? <SiniestrosTab /> : <AseguradorasPanel />}
        </main>
      )}
    </div>
  );
}
