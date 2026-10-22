/**
 * Parser y validador de archivos GPX reales (XML)
 * Extrae coordenadas reales, altitudes, calcula distancia mediante Haversine y desnivel acumulado.
 */

export interface ParsedGpxTrack {
  name: string;
  coordinates: [number, number][]; // [lat, lng] para Leaflet
  elevationProfile: { distanceKm: number; elevationM: number }[];
  totalDistanceKm: number;
  totalElevationGainM: number;
  rawGpx: string;
}

// Cálculo preciso de distancia entre dos coordenadas GPS (Fórmula de Haversine)
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseGpxXml(gpxString: string): ParsedGpxTrack {
  const cleanGpx = gpxString.trim();

  // 1. Extraer nombre del track
  const nameMatch = cleanGpx.match(/<name>(.*?)<\/name>/i);
  const name = nameMatch ? nameMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Track Importado';

  // 2. Extraer puntos de track (<trkpt>, <rtept> o <wpt>)
  const trkptRegex = /<(?:trkpt|rtept)\s+[^>]*lat=["'](-?\d+(?:\.\d+)?)["'][^>]*lon=["'](-?\d+(?:\.\d+)?)["'][^>]*>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
  const altTrkptRegex = /<(?:trkpt|rtept)\s+[^>]*lon=["'](-?\d+(?:\.\d+)?)["'][^>]*lat=["'](-?\d+(?:\.\d+)?)["'][^>]*>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;

  const coordinates: [number, number][] = [];
  const rawElevations: number[] = [];

  let match;
  while ((match = trkptRegex.exec(cleanGpx)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    const inner = match[3];

    const eleMatch = inner.match(/<ele>(-?\d+(?:\.\d+)?)<\/ele>/i);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : 600;

    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates.push([lat, lng]);
      rawElevations.push(isNaN(ele) ? 600 : ele);
    }
  }

  // Si no encontró con el primer regex, probar con lon antes de lat
  if (coordinates.length === 0) {
    while ((match = altTrkptRegex.exec(cleanGpx)) !== null) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      const inner = match[3];

      const eleMatch = inner.match(/<ele>(-?\d+(?:\.\d+)?)<\/ele>/i);
      const ele = eleMatch ? parseFloat(eleMatch[1]) : 600;

      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.push([lat, lng]);
        rawElevations.push(isNaN(ele) ? 600 : ele);
      }
    }
  }

  if (coordinates.length < 2) {
    throw new Error('El archivo no contiene suficientes puntos GPS válidos (<trkpt lat="..." lon="...">).');
  }

  // 3. Calcular distancias acumuladas y desnivel positivo
  let totalDistanceKm = 0;
  let totalElevationGainM = 0;
  const elevationProfile: { distanceKm: number; elevationM: number }[] = [];

  elevationProfile.push({ distanceKm: 0, elevationM: Math.round(rawElevations[0] || 600) });

  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const dist = haversineDistanceKm(prev[0], prev[1], curr[0], curr[1]);
    totalDistanceKm += dist;

    const prevEle = rawElevations[i - 1];
    const currEle = rawElevations[i];
    if (currEle > prevEle) {
      totalElevationGainM += currEle - prevEle;
    }

    // Muestrear perfil de elevación para no saturar memoria
    if (i % Math.max(1, Math.floor(coordinates.length / 50)) === 0 || i === coordinates.length - 1) {
      elevationProfile.push({
        distanceKm: Number(totalDistanceKm.toFixed(2)),
        elevationM: Math.round(currEle),
      });
    }
  }

  return {
    name,
    coordinates,
    elevationProfile,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalElevationGainM: Math.round(totalElevationGainM),
    rawGpx: cleanGpx,
  };
}
