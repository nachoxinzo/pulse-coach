'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Polyline as LeafletPolyline, Marker as LeafletMarker, TileLayer } from 'leaflet';
import { Layers, Trees, MousePointerClick } from 'lucide-react';

export type MapClickMode = 'none' | 'set_start' | 'add_via' | 'set_end';

interface RouteMapProps {
  coordinates: [number, number][];
  center: [number, number];
  sport: string;
  customStart?: [number, number] | null;
  customViaPoints?: [number, number][];
  customEnd?: [number, number] | null;
  clickMode?: MapClickMode;
  onMapClickPoint?: (lat: number, lng: number) => void;
  onRemoveViaPoint?: (index: number) => void;
  onMoveWaypoint?: (type: 'start' | 'via' | 'end', index: number, lat: number, lng: number) => void;
}

export type MapLayerType = 'osm' | 'topo' | 'satellite';

export default function RouteMap({
  coordinates,
  center,
  sport,
  customStart = null,
  customViaPoints = [],
  customEnd = null,
  clickMode = 'none',
  onMapClickPoint,
  onRemoveViaPoint,
  onMoveWaypoint,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const overlayLayerRef = useRef<TileLayer | null>(null);
  const polylineRef = useRef<LeafletPolyline | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const waypointMarkersRef = useRef<LeafletMarker[]>([]);
  const leafletLibRef = useRef<any>(null);

  // Ref para mantener los callbacks siempre actualizados dentro de los eventos nativos de Leaflet
  const interactionRef = useRef({
    clickMode,
    onMapClickPoint,
    onRemoveViaPoint,
    onMoveWaypoint,
  });

  useEffect(() => {
    interactionRef.current = {
      clickMode,
      onMapClickPoint,
      onRemoveViaPoint,
      onMoveWaypoint,
    };
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = clickMode !== 'none' ? 'crosshair' : '';
    }
  }, [clickMode, onMapClickPoint, onRemoveViaPoint, onMoveWaypoint]);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('osm');
  const [showTrailsOverlay, setShowTrailsOverlay] = useState<boolean>(true);

  // Capas de mapas base soportadas
  const layerConfigs: Record<MapLayerType, { url: string; attribution: string; maxZoom: number }> = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors | Pistas y sendas',
      maxZoom: 19,
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap | Curvas de nivel y sendas PR/GR',
      maxZoom: 17,
    },
    satellite: {
      url: 'https://tms-pnoa-ma.ign.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
      attribution: '&copy; PNOA / IGN / Xunta de Galicia | Ortofoto Aérea',
      maxZoom: 18,
    },
  };

  const getStrokeColor = (sportType: string) => {
    switch (sportType) {
      case 'mtb': return '#ea580c'; // Naranja intenso para MTB
      case 'trail': return '#059669'; // Verde bosque para Trail
      case 'cycling': return '#0284c7'; // Azul cielo para Carretera/Gravel
      default: return '#4f46e5'; // Índigo para Running
    }
  };

  // 1. Inicialización ÚNICA del mapa al montar
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const leafletModule = await import('leaflet');
      const L = (leafletModule && leafletModule.default) ? leafletModule.default : leafletModule;
      leafletLibRef.current = L;

      if (!isMounted || !mapContainerRef.current) return;

      try {
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: false,
          fadeAnimation: false,
          zoomAnimation: false,
        }).setView(center, 13);

        // Capa base
        const config = layerConfigs['osm'];
        const tileLayer = L.tileLayer(config.url, {
          attribution: config.attribution,
          maxZoom: config.maxZoom,
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        // Capa overlay de senderos homologados (Waymarked Trails)
        if (showTrailsOverlay) {
          const overlayUrl = sport === 'mtb' 
            ? 'https://tile.waymarkedtrails.org/mtb/{z}/{x}/{y}.png'
            : 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png';
          
          const overlayLayer = L.tileLayer(overlayUrl, {
            opacity: 0.85,
            maxZoom: 18,
          }).addTo(map);
          overlayLayerRef.current = overlayLayer;
        }

        mapInstanceRef.current = map;

        // Escuchar clics en el mapa para colocar Inicio, Puntos de Paso o Meta
        map.on('click', (e: any) => {
          const { clickMode: mode, onMapClickPoint: cb } = interactionRef.current;
          if (mode && mode !== 'none' && cb && e?.latlng) {
            cb(e.latlng.lat, e.latlng.lng);
          }
        });

        // Renderizar trazado inicial si hay coordenadas
        if (coordinates.length > 0) {
          const strokeColor = getStrokeColor(sport);
          const polyline = L.polyline(coordinates, {
            color: strokeColor,
            weight: 5,
            opacity: 0.95,
            lineJoin: 'round',
          }).addTo(map);
          polylineRef.current = polyline;

          const startIcon = L.divIcon({
            className: 'custom-start-marker',
            html: `<div style="background-color: #059669; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">INI</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const marker = L.marker(coordinates[0], { icon: startIcon }).addTo(map);
          markerRef.current = marker;

          map.fitBounds(polyline.getBounds(), { padding: [35, 35], animate: false });
        }
      } catch (err) {
        console.warn('Map initialization caught error:', err);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch {
          // Ignorar error al desmontar
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Actualización de coordenadas y trazado SIN recrear el mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L || coordinates.length === 0) return;

    try {
      const strokeColor = getStrokeColor(sport);

      if (polylineRef.current) {
        polylineRef.current.setLatLngs(coordinates);
        polylineRef.current.setStyle({ color: strokeColor });
      } else {
        polylineRef.current = L.polyline(coordinates, {
          color: strokeColor,
          weight: 5,
          opacity: 0.95,
          lineJoin: 'round',
        }).addTo(map);
      }

      const startCoords = customStart || coordinates[0];
      if (markerRef.current) {
        markerRef.current.setLatLng(startCoords);
      } else {
        const startIcon = L.divIcon({
          className: 'custom-start-marker',
          html: `<div style="background-color: #059669; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">INI</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        markerRef.current = L.marker(startCoords, { icon: startIcon }).addTo(map);
      }

      // Re-encuadrar automáticamente cuando se genera un bucle nuevo sin puntos intermedios manuales
      if (customViaPoints.length === 0 && !customEnd) {
        map.invalidateSize();
        map.fitBounds(polylineRef.current.getBounds(), { padding: [35, 35], animate: false });
      }
    } catch (err) {
      console.warn('Map route update error:', err);
    }
  }, [coordinates, sport]);

  // 2b. Renderizado de Marcadores de Puntos de Paso (1, 2, 3...) y Punto Final (META)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L) return;

    try {
      // Limpiar marcadores previos de waypoints personalizados
      waypointMarkersRef.current.forEach((m) => {
        try {
          map.removeLayer(m);
        } catch {
          // ignore
        }
      });
      waypointMarkersRef.current = [];

      // Marcadores numerados para cada Punto de Paso (1..N)
      customViaPoints.forEach((pt, idx) => {
        const viaIcon = L.divIcon({
          className: `custom-via-marker-${idx}`,
          html: `<div title="Punto de paso #${idx + 1} (Arrastra para mover o haz clic para eliminar)" style="background-color: #ea580c; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); cursor: pointer;">${idx + 1}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const viaMarker = L.marker(pt, { icon: viaIcon, draggable: true }).addTo(map);
        viaMarker.on('click', (ev: any) => {
          if (ev?.originalEvent) {
            ev.originalEvent.stopPropagation();
          }
          if (interactionRef.current.onRemoveViaPoint) {
            interactionRef.current.onRemoveViaPoint(idx);
          }
        });
        viaMarker.on('dragend', (ev: any) => {
          const pos = ev.target.getLatLng();
          if (pos && interactionRef.current.onMoveWaypoint) {
            interactionRef.current.onMoveWaypoint('via', idx, pos.lat, pos.lng);
          }
        });

        waypointMarkersRef.current.push(viaMarker);
      });

      // Marcador de Punto Final (META) cuando es distinto del inicio
      if (customEnd) {
        const endIcon = L.divIcon({
          className: 'custom-end-marker',
          html: `<div title="Punto Final / Meta (Arrastra para mover)" style="background-color: #dc2626; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: grab;">FIN</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const endMarker = L.marker(customEnd, { icon: endIcon, draggable: true }).addTo(map);
        endMarker.on('dragend', (ev: any) => {
          const pos = ev.target.getLatLng();
          if (pos && interactionRef.current.onMoveWaypoint) {
            interactionRef.current.onMoveWaypoint('end', 0, pos.lat, pos.lng);
          }
        });

        waypointMarkersRef.current.push(endMarker);
      }
    } catch (err) {
      console.warn('Error rendering custom waypoint markers:', err);
    }
  }, [customStart, customViaPoints, customEnd]);

  // 3. Cambio de capa base (OSM, Topográfico, Satélite PNOA)
  const handleChangeLayer = (layerKey: MapLayerType) => {
    setActiveLayer(layerKey);
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L) return;

    try {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      const config = layerConfigs[layerKey];
      const newLayer = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: config.maxZoom,
      }).addTo(map);
      tileLayerRef.current = newLayer;

      // Re-colocar el overlay de senderos por encima de la capa base
      if (overlayLayerRef.current) {
        overlayLayerRef.current.bringToFront();
      }
      if (polylineRef.current) {
        polylineRef.current.bringToFront();
      }
    } catch (err) {
      console.warn('Map layer change error:', err);
    }
  };

  // 4. Conmutar capa de senderos oficiales homologados (Waymarked Trails)
  const toggleTrailsOverlay = () => {
    const nextState = !showTrailsOverlay;
    setShowTrailsOverlay(nextState);

    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L) return;

    try {
      if (overlayLayerRef.current) {
        map.removeLayer(overlayLayerRef.current);
        overlayLayerRef.current = null;
      }

      if (nextState) {
        const overlayUrl = sport === 'mtb'
          ? 'https://tile.waymarkedtrails.org/mtb/{z}/{x}/{y}.png'
          : 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png';

        const newOverlay = L.tileLayer(overlayUrl, {
          opacity: 0.85,
          maxZoom: 18,
        }).addTo(map);
        overlayLayerRef.current = newOverlay;

        if (polylineRef.current) {
          polylineRef.current.bringToFront();
        }
      }
    } catch (err) {
      console.warn('Toggle overlay error:', err);
    }
  };

  return (
    <div className="w-full h-80 sm:h-96 relative rounded-xl overflow-hidden border border-slate-200/90 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Indicador de Modo de Edición de Puntos en Mapa */}
      {clickMode !== 'none' && (
        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-2 text-xs font-bold pointer-events-none">
          <MousePointerClick className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {clickMode === 'set_start' && 'Haz clic en el mapa para fijar el Punto de Inicio (INI)'}
            {clickMode === 'add_via' && `Haz clic en el mapa para añadir el Punto de Paso #${customViaPoints.length + 1}`}
            {clickMode === 'set_end' && 'Haz clic en el mapa para fijar el Punto Final / Meta (FIN)'}
          </span>
        </div>
      )}

      {/* Controles Flotantes Superiores */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
        
        {/* Selector de Capas Base */}
        <div className="bg-white/95 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-1 text-xs">
          <Layers className="w-3.5 h-3.5 text-slate-500 ml-1" />
          <button
            onClick={() => handleChangeLayer('osm')}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              activeLayer === 'osm'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            OSM Sendas
          </button>
          <button
            onClick={() => handleChangeLayer('topo')}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              activeLayer === 'topo'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Topográfico Monte
          </button>
          <button
            onClick={() => handleChangeLayer('satellite')}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              activeLayer === 'satellite'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            PNOA Ortofoto
          </button>
        </div>

        {/* Interruptor de la Capa de Senderos Homologados Oficiales */}
        <button
          onClick={toggleTrailsOverlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-md backdrop-blur-xs transition-all ${
            showTrailsOverlay
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-200'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Superpone la red oficial de senderos PR-G, GR y circuitos BTT marcados"
        >
          <Trees className="w-3.5 h-3.5" />
          <span>{showTrailsOverlay ? '✓ Senderos Homologados Activos' : '+ Ver Senderos Oficiales'}</span>
        </button>

      </div>
    </div>
  );
}
