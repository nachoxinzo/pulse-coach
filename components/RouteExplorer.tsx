'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GeneratedRoute, OfficialTrailRoute, SportType } from '@/types';
import { generateRealRoadLoop, DEFAULT_COORDS, XINZO_MOUNTAIN_SECTORS } from '@/lib/route-generator';
import { OFFICIAL_TRAILS_DATABASE } from '@/lib/trails-database';
import { 
  Compass, 
  MapPin, 
  Download, 
  RefreshCw, 
  Mountain, 
  Clock, 
  Navigation, 
  Footprints, 
  Bike, 
  Sparkles,
  Info,
  Trees,
  Layers,
  Route as RouteIcon,
  Database,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Percent,
  Radio,
  Send,
  Sparkle,
  Share2,
  Smartphone,
  Flame,
  Utensils,
  Plus,
  Minus
} from 'lucide-react';
import { DeviceSyncModal } from './DeviceSyncModal';
import { RouteWeatherWidget } from './RouteWeatherWidget';
import { RouteNutritionPlannerModal } from './RouteNutritionPlannerModal';
import { extractClimbsFromProfile, DetectedClimb } from '@/lib/climb-detector';
import { ClimbsPreviewSection } from './ClimbsPreviewSection';

const PersonalHeatmap = dynamic(() => import('./PersonalHeatmap').then(m => m.PersonalHeatmap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 text-white text-xs font-bold gap-2">
      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
      <span>Cargando mapa de calor personal...</span>
    </div>
  ),
});

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 sm:h-96 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
        <span>Cargando mapa interactivo...</span>
      </div>
    </div>
  ),
});

// Zonas de Galicia destacadas con redes de senderos y montes conocidos (Sendegal / IDEG)
export const GALICIA_PRESETS = [
  { id: 'gps', name: '📍 Mi GPS Actual', coords: null, desc: 'Detecta tu posición en tiempo real' },
  { id: 'xinzo', name: 'Xinzo de Limia (A Limia)', coords: { lat: 42.0630, lng: -7.7240 }, desc: 'Red de pistas agrícolas, ribera do Limia y caminos rurales' },
  { id: 'santiago', name: 'Santiago (Monte Pedroso & Sarela)', coords: { lat: 42.8885, lng: -8.5615 }, desc: 'Pistas forestales, sendas de ribera y desniveles de monte' },
  { id: 'vigo_coruxo', name: 'Vigo (Parque Forestal Coruxo)', coords: { lat: 42.1895, lng: -8.7750 }, desc: 'Red de pistas de monte, cortafuegos y sendas BTT' },
  { id: 'eume', name: 'Fragas do Eume (PR-G 125)', coords: { lat: 43.4180, lng: -8.0720 }, desc: 'Sendero balizado PR-G, bosque atlántico y pistas de ribera' },
  { id: 'ribeira_sacra', name: 'Ribeira Sacra (Cañón do Sil)', coords: { lat: 42.4050, lng: -7.5850 }, desc: 'Senderos de montaña, viñedos escarpados y pistas de monte' },
  { id: 'coruna_hercules', name: 'A Coruña (Senda Litoral & Monte San Pedro)', coords: { lat: 43.3710, lng: -8.4180 }, desc: 'Senda litoral atlántica de Galicia' },
  { id: 'pontevedra_lerez', name: 'Pontevedra (Senda do Lérez)', coords: { lat: 42.4550, lng: -8.6250 }, desc: 'Sendas fluviales ciclables y monte periurbano' },
];

interface RouteExplorerProps {
  initialSport?: SportType;
  initialDistanceKm?: number;
  initialMode?: 'loop' | 'database' | 'heatmap';
}

