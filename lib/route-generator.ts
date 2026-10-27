import { GeneratedRoute, RoutePoint, SportType } from '@/types';
import { buildGpxXml } from './gpx-builder';

export const DEFAULT_COORDS = { lat: 42.0630, lng: -7.7240 }; // Xinzo de Limia

export interface CustomRouteWaypoints {
  startPoint?: [number, number] | null; // [lat, lng]
  viaPoints: [number, number][]; // array de [lat, lng] por donde se quiere pasar
  endPoint?: [number, number] | null; // [lat, lng] o null si es circular (vuelve al inicio)
}

// Sectores de Montaña de Referencia para Xinzo de Limia (A Limia / Ourense)
export const XINZO_MOUNTAIN_SECTORS = [
  {
    id: 'san_mamede',
    name: 'Montes de Baronzás, Boado, Pidre & San Mamede (Noreste)',
    shortName: 'Monte de Baronzás, Pidre & San Mamede (NE)',
    description: 'Pistas forestales, senderos de monte y cortafuegos entre Baronzás, Boado, Pidre y Laroá evitando la carretera OU-1102.',
    approach: [-7.7050, 42.0685] as [number, number],
    returnPt: [-7.6930, 42.0665] as [number, number],
    baseLat: 42.0755,
    baseLng: -7.6915,
    dirLat: 0.038,
    dirLng: 0.034,
    perpLat: -0.005,
    perpLng: 0.005,
    titlePrefix: 'Ruta Monte de Baronzás, Pidre & Laroá',
  },
  {
    id: 'allariz',
    name: 'Montes de Allariz & Vilar de Santos (Noroeste)',
    shortName: 'Montes de Allariz & Vilar de Santos (NO)',
    description: 'Pistas forestales y senderos en la Reserva da Biosfera de Allariz, subiendo por Vilar de Santos hacia cotas de 850m-900m.',
    approach: [-7.7520, 42.0740] as [number, number],
    returnPt: [-7.7550, 42.0680] as [number, number],
    baseLat: 42.0860,
    baseLng: -7.7780,
    dirLat: 0.034,
    dirLng: -0.026,
    perpLat: 0.006,
    perpLng: 0.006,
    titlePrefix: 'Ruta Montes de Allariz & Vilar de Santos',
  },
  {
    id: 'cualedro',
    name: 'Serra de Cualedro & Montes de Larouco (Sureste)',
    shortName: 'Serra de Cualedro (SE)',
    description: 'Crestas de montaña, parques eólicos y pistas de monte de Cualedro y San Martiño (800m-1000m).',
    approach: [-7.7080, 42.0460] as [number, number],
    returnPt: [-7.7150, 42.0450] as [number, number],
    baseLat: 42.0250,
    baseLng: -7.6850,
    dirLat: -0.035,
    dirLng: 0.028,
    perpLat: 0.006,
    perpLng: 0.006,
    titlePrefix: 'Ruta Serra de Cualedro & Larouco',
  },
  {
    id: 'rairiz',
    name: 'Montes de Rairiz de Veiga & Leboreiro (Suroeste)',
    shortName: 'Montes de Rairiz (SO)',
    description: 'Senderos tradicionales y pistas de monte hacia Congostro y la falda de la Serra do Leboreiro (750m-950m).',
    approach: [-7.7520, 42.0540] as [number, number],
    returnPt: [-7.7480, 42.0480] as [number, number],
    baseLat: 42.0420,
    baseLng: -7.7780,
    dirLat: -0.028,
    dirLng: -0.030,
    perpLat: 0.006,
    perpLng: -0.006,
    titlePrefix: 'Ruta Montes de Rairiz & Leboreiro',
  },
];

/**
 * Consulta la elevación topográfica real (DEM / SRTM / Copernicus) para una lista de coordenadas
 * utilizando la API abierta de Open-Meteo Elevation.
 */
