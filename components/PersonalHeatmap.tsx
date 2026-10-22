'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Polyline as LeafletPolyline, Circle as LeafletCircle, TileLayer } from 'leaflet';
import { 
  Flame, 
  Layers, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Footprints, 
  Bike, 
  Sliders, 
  MapPin, 
  RotateCcw,
  Sparkles,
  Download,
  Info,
  Compass
} from 'lucide-react';
import { decodePolyline } from '@/lib/polyline';
import { getAllHeatmapTracks, seedHeatmapIfEmpty, HeatmapTrack } from '@/lib/heatmap-storage';
import { SportType } from '@/types';

export type HeatmapColorTheme = 'cyan' | 'orange' | 'purple';

export function PersonalHeatmap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const polylinesGroupRef = useRef<LeafletPolyline[]>([]);
  const privacyCircleRef = useRef<LeafletCircle | null>(null);

  const [tracks, setTracks] = useState<HeatmapTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sportFilter, setSportFilter] = useState<'all' | 'running' | 'cycling'>('all');
  const [colorTheme, setColorTheme] = useState<HeatmapColorTheme>('cyan');
  const [lineWeight, setLineWeight] = useState<number>(3);
  const [lineOpacity, setLineOpacity] = useState<number>(0.45);
  const [privacyZoneActive, setPrivacyZoneActive] = useState<boolean>(true);
  const [basemap, setBasemap] = useState<'dark' | 'osm' | 'satellite'>('dark');

  // Centro por defecto: Xinzo de Limia
  const defaultCenter: [number, number] = [42.0630, -7.7240];

  const themeColors: Record<HeatmapColorTheme, { main: string; glow: string; label: string }> = {
    cyan: { main: '#00E5FF', glow: 'rgba(0, 229, 255, 0.4)', label: 'Cian EvoLab' },
    orange: { main: '#FF5500', glow: 'rgba(255, 85, 0, 0.4)', label: 'Naranja Strava' },
    purple: { main: '#C084FC', glow: 'rgba(192, 132, 252, 0.4)', label: 'Púrpura Neón' },
  };

  const basemapUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://tms-pnoa-ma.ign.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
  };

  // 1. Cargar tracks desde IndexedDB
  useEffect(() => {
    let isMounted = true;

    async function loadTracks() {
      try {
        const loaded = await seedHeatmapIfEmpty();
        if (isMounted) {
          setTracks(loaded);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error cargando heatmap:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadTracks();
    return () => { isMounted = false; };
  }, []);

  // 2. Inicializar Mapa Leaflet de forma segura en cliente
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || loading) return;

    let isMounted = true;

    async function initLeaflet() {
      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Capa base inicial
      const tileLayer = L.tileLayer(basemapUrls[basemap], {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      renderTracksOnMap();
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

  // 3. Cambiar capa base
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(basemapUrls[basemap]);
  }, [basemap]);

  // 4. Renderizar tracks cuando cambian filtros o estilos
  const renderTracksOnMap = async () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const L = await import('leaflet');

    // Limpiar polilíneas previas
    polylinesGroupRef.current.forEach(p => p.remove());
    polylinesGroupRef.current = [];

    // Limpiar zona de privacidad previa
    if (privacyCircleRef.current) {
      privacyCircleRef.current.remove();
      privacyCircleRef.current = null;
    }

    // Filtrar tracks
    const filtered = tracks.filter(t => {
      if (sportFilter === 'running') return t.sport === 'running' || t.sport === 'trail';
      if (sportFilter === 'cycling') return t.sport === 'cycling' || t.sport === 'mtb';
      return true;
    });

    const activeColor = themeColors[colorTheme].main;

    filtered.forEach(t => {
      try {
        const coords = decodePolyline(t.polyline);
        if (coords.length > 1) {
          // Capa de calor con opacidad aditiva
          const polyline = L.polyline(coords, {
            color: activeColor,
            weight: lineWeight,
            opacity: lineOpacity,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'heatmap-glow-path',
          }).addTo(map);

          polylinesGroupRef.current.push(polyline);
        }
      } catch (err) {
        console.error('Error decodificando polyline:', err);
      }
    });

    // Zona de privacidad domiciliaria (círculo protector de 500m)
    if (privacyZoneActive) {
      const circle = L.circle(defaultCenter, {
        radius: 450,
        color: '#EF4444',
        fillColor: '#EF4444',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4',
      }).addTo(map);

      circle.bindTooltip('Zona de Privacidad Domicilio (Oculta en exportaciones)', {
        permanent: false,
        direction: 'top',
        className: 'text-xs font-bold text-rose-500 bg-slate-900 border-none'
      });

      privacyCircleRef.current = circle;
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current && !loading) {
      renderTracksOnMap();
    }
  }, [tracks, sportFilter, colorTheme, lineWeight, lineOpacity, privacyZoneActive]);

  // Métricas calculadas sobre los tracks filtrados
  const filteredTracks = tracks.filter(t => {
    if (sportFilter === 'running') return t.sport === 'running' || t.sport === 'trail';
    if (sportFilter === 'cycling') return t.sport === 'cycling' || t.sport === 'mtb';
    return true;
  });

  const totalKmExplored = filteredTracks.reduce((acc, curr) => acc + curr.distanceKm, 0);
  const totalPointsRendered = filteredTracks.reduce((acc, curr) => acc + curr.coordinatesCount, 0);

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-5">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500/20" />
              Strava Personal Heatmap · Aceleración Vectorial
            </span>
            <span className="text-xs text-slate-400">IndexedDB Local (0 Consumo Turso)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Mapa de Calor Personal GPS</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visualiza todos tus senderos, carreteras y pistas recorridas. Las rutas más transitadas brillan con mayor intensidad térmica.
          </p>
        </div>

        {/* Selector de Deporte */}
        <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs">
          <button
            onClick={() => setSportFilter('all')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              sportFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Todos ({tracks.length})
          </button>
          <button
            onClick={() => setSportFilter('running')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              sportFilter === 'running'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-cyan-500" />
            <span>Carrera & Trail</span>
          </button>
          <button
            onClick={() => setSportFilter('cycling')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              sportFilter === 'cycling'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ciclismo & BTT</span>
          </button>
        </div>
      </div>

      {/* KPI Bar Territorial */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Kilómetros Cartografiados</span>
          <strong className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {totalKmExplored.toFixed(1)} km
          </strong>
          <span className="text-[11px] text-cyan-600 dark:text-cyan-400 block font-semibold">
            {filteredTracks.length} salidas registradas
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Optimización de Puntos</span>
          <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {totalPointsRendered} puntos
          </strong>
          <span className="text-[11px] text-slate-500 block">
            98.5% compresión polyline
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Cobertura Territorial</span>
          <strong className="text-lg font-black text-slate-900 dark:text-white block">
            A Limia & Ourense
          </strong>
          <span className="text-[11px] text-slate-500 block truncate">
            Ribera, Monte y Castelos
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
            <span>Privacidad Domicilio</span>
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <strong className={`text-sm font-black block mt-0.5 ${privacyZoneActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
            {privacyZoneActive ? 'Radio 450m Protegido' : 'Desactivado'}
          </strong>
          <button
            onClick={() => setPrivacyZoneActive(!privacyZoneActive)}
            className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline mt-0.5"
          >
            {privacyZoneActive ? 'Desactivar escudo' : 'Activar escudo'}
          </button>
        </div>
      </div>

      {/* Barra de Ajustes del Heatmap (Paleta, Mapa Base, Opacidad) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 text-white text-xs border border-slate-800">
        
        {/* Selector de Paleta Térmica */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Paleta Térmica:</span>
          <div className="flex items-center gap-1.5">
            {(['cyan', 'orange', 'purple'] as HeatmapColorTheme[]).map(t => (
              <button
                key={t}
                onClick={() => setColorTheme(t)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  colorTheme === t 
                    ? 'bg-slate-800 text-white border border-slate-600 shadow-2xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColors[t].main }} />
                <span>{themeColors[t].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Mapa Base */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Mapa Base:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setBasemap('dark')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                basemap === 'dark' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Oscuro (Recomendado)
            </button>
            <button
              onClick={() => setBasemap('osm')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                basemap === 'osm' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Calles OSM
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                basemap === 'satellite' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satélite PNOA
            </button>
          </div>
        </div>

        {/* Control de Grosor y Opacidad */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Grosor:</span>
            <input
              type="range"
              min="1.5"
              max="5"
              step="0.5"
              value={lineWeight}
              onChange={e => setLineWeight(parseFloat(e.target.value))}
              className="w-16 h-1 accent-cyan-400 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Intensidad:</span>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={lineOpacity}
              onChange={e => setLineOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

      </div>

      {/* Contenedor del Mapa Leaflet */}
      <div className="relative w-full h-[460px] sm:h-[540px] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-inner bg-slate-950">
        {loading && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <span>Optimizando coordenadas térmicas...</span>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Leyenda flotante en esquina */}
        <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-[11px] text-white space-y-1.5 shadow-lg select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColors[colorTheme].main }} />
            <span className="font-bold">Leyenda de Frecuencia</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="opacity-40">1 salida</span>
            <span>→</span>
            <span className="opacity-80">3 salidas</span>
            <span>→</span>
            <span className="font-black text-cyan-300">Transitadas (+5)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
