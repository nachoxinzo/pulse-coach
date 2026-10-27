'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DeviceSyncModal } from './DeviceSyncModal';
import { GpxToolModal } from './GpxToolModal';
import { FuelingCalculatorModal } from './FuelingCalculatorModal';
import { PopularEvent, SportType, BiometricMetrics } from '@/types';
import { POPULAR_EVENTS_DATABASE } from '@/lib/events-database';
import { shareTrackToDevice } from '@/lib/device-share';
import { 
  Trophy, 
  Search, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  Target, 
  Bike, 
  Footprints, 
  Mountain, 
  CheckCircle2, 
  SlidersHorizontal, 
  Flame, 
  Award, 
  Download, 
  Map as MapIcon, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Share2, 
  Info, 
  Watch,
  Upload,
  Compass,
  Check,
  Utensils
} from 'lucide-react';

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
        <span>Cargando visor del track...</span>
      </div>
    </div>
  ),
});

interface EventsExplorerProps {
  metrics: BiometricMetrics;
  onSetTargetEvent?: (event: PopularEvent) => void;
}

export function EventsExplorer({ metrics, onSetTargetEvent }: EventsExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(50);
  const [selectedTargetEventId, setSelectedTargetEventId] = useState<string>('event-xinzo-popular');
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [sendingGarminId, setSendingGarminId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [syncModalEvent, setSyncModalEvent] = useState<PopularEvent | null>(null);
  const [fuelingEvent, setFuelingEvent] = useState<PopularEvent | null>(null);
  const [isGpxToolOpen, setIsGpxToolOpen] = useState(false);

  // Filtrado reactivo de eventos
  const filteredEvents = useMemo(() => {
    return POPULAR_EVENTS_DATABASE.filter((event) => {
      const matchesSearch = 
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSport = selectedSport === 'all' || event.sport === selectedSport;
      const matchesDistance = event.distanceFromUserKm <= maxDistanceKm;

      return matchesSearch && matchesSport && matchesDistance;
    });
  }, [searchQuery, selectedSport, maxDistanceKm]);

  // Eventos recomendados por el Coach
  const coachTopSuggestions = useMemo(() => {
    return [...POPULAR_EVENTS_DATABASE]
      .sort((a, b) => b.coachFitScore - a.coachFitScore)
      .slice(0, 2);
  }, []);

  const handleChooseTarget = (event: PopularEvent) => {
    setSelectedTargetEventId(event.id);
    if (onSetTargetEvent) {
      onSetTargetEvent(event);
    }
    setStatusMessage(`¡Objetivo fijado! Tu Coach adaptará las sesiones hacia la ${event.name} (${event.dateStr}).`);
    setTimeout(() => setStatusMessage(''), 4500);
  };

  // Envío DIRECTO a Garmin Connect por API
  const handleSendDirectToGarmin = async (event: PopularEvent) => {
    setSendingGarminId(event.id);
    try {
      const res = await fetch('/api/garmin/send-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: event.name,
          sport: event.sport,
          coordinates: event.coordinates,
          elevationProfile: event.elevationProfile,
          gpxContent: event.gpxContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`🚀 ¡"${event.name}" enviado con éxito a tu cuenta de Garmin Connect! En tu reloj ve a: Navegación > Trayectos.`);
      } else {
        setStatusMessage(`Aviso: ${data.error || 'No se pudo enviar automáticamente a Garmin.'}`);
      }
    } catch {
      setStatusMessage('Error de conexión al enviar el trayecto a Garmin.');
    } finally {
      setSendingGarminId(null);
      setTimeout(() => setStatusMessage(''), 7000);
    }
  };

  // Descarga del track GPX para Strava y Garmin
  const handleDownloadGpx = (event: PopularEvent) => {
    const blob = new Blob([event.gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `track_${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage(`Track descargado: track_${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gpx. ¡Listo para importar a Strava o Garmin!`);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  // Compartir directamente a app COROS / iGPSPORT o abrir modal guiado
  const handleShareCorosIgpsport = async (event: PopularEvent) => {
    // Intentar Web Share directo (abre COROS o iGPSPORT directamente en Android/iOS)
    const res = await shareTrackToDevice({
      name: event.name,
      gpxContent: event.gpxContent,
      sport: event.sport,
    });

    if (res.method === 'native_share') {
      setStatusMessage(res.message);
      setTimeout(() => setStatusMessage(''), 6000);
    } else {
      // En escritorio o si no soporta archivos Web Share, abrir el modal completo
      setSyncModalEvent(event);
    }
  };

  const getSportBadge = (sport: SportType) => {
    switch (sport) {
      case 'mtb':
        return { label: 'BTT / MTB', icon: Bike, bg: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'trail':
        return { label: 'Trail Running', icon: Mountain, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'cycling':
        return { label: 'Ciclismo Carretera', icon: Bike, bg: 'bg-sky-50 text-sky-800 border-sky-200' };
      default:
        return { label: 'Running Asfalto', icon: Footprints, bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Tracks Oficiales GPX & Calendario Popular
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ourense, A Limia & Galicia</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">Buscador de Eventos con Track GPX</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Descarga el track oficial de cada prueba o impórtalo directamente a tu reloj Garmin y Strava.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Botón Herramienta GPX a Mayores */}
          <button
            onClick={() => setIsGpxToolOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-md transition-all active:scale-[0.98] touch-target"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Herramienta Importar GPX</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>2026</span>
          </div>
        </div>
      </div>

      {/* Notificación de Acción */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* SUGERENCIAS DESTACADAS DEL COACH SEGÚN TU FORMA FÍSICA */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-700/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sugerencias del Coach para Ti
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Cruzado con tu VO2 max ({metrics.vo2Max}) y ratio de fatiga ({metrics.acwr})
            </span>
          </div>
          <span className="text-xs font-bold text-indigo-300">Alta Afinidad Físico-Técnica</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coachTopSuggestions.map((event) => {
            const badge = getSportBadge(event.sport);
            const isTarget = selectedTargetEventId === event.id;

            return (
              <div 
                key={event.id}
                className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/20 text-white">
                      {badge.label}
                    </span>
                    <span className="text-xs font-black text-amber-400 tabular-nums">
                      {event.coachFitScore}% Match Físico
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white">{event.name}</h3>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{event.location}</span>
                    <span className="text-slate-400">· {event.distanceFromUserKm === 0 ? 'En tu localidad' : `A ${event.distanceFromUserKm} km`}</span>
                  </p>
                  
                  <div className="mt-3 p-2.5 rounded-lg bg-black/20 text-xs text-slate-200 leading-relaxed border border-white/5">
                    <strong className="text-indigo-300">Por qué te conviene: </strong>
                    {event.coachFitRationale}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendDirectToGarmin(event)}
                      disabled={sendingGarminId === event.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs border border-white/10 disabled:opacity-50"
                      title="Enviar directamente a tu reloj Garmin"
                    >
                      <Watch className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{sendingGarminId === event.id ? '...' : 'Garmin'}</span>
                    </button>

                    <button
                      onClick={() => handleShareCorosIgpsport(event)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      title="Enviar a reloj COROS o ciclocomputador iGPSPORT"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>COROS / iGPS</span>
                    </button>

                    <button
                      onClick={() => handleDownloadGpx(event)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs"
                      title="Descargar track GPX para Strava"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Strava GPX</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleChooseTarget(event)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isTarget
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {isTarget ? '✓ Reto Fijado' : 'Fijar como Reto'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GUÍA RÁPIDA: CÓMO IMPORTAR EL GPX A STRAVA */}
      <div className="bg-orange-50/70 p-4 rounded-xl border border-orange-200 flex items-start gap-3 text-xs text-orange-950">
        <Share2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>¿Cómo mandar el GPX a tu Strava?</strong> 
          Pulsa en <strong>«Descargar GPX»</strong> en cualquiera de los eventos. Luego, entra en <a href="https://www.strava.com/routes/new" target="_blank" rel="noopener noreferrer" className="underline font-bold text-orange-800">strava.com/routes/new</a> (o en la app móvil de Strava: <em>Mapas &gt; Rutas Guardadas &gt; Importar GPX</em>) y selecciona el archivo. Quedará guardado en tu perfil de Strava y sincronizado con tu GPS.
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
        
        {/* Input Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre (ej. Xinzo, Allariz, Xurés), deporte o municipio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-indigo-500 text-slate-800 placeholder-slate-400 transition-colors"
          />
        </div>

        {/* Filtros de deporte */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSport('all')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all touch-target ${
                selectedSport === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              Todos ({POPULAR_EVENTS_DATABASE.length})
            </button>
            <button
              onClick={() => setSelectedSport('mtb')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all touch-target ${
                selectedSport === 'mtb'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>BTT / MTB</span>
            </button>
            <button
              onClick={() => setSelectedSport('trail')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all touch-target ${
                selectedSport === 'trail'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>Trail Running</span>
            </button>
            <button
              onClick={() => setSelectedSport('cycling')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all touch-target ${
                selectedSport === 'cycling'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Ciclismo / Gran Fondo</span>
            </button>
            <button
              onClick={() => setSelectedSport('running')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all touch-target ${
                selectedSport === 'running'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Running Asfalto</span>
            </button>
          </div>

          {/* Filtro radio proximidad */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-semibold mr-1">Radio:</span>
            {[20, 35, 50].map((dist) => (
              <button
                key={dist}
                onClick={() => setMaxDistanceKm(dist)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  maxDistanceKm === dist
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                &le; {dist} km
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* LISTADO DE EVENTOS ENCONTRADOS */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">No se encontraron eventos con los filtros actuales</p>
            <p className="text-xs text-slate-500">Prueba a ampliar el radio de kilómetros o selecciona &quot;Todos&quot; los deportes.</p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const badge = getSportBadge(event.sport);
            const isTarget = selectedTargetEventId === event.id;
            const isPreviewOpen = previewEventId === event.id;

            return (
              <div
                key={event.id}
                className={`bg-white dark:bg-[#0F172A] rounded-xl border p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] transition-all ${
                  isTarget
                    ? 'border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Bloque Fecha + Título */}
                  <div className="flex items-start gap-4">
                    {/* Caja de Fecha */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-slate-900 dark:bg-slate-950 text-white flex flex-col items-center justify-center shrink-0 shadow-2xs border border-slate-800">
                      <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-amber-400">{event.month}</span>
                      <span className="text-lg sm:text-xl font-black leading-none tabular-nums">{event.day}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {event.difficulty}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {event.status}
                        </span>
                        {event.isVerifiedRoute && (
                          <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Trazado Vial Real</span>
                          </span>
                        )}
                        {isTarget && (
                          <span className="text-xs font-black text-white bg-emerald-600 px-2.5 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>Reto Activo</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{event.name}</h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.location}</span>
                        <strong className="text-slate-700 dark:text-slate-300">· {event.distanceFromUserKm === 0 ? 'En tu localidad' : `A ${event.distanceFromUserKm} km de ti`}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Distancias & Afinidad */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Distancias</span>
                      <div className="flex flex-wrap gap-1.5">
                        {event.distances.map((d, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold tabular-nums">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-left sm:text-right sm:border-l sm:border-slate-100 dark:sm:border-slate-800 sm:pl-4">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Afinidad Coach</span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400 tabular-nums">{event.coachFitScore}%</span>
                    </div>
                  </div>

                </div>

                {/* Explicación del Coach */}
                <div className="mt-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white">Consejo de preparación: </strong>
                  {event.coachFitRationale} ({event.targetPreparationWeeks} semanas recomendadas).
                </div>

                {/* BOTONERA DE ACCIÓN: GPX, ENLACES WIKILOC / STRAVA, Y GARMIN DIRECTO */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  
                  {/* Acciones de Track GPX y Fuentes Oficiales */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Botón Garmin Connect */}
                    <button
                      onClick={() => handleSendDirectToGarmin(event)}
                      disabled={sendingGarminId === event.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all shadow-xs touch-target disabled:opacity-50"
                      title="Enviar track real directamente a tu cuenta y reloj Garmin Connect"
                    >
                      <Watch className={`w-3.5 h-3.5 ${sendingGarminId === event.id ? 'animate-spin text-white' : 'text-white'}`} />
                      <span>{sendingGarminId === event.id ? 'Enviando...' : 'Garmin Connect'}</span>
                    </button>

                    {/* Botón COROS / iGPSPORT */}
                    <button
                      onClick={() => handleShareCorosIgpsport(event)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs touch-target"
                      title="Enviar track directamente a tu app de COROS o ciclocomputador iGPSPORT"
                    >
                      <Share2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>COROS / iGPSPORT</span>
                    </button>

                    {/* Botón Descargar GPX */}
                    <button
                      onClick={() => handleDownloadGpx(event)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold transition-all shadow-xs touch-target"
                      title="Descargar track GPX 100% sobre caminos reales"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Descargar GPX</span>
                    </button>

                    {/* Enlace a Wikiloc Oficial */}
                    {event.wikilocUrl && (
                      <a
                        href={event.wikilocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 transition-all touch-target"
                        title="Ver tracks y fotos de la comunidad en Wikiloc"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Wikiloc</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}

                    {/* Enlace a Strava */}
                    {event.stravaSegmentUrl && (
                      <a
                        href={event.stravaSegmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-800 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-800 transition-all touch-target"
                        title="Ver ruta y segmentos en Strava"
                      >
                        <span>Strava</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}

                    {/* Calculadora de Nutrición, Comida Real & Hidratación */}
                    <button
                      onClick={() => setFuelingEvent(event)}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 transition-all touch-target"
                      title="Calcular comida real (guayaba, sándwich), carbohidratos e hidratación"
                    >
                      <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Nutrición & Comida</span>
                    </button>

                    {/* Ver Mapa */}
                    <button
                      onClick={() => setPreviewEventId(isPreviewOpen ? null : event.id)}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all touch-target"
                    >
                      <MapIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{isPreviewOpen ? 'Ocultar' : 'Ver Mapa'}</span>
                      {isPreviewOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Acciones de Reto e Inscripción */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChooseTarget(event)}
                      className={`px-3.5 py-2 rounded-lg font-bold transition-all touch-target ${
                        isTarget
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isTarget ? 'Reto Fijado' : 'Fijar como Reto'}
                    </button>

                    {event.registrationUrl && (
                      <a
                        href={event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold shadow-2xs transition-all touch-target"
                      >
                        <span>{event.platformName}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                </div>

                {/* VISTA DESPLEGABLE DEL TRACK OFICIAL EN EL MAPA */}
                {isPreviewOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Trazado Vial Real: {event.name} ({event.officialDistanceKm} km · +{event.elevationGainM}m)</span>
                      <span className="text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
                        GPX 1.1 Verificado
                      </span>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <RouteMap
                        coordinates={event.coordinates}
                        center={event.coordinates[0]}
                        sport={event.sport}
                      />
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Modal universal de sincronización para COROS, iGPSPORT, Garmin y Strava */}
      {syncModalEvent && (
        <DeviceSyncModal
          isOpen={true}
          onClose={() => setSyncModalEvent(null)}
          trackName={syncModalEvent.name}
          sport={syncModalEvent.sport}
          gpxContent={syncModalEvent.gpxContent}
          coordinates={syncModalEvent.coordinates}
          elevationProfile={syncModalEvent.elevationProfile}
          onGarminSent={(msg) => setStatusMessage(msg)}
        />
      )}

      {/* Modal de Calculadora de Nutrición, Hidratación & Geles */}
      {fuelingEvent && (
        <FuelingCalculatorModal
          isOpen={true}
          onClose={() => setFuelingEvent(null)}
          eventTitle={fuelingEvent.name}
          defaultSport={fuelingEvent.sport}
          defaultDistanceKm={fuelingEvent.officialDistanceKm}
          defaultDurationMin={fuelingEvent.sport === 'mtb' ? 150 : fuelingEvent.sport === 'cycling' ? 180 : 90}
        />
      )}

      {/* Herramienta Avanzada de Importación y Auditoría GPX */}
      <GpxToolModal
        isOpen={isGpxToolOpen}
        onClose={() => setIsGpxToolOpen(false)}
      />

    </div>
  );
}
