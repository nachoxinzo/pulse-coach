import { OfficialTrailRoute } from '@/types';
import { buildGpxXml } from './gpx-builder';

// Función auxiliar para construir puntos y GPX
function createTrail(
  id: string,
  name: string,
  category: 'mtb' | 'trail',
  region: string,
  distanceKm: number,
  elevationGainM: number,
  difficulty: 'Fácil' | 'Moderada' | 'Técnica' | 'Muy exigente',
  estimatedTimeMin: number,
  terrainBreakdown: { trailPercent: number; trackPercent: number; roadPercent: number },
  highlights: string[],
  description: string,
  startCoords: [number, number],
  centerOffset: { lat: number; lng: number },
  codePRG?: string
): OfficialTrailRoute {
  // Generar trazado cerrado o semilineal a partir de startCoords
  const numPoints = 50;
  const coords: [number, number][] = [];
  const points: { lat: number; lng: number; elevationM: number }[] = [];
  const elevationProfile: { distanceKm: number; elevationM: number }[] = [];

  const baseEle = region.includes('Xurés') ? 720 : 625;
  let currentDist = 0;

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const angle = fraction * 2 * Math.PI;
    
    // Deformación del bucle natural
    const wobble = 1 + 0.25 * Math.sin(3 * angle) + 0.15 * Math.cos(5 * angle);
    const radiusLat = centerOffset.lat * wobble;
    const radiusLng = centerOffset.lng * wobble;

    const lat = startCoords[0] + radiusLat * Math.sin(angle);
    const lng = startCoords[1] + radiusLng * Math.cos(angle);

    const ele = Math.round(
      baseEle + (elevationGainM * 0.7) * (0.5 - 0.5 * Math.cos(angle * 2)) +
      (elevationGainM * 0.2) * Math.sin(angle * 4)
    );

    coords.push([lat, lng]);
    points.push({ lat, lng, elevationM: ele });

    currentDist = Math.round((fraction * distanceKm) * 10) / 10;
    elevationProfile.push({
      distanceKm: currentDist,
      elevationM: ele,
    });
  }

  // Asegurar cierre exacto
  coords[coords.length - 1] = coords[0];
  points[points.length - 1] = points[0];

  const gpxContent = buildGpxXml(name, points);

  return {
    id,
    name,
    category,
    region,
    distanceKm,
    elevationGainM,
    difficulty,
    estimatedTimeMin,
    terrainBreakdown,
    highlights,
    description,
    codePRG,
    startCoords,
    coordinates: coords,
    elevationProfile,
    gpxContent,
  };
}

export const OFFICIAL_TRAILS_DATABASE: OfficialTrailRoute[] = [
  // 1. MTB en Xinzo de Limia
  createTrail(
    'trail-mtb-limia-antela',
    'BTT Xinzo - Ribera do Río Limia & Humedales de Antela',
    'mtb',
    'Xinzo de Limia (A Limia)',
    24.5,
    115,
    'Moderada',
    75,
    { trailPercent: 25, trackPercent: 65, roadPercent: 10 },
    ['Canal do Limia', 'Humedales recuperados de Antela', 'Pistas de tierra de Piñeira de Arcos'],
    'Recorrido de bicicleta de montaña llano y rodador por pistas agrícolas de tierra compacta y caminos de ribera que bordean los humedales de la antigua Laguna de Antela.',
    [42.0630, -7.7240],
    { lat: 0.038, lng: 0.052 },
    'Rede BTT A Limia'
  ),

  // 2. MTB Desnivel Alto do Furriolo
  createTrail(
    'trail-mtb-furriolo',
    'MTB Xinzo - Alto do Furriolo & Serra de San Mamede',
    'mtb',
    'A Limia / San Mamede',
    44.8,
    780,
    'Muy exigente',
    160,
    { trailPercent: 35, trackPercent: 55, roadPercent: 10 },
    ['Alto do Furriolo', 'Pistas forestales de monte alto', 'Vistas de toda A Limia', 'Descensos técnicos'],
    'Ruta de BTT de pura montaña. Asciende hacia los contrafuertes de la Serra de San Mamede por pistas forestales de tierra suelta, cortafuegos transitables y trialeras ciclables.',
    [42.0630, -7.7240],
    { lat: 0.075, lng: 0.065 },
    'Desafío BTT Ourense'
  ),

  // 3. Trail Running Vía da Plata
  createTrail(
    'trail-run-viaplata',
    'Trail Running Camiño Real da Vía da Plata (Xinzo - Sandiás)',
    'trail',
    'Xinzo de Limia - Sandiás',
    13.6,
    140,
    'Moderada',
    85,
    { trailPercent: 65, trackPercent: 30, roadPercent: 5 },
    ['Trazado histórico de la Vía de la Plata', 'Camiños de herradura', 'Carballeiras autóctonas'],
    'Ruta de trail running que sigue el camino tradicional de peregrinos por sendas de tierra blanda, callejones entre muros de piedra y pistas de monte entre Xinzo y Sandiás.',
    [42.0630, -7.7240],
    { lat: 0.045, lng: 0.035 },
    'Camiño de Santiago'
  ),

  // 4. Trail Running Rápido Canle de Antela
  createTrail(
    'trail-run-canle-antela',
    'Trail Canle de Antela & Sendeiro dos Muíños',
    'trail',
    'Xinzo de Limia',
    9.2,
    65,
    'Fácil',
    52,
    { trailPercent: 70, trackPercent: 25, roadPercent: 5 },
    ['Sendero fluvial', 'Molinos de agua', 'Bosque de ribera'],
    'Circuito de trail suave y dinámico, ideal para entrenamientos de ritmo vivo por senderos estrechos de tierra a la sombra de los alisos del río Limia.',
    [42.0630, -7.7240],
    { lat: 0.022, lng: 0.028 },
    'Senda Fluvial'
  ),

  // 5. Trail / MTB Baixa Limia Xurés PR-G 27
  createTrail(
    'trail-xures-prg27',
    'Trail & MTB Baixa Limia - Serra do Xurés (PR-G 27)',
    'trail',
    'Baixa Limia - Xurés',
    16.8,
    580,
    'Técnica',
    115,
    { trailPercent: 60, trackPercent: 30, roadPercent: 10 },
    ['Dólmenes de Maus de Salas', 'Parque Natural Gerês-Xurés', 'Ermita de A Ascensión'],
    'Sendero homologado PR-G de alta montaña gallega en el corazón del Parque Natural del Xurés. Calzadas de piedra, sendas de monte y paisajes graníticos espectaculares.',
    [41.9280, -8.0250],
    { lat: 0.040, lng: 0.045 },
    'PR-G 27 (Sendegal)'
  ),

  // 6. MTB Centro BTT Portas de Galicia
  createTrail(
    'trail-mtb-portas-galicia',
    'BTT Centro BTT Portas de Galicia - Circuito Pistas de Monte',
    'mtb',
    'O Invernadeiro / Verín',
    32.4,
    620,
    'Técnica',
    130,
    { trailPercent: 40, trackPercent: 50, roadPercent: 10 },
    ['Rede de Centros BTT de Galicia', 'Pistas de cortafuegos', 'Pinares y castañares'],
    'Circuito oficial balizado de la Red de Centros BTT de la Xunta de Galicia con descensos fluidos de tierra y subidas técnicas.',
    [41.9400, -7.4350],
    { lat: 0.055, lng: 0.050 },
    'Centro BTT Galicia'
  ),
];
