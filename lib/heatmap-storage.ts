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
 * Recupera los tracks del usuario en IndexedDB.
 * Solo muestra los datos que el usuario haya sincronizado o generado de forma real.
 */
export async function seedHeatmapIfEmpty(): Promise<HeatmapTrack[]> {
  const existing = await getAllHeatmapTracks();
  // Limpiar cualquier traza simulada previa para asegurar pureza de datos reales
  const realTracks = existing.filter(t => !t.id.startsWith('habitual-limia-') && !t.id.startsWith('trail-official-') && t.id !== 'habitual-mtb-mamede');
  
  if (realTracks.length !== existing.length) {
    try {
      const db = await openDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const t of realTracks) {
        store.put(t);
      }
    } catch {
      // Ignorar
    }
  }

  return realTracks;
}
