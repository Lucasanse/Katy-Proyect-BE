import React, { useState } from 'react';

import Step1contact from '../step1contact/Step1contact';
import Step2conductor from '../step2conductor/Step2conductor';
import Step3Productor from '../step3productor/Step3Productor';
import Step4tercero from '../step4Tercero/Step4tercero';
import Step5siniestro from '../step5Siniestro/Step5siniestro';
import Step6detalles from '../step6Detalles/Step6detalles';
import Step7Verificacion from '../step7verificacion/Step7verificacion';
import Step8Adjuntos from '../step8Adjuntos/Step8Adjuntos';
import siniestrosService from '../../services/siniestros.service.js';
import evidenciaService from '../../services/evidencia.service.js';
import verificacionService from '../../services/verificacion.service.js';

function buildSiniestroPayload(formData) {
  const payload = {
    fechaSiniestro: formData.fechaSiniestro,
    horaSiniestro: formData.horaSiniestro,
    huboHeridos: Boolean(formData.huboHeridos),
    lugarCalle: formData.lugarCalle,
    lugarLocalidad: formData.lugarLocalidad,
    lugarProvincia: formData.lugarProvincia,
    detallesAccidente: formData.detallesAccidente,
    titular: {
      tipoDoc: formData.titularTipoDoc,
      numDoc: formData.titularNumDoc,
      nombre: formData.titularNombre,
      apellido: formData.titularApellido,
      patente: formData.titularPatente,
      telefono: formData.titularTelefono,
      email: formData.titularEmail,
      aseguradoraId: Number(formData.titularSeguro),
    },
  };

  if (typeof formData.latitud === 'number' && typeof formData.longitud === 'number') {
    payload.latitud = formData.latitud;
    payload.longitud = formData.longitud;
  }

  if (!formData.esMismoConductor) {
    payload.conductor = {
      nombreCompleto: formData.conductorNombreCompleto,
      documento: formData.conductorDocumento,
      telefono: formData.conductorTelefono || undefined,
      email: formData.conductorEmail || undefined,
      vinculo: formData.conductorVinculo || undefined,
    };
  }

  if (formData.esProductor) {
    payload.productor = {
      esProductor: true,
      nombre: formData.productorNombre,
      matricula: formData.productorMatricula,
      telefono: formData.productorTelefono,
      email: formData.productorEmail,
    };
  }

  const terceros = (formData.terceros || []).filter((t) => t.dni || t.nombre || t.apellido || t.patente);
  if (terceros.length) {
    payload.terceros = terceros.map((t) => ({
      dni: t.dni || undefined,
      nombre: t.nombre || undefined,
      apellido: t.apellido || undefined,
      patente: t.patente || undefined,
      aseguradoraId: t.aseguradora ? Number(t.aseguradora) : undefined,
    }));
  }

  return payload;
}

// Flujo público: pasa por la verificación por mail (RF-07).
// Flujo admin (skipVerification): la abogada ya está autenticada, no tiene sentido pedirle un código a su propio mail.
const FLOW_CON_VERIFICACION = ['contacto', 'conductor', 'productor', 'tercero', 'siniestro', 'detalles', 'verificacion', 'adjuntos'];
const FLOW_SIN_VERIFICACION = ['contacto', 'conductor', 'productor', 'tercero', 'siniestro', 'detalles', 'adjuntos'];

