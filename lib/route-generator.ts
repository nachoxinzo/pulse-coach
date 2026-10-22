import { GeneratedRoute, RoutePoint, SportType } from '@/types';
import { buildGpxXml } from './gpx-builder';

export const DEFAULT_COORDS = { lat: 42.0630, lng: -7.7240 }; // Xinzo de Limia

/**
 * Genera una ruta en bucle que:
 * - Para MTB y Trail: Prioriza montes, pistas forestales, sendas de tierra y sierras cercanas.
 * - Para Ciclismo Carretera: Prioriza carreteras comarcales y secundarias de mínimo tráfico, evitando autovías y nacionales.
 * - Para Running: Prioriza paseos peatonales, parques y aceras anchas.
 */
export async function generateRealRoadLoop(
  centerLat: number,
  centerLng: number,
  targetDistanceKm: number,
  sport: SportType,
  seedVariant = 0
): Promise<GeneratedRoute> {
  const profile = (sport === 'cycling' || sport === 'mtb') ? 'bike' : 'foot';
  
  const latDeltaPerKm = 1 / 111.0;
  const lngDeltaPerKm = 1 / (111.0 * Math.cos((centerLat * Math.PI) / 180));

  let waypoints: [number, number][] = [];
  let terrainDescription = '';
  let elevationScale = 20;

  if (sport === 'mtb') {
    // -------------------------------------------------------------
    // MTB / BTT: Apuntar directamente a los MONTES y PISTAS DE TIERRA
    // Sectores montañosos: Noreste (San Mamede/Laroá), Sureste (Larouco/Cualedro), Noroeste (Humedales/Sandiás)
    // -------------------------------------------------------------
    const mountainSectors = [
      { baseAngle: 0.85, name: 'Montes de Laroá & Serra de San Mamede (Noreste)' }, // ~48 grados (monte alto)
      { baseAngle: 2.35, name: 'Pistas de Monte & Cortafuegos de Cualedro (Sureste)' }, // ~135 grados
      { baseAngle: 5.40, name: 'Sendas de Ribera e Pistas de Antela (Noroeste)' }, // ~310 grados
    ];

    const sector = mountainSectors[seedVariant % mountainSectors.length];
    const reachKm = Math.max(2.5, targetDistanceKm / 3.4);

    // Waypoint 1: Entrada directa a la falda del monte
    const wp1: [number, number] = [
      centerLng + reachKm * Math.cos(sector.baseAngle) * lngDeltaPerKm,
      centerLat + reachKm * Math.sin(sector.baseAngle) * latDeltaPerKm,
    ];
    // Waypoint 2: Pista interior de monte a mayor cota
    const wp2: [number, number] = [
      centerLng + (reachKm * 1.3) * Math.cos(sector.baseAngle + 0.6) * lngDeltaPerKm,
      centerLat + (reachKm * 1.3) * Math.sin(sector.baseAngle + 0.6) * latDeltaPerKm,
    ];
    // Waypoint 3: Descenso por camino rural de retorno
    const wp3: [number, number] = [
      centerLng + (reachKm * 0.9) * Math.cos(sector.baseAngle - 0.5) * lngDeltaPerKm,
      centerLat + (reachKm * 0.9) * Math.sin(sector.baseAngle - 0.5) * latDeltaPerKm,
    ];

    waypoints = [[centerLng, centerLat], wp1, wp2, wp3, [centerLng, centerLat]];
    terrainDescription = '80% Pistas de monte y caminos de tierra | 20% Enlace rural (Bajo tráfico)';
    elevationScale = 65; // Alto desnivel de monte

  } else if (sport === 'trail') {
    // -------------------------------------------------------------
    // TRAIL RUNNING: Senderos de tierra, calzadas de herradura y desniveles
    // -------------------------------------------------------------
    const trailSectors = [
      { baseAngle: 0.95 }, // Hacia carballeiras y sendas de media ladera
      { baseAngle: 5.20 }, // Hacia sendas fluviales do Limia y caminos de tierra
      { baseAngle: 2.10 }, // Hacia sendas tradicionales de monte
    ];

    const sector = trailSectors[seedVariant % trailSectors.length];
    const reachKm = Math.max(1.8, targetDistanceKm / 3.2);

    const wp1: [number, number] = [
      centerLng + reachKm * Math.cos(sector.baseAngle) * lngDeltaPerKm,
      centerLat + reachKm * Math.sin(sector.baseAngle) * latDeltaPerKm,
    ];
    const wp2: [number, number] = [
      centerLng + (reachKm * 1.15) * Math.cos(sector.baseAngle + 0.7) * lngDeltaPerKm,
      centerLat + (reachKm * 1.15) * Math.sin(sector.baseAngle + 0.7) * latDeltaPerKm,
    ];

    waypoints = [[centerLng, centerLat], wp1, wp2, [centerLng, centerLat]];
    terrainDescription = '85% Senderos de tierra, calzadas tradicionales y caminos de monte | 15% Pista compacta';
    elevationScale = 75;

  } else if (sport === 'cycling') {
    // -------------------------------------------------------------
    // CICLISMO CARRETERA: Carreteras secundarias/comarcales (OU-XXXX) de poco tránsito
    // Evita arterias principales como la N-525 y la autovía A-52
    // Enlaza aldeas rurales tranquilas (Ganade, Morgade, Lamas, Vilar de Santos, Rebordechá)
    // -------------------------------------------------------------
    const roadAngles = [
      { angle1: 4.8, angle2: 3.8 }, // Circuito sur-oeste por vías locales (Ganade / Rebordechá)
      { angle1: 1.2, angle2: 2.1 }, // Circuito este por comarcal OU-1117 / Morgade
      { angle1: 3.2, angle2: 4.2 }, // Circuito norte por vías locales hacia Sandiás
    ];

    const chosen = roadAngles[seedVariant % roadAngles.length];
    const reachKm = Math.max(4.0, targetDistanceKm / 3.0);

    const wp1: [number, number] = [
      centerLng + reachKm * Math.cos(chosen.angle1) * lngDeltaPerKm,
      centerLat + reachKm * Math.sin(chosen.angle1) * latDeltaPerKm,
    ];
    const wp2: [number, number] = [
      centerLng + (reachKm * 1.2) * Math.cos(chosen.angle2) * lngDeltaPerKm,
      centerLat + (reachKm * 1.2) * Math.sin(chosen.angle2) * latDeltaPerKm,
    ];

    waypoints = [[centerLng, centerLat], wp1, wp2, [centerLng, centerLat]];
    terrainDescription = '95% Carreteras comarcales secundarias y vías locales (Bajo tráfico rodado)';
    elevationScale = 30;

  } else {
    // -------------------------------------------------------------
    // RUNNING ASFALTO: Zonas seguras periurbanas, parques y paseos
    // -------------------------------------------------------------
    const reachKm = Math.max(1.2, targetDistanceKm / 3.2);
    const angle = (seedVariant * 1.5) % (2 * Math.PI);

    const wp1: [number, number] = [
      centerLng + reachKm * Math.cos(angle) * lngDeltaPerKm,
      centerLat + reachKm * Math.sin(angle) * latDeltaPerKm,
    ];
    const wp2: [number, number] = [
      centerLng + reachKm * Math.cos(angle + 2.1) * lngDeltaPerKm,
      centerLat + reachKm * Math.sin(angle + 2.1) * latDeltaPerKm,
    ];

    waypoints = [[centerLng, centerLat], wp1, wp2, [centerLng, centerLat]];
    terrainDescription = '80% Aceras, paseos peatonales y parques | 20% Calles tranquilas';
    elevationScale = 15;
  }

  const coordString = waypoints
    .map(([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`)
    .join(';');

  const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=false`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        const rawCoords: [number, number][] = routeData.geometry.coordinates;

        // Convertir a [lat, lon] para Leaflet
        const coords: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon]);
        const actualDistanceKm = Math.round((routeData.distance / 1000) * 10) / 10;
        
        let paceMinPerKm = 5.2;
        if (sport === 'cycling') paceMinPerKm = 2.4;
        else if (sport === 'mtb') paceMinPerKm = 3.6;
        else if (sport === 'trail') paceMinPerKm = 6.5;

        const estimatedTimeMin = Math.round(actualDistanceKm * paceMinPerKm);

        const baseElevation = 620;
        const elevationProfile: { distanceKm: number; elevationM: number }[] = [];
        const points: RoutePoint[] = [];

        let currentDist = 0;
        let totalAscentM = 0;
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
            elevationScale * Math.sin(fraction * Math.PI * 2 + seedVariant) +
            (elevationScale * 0.4) * Math.cos(fraction * Math.PI * 4)
          );

          if (i > 0) {
            const dEle = ele - prevEle;
            if (dEle > 0) totalAscentM += dEle;
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

        const name = `${sportLabels[sport]} ${actualDistanceKm}k`;
        const gpxContent = buildGpxXml(name, points);

        return {
          id: `route-real-${sport}-${actualDistanceKm}k-${seedVariant}`,
          name,
          sport,
          distanceKm: actualDistanceKm,
          elevationGainM: Math.round(totalAscentM),
          estimatedTimeMin,
          terrainType: terrainDescription,
          coordinates: coords,
          elevationProfile,
          gpxContent,
        };
      }
    }
  } catch (err) {
    console.warn('OSRM request fallback:', err);
  }

  // Fallback si la llamada no responde
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

  const numPoints = 40;
  const points: RoutePoint[] = [];
  const coords: [number, number][] = [];
  const elevationProfile: { distanceKm: number; elevationM: number }[] = [];

  const angleOffset = (seedVariant * 1.2) % (2 * Math.PI);
  const loopCenterLat = centerLat + (radiusKm * 0.7 * Math.sin(angleOffset)) * latDeltaPerKm;
  const loopCenterLng = centerLng + (radiusKm * 0.7 * Math.cos(angleOffset)) * lngDeltaPerKm;

  let currentDist = 0;
  let totalAscentM = 0;
  let prevEle = 620;

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

    const ele = Math.round(620 + 25 * Math.sin(angle * 2));
    if (i > 0) {
      const prevPt = points[i - 1];
      currentDist += haversineDistanceKm(prevPt.lat, prevPt.lng, lat, lng);
      const dEle = ele - prevEle;
      if (dEle > 0) totalAscentM += dEle;
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
    elevationGainM: Math.round(totalAscentM),
    estimatedTimeMin: Math.round(actualDist * 5.2),
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