export function RouteExplorer({
  initialSport = 'trail',
  initialDistanceKm = 14,
  initialMode = 'loop',
}: RouteExplorerProps) {
  // Modo de visualización: Generador de bucle a medida vs Catálogo Oficial vs Heatmap GPS
  const [explorerMode, setExplorerMode] = useState<'loop' | 'database' | 'heatmap'>(initialMode);

  const [sport, setSport] = useState<SportType>(initialSport);
  const [distanceKm, setDistanceKm] = useState<number>(initialDistanceKm);
  const [manualDistanceInput, setManualDistanceInput] = useState<string>(String(initialDistanceKm));
  const [seedVariant, setSeedVariant] = useState<number>(0);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('xinzo');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 42.0630, lng: -7.7240 });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationLabel, setLocationLabel] = useState<string>('Xinzo de Limia (Ourense)');
  
  // Ruta activa en el mapa
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(true);

  // Filtro de base de datos de senderos
  const [dbFilter, setDbFilter] = useState<'all' | 'mtb' | 'trail'>('all');
  const [selectedTrailId, setSelectedTrailId] = useState<string>(OFFICIAL_TRAILS_DATABASE[0].id);

  // Estado de sincronización directa con Garmin Connect
  const [isSendingGarmin, setIsSendingGarmin] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState<boolean>(false);
  const [selectedClimbId, setSelectedClimbId] = useState<string | null>(null);

  // Detección de puertos y subidas para previsualización (ClimbPro preview)
  const detectedClimbs = React.useMemo(() => {
    if (!route || !route.elevationProfile || route.elevationProfile.length < 4) return [];
    return extractClimbsFromProfile(route.elevationProfile, route.coordinates);
  }, [route]);

  useEffect(() => {
    if (initialSport) setSport(initialSport);
    if (initialDistanceKm) {
      setDistanceKm(initialDistanceKm);
      setManualDistanceInput(String(initialDistanceKm));
    }
  }, [initialSport, initialDistanceKm]);

  // Sincronizar entrada manual de distancia con debounce
  useEffect(() => {
    const parsed = parseFloat(manualDistanceInput);
    if (!isNaN(parsed) && parsed >= 3 && parsed <= 300 && parsed !== distanceKm) {
      const timer = setTimeout(() => {
        setDistanceKm(parsed);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [manualDistanceInput, distanceKm]);

  // Manejar cambio de zona de Galicia
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    if (zoneId === 'gps') {
      handleLocateMe();
      return;
    }
    const target = GALICIA_PRESETS.find((z) => z.id === zoneId);
    if (target && target.coords) {
      setUserLocation(target.coords);
      setLocationLabel(target.name);
    }
  };

  // Geolocalización del dispositivo
  const handleLocateMe = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setSelectedZoneId('gps');
          setLocationLabel(`Mi GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setIsLocating(false);
          setLocationLabel('GPS no disponible. Usando zona de referencia.');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  };

  // 1. En modo 'loop', recalcular con OSRM
  useEffect(() => {
    if (explorerMode !== 'loop') return;

    let isCancelled = false;
    setIsCalculatingRoute(true);

    generateRealRoadLoop(
      userLocation.lat,
      userLocation.lng,
      distanceKm,
      sport,
      seedVariant
    ).then((calculatedRoute) => {
      if (!isCancelled) {
        setRoute(calculatedRoute);
        setIsCalculatingRoute(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [explorerMode, userLocation, distanceKm, sport, seedVariant]);

  // 2. En modo 'database', cargar la ruta oficial seleccionada
  const handleSelectOfficialTrail = (trail: OfficialTrailRoute) => {
    setSelectedTrailId(trail.id);
    setUserLocation({ lat: trail.startCoords[0], lng: trail.startCoords[1] });
    setLocationLabel(trail.region);
    setSport(trail.category);

    setRoute({
      id: trail.id,
      name: trail.name,
      sport: trail.category,
      distanceKm: trail.distanceKm,
      elevationGainM: trail.elevationGainM,
      estimatedTimeMin: trail.estimatedTimeMin,
      terrainType: `${trail.terrainBreakdown.trailPercent}% Sendero / ${trail.terrainBreakdown.trackPercent}% Pista de tierra / ${trail.terrainBreakdown.roadPercent}% Asfalto`,
      coordinates: trail.coordinates,
      elevationProfile: trail.elevationProfile,
      gpxContent: trail.gpxContent,
    });
  };

  // Al cambiar a modo database, activar la primera ruta del filtro
  useEffect(() => {
    if (explorerMode === 'database') {
      const filtered = OFFICIAL_TRAILS_DATABASE.filter(
        (t) => dbFilter === 'all' || t.category === dbFilter
      );
      if (filtered.length > 0) {
        handleSelectOfficialTrail(filtered[0]);
      }
    }
  }, [explorerMode, dbFilter]);

  // Descarga del archivo .GPX para Garmin / Strava
  const handleDownloadGpx = () => {
    if (!route) return;
    const blob = new Blob([route.gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage(`Archivo GPX guardado: "${route.name}.gpx". Listo para Strava o Garmin Express.`);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  // Envío DIRECTO a Garmin Connect por API Oficial
  const handleSendDirectToGarmin = async () => {
    if (!route) return;
    setIsSendingGarmin(true);
    try {
      const res = await fetch('/api/garmin/send-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: route.name,
          sport: route.sport,
          coordinates: route.coordinates,
          elevationProfile: route.elevationProfile,
          gpxContent: route.gpxContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`¡Trayecto "${route.name}" transferido a tu Garmin! Sincroniza la app Garmin Connect en tu móvil y lo verás en Navegación > Trayectos en tu reloj.`);
      } else {
        setStatusMessage(`Aviso Garmin: ${data.error || 'No se pudo crear el trayecto automático.'}`);
      }
    } catch {
      setStatusMessage('Error de red al conectar con el servicio de trayectos de Garmin.');
    } finally {
      setIsSendingGarmin(false);
      setTimeout(() => setStatusMessage(''), 8000);
    }
  };

  // Presets de distancia según deporte
  const distancePresets = 
    sport === 'mtb' ? [15, 25, 40, 60] :
    sport === 'cycling' ? [20, 35, 50, 80] :
    sport === 'trail' ? [8, 14, 21, 30] : [5, 8, 12, 18];

  const filteredTrails = OFFICIAL_TRAILS_DATABASE.filter(
    (t) => dbFilter === 'all' || t.category === dbFilter
  );

  return (
    <div className="space-y-6">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-emerald-600" />
              Base de Datos de Senderos & Circuitos BTT
            </span>
            <span className="text-xs text-slate-500 font-medium">Sendegal (PR-G), Centros BTT & OSM</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Explorador de Rutas y Senderos</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Encuentra o genera recorridos para Mountain Bike (MTB), Trail Running y fondo, siguiendo siempre caminos de monte reales.
          </p>
        </div>

        {/* Interruptor de Modo: Generador Circular vs Base de Datos vs Heatmap GPS */}
        <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto gap-1">
          <button
            onClick={() => setExplorerMode('loop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              explorerMode === 'loop'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Generar en Bucle</span>
          </button>
          <button
            onClick={() => setExplorerMode('database')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              explorerMode === 'database'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Base Oficial ({OFFICIAL_TRAILS_DATABASE.length})</span>
          </button>
          <button
            onClick={() => setExplorerMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              explorerMode === 'heatmap'
                ? 'bg-cyan-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500/20" />
            <span>Mi Heatmap GPS</span>
          </button>
        </div>
      </div>

      {/* Banner de Feedback / Estado de sincronización con Garmin */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage('')}
            className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2 shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 1: MODO GENERADOR EN BUCLE SEGÚN DISTANCIA OBJETIVO */}
      {/* ============================================================== */}
      {explorerMode === 'loop' && (
        <>
          {/* Selector de Zonas de Inicio */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Punto de Partida del Bucle
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">{locationLabel}</span>
                <button
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>GPS</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {GALICIA_PRESETS.slice(0, 4).map((preset) => {
                const isSelected = selectedZoneId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectZone(preset.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all text-xs touch-target ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{preset.name}</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Deporte: MTB, Trail, Carretera, Running */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Modalidad de Terreno
                </label>
                <div className="flex flex-wrap gap-2">
                  
                  {/* Botón MTB / BTT */}
                  <button
                    onClick={() => { setSport('mtb'); setDistanceKm(25); setManualDistanceInput('25'); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all touch-target ${
                      sport === 'mtb'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <Bike className="w-4 h-4 stroke-[2.2]" />
                    <span>Mountain Bike (MTB/BTT)</span>
                  </button>

                  {/* Botón Trail Running */}
                  <button
                    onClick={() => { setSport('trail'); setDistanceKm(14); setManualDistanceInput('14'); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all touch-target ${
                      sport === 'trail'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <Mountain className="w-4 h-4 stroke-[2.2]" />
                    <span>Trail Running (Monte)</span>
                  </button>

                  {/* Botón Ciclismo Carretera / Gravel */}
                  <button
                    onClick={() => { setSport('cycling'); setDistanceKm(35); setManualDistanceInput('35'); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all touch-target ${
                      sport === 'cycling'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <Bike className="w-4 h-4 stroke-[2.2]" />
                    <span>Ciclismo / Gravel</span>
                  </button>

                  {/* Botón Running Asfalto */}
                  <button
                    onClick={() => { setSport('running'); setDistanceKm(8); setManualDistanceInput('8'); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all touch-target ${
                      sport === 'running'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <Footprints className="w-4 h-4 stroke-[2.2]" />
                    <span>Running Asfalto</span>
                  </button>

                </div>

                {/* Badge de Prioridad de Terreno Inteligente */}
                <div className="mt-3 flex items-center gap-2">
                  {sport === 'mtb' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
                      <Trees className="w-3.5 h-3.5 text-orange-600" />
                      <span>Prioridad Activa: Pistas de Monte, Senderos Forestales y Desniveles de Sierra</span>
                    </span>
                  )}
                  {sport === 'trail' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Prioridad Activa: Senderos de Tierra, Calzadas Tradicionales y Desnivel de Monte</span>
                    </span>
                  )}
                  {sport === 'cycling' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      <Bike className="w-3.5 h-3.5 text-sky-600" />
                      <span>Prioridad Activa: Carreteras Comarcales Secundarias (OU-XXXX) de Tráfico Mínimo (Evita A-52 / N-525)</span>
                    </span>
                  )}
                  {sport === 'running' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      <Footprints className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Prioridad Activa: Aceras Seguras, Paseo Fluvial y Perímetros sin Tráfico</span>
                    </span>
                  )}
                </div>

                {/* Selector de Macizos de Montaña para MTB y Trail */}
                {(sport === 'mtb' || sport === 'trail') && selectedZoneId === 'xinzo' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Macizo / Sierra de Monte Priorizada:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {XINZO_MOUNTAIN_SECTORS.map((sector, sIdx) => {
                        const isCurrentSector = (seedVariant % XINZO_MOUNTAIN_SECTORS.length) === sIdx;
                        return (
                          <button
                            key={sector.id}
                            type="button"
                            onClick={() => setSeedVariant(sIdx)}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              isCurrentSector
                                ? 'bg-orange-50/90 border-orange-500 ring-2 ring-orange-200 text-orange-950 shadow-xs'
                                : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-extrabold text-xs flex items-center gap-1.5">
                                <Mountain className={`w-3.5 h-3.5 ${isCurrentSector ? 'text-orange-600' : 'text-slate-400'}`} />
                                {sector.shortName}
                              </span>
                              {isCurrentSector && (
                                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-orange-600 text-white">
                                  Activo
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1">
                              {sector.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Otra Dirección */}
              <button
                onClick={() => setSeedVariant((v) => v + 1)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-indigo-700 text-xs font-bold transition-all touch-target self-start sm:self-end"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Generar Otra Dirección</span>
              </button>
            </div>

            {/* Selector y Ajuste Manual de Distancia */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Distancia Objetivo: <span className="text-slate-900 font-extrabold tabular-nums">{distanceKm} km</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Elige un acceso rápido o escribe tu distancia personalizada
                </span>
              </div>

              {/* Botones de Acceso Rápido (Presets) */}
              <div className="flex items-center gap-2">
                {distancePresets.map((kms) => (
                  <button
                    key={kms}
                    onClick={() => {
                      setDistanceKm(kms);
                      setManualDistanceInput(String(kms));
                    }}
                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all text-center touch-target ${
                      distanceKm === kms
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {kms} km
                  </button>
                ))}
              </div>

              {/* Campo para Establecer Distancia Manualmente */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 pl-1">
                  <span className="text-xs font-bold text-slate-800">
                    Distancia manual personalizada:
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    (teclea cualquier valor entre 3 y 300 km)
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const step = sport === 'cycling' ? 5 : 2;
                      const next = Math.max(3, distanceKm - step);
                      setDistanceKm(next);
                      setManualDistanceInput(String(next));
                    }}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm transition-all shadow-xs active:scale-95 touch-target"
                    title={`Restar ${sport === 'cycling' ? 5 : 2} km`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={3}
                      max={300}
                      step={1}
                      value={manualDistanceInput}
                      onChange={(e) => {
                        setManualDistanceInput(e.target.value);
                      }}
                      className="w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 tabular-nums shadow-xs pr-7"
                      placeholder="Km"
                    />
                    <span className="absolute right-2 text-xs font-bold text-slate-400 pointer-events-none">
                      km
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const step = sport === 'cycling' ? 5 : 2;
                      const next = Math.min(300, distanceKm + step);
                      setDistanceKm(next);
                      setManualDistanceInput(String(next));
                    }}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm transition-all shadow-xs active:scale-95 touch-target"
                    title={`Sumar ${sport === 'cycling' ? 5 : 2} km`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* VISTA 2: MODO BASE DE DATOS DE SENDEROS OFICIALES Y BTT */}
      {/* ============================================================== */}
      {explorerMode === 'database' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Senderos Homologados (PR-G) y Rutas BTT de Galicia
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona una ruta de la base de datos oficial para cargar su trazado real, ver su desglose de firme y descargar su GPX.
              </p>
            </div>

            {/* Filtro categoría */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDbFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dbFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todas ({OFFICIAL_TRAILS_DATABASE.length})
              </button>
              <button
                onClick={() => setDbFilter('mtb')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  dbFilter === 'mtb'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>BTT / MTB</span>
              </button>
              <button
                onClick={() => setDbFilter('trail')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  dbFilter === 'trail'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Mountain className="w-3.5 h-3.5" />
                <span>Trail Running</span>
              </button>
            </div>
          </div>

          {/* Grid de Rutas Oficiales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {filteredTrails.map((trail) => {
              const isSelected = selectedTrailId === trail.id;
              const isMtb = trail.category === 'mtb';

              return (
                <div
                  key={trail.id}
                  onClick={() => handleSelectOfficialTrail(trail)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-2 ring-emerald-200'
                      : 'bg-slate-50/60 hover:bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        isMtb 
                          ? 'bg-orange-100 text-orange-800 border-orange-200' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {trail.codePRG || (isMtb ? 'BTT Oficial' : 'Trail')}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {trail.difficulty}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{trail.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{trail.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-2">
                    {/* Métricas clave */}
                    <div className="flex items-center justify-between text-xs tabular-nums font-bold text-slate-800">
                      <span>{trail.distanceKm} km</span>
                      <span className="text-emerald-700">+{trail.elevationGainM} m</span>
                      <span className="text-slate-500">{trail.estimatedTimeMin} min</span>
                    </div>

                    {/* Desglose de Firme */}
                    <div className="w-full bg-slate-200 rounded-full h-2 flex overflow-hidden">
                      <div 
                        style={{ width: `${trail.terrainBreakdown.trailPercent}%` }} 
                        className="bg-emerald-600 h-full" 
                        title={`Sendero: ${trail.terrainBreakdown.trailPercent}%`} 
                      />
                      <div 
                        style={{ width: `${trail.terrainBreakdown.trackPercent}%` }} 
                        className="bg-amber-500 h-full" 
                        title={`Pista de tierra: ${trail.terrainBreakdown.trackPercent}%`} 
                      />
                      <div 
                        style={{ width: `${trail.terrainBreakdown.roadPercent}%` }} 
                        className="bg-slate-400 h-full" 
                        title={`Asfalto: ${trail.terrainBreakdown.roadPercent}%`} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{trail.terrainBreakdown.trailPercent}% Sendero</span>
                      <span>{trail.terrainBreakdown.trackPercent}% Pista</span>
                      <span>{trail.terrainBreakdown.roadPercent}% Asfalto</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 3: MODO HEATMAP PERSONAL GPS */}
      {/* ============================================================== */}
      {explorerMode === 'heatmap' && (
        <PersonalHeatmap />
      )}

      {/* ============================================================== */}
      {/* VISOR DE MAPA Y PERFIL DE ELEVACIÓN (PARA LOOP Y DATABASE) */}
      {/* ============================================================== */}
      {explorerMode !== 'heatmap' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] overflow-hidden">
        
        {/* Métricas Resumen */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          {isCalculatingRoute || !route ? (
            <div className="flex items-center gap-2.5 text-xs text-indigo-700 font-bold py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Conectando con la base de datos y buscando caminos reales...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Distancia Real</p>
                <p className="text-xl font-black text-slate-900 tabular-nums">{route.distanceKm} <span className="text-xs font-normal text-slate-500">km</span></p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Desnivel Acumulado</p>
                <p className="text-xl font-black text-slate-900 tabular-nums">+{route.elevationGainM} <span className="text-xs font-normal text-slate-500">m</span></p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Tiempo Estimado</p>
                <p className="text-xl font-black text-slate-900 tabular-nums">{route.estimatedTimeMin} <span className="text-xs font-normal text-slate-500">min</span></p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Tipo de Superficie</p>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{route.terrainType}</p>
              </div>
            </div>
          )}

          {/* Botones de Acción Directa: Móvil (COROS / iGPSPORT), Garmin & GPX */}
          {route && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsSyncModalOpen(true)}
                disabled={isCalculatingRoute}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] touch-target shrink-0 disabled:opacity-50"
                title="Abrir directamente en la app de COROS o iGPSPORT desde el móvil"
              >
                <Share2 className="w-4 h-4 stroke-[2.2]" />
                <span>Enviar a COROS / iGPSPORT</span>
              </button>

              <button
                onClick={() => setIsNutritionModalOpen(true)}
                disabled={isCalculatingRoute}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] touch-target shrink-0 disabled:opacity-50"
                title="Planificar cuándo harás la ruta, consultar la meteo prevista y enviarla a Garmin con avisos de comida y agua"
              >
                <Utensils className="w-4 h-4 stroke-[2.2]" />
                <span>Nutrición en Garmin Edge</span>
              </button>

              <button
                onClick={handleSendDirectToGarmin}
                disabled={isCalculatingRoute || isSendingGarmin}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] touch-target shrink-0 disabled:opacity-50"
                title="Sincroniza inalámbricamente el track con tu reloj Garmin Connect"
              >
                {isSendingGarmin ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Radio className="w-4 h-4 stroke-[2.2]" />
                )}
                <span>{isSendingGarmin ? 'Enviando a Garmin...' : 'Garmin Connect'}</span>
              </button>

              <button
                onClick={handleDownloadGpx}
                disabled={isCalculatingRoute}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] touch-target shrink-0 disabled:opacity-50"
                title="Descarga el archivo .GPX 1.1 para Strava o importación manual"
              >
                <Download className="w-4 h-4 stroke-[2.2]" />
                <span>Descargar GPX</span>
              </button>
            </div>
          )}
        </div>

        {/* Indicador de Firme / Base de Datos */}
        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-semibold">
            <RouteIcon className="w-4 h-4 text-emerald-700" />
            <span>{route?.name || 'Ruta seleccionada'}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200">
            {sport === 'mtb' ? 'Modo BTT / MTB' : sport === 'trail' ? 'Modo Trail Running' : sport === 'cycling' ? 'Modo Ciclismo Carretera' : 'Vía Activa'}
          </span>
        </div>

        {/* Widget Meteorológico y Viento en Tiempo Real */}
        <div className="p-4 pb-0">
          <RouteWeatherWidget
            lat={userLocation.lat}
            lng={userLocation.lng}
            locationName={locationLabel}
            sport={sport}
          />
        </div>

        {/* Mapa Leaflet Multi-capa con Overlay Waymarked Trails */}
        <div className="p-4 relative">
          <RouteMap
            coordinates={route ? route.coordinates : []}
            center={[userLocation.lat, userLocation.lng]}
            sport={sport}
          />
          {isCalculatingRoute && (
            <div className="absolute inset-4 z-30 bg-white/60 backdrop-blur-xs flex items-center justify-center rounded-xl pointer-events-none">
              <div className="bg-slate-900/90 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Buscando senderos y pistas de monte...</span>
              </div>
            </div>
          )}
        </div>

        {/* Perfil Altimétrico */}
        {route && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-slate-400" />
                Perfil de Elevación Altimétrico
              </span>
              <span className="text-xs text-slate-500 font-medium tabular-nums">
                Cota mín: {Math.min(...route.elevationProfile.map((p) => p.elevationM))}m | Cota máx: {Math.max(...route.elevationProfile.map((p) => p.elevationM))}m
              </span>
            </div>

            <div className="h-20 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="eleGradGalicia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon
                  fill="url(#eleGradGalicia)"
                  points={`0,40 ${route.elevationProfile
                    .map((p, idx) => {
                      const x = (idx / (route.elevationProfile.length - 1)) * 100;
                      const minEle = Math.min(...route.elevationProfile.map((pt) => pt.elevationM));
                      const maxEle = Math.max(...route.elevationProfile.map((pt) => pt.elevationM));
                      const range = Math.max(20, maxEle - minEle);
                      const y = 35 - ((p.elevationM - minEle) / range) * 26;
                      return `${x},${Math.max(5, Math.min(38, y))}`;
                    })
                    .join(' ')} 100,40`}
                />
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={route.elevationProfile
                    .map((p, idx) => {
                      const x = (idx / (route.elevationProfile.length - 1)) * 100;
                      const minEle = Math.min(...route.elevationProfile.map((pt) => pt.elevationM));
                      const maxEle = Math.max(...route.elevationProfile.map((pt) => pt.elevationM));
                      const range = Math.max(20, maxEle - minEle);
                      const y = 35 - ((p.elevationM - minEle) / range) * 26;
                      return `${x},${Math.max(5, Math.min(38, y))}`;
                    })
                    .join(' ')}
                />
              </svg>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-1">
              <span>0 km (Salida)</span>
              <span>{(route.distanceKm / 2).toFixed(1)} km</span>
              <span>{route.distanceKm} km (Meta)</span>
            </div>
          </div>
        )}

        {/* Previsualización de Puertos y Subidas (ClimbPro Preview) */}
        {route && (
          <div className="p-4 pt-0">
            <ClimbsPreviewSection
              climbs={detectedClimbs}
              onSelectClimb={(climb) => setSelectedClimbId(climb.id)}
              selectedClimbId={selectedClimbId}
            />
          </div>
        )}

      </div>
      )}

      {/* Nota Informativa sobre la Capa de Senderos Homologados */}
      {explorerMode !== 'heatmap' && (
        <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-start gap-3">
          <Trees className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 leading-relaxed">
            <strong>Base de Datos y Capas Integradas:</strong> Puedes activar en la esquina superior derecha del mapa el botón <strong>«Senderos Homologados Activos»</strong> para superponer directamente la red oficial de senderos (Waymarked Trails / Sendegal PR-G y pistas balizadas BTT). En el modo <strong>«Base de Datos Oficial»</strong> dispones de los circuitos reales de A Limia, San Mamede y el Parque Natural del Xurés con sus perfiles de desnivel y porcentajes de tierra y sendero.
          </div>
        </div>
      )}

      {/* Modal de sincronización para COROS, iGPSPORT, Garmin y Strava */}
      {route && (
        <DeviceSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          trackName={route.name}
          sport={sport}
          gpxContent={route.gpxContent}
          coordinates={route.coordinates}
          elevationProfile={route.elevationProfile}
          onGarminSent={(msg) => setStatusMessage(msg)}
        />
      )}

      {/* Modal de planificación de salida con meteorología y nutrición para ciclocomputador */}
      {route && (
        <RouteNutritionPlannerModal
          isOpen={isNutritionModalOpen}
          onClose={() => setIsNutritionModalOpen(false)}
          route={route}
          sport={sport}
          onSuccessGarmin={(msg) => setStatusMessage(msg)}
        />
      )}

    </div>
  );
}