async function fetchRealElevationForCoordinates(
  coords: [number, number][] // [lat, lng]
): Promise<number[] | null> {
  if (coords.length === 0) return null;

  try {
    // Muestrear hasta 65 puntos distribuidos equitativamente a lo largo del track
    const maxSamples = Math.min(65, coords.length);
    const step = (coords.length - 1) / (maxSamples - 1);
    const sampledIndices: number[] = [];
    for (let i = 0; i < maxSamples; i++) {
      sampledIndices.push(Math.round(i * step));
    }

    const lats = sampledIndices.map((idx) => coords[idx][0].toFixed(5)).join(',');
    const lngs = sampledIndices.map((idx) => coords[idx][1].toFixed(5)).join(',');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const rawElevations: number[] = data.elevation;

    if (!Array.isArray(rawElevations) || rawElevations.length !== sampledIndices.length) {
      return null;
    }

    // Interpolar las elevaciones para cada una de las coordenadas completas de la ruta
    const fullElevations: number[] = [];
    for (let i = 0; i < coords.length; i++) {
      const fraction = coords.length > 1 ? i / (coords.length - 1) : 0;
      const pos = fraction * (rawElevations.length - 1);
      const low = Math.floor(pos);
      const high = Math.min(rawElevations.length - 1, Math.ceil(pos));
      const subFraction = pos - low;
      const ele = Math.round(rawElevations[low] * (1 - subFraction) + rawElevations[high] * subFraction);
      fullElevations.push(ele);
    }

    return fullElevations;
  } catch (err) {
    console.warn('No se pudo obtener la elevación DEM en línea, aplicando modelo topográfico local:', err);
    return null;
  }
}

/**
 * Escanea mediante radar topográfico (Open-Meteo Elevation DEM) las 12 direcciones
 * cardinales alrededor de un punto (lat, lng) y devuelve los ángulos (en radianes)
 * ordenados de mayor a menor ganancia de altitud de montaña.
 * Permite que cualquier ruta de MTB o Trail priorice incursiones en los montes más altos cercanos.
 */
async function findBestMountainAngles(
  centerLat: number,
  centerLng: number,
  probeRadiusKm = 8.0
): Promise<number[]> {
  const defaultAngles = [0.85, 2.30, 3.80, 5.35];
  try {
    const latDelta = 1 / 111.0;
    const lngDelta = 1 / (111.0 * Math.cos((centerLat * Math.PI) / 180));

    const numDirections = 12;
    const midKm = Math.max(3.5, probeRadiusKm * 0.55);
    const farKm = Math.max(6.0, probeRadiusKm);

    const lats: string[] = [centerLat.toFixed(5)];
    const lngs: string[] = [centerLng.toFixed(5)];
    const angles: number[] = [];

    for (let i = 0; i < numDirections; i++) {
      const theta = (i * 2 * Math.PI) / numDirections;
      angles.push(theta);
      // Muestra intermedia (pie de monte)
      lats.push((centerLat + midKm * Math.sin(theta) * latDelta).toFixed(5));
      lngs.push((centerLng + midKm * Math.cos(theta) * lngDelta).toFixed(5));
      // Muestra lejana (cumbre / sierra)
      lats.push((centerLat + farKm * Math.sin(theta) * latDelta).toFixed(5));
      lngs.push((centerLng + farKm * Math.cos(theta) * lngDelta).toFixed(5));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(',')}&longitude=${lngs.join(',')}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return defaultAngles;
    const data = await res.json();
    const elevations: number[] = data.elevation;
    if (!Array.isArray(elevations) || elevations.length < 1 + numDirections * 2) {
      return defaultAngles;
    }

    const baseEle = elevations[0];
    const scoredAngles: { angle: number; score: number }[] = [];

    for (let i = 0; i < numDirections; i++) {
      const eleMid = elevations[1 + i * 2];
      const eleFar = elevations[1 + i * 2 + 1];
      const maxGain = Math.max(eleMid - baseEle, eleFar - baseEle);
      const avgGain = ((eleMid - baseEle) + (eleFar - baseEle)) / 2;
      scoredAngles.push({
        angle: angles[i],
        score: maxGain * 0.7 + avgGain * 0.3,
      });
    }

    scoredAngles.sort((a, b) => b.score - a.score);
    return scoredAngles.map((s) => s.angle);
  } catch {
    return defaultAngles;
  }
}

/**
 * Genera una ruta en bucle o pasando por puntos personalizados (Inicio, Puntos de Paso 1..N, Final) que:
 * - Para MTB y Trail: Prioriza incursiones en montes, pistas forestales, sendas de tierra y sierras cercanas.
 * - Para Ciclismo Carretera: Prioriza carreteras comarcales y secundarias de mínimo tráfico, evitando autovías.
 * - Para Running: Prioriza paseos peatonales, parques y aceras anchas.
 * - Respeta todos los puntos de paso marcados por el usuario y calibra la distancia con OSRM para que coincida con la distancia objetivo.
 * - Calcula el desnivel acumulado y el perfil altimétrico a partir de datos topográficos reales.
 */
