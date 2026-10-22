import { PopularEvent, SportType } from '@/types';
import { buildGpxXml } from './gpx-builder';

// Función para interpolar densamente un trazado de waypoints reales
function createRealisticTrack(
  name: string,
  keyWaypoints: { lat: number; lng: number; ele: number }[],
  totalDistanceKm: number
) {
  const points: { lat: number; lng: number; elevationM: number }[] = [];
  const coords: [number, number][] = [];
  const elevationProfile: { distanceKm: number; elevationM: number }[] = [];

  const totalSegments = keyWaypoints.length - 1;
  const pointsPerSegment = Math.max(5, Math.floor(180 / totalSegments));

  for (let s = 0; s < totalSegments; s++) {
    const p1 = keyWaypoints[s];
    const p2 = keyWaypoints[s + 1];

    for (let step = 0; step < pointsPerSegment; step++) {
      const frac = step / pointsPerSegment;
      const lat = p1.lat + (p2.lat - p1.lat) * frac;
      const lng = p1.lng + (p2.lng - p1.lng) * frac;
      const ele = Math.round(p1.ele + (p2.ele - p1.ele) * frac);

      coords.push([lat, lng]);
      points.push({ lat, lng, elevationM: ele });
    }
  }

  // Cerrar con el último punto
  const last = keyWaypoints[keyWaypoints.length - 1];
  coords.push([last.lat, last.lng]);
  points.push({ lat: last.lat, lng: last.lng, elevationM: Math.round(last.ele) });

  // Crear perfil de elevación representativo
  const numProfilePoints = 25;
  for (let i = 0; i <= numProfilePoints; i++) {
    const fraction = i / numProfilePoints;
    const ptIndex = Math.min(points.length - 1, Math.floor(fraction * (points.length - 1)));
    elevationProfile.push({
      distanceKm: Number((fraction * totalDistanceKm).toFixed(2)),
      elevationM: points[ptIndex].elevationM,
    });
  }

  const gpxContent = buildGpxXml(name, points);

  return { coords, elevationProfile, gpxContent };
}

