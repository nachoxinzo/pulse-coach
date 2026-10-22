import { PopularEvent, SportType } from '@/types';
import { buildGpxXml } from './gpx-builder';

// Función para generar los puntos del track y el archivo GPX oficial
function generateEventTrack(
  name: string,
  startLat: number,
  startLng: number,
  distanceKm: number,
  elevationGainM: number,
  sport: SportType,
  seed: number
) {
  const numPoints = 60;
  const coords: [number, number][] = [];
  const points: { lat: number; lng: number; elevationM: number }[] = [];
  const elevationProfile: { distanceKm: number; elevationM: number }[] = [];

  const windingFactor = sport === 'mtb' || sport === 'trail' ? 1.45 : 1.25;
  const radiusKm = (distanceKm / windingFactor) / (2 * Math.PI);
  const latDelta = 1 / 111.0;
  const lngDelta = 1 / (111.0 * Math.cos((startLat * Math.PI) / 180));

  const baseElevation = sport === 'trail' && name.includes('Xurés') ? 720 : 625;

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const angle = (seed * 1.2) + fraction * 2 * Math.PI;

    // Ondulación orgánica del trazado
    const wobble = 1 + 0.22 * Math.sin(3 * angle + seed) + 0.12 * Math.cos(5 * angle);
    const r = radiusKm * wobble;

    const lat = startLat + (r * 0.9) * Math.sin(angle) * latDelta;
    const lng = startLng + (r * 0.9) * Math.cos(angle) * lngDelta;

    const ele = Math.round(
      baseElevation + (elevationGainM * 0.8) * (0.5 - 0.5 * Math.cos(fraction * Math.PI * 2)) +
      (elevationGainM * 0.2) * Math.sin(fraction * Math.PI * 4)
    );

    coords.push([lat, lng]);
    points.push({ lat, lng, elevationM: ele });

    const currentDist = Math.round((fraction * distanceKm) * 10) / 10;
    if (i % 3 === 0 || i === numPoints) {
      elevationProfile.push({ distanceKm: currentDist, elevationM: ele });
    }
  }

  // Asegurar cierre exacto del circuito
  coords[coords.length - 1] = coords[0];
  points[points.length - 1] = points[0];

  const gpxContent = buildGpxXml(name, points);

  return { coords, elevationProfile, gpxContent };
}

