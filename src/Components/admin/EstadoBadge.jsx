const ESTADO_STYLES = {
  pendiente: 'bg-amber-100 text-amber-800',
  en_revision: 'bg-blue-100 text-blue-800',
  falta_documentacion: 'bg-orange-100 text-orange-800',
  presentado_compania: 'bg-purple-100 text-purple-800',
  cerrado: 'bg-emerald-100 text-emerald-800',
};

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  falta_documentacion: 'Falta de documentación',
  presentado_compania: 'Presentado a la compañía',
  cerrado: 'Cerrado',
};

export default function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_STYLES[estado] || 'bg-slate-100 text-slate-700'}`}
    >
      {ESTADO_LABELS[estado] || estado}
    </span>
  );
}

export { ESTADO_LABELS };
