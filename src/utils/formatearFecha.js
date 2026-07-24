// fechaSiniestro se guarda como texto "YYYY-MM-DD" (lo que espera <input type="date">).
// Acá solo se cambia cómo se muestra, nunca el valor que viaja al backend o a los inputs de fecha.
export function formatearFecha(fechaIso) {
  if (!fechaIso) return fechaIso;
  const [anio, mes, dia] = fechaIso.split('-');
  if (!anio || !mes || !dia) return fechaIso;
  return `${dia}-${mes}-${anio}`;
}
