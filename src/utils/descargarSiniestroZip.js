import JSZip from 'jszip';
import { ESTADO_LABELS } from '../Components/admin/EstadoBadge.jsx';
import { formatearFecha } from './formatearFecha.js';

const ETIQUETAS_TIPO_DOCUMENTO = {
  patente: 'Foto de patente',
  danios: 'Foto de daños en detalle',
  dni_frente: 'DNI frente',
  dni_dorso: 'DNI dorso',
  licencia_frente: 'Licencia de conducir frente',
  licencia_dorso: 'Licencia de conducir dorso',
  cedula: 'Cédula verde o azul',
  denuncia: 'Denuncia administrativa previa',
  cobertura: 'Certificado de cobertura',
  presupuesto: 'Presupuesto de reparación',
};

function etiquetaEvidencia(tipoDocumento) {
  return ETIQUETAS_TIPO_DOCUMENTO[tipoDocumento] || tipoDocumento;
}

function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extensionDesdeMime(mime) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'application/pdf') return 'pdf';
  return 'bin';
}

function linea(label, value) {
  return `${label}: ${value ?? '—'}`;
}

function construirTexto(siniestro, nombresArchivos) {
  const lineas = [];
  lineas.push(`SINIESTRO #${siniestro.id}`);
  lineas.push('='.repeat(50));
  lineas.push('');
  lineas.push(linea('Fecha', formatearFecha(siniestro.fechaSiniestro)));
  lineas.push(linea('Hora', siniestro.horaSiniestro));
  lineas.push(linea('Estado', ESTADO_LABELS[siniestro.estado] || siniestro.estado));
  lineas.push(linea('¿Hubo heridos?', siniestro.huboHeridos ? 'Sí' : 'No'));
  lineas.push('');

  lineas.push('LUGAR DEL HECHO');
  lineas.push(linea('Calle', siniestro.lugarCalle));
  lineas.push(linea('Localidad', siniestro.lugarLocalidad));
  lineas.push(linea('Provincia', siniestro.lugarProvincia));
  lineas.push(
    linea(
      'Coordenadas',
      siniestro.latitud != null && siniestro.longitud != null
        ? `${siniestro.latitud}, ${siniestro.longitud} (https://www.google.com/maps?q=${siniestro.latitud},${siniestro.longitud})`
        : 'No registradas',
    ),
  );
  lineas.push('');

  lineas.push('DETALLES DEL ACCIDENTE');
  lineas.push(siniestro.detallesAccidente || '—');
  lineas.push('');

  lineas.push('TITULAR');
  if (siniestro.titular) {
    lineas.push(linea('Nombre', `${siniestro.titular.nombre} ${siniestro.titular.apellido}`));
    lineas.push(linea('Documento', `${siniestro.titular.tipoDoc} ${siniestro.titular.numDoc}`));
    lineas.push(linea('Patente', siniestro.titular.patente));
    lineas.push(linea('Teléfono', siniestro.titular.telefono));
    lineas.push(linea('Email', siniestro.titular.email));
    lineas.push(linea('Aseguradora', siniestro.titular.aseguradora?.nombre));
  } else {
    lineas.push('No se cargaron los datos del titular del vehículo.');
  }
  lineas.push('');

  lineas.push('CONDUCTOR');
  if (siniestro.conductor) {
    lineas.push(linea('Nombre completo', siniestro.conductor.nombreCompleto));
    lineas.push(linea('Documento', siniestro.conductor.documento));
    lineas.push(linea('Teléfono', siniestro.conductor.telefono));
    lineas.push(linea('Email', siniestro.conductor.email));
    lineas.push(linea('Vínculo con el titular', siniestro.conductor.vinculo));
  } else {
    lineas.push('No se cargó un conductor: el titular era quien conducía el vehículo.');
  }
  lineas.push('');

  lineas.push('PRODUCTOR DE SEGUROS');
  if (siniestro.productor?.esProductor) {
    lineas.push(linea('Nombre', siniestro.productor.nombre));
    lineas.push(linea('Matrícula', siniestro.productor.matricula));
    lineas.push(linea('Teléfono', siniestro.productor.telefono));
    lineas.push(linea('Email', siniestro.productor.email));
  } else {
    lineas.push('Este siniestro no fue gestionado por un productor de seguros.');
  }
  lineas.push('');

  lineas.push('TERCEROS INVOLUCRADOS');
  if (siniestro.terceros?.length) {
    siniestro.terceros.forEach((tercero, i) => {
      lineas.push(`  Tercero ${i + 1}:`);
      lineas.push(`    ${linea('Nombre', `${tercero.nombre || ''} ${tercero.apellido || ''}`.trim())}`);
      lineas.push(`    ${linea('DNI', tercero.dni)}`);
      lineas.push(`    ${linea('Patente', tercero.patente)}`);
      lineas.push(`    ${linea('Aseguradora', tercero.aseguradora?.nombre)}`);
    });
  } else {
    lineas.push('No se registraron terceros involucrados en este siniestro.');
  }
  lineas.push('');

  lineas.push('EVIDENCIA INCLUIDA EN ESTE ARCHIVO ZIP');
  if (nombresArchivos.length) {
    nombresArchivos.forEach(({ nombre, etiqueta, incluido }) => {
      lineas.push(`  - ${nombre}${incluido ? '' : ' (no se pudo descargar desde Cloudinary)'} — ${etiqueta}`);
    });
  } else {
    lineas.push('No se cargó evidencia para este siniestro.');
  }
  lineas.push('');
  lineas.push(`Generado el ${new Date().toLocaleString('es-AR')} desde el Panel de Administración.`);

  return lineas.join('\n');
}

export async function descargarSiniestroZip(siniestro) {
  const zip = new JSZip();
  const carpetaEvidencia = zip.folder('evidencia');

  const contador = {};
  const nombresArchivos = [];

  for (const evidencia of siniestro.evidencias || []) {
    const etiqueta = etiquetaEvidencia(evidencia.tipoDocumento);
    const base = slugify(etiqueta);
    contador[base] = (contador[base] || 0) + 1;
    const sufijo = contador[base] > 1 ? `_${contador[base]}` : '';

    try {
      const respuesta = await fetch(evidencia.urlArchivo);
      if (!respuesta.ok) throw new Error('No se pudo descargar el archivo');
      const blob = await respuesta.blob();
      const nombreArchivo = `${base}${sufijo}.${extensionDesdeMime(blob.type)}`;
      carpetaEvidencia.file(nombreArchivo, blob);
      nombresArchivos.push({ nombre: `evidencia/${nombreArchivo}`, etiqueta, incluido: true });
    } catch (err) {
      nombresArchivos.push({ nombre: `${base}${sufijo}`, etiqueta, incluido: false });
    }
  }

  zip.file('siniestro.txt', construirTexto(siniestro, nombresArchivos));

  const blobZip = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(blobZip);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `siniestro-${siniestro.id}.zip`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);

  const fallidas = nombresArchivos.filter((n) => !n.incluido);
  return { totalEvidencias: nombresArchivos.length, fallidas: fallidas.length };
}
