import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatearFecha } from '../../utils/formatearFecha.js';

const provinciasArgentina = [
  "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Ciudad Autónoma de Buenos Aires",
  "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
  "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta",
  "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán"
];

const iconoMarcador = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const normalizarProvincia = (provinciaOSM) => {
  if (!provinciaOSM) return "";
  const limpia = provinciaOSM.replace(/^Provincia de\s+/i, '').trim();
  const coincidencia = provinciasArgentina.find(p => 
    p.toLowerCase() === limpia.toLowerCase() || 
    p.toLowerCase().includes(limpia.toLowerCase()) ||
    limpia.toLowerCase().includes(p.toLowerCase())
  );
  return coincidencia || limpia;
};

function ControladorMapa({ posicion, setPosicion, onGeocodificacionInversa }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) {
      map.setView([posicion.lat, posicion.lng], map.getZoom() < 13 ? 15 : map.getZoom());
    }
  }, [posicion, map]);

  useMapEvents({
    click(e) {
      const nuevaPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosicion(nuevaPos);
      onGeocodificacionInversa(nuevaPos.lat, nuevaPos.lng);
    }
  });

  return posicion ? (
    <Marker 
      position={[posicion.lat, posicion.lng]} icon={iconoMarcador} draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const coord = e.target.getLatLng();
          setPosicion({ lat: coord.lat, lng: coord.lng });
          onGeocodificacionInversa(coord.lat, coord.lng);
        }
      }}
    />
  ) : null;
}