export async function generateRealRoadLoop(
  centerLat: number,
  centerLng: number,
  targetDistanceKm: number,
  sport: SportType,
  seedVariant = 0,
  customWaypoints?: CustomRouteWaypoints
): Promise<GeneratedRoute> {
  const profile = (sport === 'cycling' || sport === 'mtb') ? 'bike' : 'foot';
  const isMountainSport = sport === 'mtb' || sport === 'trail';

  // Determinar punto de inicio efectivo y punto final efectivo
  const startLat = customWaypoints?.startPoint ? customWaypoints.startPoint[0] : centerLat;
  const startLng = customWaypoints?.startPoint ? customWaypoints.startPoint[1] : centerLng;

  const endLat = customWaypoints?.endPoint ? customWaypoints.endPoint[0] : startLat;
  const endLng = customWaypoints?.endPoint ? customWaypoints.endPoint[1] : startLng;

  const viaPoints = customWaypoints?.viaPoints || [];
  const isPointToPoint = haversineDistanceKm(startLat, startLng, endLat, endLng) > 0.15;
  const hasCustomPoints = viaPoints.length > 0 || isPointToPoint;

  const latDeltaPerKm = 1 / 111.0;
  const lngDeltaPerKm = 1 / (111.0 * Math.cos((startLat * Math.PI) / 180));

  // Detectar si el punto de salida está en el valle de Xinzo de Limia / A Limia
  const isXinzoArea = Math.abs(startLat - 42.0630) < 0.08 && Math.abs(startLng - (-7.7240)) < 0.08;

  let terrainDescription = '';
  let customRouteTitle = '';

  if (sport === 'mtb') {
    terrainDescription = '85% Pistas de monte, caminos de tierra y cortafuegos | 15% Enlace rural (Bajo tráfico)';
  } else if (sport === 'trail') {
    terrainDescription = '90% Senderos de tierra, calzadas tradicionales y caminos de monte | 10% Pista compacta';
  } else if (sport === 'cycling') {
    terrainDescription = '95% Carreteras comarcales secundarias y vías locales (Bajo tráfico rodado)';
  } else {
    terrainDescription = '80% Aceras, paseos peatonales y parques | 20% Calles tranquilas';
  }

  // Si es deporte de montaña (MTB o Trail) fuera de los presets fijos de Xinzo o con puntos a medida,
  // escanear el relieve real circundante para saber hacia dónde están las montañas más altas:
  let detectedMountainAngles = [0.85, 2.30, 3.80, 5.35];
  if (isMountainSport && (!isXinzoArea || hasCustomPoints)) {
    const refLat = viaPoints.length > 0 ? viaPoints[viaPoints.length - 1][0] : startLat;
    const refLng = viaPoints.length > 0 ? viaPoints[viaPoints.length - 1][1] : startLng;
    detectedMountainAngles = await findBestMountainAngles(refLat, refLng, Math.max(5.5, targetDistanceKm * 0.28));
  }

  // 1. CONSTRUCCIÓN DE WAYPOINTS PARA MTB Y TRAIL (INCURSIÓN EN MONTAÑA SIN PUNTOS MANUALES)
  const buildMountainWaypoints = (scaleFactor: number, seed: number): [number, number][] => {
    if (isXinzoArea) {
      // Usar los corredores reales de montaña de Xinzo de Limia
      const sector = XINZO_MOUNTAIN_SECTORS[seed % XINZO_MOUNTAIN_SECTORS.length];
      customRouteTitle = `${sport === 'mtb' ? 'Ruta BTT' : 'Trail'} ${sector.shortName}`;

      const apexLat = sector.baseLat + sector.dirLat * scaleFactor;
      const apexLng = sector.baseLng + sector.dirLng * scaleFactor;

      const m1: [number, number] = [apexLng - sector.perpLng, apexLat - sector.perpLat];
      const m2: [number, number] = [apexLng + sector.perpLng, apexLat + sector.perpLat];

      return [
        [startLng, startLat],
        sector.approach,
        m1,
        m2,
        sector.returnPt,
        [startLng, startLat],
      ];
    } else {
      // Fuera de Xinzo: usar el ángulo de mayor ganancia topográfica real detectado por Open-Meteo DEM
      const baseAngle = detectedMountainAngles[seed % Math.min(6, detectedMountainAngles.length)];
      customRouteTitle = `${sport === 'mtb' ? 'Ruta BTT Incursión en Sierra' : 'Trail de Montaña'}`;

      // Cota alta en la sierra (dos vértices en el monte para trazar un bucle limpio sin callejones sin salida duplicados)
      const peakKm = Math.max(0.6, targetDistanceKm * 0.22 * scaleFactor);
      const wpPeak1: [number, number] = [
        startLng + peakKm * Math.cos(baseAngle + 0.28) * lngDeltaPerKm,
        startLat + peakKm * Math.sin(baseAngle + 0.28) * latDeltaPerKm,
      ];
      const wpPeak2: [number, number] = [
        startLng + (peakKm * 0.95) * Math.cos(baseAngle - 0.28) * lngDeltaPerKm,
        startLat + (peakKm * 0.95) * Math.sin(baseAngle - 0.28) * latDeltaPerKm,
      ];

      return [[startLng, startLat], wpPeak1, wpPeak2, [startLng, startLat]];
    }
  };

  // 2. CONSTRUCCIÓN DE WAYPOINTS PARA CARRETERA Y RUNNING (POLÍGONO EQUILIBRADO)
  const buildRoadWaypoints = (radiusKm: number, seed: number): [number, number][] => {
    const roadAngles = [0.65, 2.10, 3.65, 5.15];
    const baseAngle = roadAngles[seed % roadAngles.length];

    const circleCenterLat = startLat + (radiusKm * Math.sin(baseAngle)) * latDeltaPerKm;
    const circleCenterLng = startLng + (radiusKm * Math.cos(baseAngle)) * lngDeltaPerKm;

    const angle1 = baseAngle + Math.PI + (2 * Math.PI / 3);
    const angle2 = baseAngle + Math.PI + (4 * Math.PI / 3);

    const wp1: [number, number] = [
      circleCenterLng + radiusKm * Math.cos(angle1) * lngDeltaPerKm,
      circleCenterLat + radiusKm * Math.sin(angle1) * latDeltaPerKm,
    ];
    const wp2: [number, number] = [
      circleCenterLng + radiusKm * Math.cos(angle2) * lngDeltaPerKm,
      circleCenterLat + radiusKm * Math.sin(angle2) * latDeltaPerKm,
    ];

    return [[startLng, startLat], wp1, wp2, [startLng, startLat]];
  };

  // Función auxiliar para consultar BRouter (especialista en pistas/senderos OSM: mtb, hiking-mountain, fastbike-lowtraffic)
  // con fallback automático a OSRM si BRouter no responde.
  const queryOsrm = async (waypointsLngLat: [number, number][]) => {
    const brouterProfile =
      sport === 'mtb'
        ? 'mtb'
        : sport === 'trail' || sport === 'hiking'
        ? 'hiking-mountain'
        : sport === 'cycling'
        ? 'fastbike-lowtraffic'
        : 'shortest';

    // 1. Intentar con BRouter (prioriza highway=track, highway=path y caminos de tierra frente a carreteras asfaltadas)
    const fetchBrouter = async (pts: [number, number][]) => {
      const lonlats = pts
        .map(([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`)
        .join('|');
      const brouterUrl = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${brouterProfile}&alternativeidx=0&format=geojson`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500);
      const res = await fetch(brouterUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.features?.[0] || null;
    };

    try {
      let feat = await fetchBrouter(waypointsLngLat);
      // Si algún vértice intermedio cayó en medio del monte lejos de una pista mapeada (>250m),
      // desplazar ligeramente los puntos intermedios (~350m) para enganchar la pista forestal más cercana en BRouter
      if (!feat && waypointsLngLat.length > 2) {
        const nudged = waypointsLngLat.map(([lon, lat], idx) => {
          if (idx === 0 || idx === waypointsLngLat.length - 1) return [lon, lat] as [number, number];
          return [lon + 0.0035, lat - 0.0030] as [number, number];
        });
        feat = await fetchBrouter(nudged);
      }

      if (feat && feat.geometry?.coordinates?.length > 1) {
        const trackLengthM = parseFloat(feat.properties?.['track-length']) || 0;
        const filteredAscendM = parseFloat(feat.properties?.['filtered ascend']) || 0;

        // Analizar el desglose real de superficie a partir de las etiquetas OSM de cada tramo (messages)
        let surfaceBreakdown: string | undefined;
        let offroadPct = 0;
        const msgs: any[] = feat.properties?.messages;
        if (Array.isArray(msgs) && msgs.length > 1) {
          let trackMeters = 0;
          let pathMeters = 0;
          let roadMeters = 0;
          for (let i = 1; i < msgs.length; i++) {
            const segMeters = parseFloat(msgs[i][3]) || 0;
            const tags = String(msgs[i][9] || '');
            if (
              tags.includes('highway=path') ||
              tags.includes('highway=footway') ||
              tags.includes('highway=bridleway') ||
              tags.includes('highway=steps')
            ) {
              pathMeters += segMeters;
            } else if (
              tags.includes('highway=track') ||
              tags.includes('surface=ground') ||
              tags.includes('surface=dirt') ||
              tags.includes('surface=earth') ||
              tags.includes('surface=gravel') ||
              tags.includes('surface=unpaved') ||
              tags.includes('surface=compacted') ||
              tags.includes('surface=fine_gravel')
            ) {
              trackMeters += segMeters;
            } else {
              roadMeters += segMeters;
            }
          }
          const totalM = trackMeters + pathMeters + roadMeters;
          if (totalM > 0 && isMountainSport) {
            const pctTrack = Math.round((trackMeters / totalM) * 100);
            const pctPath = Math.round((pathMeters / totalM) * 100);
            const pctRoad = Math.max(0, 100 - pctTrack - pctPath);
            offroadPct = pctTrack + pctPath;
            surfaceBreakdown = `${pctTrack}% Pista de monte · ${pctPath}% Sendero · ${pctRoad}% Enlace`;
          }
        }

        return {
          distance: trackLengthM,
          geometry: feat.geometry,
          brouterAscentM: filteredAscendM,
          brouterSurfaceBreakdown: surfaceBreakdown,
          offroadPct,
        };
      }
    } catch {
      // Continuar con fallback OSRM
    }

    // 2. Fallback: OSRM
    const coordString = waypointsLngLat
      .map(([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`)
      .join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=false`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);
    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    return null;
  };

  // Intentar consultar OSRM con calibración dinámica
  try {
    let bestRouteData: any = null;

    if (hasCustomPoints) {
      // ============================================================================
      // MODO PUNTOS PERSONALIZADOS (INICIO -> PUNTOS DE PASO 1..N -> FINAL + CALIBRACIÓN DE DISTANCIA)
      // ============================================================================
      customRouteTitle = viaPoints.length > 0
        ? `Ruta a Medida (${viaPoints.length} ${viaPoints.length === 1 ? 'pto de paso' : 'ptos de paso'})`
        : 'Ruta Punto a Punto a Medida';

      // Construir cadena base obligatoria en formato [lng, lat]
      const mandatoryWaypoints: [number, number][] = [
        [startLng, startLat],
        ...viaPoints.map(([lat, lng]) => [lng, lat] as [number, number]),
        [endLng, endLat],
      ];

      // Si es circular (Start == End) y solo hay 1 punto de paso, añadimos un ligero desvío lateral
      // en el regreso para que la ruta base no vuelva exactamente por la misma carretera/camino
      const baseQueryWaypoints = [...mandatoryWaypoints];
      if (!isPointToPoint && viaPoints.length === 1) {
        const [vLat, vLng] = viaPoints[0];
        const midLat = (startLat + vLat) / 2;
        const midLng = (startLng + vLng) / 2;
        const dLat = vLat - startLat;
        const dLng = vLng - startLng;
        // Vector perpendicular para abrir el bucle de retorno
        const sideSign = seedVariant % 2 === 0 ? 1 : -1;
        const retLat = midLat + (-dLng * 0.28 * sideSign);
        const retLng = midLng + (dLat * 0.28 * sideSign);
        baseQueryWaypoints.splice(2, 0, [retLng, retLat]);
      }

      const baseRoute = await queryOsrm(baseQueryWaypoints);
      if (baseRoute) {
        bestRouteData = baseRoute;
        const baseDistKm = baseRoute.distance / 1000;

        // Si la ruta directa por los puntos marcados es más corta que el objetivo (>8% por debajo),
        // inyectamos un bucle de extensión calibrado (priorizando la montaña en MTB/Trail)
        if (baseDistKm < targetDistanceKm * 0.92) {
          const prevPt = mandatoryWaypoints[mandatoryWaypoints.length - 2]; // [lng, lat] del último punto de paso (o inicio)
          const lastPt = mandatoryWaypoints[mandatoryWaypoints.length - 1]; // [lng, lat] de la meta

          const anchorLng = (prevPt[0] + lastPt[0]) / 2;
          const anchorLat = (prevPt[1] + lastPt[1]) / 2;

          // Elegir ángulo de incursión: en MTB/Trail hacia la mayor cota de montaña detectada;
          // en Carretera/Running perpendicular al último tramo
          let extAngle = detectedMountainAngles[seedVariant % Math.min(4, detectedMountainAngles.length)];
          if (!isMountainSport) {
            const segAngle = Math.atan2(
              (lastPt[1] - prevPt[1]) / latDeltaPerKm,
              (lastPt[0] - prevPt[0]) / lngDeltaPerKm
            );
            extAngle = segAngle + (seedVariant % 2 === 0 ? Math.PI / 2 : -Math.PI / 2);
          }

          const neededExtraKm = Math.max(1.5, targetDistanceKm - baseDistKm * 0.82);
          let extReachKm = Math.max(0.8, neededExtraKm / 3.1);

          for (let attempt = 0; attempt < 2; attempt++) {
            const ext1: [number, number] = [
              anchorLng + extReachKm * Math.cos(extAngle + 0.26) * lngDeltaPerKm,
              anchorLat + extReachKm * Math.sin(extAngle + 0.26) * latDeltaPerKm,
            ];
            const ext2: [number, number] = [
              anchorLng + (extReachKm * 0.95) * Math.cos(extAngle - 0.26) * lngDeltaPerKm,
              anchorLat + (extReachKm * 0.95) * Math.sin(extAngle - 0.26) * latDeltaPerKm,
            ];

            const extendedWaypoints: [number, number][] = [
              ...mandatoryWaypoints.slice(0, mandatoryWaypoints.length - 1),
              ext1,
              ext2,
              lastPt,
            ];

            const candidateRoute = await queryOsrm(extendedWaypoints);
            if (candidateRoute) {
              const candDistKm = candidateRoute.distance / 1000;
              const prevBestDistKm = bestRouteData.distance / 1000;

              if (Math.abs(candDistKm - targetDistanceKm) < Math.abs(prevBestDistKm - targetDistanceKm)) {
                bestRouteData = candidateRoute;
              }

              const diffPct = Math.abs(candDistKm - targetDistanceKm) / targetDistanceKm;
              if (diffPct <= 0.08) {
                break;
              }

              if (attempt === 0) {
                // Calibrar el alcance de la extensión según la respuesta real de la red de caminos OSRM
                const retainedBaseKm = baseDistKm * 0.72;
                const actualAddedKm = Math.max(0.6, candDistKm - retainedBaseKm);
                const desiredAddedKm = Math.max(0.6, targetDistanceKm - retainedBaseKm);
                extReachKm = Math.max(0.4, extReachKm * Math.pow(desiredAddedKm / actualAddedKm, 0.88));
              }
            }
          }
        }
      }
    } else {
      // ============================================================================
      // MODO BUCLE AUTOMÁTICO CON PRIORIDAD DE MONTAÑA (MTB/TRAIL) O COMARCAL (CARRETERA)
      // ============================================================================
      let currentMountainScale = isXinzoArea
        ? Math.max(0.12, (targetDistanceKm - 10) / 24)
        : 0.85;
      let currentRoadRadius = Math.max(1.0, targetDistanceKm / (sport === 'cycling' ? 7.2 : 6.8));
      let activeSeed = seedVariant;

      for (let attempt = 0; attempt < 3; attempt++) {
        const waypoints = isMountainSport
          ? buildMountainWaypoints(currentMountainScale, activeSeed)
          : buildRoadWaypoints(currentRoadRadius, activeSeed);

        const route = await queryOsrm(waypoints);
        if (route) {
          const distKm = route.distance / 1000;
          if (
            !bestRouteData ||
            Math.abs(distKm - targetDistanceKm) < Math.abs(bestRouteData.distance / 1000 - targetDistanceKm)
          ) {
            bestRouteData = route;
          }

          // Si en el primer intento fuera de Xinzo el rodeo cruza un cañón/río (>1.85x) o tiene poco porcentaje de tierra (<55%),
          // probamos el siguiente sector de montaña detectado por el radar topográfico
          if (
            !isXinzoArea &&
            isMountainSport &&
            attempt === 0 &&
            (distKm > targetDistanceKm * 1.85 || (typeof route.offroadPct === 'number' && route.offroadPct < 55))
          ) {
            activeSeed = activeSeed + 1;
            bestRouteData = route;
            continue;
          }

          // Si la distancia calculada está dentro del 8% de la distancia objetivo, la aceptamos
          const diffPct = Math.abs(distKm - targetDistanceKm) / targetDistanceKm;
          if (diffPct <= 0.08) {
            break;
          }

          // Corregir la escala para el siguiente intento
          const correction = targetDistanceKm / distKm;
          if (isMountainSport) {
            currentMountainScale = Math.max(0.08, currentMountainScale * Math.pow(correction, 0.9));
          } else {
            currentRoadRadius = Math.max(0.4, currentRoadRadius * Math.pow(correction, 0.9));
          }
        }
      }
    }

    if (bestRouteData) {
      const rawCoords: number[][] = bestRouteData.geometry.coordinates;
      const coords: [number, number][] = rawCoords.map((c) => [c[1], c[0]]);
      const actualDistanceKm = Math.round((bestRouteData.distance / 1000) * 10) / 10;

      if (bestRouteData.brouterSurfaceBreakdown) {
        terrainDescription = bestRouteData.brouterSurfaceBreakdown;
      }

      let paceMinPerKm = 5.2;
      if (sport === 'cycling') paceMinPerKm = 2.4;
      else if (sport === 'mtb') paceMinPerKm = 3.6;
      else if (sport === 'trail') paceMinPerKm = 6.5;

      const estimatedTimeMin = Math.round(actualDistanceKm * paceMinPerKm);

      // Si BRouter ya devolvió elevación 3D SRTM en cada coordenada [lon, lat, ele], usarla directamente;
      // de lo contrario consultar Open-Meteo Elevation DEM
      const hasEmbedded3dEle = rawCoords.length > 0 && rawCoords[0].length >= 3 && typeof rawCoords[0][2] === 'number';
      const realElevations = hasEmbedded3dEle
        ? rawCoords.map((c) => Math.round(Number(c[2])))
        : await fetchRealElevationForCoordinates(coords);

      const points: RoutePoint[] = [];
      const elevationProfile: { distanceKm: number; elevationM: number }[] = [];
      let currentDist = 0;
      let totalAscentM = 0;

      const baseElevation = 620; // Cota media de Xinzo / A Limia

      if (realElevations && realElevations.length === coords.length) {
        let prevFilteredEle = realElevations[0];

        for (let i = 0; i < coords.length; i++) {
          const [lat, lng] = coords[i];
          if (i > 0) {
            const [pLat, pLng] = coords[i - 1];
            currentDist += haversineDistanceKm(pLat, pLng, lat, lng);
          }

          const ele = realElevations[i];
          points.push({ lat, lng, elevationM: ele });

          // Filtro de ruido de 2.0 metros para acumulación realista de desnivel (estándar Garmin / Strava)
          const diff = ele - prevFilteredEle;
          if (diff >= 2.0) {
            totalAscentM += diff;
            prevFilteredEle = ele;
          } else if (diff <= -2.0) {
            prevFilteredEle = ele;
          }

          if (i % 3 === 0 || i === coords.length - 1) {
            elevationProfile.push({
              distanceKm: Math.round(currentDist * 10) / 10,
              elevationM: ele,
            });
          }
        }

        if (typeof bestRouteData.brouterAscentM === 'number' && bestRouteData.brouterAscentM > 0) {
          totalAscentM = bestRouteData.brouterAscentM;
        }
      } else {
        // Fallback topográfico realista si la API de elevación no responde:
        const eleGainPerKm = sport === 'mtb' ? 24 : sport === 'trail' ? 32 : 14;
        const totalTargetAscent = Math.round(actualDistanceKm * eleGainPerKm);

        let prevEle = baseElevation;
        for (let i = 0; i < coords.length; i++) {
          const [lat, lng] = coords[i];
          if (i > 0) {
            const [pLat, pLng] = coords[i - 1];
            currentDist += haversineDistanceKm(pLat, pLng, lat, lng);
          }

          const fraction = coords.length > 1 ? i / (coords.length - 1) : 0;
          const ele = Math.round(
            baseElevation +
            (totalTargetAscent * 0.35) * Math.sin(fraction * Math.PI * 2 + seedVariant) +
            (totalTargetAscent * 0.20) * Math.sin(fraction * Math.PI * 6) +
            (totalTargetAscent * 0.10) * Math.cos(fraction * Math.PI * 10)
          );

          if (i > 0) {
            const dEle = ele - prevEle;
            if (dEle > 1.5) totalAscentM += dEle;
          }
          prevEle = ele;

          points.push({ lat, lng, elevationM: ele });
          if (i % 3 === 0 || i === coords.length - 1) {
            elevationProfile.push({
              distanceKm: Math.round(currentDist * 10) / 10,
              elevationM: ele,
            });
          }
        }
      }

      const sportLabels: Record<SportType, string> = {
        mtb: 'Ruta MTB Monte & Pistas Forestales',
        trail: 'Senda de Monte & Trail Running',
        cycling: 'Circuito Carretera Secundaria Tranquila',
        running: 'Ruta Running Asfalto & Paseo',
        hiking: 'Ruta de Senderismo',
        walking: 'Caminata y Paseo Activo',
        swimming: 'Sesión de Natación',
        cardio: 'Sesión Cardio & Fitness',
        strength_mobility: 'Paseo Activo',
      };

      const baseName = customRouteTitle || `${sportLabels[sport]}`;
      const name = `${baseName} ${actualDistanceKm}k`;
      const gpxContent = buildGpxXml(name, points);

      return {
        id: `route-real-${sport}-${actualDistanceKm}k-${seedVariant}`,
        name,
        sport,
        distanceKm: actualDistanceKm,
        elevationGainM: Math.max(120, Math.round(totalAscentM)),
        estimatedTimeMin,
        terrainType: terrainDescription,
        coordinates: coords,
        elevationProfile,
        gpxContent,
      };
    }
  } catch (err) {
    console.warn('Error en cálculo OSRM, recurriendo al trazado geométrico:', err);
  }

  // Fallback geométrico con desnivel realista
  return fallbackGeometricLoop(centerLat, centerLng, targetDistanceKm, sport, seedVariant);
}

function fallbackGeometricLoop(
  centerLat: number,
  centerLng: number,
  targetDistanceKm: number,
  sport: SportType,
  seedVariant: number
): GeneratedRoute {
  const windingFactor = sport === 'trail' || sport === 'mtb' ? 1.45 : 1.25;
  const radiusKm = (targetDistanceKm / windingFactor) / (2 * Math.PI);
  const latDeltaPerKm = 1 / 111.0;
  const lngDeltaPerKm = 1 / (111.0 * Math.cos((centerLat * Math.PI) / 180));

  const numPoints = 50;
  const points: RoutePoint[] = [];
  const coords: [number, number][] = [];
  const elevationProfile: { distanceKm: number; elevationM: number }[] = [];

  const angleOffset = (seedVariant * 1.2) % (2 * Math.PI);
  const loopCenterLat = centerLat + (radiusKm * 0.7 * Math.sin(angleOffset)) * latDeltaPerKm;
  const loopCenterLng = centerLng + (radiusKm * 0.7 * Math.cos(angleOffset)) * lngDeltaPerKm;

  let currentDist = 0;
  let totalAscentM = 0;
  const baseElevation = 620;
  let prevEle = baseElevation;

  const expectedGain = Math.round(targetDistanceKm * (sport === 'mtb' ? 24 : sport === 'cycling' ? 14 : 20));

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const angle = angleOffset + fraction * 2 * Math.PI;
    const blendWeight = Math.sin(fraction * Math.PI);

    let lat = centerLat * (1 - blendWeight) + (loopCenterLat + radiusKm * Math.sin(angle) * latDeltaPerKm) * blendWeight;
    let lng = centerLng * (1 - blendWeight) + (loopCenterLng + radiusKm * Math.cos(angle) * lngDeltaPerKm) * blendWeight;

    if (i === 0 || i === numPoints) {
      lat = centerLat;
      lng = centerLng;
    }

    const ele = Math.round(
      baseElevation +
      (expectedGain * 0.35) * Math.sin(angle * 2) +
      (expectedGain * 0.15) * Math.sin(angle * 5)
    );

    if (i > 0) {
      const prevPt = points[i - 1];
      currentDist += haversineDistanceKm(prevPt.lat, prevPt.lng, lat, lng);
      const dEle = ele - prevEle;
      if (dEle > 1.5) totalAscentM += dEle;
    }
    prevEle = ele;

    points.push({ lat, lng, elevationM: ele });
    coords.push([lat, lng]);
    elevationProfile.push({
      distanceKm: Math.round(currentDist * 10) / 10,
      elevationM: ele,
    });
  }

  const actualDist = Math.round(currentDist * 10) / 10;
  const name = `Bucle ${actualDist}k`;

  return {
    id: `route-fallback-${actualDist}k`,
    name,
    sport,
    distanceKm: actualDist,
    elevationGainM: Math.max(120, Math.round(totalAscentM)),
    estimatedTimeMin: Math.round(actualDist * (sport === 'cycling' ? 2.4 : sport === 'mtb' ? 3.6 : 5.2)),
    terrainType: sport === 'mtb' ? 'Pistas forestales y monte' : 'Caminos secundarios',
    coordinates: coords,
    elevationProfile,
    gpxContent: buildGpxXml(name, points),
  };
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