export default function Wizard({ skipVerification = false, onCancel }) {
  const flow = skipVerification ? FLOW_SIN_VERIFICACION : FLOW_CON_VERIFICACION;
  const [stepKey, setStepKey] = useState(flow[0]);
  const stepIndex = flow.indexOf(stepKey);
  const totalSteps = flow.length;

  const [formData, setFormData] = useState({
    // Titular
    titularTipoDoc: 'DNI', titularNumDoc: '', titularNombre: '', titularApellido: '',
    titularPatente: '', titularTelefono: '', titularEmail: '', titularSeguro: '',

    // Conductor
    esMismoConductor: true, conductorNombreCompleto: '', conductorDocumento: '',
    conductorTelefono: '', conductorEmail: '', conductorVinculo: '',

    // Productor
    esProductor: false, productorNombre: '', productorMatricula: '',
    productorTelefono: '', productorEmail: '',

    // Terceros (array dinámico)
    terceros: [],

    // Siniestro + mapa
    fechaSiniestro: '', horaSiniestro: '', huboHeridos: false,
    lugarCalle: '', lugarLocalidad: '', lugarProvincia: '', latitud: null, longitud: null,

    // Detalles
    detallesAccidente: '',
  });

  const [authData, setAuthData] = useState({ emailDestino: '', verificado: false });
  const [siniestroCreado, setSiniestroCreado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);

  const goTo = (key) => setStepKey(key);

  const nextStep = () => {
    const idx = flow.indexOf(stepKey);
    if (idx < flow.length - 1) setStepKey(flow[idx + 1]);
  };

  const prevStep = () => {
    const idx = flow.indexOf(stepKey);
    if (idx > 0) setStepKey(flow[idx - 1]);
  };

  // Reenvío desde el paso 7: si falla, el error se propaga para que Step7 lo muestre inline
  const reenviarCodigo = async () => {
    setEnviandoCodigo(true);
    try {
      await verificacionService.enviarCodigo(authData.emailDestino);
    } finally {
      setEnviandoCodigo(false);
    }
  };

  // Al terminar el paso de Detalles: la abogada (admin) salta directo a Adjuntos, el público pasa por el mail
  const handleStep6Continue = async () => {
    if (skipVerification) {
      goTo('adjuntos');
      return;
    }

    const emailDestino = formData.esProductor && formData.productorEmail
      ? formData.productorEmail
      : formData.titularEmail;

    if (!emailDestino) {
      alert('Por favor, regresa e ingresa un email válido para el Titular o el Productor.');
      return;
    }

    setEnviandoCodigo(true);
    try {
      await verificacionService.enviarCodigo(emailDestino);
      setAuthData({ emailDestino, verificado: false });
      goTo('verificacion');
    } catch (err) {
      alert(err.message || 'No se pudo enviar el código de verificación. Intentá nuevamente.');
    } finally {
      setEnviandoCodigo(false);
    }
  };

  // Si el código es incorrecto o venció, verificacionService.confirmarCodigo tira un error
  // que Step7 atrapa y muestra; acá solo se maneja el caso de éxito
  const handleVerificarCodigo = async (codigoIngresado) => {
    await verificacionService.confirmarCodigo(authData.emailDestino, codigoIngresado);
    setAuthData((prev) => ({ ...prev, verificado: true }));
    goTo('adjuntos');
  };

  const handleSubmitFinal = async (archivosPorCategoria) => {
    setEnviando(true);
    setErrorEnvio('');
    try {
      const payload = buildSiniestroPayload(formData);
      const creado = await siniestrosService.create(payload);

      // Categorías como "daños" mandan un array de archivos; el resto manda un único File
      const entradas = Object.entries(archivosPorCategoria || {});
      for (const [tipoDocumento, valor] of entradas) {
        const archivosDeLaCategoria = Array.isArray(valor) ? valor : [valor];
        for (const archivo of archivosDeLaCategoria) {
          if (!archivo) continue;
          // Se sube uno por uno: si alguno falla, el siniestro ya quedó creado y el resto sigue intentándose
          await evidenciaService.upload({ siniestroId: creado.id, tipoDocumento, archivo }).catch((err) => {
            console.error(`No se pudo subir la evidencia "${tipoDocumento}":`, err);
          });
        }
      }

      setSiniestroCreado(creado);
    } catch (err) {
      setErrorEnvio(err.message || 'No se pudo registrar el siniestro. Intentá nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">

        {/* Barra de Progreso Superior */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-5">
          <div className="flex items-center justify-between mb-3">
            {stepIndex > 0 ? (
              <button type="button" onClick={prevStep} className="text-blue-600 font-semibold text-sm flex items-center gap-1 hover:underline">
                ← Paso anterior
              </button>
            ) : <span />}
            <span className="text-sm font-bold text-slate-600 tracking-wide">
              Paso {stepIndex + 1} de {totalSteps}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Componentes Paso a Paso */}
        <div className="p-8">
          {stepKey === 'contacto' && <Step1contact formData={formData} setFormData={setFormData} nextStep={nextStep} />}
          {stepKey === 'conductor' && <Step2conductor formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />}
          {stepKey === 'productor' && <Step3Productor formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />}
          {stepKey === 'tercero' && <Step4tercero formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />}
          {stepKey === 'siniestro' && <Step5siniestro formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />}
          {stepKey === 'detalles' && (
            <Step6detalles
              formData={formData}
              setFormData={setFormData}
              prevStep={prevStep}
              onSubmit={handleStep6Continue}
              enviando={enviandoCodigo}
            />
          )}

          {stepKey === 'verificacion' && (
            <Step7Verificacion
              emailDestino={authData.emailDestino}
              onVerificar={handleVerificarCodigo}
              onReenviar={reenviarCodigo}
              enviandoCodigo={enviandoCodigo}
              prevStep={prevStep}
            />
          )}

          {stepKey === 'adjuntos' && (
            <Step8Adjuntos
              prevStep={prevStep}
              onSubmitFinal={handleSubmitFinal}
              enviando={enviando}
              errorEnvio={errorEnvio}
              siniestroCreado={siniestroCreado}
              onFinish={onCancel}
            />
          )}
        </div>

      </div>
    </div>
  );
}
