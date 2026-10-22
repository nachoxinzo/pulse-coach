/**
 * Gestor de almacenamiento en cliente (IndexedDB) para el Mapa de Calor GPS.
 * Permite almacenar cientos de rutas y coordenadas de forma local con consumo CERO en Turso.
 */

import { encodePolyline, simplifyCoordinates } from './polyline';
import { OFFICIAL_TRAILS_DATABASE } from './trails-database';
import { SportType } from '@/types';

export interface HeatmapTrack {
  id: string;
  title: string;
  sport: SportType;
  date: string;
  distanceKm: number;
  elevationGainM?: number;
  polyline: string; // Cadena comprimida Google Polyline (~3-6 KB)
  coordinatesCount: number;
}

const DB_NAME = 'pulse_heatmap_db';
const STORE_NAME = 'heatmap_tracks';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB solo disponible en navegador'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('sport', 'sport', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda o actualiza un track en el almacenamiento local IndexedDB
 */
export async function saveHeatmapTrack(track: HeatmapTrack): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(track);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error al guardar track en IndexedDB:', err);
  }
}

/**
 * Recupera todos los tracks almacenados localmente para el heatmap
 */
export async function getAllHeatmapTracks(): Promise<HeatmapTrack[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error al leer tracks de IndexedDB:', err);
    return [];
  }
}

/**
 * Genera trazados multi-capa realistas alrededor de Xinzo de Limia y Ourense
 * Si el usuario aún no tiene tracks guardados en IndexedDB, se inicializan
 * múltiples repeticiones de rutas para mostrar el brillo térmico aditivo.
 */
export async function seedHeatmapIfEmpty(): Promise<HeatmapTrack[]> {
  const existing = await getAllHeatmapTracks();
  if (existing.length > 0) return existing;

  const defaultTracks: HeatmapTrack[] = [];
  const baseCenter: [number, number] = [42.0630, -7.7240]; // Xinzo de Limia

  // 1. Convertir senderos oficiales de trails-database en tracks codificados
  OFFICIAL_TRAILS_DATABASE.forEach((trail, idx) => {
    const simplified = simplifyCoordinates(trail.coordinates, 0.00008);
    const encoded = encodePolyline(simplified);

    defaultTracks.push({
      id: `trail-official-${trail.id}`,
      title: trail.name,
      sport: trail.category === 'mtb' ? 'mtb' : 'trail',
      date: `2026-0${(idx % 5) + 1}-15`,
      distanceKm: trail.distanceKm,
      elevationGainM: trail.elevationGainM,
      polyline: encoded,
      coordinatesCount: simplified.length
    });
  });

  // 2. Crear 4 salidas habituales con variaciones sobre la ribera del río Limia
  // (Para simular la frecuencia de paso y el efecto calor acumulado)
  const limiaPistas: [number, number][] = [
    [42.0630, -7.7240],
    [42.0645, -7.7210],
    [42.0662, -7.7180],
    [42.0690, -7.7135],
    [42.0725, -7.7080],
    [42.0760, -7.7020],
    [42.0795, -7.6970],
    [42.0830, -7.6915],
    [42.0860, -7.6880],
    [42.0835, -7.6920],
    [42.0780, -7.7010],
    [42.0710, -7.7110],
    [42.0650, -7.7205],
    [42.0630, -7.7240]
  ];

  for (let rep = 1; rep <= 5; rep++) {
    // Pequeñas desviaciones realistas de GPS
    const jittered: [number, number][] = limiaPistas.map(([lat, lng]) => [
      lat + (Math.sin(rep * 1.5) * 0.00015),
      lng + (Math.cos(rep * 1.5) * 0.00015)
    ]);
    const simplified = simplifyCoordinates(jittered, 0.00005);
    const encoded = encodePolyline(simplified);

    defaultTracks.push({
      id: `habitual-limia-${rep}`,
      title: `Rodaje Ribera do Limia #${rep}`,
      sport: 'running',
      date: `2026-05-${10 + rep * 2}`,
      distanceKm: 8.6,
      elevationGainM: 45,
      polyline: encoded,
      coordinatesCount: simplified.length
    });
  }

  // 3. Salida de BTT circular hacia la Serra de San Mamede
  const mtbTrack: [number, number][] = [
    [42.0630, -7.7240],
    [42.0710, -7.7180],
    [42.0820, -7.7020],
    [42.0950, -7.6850],
    [42.1120, -7.6620],
    [42.1280, -7.6400],
    [42.1450, -7.6180],
    [42.1620, -7.5950], // Alto San Mamede
    [42.1550, -7.6250],
    [42.1320, -7.6580],
    [42.1050, -7.6900],
    [42.0800, -7.7150],
    [42.0630, -7.7240]
  ];

  const mtbSimplified = simplifyCoordinates(mtbTrack, 0.00008);
  defaultTracks.push({
    id: 'habitual-mtb-mamede',
    title: 'Desafío Serra de San Mamede BTT',
    sport: 'mtb',
    date: '2026-05-18',
    distanceKm: 42.4,
    elevationGainM: 1150,
    polyline: encodePolyline(mtbSimplified),
    coordinatesCount: mtbSimplified.length
  });

  // Guardar todos en IndexedDB de forma asíncrona
  for (const t of defaultTracks) {
    await saveHeatmapTrack(t);
  }

  return defaultTracks;
}