export default function Step5siniestro({ formData, setFormData, nextStep, prevStep }) {
  const posInicial = formData.latitud && formData.longitud 
    ? { lat: formData.latitud, lng: formData.longitud } 
    : { lat: -38.9516, lng: -68.0591 };

  const [posicion, setPosicion] = useState(posInicial);
  const [inputBusqueda, setInputBusqueda] = useState(formData?.lugarCalle || '');
  const [cargando, setCargando] = useState(false);
  const [errorMapa, setErrorMapa] = useState('');
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [errors, setErrors] = useState({});

  // Calcular la fecha máxima actual para evitar selecciones futuras
  const todayMax = new Date().toISOString().split("T")[0];

  const validateField = (name, value) => {
    if (!value || value.toString().trim() === "") return "Este campo es obligatorio";
    if (name === "fechaSiniestro") {
      const selectedDate = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        return "La fecha no puede ser posterior a la de hoy";
      }
    }
    return "";
  };

  const realizarGeocodificacionInversa = async (lat, lng) => {
    setCargando(true);
    setErrorMapa('');
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await resp.json();

      if (data && data.address) {
        const addr = data.address;
        const calle = addr.road || addr.pedestrian || addr.suburb || '';
        const altura = addr.house_number || '';
        const localidad = addr.city || addr.town || addr.village || addr.municipality || '';
        const provinciaNormalizada = normalizarProvincia(addr.state);
        const direccionArmada = `${calle} ${altura}`.trim() || data.display_name.split(',')[0];
        
        setInputBusqueda(direccionArmada);
        setFormData(prev => ({
          ...prev,
          lugarCalle: direccionArmada, lugarLocalidad: localidad,
          lugarProvincia: provinciaNormalizada, latitud: lat, longitud: lng
        }));
        setMostrarAlerta(true);
      }
    } catch (err) {
      setErrorMapa("No se pudo obtener el nombre de la calle en esta ubicación.");
    } finally {
      setCargando(false);
    }
  };

  const handleBuscarDireccion = async (e) => {
    e.preventDefault();
    if (!inputBusqueda.trim()) return;
    setCargando(true);
    setErrorMapa('');
    try {
      const query = encodeURIComponent(`${inputBusqueda}, Argentina`);
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const resultados = await resp.json();

      if (resultados && resultados.length > 0) {
        const item = resultados[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const addr = item.address || {};
        const calle = addr.road || addr.pedestrian || addr.suburb || '';
        const altura = addr.house_number || '';
        const localidad = addr.city || addr.town || addr.village || addr.municipality || '';
        const provinciaNormalizada = normalizarProvincia(addr.state);
        const direccionArmada = `${calle} ${altura}`.trim() || inputBusqueda;

        setPosicion({ lat, lng });
        setFormData(prev => ({
          ...prev,
          lugarCalle: direccionArmada, lugarLocalidad: localidad,
          lugarProvincia: provinciaNormalizada, latitud: lat, longitud: lng
        }));
        setMostrarAlerta(true);
      } else {
        setErrorMapa("No se encontró esa dirección. Probá haciendo clic directamente en el mapa.");
      }
    } catch (err) {
      setErrorMapa("Hubo un error en la búsqueda. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const cleanValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: cleanValue }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, cleanValue) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const fieldsToValidate = ['fechaSiniestro', 'horaSiniestro', 'lugarCalle', 'lugarLocalidad', 'lugarProvincia'];

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
        <h2 className="text-2xl font-bold text-slate-800">5. Datos del choque</h2>
        <p className="text-sm text-slate-500 mt-1">Indicá cuándo ocurrió y marcá el lugar exacto en el mapa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">Fecha del hecho</label>
          <input 
            type="date" name="fechaSiniestro" value={formData?.fechaSiniestro || ''} onChange={handleChange}
            max={todayMax}
            className={`w-full mt-2 border-0 border-b-2 ${errors.fechaSiniestro ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none`} 
          />
          {errors.fechaSiniestro && <span className="text-xs text-red-500 mt-1 block">{errors.fechaSiniestro}</span>}
          {formData?.fechaSiniestro && !errors.fechaSiniestro && (
            <span className="text-xs text-slate-400 mt-1 block">
              Fecha seleccionada: {formatearFecha(formData.fechaSiniestro)}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase">Hora</label>
          <input 
            type="time" name="horaSiniestro" value={formData?.horaSiniestro || ''} onChange={handleChange} 
            className={`w-full mt-2 border-0 border-b-2 ${errors.horaSiniestro ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none`} 
          />
          {errors.horaSiniestro && <span className="text-xs text-red-500 mt-1 block">{errors.horaSiniestro}</span>}
        </div>

        <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-slate-700">¿Hubo heridos en el accidente?</span>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="huboHeridos" checked={formData?.huboHeridos === true} onChange={() => setFormData({...formData, huboHeridos: true})} className="w-5 h-5 text-blue-600 focus:ring-0" />
              <span className="font-medium text-slate-700">SÍ</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="huboHeridos" checked={formData?.huboHeridos === false} onChange={() => setFormData({...formData, huboHeridos: false})} className="w-5 h-5 text-blue-600 focus:ring-0" />
              <span className="font-medium text-slate-700">NO</span>
            </label>
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase">
          Lugar de ocurrencia (Buscá la calle o hacé clic directamente en el mapa)
        </label>
        
        <div className="flex gap-2">
          <input 
            type="text" value={inputBusqueda} onChange={(e) => setInputBusqueda(e.target.value)}
            placeholder="Ej: Av. Argentina 500, Neuquén" 
            className="flex-1 border-0 border-b-2 border-slate-300 focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 focus:outline-none" 
          />
          <button 
            type="button" onClick={handleBuscarDireccion} disabled={cargando}
            className="px-5 py-1.5 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition shadow disabled:bg-blue-400"
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {errorMapa && <p className="text-xs text-red-600 font-semibold">{errorMapa}</p>}

        <div className="w-full h-72 bg-slate-200 rounded-xl border border-slate-300 shadow-inner overflow-hidden relative z-0">
          <MapContainer center={[posicion.lat, posicion.lng]} zoom={formData?.latitud ? 16 : 14} style={{ width: '100%', height: '100%' }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ControladorMapa posicion={posicion} setPosicion={setPosicion} onGeocodificacionInversa={realizarGeocodificacionInversa} />
          </MapContainer>
        </div>

        {mostrarAlerta && (
          <div className="flex items-center justify-between p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-md transition-all shadow-sm">
            <div className="flex items-center space-x-2.5">
              <span className="text-amber-600 text-base">⚠️</span>
              <p className="text-xs text-amber-900 font-medium">
                <strong>Verificación requerida:</strong> Por favor, revisá y confirmá que la calle, altura y localidad autocompletadas debajo coincidan exactamente con el lugar del hecho.
              </p>
            </div>
            <button type="button" onClick={() => setMostrarAlerta(false)} className="text-amber-700 hover:text-amber-950 font-bold text-xs ml-2 px-1.5 py-0.5 rounded hover:bg-amber-100 transition" title="Cerrar aviso">
              ✕
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 italic">
          * Podés hacer clic en cualquier punto del mapa o arrastrar el pin para completar la dirección y coordenadas automáticamente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Calle y Altura exacta</label>
            <input 
              type="text" name="lugarCalle" value={formData?.lugarCalle || ''} onChange={handleChange} 
              className={`w-full mt-2 border-0 border-b-2 ${errors.lugarCalle ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 bg-slate-50 font-medium focus:outline-none`} 
            />
            {errors.lugarCalle && <span className="text-xs text-red-500 mt-1 block">{errors.lugarCalle}</span>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Localidad</label>
            <input 
              type="text" name="lugarLocalidad" value={formData?.lugarLocalidad || ''} onChange={handleChange} 
              className={`w-full mt-2 border-0 border-b-2 ${errors.lugarLocalidad ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 bg-slate-50 font-medium focus:outline-none`} 
            />
            {errors.lugarLocalidad && <span className="text-xs text-red-500 mt-1 block">{errors.lugarLocalidad}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Provincia</label>
            <select 
              name="lugarProvincia" value={formData?.lugarProvincia || ''} onChange={handleChange}
              className={`w-full mt-2 border-0 border-b-2 ${errors.lugarProvincia ? 'border-red-500' : 'border-slate-300'} focus:border-blue-600 focus:ring-0 pb-1 text-slate-800 bg-transparent font-medium focus:outline-none cursor-pointer`}
            >
              <option value="">Seleccioná una provincia...</option>
              {provinciasArgentina.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            {errors.lugarProvincia && <span className="text-xs text-red-500 mt-1 block">{errors.lugarProvincia}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Coordenadas (Lat / Lng)</label>
            <input 
              readOnly type="text" value={formData?.latitud ? `${formData.latitud.toFixed(5)}, ${formData.longitud.toFixed(5)}` : 'Sin seleccionar'} 
              className="w-full mt-2 border-0 border-b-2 border-slate-200 pb-1 text-slate-400 bg-transparent text-xs font-mono cursor-not-allowed focus:outline-none" 
            />
          </div>
        </div>
      </div>

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