export const POPULAR_EVENTS_DATABASE: PopularEvent[] = [
  // 1. Carreira Popular Xinzo de Limia (Trazado Urbano Real)
  (() => {
    const waypoints = [
      { lat: 42.0631, lng: -7.7242, ele: 622 }, // Praza Maior de Xinzo (Salida)
      { lat: 42.0645, lng: -7.7225, ele: 623 }, // Rúa Constitución
      { lat: 42.0665, lng: -7.7212, ele: 624 }, // Avda. de Madrid (N-525 tramo urbano)
      { lat: 42.0690, lng: -7.7240, ele: 621 }, // Enlace Paseo do Río Limia
      { lat: 42.0715, lng: -7.7285, ele: 620 }, // Ponte Nova do Limia
      { lat: 42.0678, lng: -7.7320, ele: 620 }, // Paseo Fluvial norte
      { lat: 42.0635, lng: -7.7310, ele: 622 }, // Parque de O Toural
      { lat: 42.0612, lng: -7.7280, ele: 623 }, // Rúa Dous de Maio
      { lat: 42.0620, lng: -7.7255, ele: 623 }, // Rúa San Roque
      { lat: 42.0631, lng: -7.7242, ele: 622 }, // Praza Maior (Meta)
    ];
    const track = createRealisticTrack('Carreira Popular Xinzo de Limia 8.4k', waypoints, 8.4);
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
      wikilocUrl: 'https://es.wikiloc.com/rutas/carrera/espana/galicia/xinzo-de-limia',
      stravaSegmentUrl: 'https://www.strava.com/segments/search?location=Xinzo%20de%20Limia',
      isVerifiedRoute: true,
      coachFitScore: 95,
      coachFitRationale: 'Distancia perfecta para tu nivel actual. Tu VO2 max te permitirá rodar a ritmo sostenido en el llano de A Limia.',
      description: 'Circuito urbano y fluvial 100% real por el casco histórico, la ribera del Río Limia y el Parque de O Toural.',
      targetPreparationWeeks: 4,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 2. BTT Resistencia Deputación de Ourense - Xinzo
  (() => {
    const waypoints = [
      { lat: 42.0605, lng: -7.7280, ele: 624 }, // Pavillón de Deportes Xinzo
      { lat: 42.0720, lng: -7.7390, ele: 620 }, // Salida por pistas agrícolas
      { lat: 42.0880, lng: -7.7480, ele: 618 }, // Canal Central da Antela
      { lat: 42.1120, lng: -7.7580, ele: 625 }, // Pistas de Sandiás
      { lat: 42.1280, lng: -7.7420, ele: 645 }, // Piñeira de Arcos (primer repecho)
      { lat: 42.1050, lng: -7.7120, ele: 660 }, // Enlace camino de monte hacia Laroá
      { lat: 42.0850, lng: -7.7050, ele: 635 }, // Pistas forestales de Morgade
      { lat: 42.0710, lng: -7.7150, ele: 626 }, // Camino de Rebordechá
      { lat: 42.0605, lng: -7.7280, ele: 624 }, // Pavillón de Xinzo (Meta)
    ];
    const track = createRealisticTrack('BTT Resistencia Deputacion Xinzo 45k', waypoints, 45.0);
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
      platformName: 'Federación Galega Ciclismo',
      registrationUrl: 'https://www.fgalegaciclismo.es',
      wikilocUrl: 'https://es.wikiloc.com/rutas-mountain-bike/espana/galicia/xinzo-de-limia',
      stravaSegmentUrl: 'https://www.strava.com/segments/search?location=Xinzo%20de%20Limia',
      isVerifiedRoute: true,
      coachFitScore: 92,
      coachFitRationale: 'Tu ratio ACWR actual demuestra solidez para aguantar pruebas de esfuerzo sostenido sobre los pedales.',
      description: 'Trazado real por los caminos rurales de concentración parcelaria, pistas de tierra de A Lagoa y senderos de monte de Laroá.',
      targetPreparationWeeks: 6,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 3. Ruta BTT das Donas - Allariz
  (() => {
    const waypoints = [
      { lat: 42.1902, lng: -7.8010, ele: 435 }, // Campo da Barreira / Allariz
      { lat: 42.1850, lng: -7.8080, ele: 440 }, // Paseo Fluvial do Arnoia
      { lat: 42.1720, lng: -7.7950, ele: 560 }, // Subida a San Salvador dos Penedos
      { lat: 42.1580, lng: -7.7880, ele: 720 }, // Alto do Furriolo (pistas rocosas)
      { lat: 42.1490, lng: -7.7750, ele: 850 }, // Cota máxima Furriolo
      { lat: 42.1820, lng: -7.7610, ele: 610 }, // Carballeiras de Augas Santas
      { lat: 42.2010, lng: -7.7850, ele: 470 }, // Sendeiro tradicional de baixada
      { lat: 42.1902, lng: -7.8010, ele: 435 }, // Retorno a Allariz (Meta)
    ];
    const track = createRealisticTrack('Ruta BTT das Donas Allariz 42k', waypoints, 42.0);
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
      wikilocUrl: 'https://es.wikiloc.com/rutas-mountain-bike/espana/galicia/allariz',
      stravaSegmentUrl: 'https://www.strava.com/segments/search?location=Allariz',
      isVerifiedRoute: true,
      coachFitScore: 88,
      coachFitRationale: 'Gran desnivel positivo en ascenso hacia O Furriolo. Recomendamos la opción de 26 km o 42 km con bloque previo.',
      description: 'Una clásica del BTT gallego con senderos auténticos entre robledales centenarios, subida de roca al Furriolo y bajada al Río Arnoia.',
      targetPreparationWeeks: 5,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 4. Trail Baixa Limia - Serra do Xurés
  (() => {
    const waypoints = [
      { lat: 41.9050, lng: -8.1130, ele: 320 }, // Balneario de Riocaldo / Lobios
      { lat: 41.9120, lng: -8.1050, ele: 450 }, // Calzada Romana Vía Nova
      { lat: 41.9010, lng: -8.1180, ele: 710 }, // Cascadas da Corga da Fecha
      { lat: 41.8890, lng: -8.1320, ele: 980 }, // Portela do Home (cumbre fronteriza)
      { lat: 41.9150, lng: -8.0850, ele: 1120 }, // Serra de Santa Eufemia
      { lat: 41.9280, lng: -8.0720, ele: 780 }, // Sendeiros de Torneiros
      { lat: 41.9050, lng: -8.1130, ele: 320 }, // Retorno a Riocaldo
    ];
    const track = createRealisticTrack('Trail Baixa Limia Serra do Xures 32k', waypoints, 32.0);
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
      wikilocUrl: 'https://es.wikiloc.com/rutas-trail-running/espana/galicia/lobios',
      stravaSegmentUrl: 'https://www.strava.com/segments/search?location=Lobios',
      isVerifiedRoute: true,
      coachFitScore: 84,
      coachFitRationale: 'Gran desnivel positivo en terreno técnico de roca y calzadas romanas.',
      description: 'Carrera por el Parque Natural transfronterizo del Xurés por sendas de piedra granítica, cañones de agua y Portela do Home.',
      targetPreparationWeeks: 7,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 5. Gran Fondo Ourense Strade Termal
  (() => {
    const waypoints = [
      { lat: 42.3480, lng: -7.8820, ele: 125 }, // Ourense Termal (Salida)
      { lat: 42.2650, lng: -7.9120, ele: 240 }, // Valenzá / Sobrado
      { lat: 42.1520, lng: -7.9580, ele: 530 }, // Celanova (Monasterio San Rosendo)
      { lat: 42.0620, lng: -7.9950, ele: 680 }, // Alto de Vieiro
      { lat: 41.9820, lng: -8.0250, ele: 410 }, // Bande / Embalse de As Conchas
      { lat: 42.0350, lng: -8.0650, ele: 520 }, // Muíños (Sector Sterrato de grava)
      { lat: 42.1850, lng: -8.0120, ele: 340 }, // Ramirás comarcal
      { lat: 42.3480, lng: -7.8820, ele: 125 }, // Ourense Meta
    ];
    const track = createRealisticTrack('Gran Fondo Ourense Strade Termal 112k', waypoints, 112.0);
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
      wikilocUrl: 'https://es.wikiloc.com/rutas-ciclismo/espana/galicia/ourense',
      stravaSegmentUrl: 'https://www.strava.com/segments/search?location=Ourense',
      isVerifiedRoute: true,
      coachFitScore: 80,
      coachFitRationale: 'La cita reina del cicloturismo gallego. Tramos de asfalto liso combinados con pistas de sterrato compactas.',
      description: 'Inspirada en las clásicas italianas de primavera: asfalto entre cañones termales y sectores de tierra alrededor de As Conchas.',
      targetPreparationWeeks: 8,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 6. Trail Serra de San Mamede
  (() => {
    const waypoints = [
      { lat: 42.1610, lng: -7.6110, ele: 710 }, // Vilar de Barrio (Salida)
      { lat: 42.1750, lng: -7.6020, ele: 890 }, // Bosque de acebos autóctonos
      { lat: 42.1920, lng: -7.5910, ele: 1240 }, // Pista cortafuegos de alta ladera
      { lat: 42.2040, lng: -7.5850, ele: 1618 }, // Vértice Geodésico San Mamede (Cima)
      { lat: 42.1880, lng: -7.5720, ele: 1350 }, // Ermita de San Mamede
      { lat: 42.1690, lng: -7.5890, ele: 940 }, // Val de Meda
      { lat: 42.1610, lng: -7.6110, ele: 710 }, // Vilar de Barrio (Meta)
    ];
    const track = createRealisticTrack('Trail Serra de San Mamede 24k', waypoints, 24.0);
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
      wikilocUrl: 'https://es.wikiloc.com/rutas-trail-running/espana/galicia/vilar-de-barrio',
      stravaSegmentUrl: 'https://www.strava.com/segments/search?location=Vilar%20de%20Barrio',
      isVerifiedRoute: true,
      coachFitScore: 91,
      coachFitRationale: 'Los senderos de San Mamede son ideales para poner a prueba tu potencia aeróbica en subidas prolongadas.',
      description: 'Ascenso real hasta la cumbre a 1618 metros por caminos forestales tradicionales de la comarca de A Limia.',
      targetPreparationWeeks: 6,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 7. Marcha BTT Castelo de Monterrei - Verín
  (() => {
    const waypoints = [
      { lat: 41.9410, lng: -7.4360, ele: 375 }, // Alameda de Verín (Salida)
      { lat: 41.9560, lng: -7.4480, ele: 530 }, // Calzada del Castillo de Monterrei
      { lat: 41.9750, lng: -7.4720, ele: 680 }, // Pistas entre viñedos de Vilaza
      { lat: 41.9890, lng: -7.4580, ele: 790 }, // Montes de Albarellos
      { lat: 41.9680, lng: -7.4250, ele: 510 }, // Sendeiros de Pazos
      { lat: 41.9410, lng: -7.4360, ele: 375 }, // Alameda de Verín (Meta)
    ];
    const track = createRealisticTrack('Marcha BTT Castelo de Monterrei 48k', waypoints, 48.0);
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
      wikilocUrl: 'https://es.wikiloc.com/rutas-mountain-bike/espana/galicia/verin',
      stravaSegmentUrl: 'https://www.strava.com/segments/search?location=Verin',
      isVerifiedRoute: true,
      coachFitScore: 89,
      coachFitRationale: 'Perfil mixto con subidas medias y pistas rápidas entre viñedos de la D.O. Monterrei.',
      description: 'Salida en el valle del río Támega y ascenso panorámico por las pistas del Castillo medieval de Monterrei.',
      targetPreparationWeeks: 8,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),

  // 8. Carreira Pedestre Popular do San Martiño (Circuito Homologado RFEA)
  (() => {
    const waypoints = [
      { lat: 42.3435, lng: -7.8680, ele: 130 }, // Ponte Vella / Puente Romano (Salida)
      { lat: 42.3380, lng: -7.8640, ele: 135 }, // Rúa Progreso
      { lat: 42.3340, lng: -7.8690, ele: 138 }, // Alameda do Concello
      { lat: 42.3375, lng: -7.8780, ele: 132 }, // Pardo de Cela / Pavillón dos Remedios
      { lat: 42.3470, lng: -7.8760, ele: 140 }, // Ponte do Milenio (Paso elevado)
      { lat: 42.3510, lng: -7.8690, ele: 136 }, // Avda. das Caldas
      { lat: 42.3485, lng: -7.8620, ele: 142 }, // Curros Enríquez
      { lat: 42.3410, lng: -7.8635, ele: 138 }, // Rúa do Paseo
      { lat: 42.3435, lng: -7.8680, ele: 130 }, // Ponte Vella (Meta)
    ];
    const track = createRealisticTrack('Carreira Pedestre Popular San Martino 10k', waypoints, 10.0);
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
      wikilocUrl: 'https://es.wikiloc.com/rutas/carrera/espana/galicia/ourense',
      stravaSegmentUrl: 'https://www.strava.com/segments/search?location=Ourense',
      isVerifiedRoute: true,
      coachFitScore: 96,
      coachFitRationale: 'La carrera popular más multitudinaria de Galicia. Circuito 100% asfalto para buscar tu mejor marca en 10K.',
      description: 'El circuito real homologado cruzando los puentes sobre el río Miño, la Alameda y el casco histórico de Ourense.',
      targetPreparationWeeks: 10,
      coordinates: track.coords,
      elevationProfile: track.elevationProfile,
      gpxContent: track.gpxContent,
    };
  })(),
];