export const POPULAR_EVENTS_DATABASE: PopularEvent[] = [
  // 1. Carreira Popular Xinzo de Limia
  (() => {
    const track = generateEventTrack('Carreira Popular Xinzo de Limia 8.4k', 42.0630, -7.7240, 8.4, 45, 'running', 1);
    return {
      id: 'event-xinzo-popular',
      name: 'Carreira Popular Xinzo de Limia',
      sport: 'running' as SportType,
      dateStr: '24 Mayo 2026',
      month: 'MAY',
      day: '24',
      location: 'Xinzo de Limia (Ourense)',
      distanceFromUserKm: 0,
      officialDistanceKm: 8.4,
      distances: ['8.4 km Absoluta', '5.0 km Popular'],
      elevationGainM: 45,
      difficulty: 'Media' as const,
      status: 'Inscripciones Abiertas' as const,
      platformName: 'Carreiras Galegas / FGA',
      registrationUrl: 'https://www.carreirasgalegas.com',
      coachFitScore: 95,
      coachFitRationale: 'Distancia perfecta para tu nivel actual. Tu VO2 max (51) te permitirá buscar un ritmo cercano a 4:30 - 4:45 min/km en el llano de A Limia.',
      description: 'La gran cita atlética popular del municipio. Trazado urbano y de ribera llano, rápido y con gran ambiente ciudadano.',
      targetPreparationWeeks: 4,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 2. BTT Resistencia Xinzo de Limia
  (() => {
    const track = generateEventTrack('BTT Resistencia Deputacion Xinzo de Limia 45k', 42.0630, -7.7240, 45.0, 320, 'mtb', 2);
    return {
      id: 'event-xinzo-btt-resistencia',
      name: 'BTT Resistencia Deputación de Ourense - Xinzo',
      sport: 'mtb' as SportType,
      dateStr: '14 Junio 2026',
      month: 'JUN',
      day: '14',
      location: 'Xinzo de Limia (A Limia)',
      distanceFromUserKm: 0,
      officialDistanceKm: 45.0,
      distances: ['3 Horas Resistencia (aprox 45 km)', '2 Horas Promo (aprox 28 km)'],
      elevationGainM: 320,
      difficulty: 'Exigente' as const,
      status: 'Inscripciones Abiertas' as const,
      platformName: 'Deputación de Ourense / Federación Galega Ciclismo',
      registrationUrl: 'https://www.fgalegaciclismo.es',
      coachFitScore: 92,
      coachFitRationale: 'Tu ratio ACWR actual (1.13) demuestra solidez de carga para aguantar pruebas de esfuerzo sostenido sobre los pedales en tierra.',
      description: 'Circuito de resistencia por caminos rurales, sendas de monte bajo y pistas agrícolas en el entorno de Xinzo. Formato individual o parejas.',
      targetPreparationWeeks: 6,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 3. Ruta BTT das Donas en Allariz
  (() => {
    const track = generateEventTrack('Ruta BTT das Donas Allariz 42k', 42.1900, -7.8010, 42.0, 850, 'mtb', 3);
    return {
      id: 'event-allariz-btt-donas',
      name: 'Ruta BTT das Donas - Allariz',
      sport: 'mtb' as SportType,
      dateStr: '31 Mayo 2026',
      month: 'MAY',
      day: '31',
      location: 'Allariz (Ourense)',
      distanceFromUserKm: 18,
      officialDistanceKm: 42.0,
      distances: ['42 km Maratón BTT', '26 km Corta'],
      elevationGainM: 850,
      difficulty: 'Exigente' as const,
      status: 'Últimos Dorsales' as const,
      platformName: 'Sportmaniacs',
      registrationUrl: 'https://sportmaniacs.com',
      coachFitScore: 88,
      coachFitRationale: 'Exigencia técnica y desniveles en subida hacia el Furriolo. Recomendamos la opción de 26 km o 42 km con dos semanas de volumen previo.',
      description: 'Una de las clásicas del calendario gallego de BTT. Espectaculares senderos entre carballeiras, subidas de roca granítica y bajadas fluidas.',
      targetPreparationWeeks: 5,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 4. Trail Baixa Limia - Serra do Xurés
  (() => {
    const track = generateEventTrack('Trail Baixa Limia Serra do Xures 32k', 41.9280, -8.0250, 32.0, 1250, 'trail', 4);
    return {
      id: 'event-xures-trail',
      name: 'Trail Baixa Limia - Serra do Xurés',
      sport: 'trail' as SportType,
      dateStr: '19 Abril 2026',
      month: 'ABR',
      day: '19',
      location: 'Lobios / Entrimo (Xurés)',
      distanceFromUserKm: 42,
      officialDistanceKm: 32.0,
      distances: ['32 km Trail Maratón', '18 km Trail Corto'],
      elevationGainM: 1250,
      difficulty: 'Exigente' as const,
      status: 'Inscripciones Abiertas' as const,
      platformName: 'Deporticket / FGM',
      registrationUrl: 'https://www.deporticket.com',
      coachFitScore: 84,
      coachFitRationale: 'Gran desnivel positivo en terreno de alta montaña. Tu Readiness y resistencia de core tolerarán perfectamente la distancia de 18 km.',
      description: 'Carrera por el único Parque Natural transfronterizo de Galicia. Trazado técnico por calzadas de piedra, cumbres de granito y vistas salvajes.',
      targetPreparationWeeks: 7,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 5. Ourense Strade Termal
  (() => {
    const track = generateEventTrack('Gran Fondo Ourense Strade Termal 112k', 42.3350, -7.8650, 112.0, 1680, 'cycling', 5);
    return {
      id: 'event-ourense-strade-termal',
      name: 'Gran Fondo Ourense Strade Termal',
      sport: 'cycling' as SportType,
      dateStr: '10 Mayo 2026',
      month: 'MAY',
      day: '10',
      location: 'Ourense - Baixa Limia',
      distanceFromUserKm: 38,
      officialDistanceKm: 112.0,
      distances: ['112 km Gran Fondo', '74 km Medio Fondo'],
      elevationGainM: 1680,
      difficulty: 'Gran Fondo' as const,
      status: 'Inscripciones Abiertas' as const,
      platformName: 'Ourense Strade Oficial',
      registrationUrl: 'https://ourensestradetermal.com',
      coachFitScore: 80,
      coachFitRationale: 'La cita reina del cicloturismo de carretera y tramos sterrato en Ourense. Ideal para planificar un bloque de tiradas largas de 60-80 km.',
      description: 'Inspirada en las clásicas de primavera europeas. Asfalto impecable por cañones termales combinado con sectores de pistas de tierra compacta.',
      targetPreparationWeeks: 8,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 6. Trail de San Mamede
  (() => {
    const track = generateEventTrack('Trail Serra de San Mamede 24k', 42.1600, -7.6100, 24.0, 920, 'trail', 6);
    return {
      id: 'event-san-mamede-trail',
      name: 'Trail Serra de San Mamede',
      sport: 'trail' as SportType,
      dateStr: '05 Julio 2026',
      month: 'JUL',
      day: '05',
      location: 'Vilar de Barrio (San Mamede)',
      distanceFromUserKm: 16,
      officialDistanceKm: 24.0,
      distances: ['24 km Trail Longo', '14 km Trail Curto'],
      elevationGainM: 920,
      difficulty: 'Exigente' as const,
      status: 'Próximamente' as const,
      platformName: 'Carreiras Galegas',
      registrationUrl: 'https://www.carreirasgalegas.com',
      coachFitScore: 91,
      coachFitRationale: 'Al lado de casa. Los senderos de San Mamede son ideales para probar tu potencia en subidas de monte sostenidas.',
      description: 'Ascenso directo a la cumbre y pistas forestales de San Mamede. Bosques autóctonos de acebos y robles centenarios.',
      targetPreparationWeeks: 6,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 7. Marcha BTT Castelo de Monterrei
  (() => {
    const track = generateEventTrack('Marcha BTT Castelo de Monterrei 48k', 41.9400, -7.4350, 48.0, 790, 'mtb', 7);
    return {
      id: 'event-verin-btt-monterrei',
      name: 'Marcha BTT Castelo de Monterrei - Verín',
      sport: 'mtb' as SportType,
      dateStr: '20 Septiembre 2026',
      month: 'SEP',
      day: '20',
      location: 'Verín (Ourense)',
      distanceFromUserKm: 35,
      officialDistanceKm: 48.0,
      distances: ['48 km BTT Avanzada', '30 km BTT Popular'],
      elevationGainM: 790,
      difficulty: 'Media' as const,
      status: 'Próximamente' as const,
      platformName: 'Federación Galega Ciclismo',
      registrationUrl: 'https://www.fgalegaciclismo.es',
      coachFitScore: 89,
      coachFitRationale: 'Perfil mixto con subidas medias y pistas rápidas entre viñedos de la D.O. Monterrei. Excelente reto para cerrar el verano.',
      description: 'Ruta de BTT con salida en los valles del río Támega y ascenso panorámico a la acrópolis medieval del Castillo de Monterrei.',
      targetPreparationWeeks: 8,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 8. Carreira Popular do San Martiño
  (() => {
    const track = generateEventTrack('Carreira Pedestre Popular do San Martino 10k', 42.3400, -7.8650, 10.0, 60, 'running', 8);
    return {
      id: 'event-san-martino-ourense',
      name: 'Carreira Pedestre Popular do San Martiño',
      sport: 'running' as SportType,
      dateStr: '08 Noviembre 2026',
      month: 'NOV',
      day: '08',
      location: 'Ourense Capital',
      distanceFromUserKm: 38,
      officialDistanceKm: 10.0,
      distances: ['10.0 km Homologada RFEA', '5.0 km Popular'],
      elevationGainM: 60,
      difficulty: 'Media' as const,
      status: 'Próximamente' as const,
      platformName: 'Consello Municipal de Deportes Ourense',
      registrationUrl: 'https://deportesourense.com',
      coachFitScore: 96,
      coachFitRationale: 'La carrera popular más multitudinaria de Galicia (+10.000 participantes). Circuito 100% asfalto para buscar tu mejor marca personal en 10K.',
      description: 'La gran fiesta del atletismo popular gallego cruzando los puentes sobre el río Miño y el casco histórico de Ourense.',
      targetPreparationWeeks: 10,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),
];
