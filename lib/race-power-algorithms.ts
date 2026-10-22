/**
 * Algoritmos de Fisiología Deportiva y Modelado de Rendimiento
 * 
 * Basado en estudios científicos de referencia:
 * 1. Daniels & Gilbert (1979) - Oxygen Power & VDOT Running Model
 * 2. Vickers & Vertosick (2016) - An empirical study of marathon prediction (BMC Sports Science)
 * 3. Pete Riegel (1977/1981) - Athletic records and human endurance
 * 4. Monod & Scherrer (1965) / Moritani (1981) - Critical Power (CP) & Anaerobic Work Capacity (W')
 * 5. Coggan & Allen (2010) - Training and Racing with a Power Meter (FTP & 7 Power Zones)
 * 6. Martin et al. (1998) - Validation of a mathematical model for road cycling power
 */

import { ActivitySession } from '@/types';

export interface VDotPrediction {
  targetDistanceKm: number;
  name: string;
  timeSec: number;
  timeFormatted: string;
  paceFormatted: string;
  paceSecPerKm: number;
  vdotTimeSec: number;
  riegelTimeSec: number;
  confidencePercent: number;
  strategyTip: string;
}

export interface PowerZone {
  zoneIndex: number;
  code: string;
  name: string;
  minWatts: number;
  maxWatts: number;
  minWkg: number;
  maxWkg: number;
  color: string;
  description: string;
}

export interface FtpEstimationResult {
  ftpWatts: number;
  ftpWkg: number;
  criticalPowerWatts: number;
  wPrimeKj: number;
  sourceMethod: 'test_20m' | 'critical_power' | 'telemetry_physics' | 'manual';
  methodLabel: string;
  confidencePercent: number;
  best20MinWatts?: number;
  best5MinWatts?: number;
  best1MinWatts?: number;
  zones: PowerZone[];
}

/**
 * Convierte segundos a formato "H:MM:SS" o "M:SS"
 */
export function formatSecondsToTime(totalSec: number): string {
  const rounded = Math.round(totalSec);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * Convierte segundos por kilómetro a formato "M:SS /km"
 */
export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

// ============================================================================
// 1. ALGORITMOS DE PREDICCIÓN DE CARRERA (VDOT & RIEGEL-VICKERS)
// ============================================================================

/**
 * Calcula el VDOT a partir de una distancia en metros y tiempo en segundos
 * utilizando las ecuaciones no lineales de Daniels y Gilbert (1979).
 */
export function calculateVDOT(distanceMeters: number, timeSec: number): number {
  if (timeSec <= 0 || distanceMeters <= 0) return 40;
  const tMin = timeSec / 60;
  const vMPerMin = distanceMeters / tMin;

  // Coste de oxígeno (ml/kg/min) según velocidad
  const vo2 = -4.60 + 0.182258 * vMPerMin + 0.000104 * Math.pow(vMPerMin, 2);

  // Fracción de VO2máx que un atleta puede sostener durante tMin
  const fraction = 0.8 + 0.1894393 * Math.exp(-0.012778 * tMin) + 0.2989558 * Math.exp(-0.1932605 * tMin);

  const vdot = vo2 / fraction;
  return Math.max(30, Math.min(85, vdot));
}

/**
 * Resuelve el tiempo previsto (segundos) para cualquier distancia en metros
 * dado un VDOT mediante búsqueda binaria de precisión sub-segundo.
 */
export function predictTimeVDOT(vdot: number, targetDistanceMeters: number): number {
  let low = 30; // 30 segundos
  let high = 100000; // más de 24 horas

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const testVdot = calculateVDOT(targetDistanceMeters, mid);
    if (testVdot > vdot) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Modelo de Pete Riegel (1981) mejorado con el estudio de Vickers & Vertosick (2016)
 * donde el exponente de fatiga aeróbica b se calibra según el volumen semanal real.
 */
export function predictTimeRiegel(
  t1Sec: number, 
  d1Meters: number, 
  d2Meters: number, 
  weeklyKm: number = 30
): number {
  if (t1Sec <= 0 || d1Meters <= 0 || d2Meters <= 0) return 0;
  
  // Estudio Vickers & Vertosick: Exponente según volumen aeróbico
  let b = 1.07;
  if (weeklyKm >= 70) b = 1.055;
  else if (weeklyKm >= 50) b = 1.065;
  else if (weeklyKm >= 30) b = 1.075;
  else b = 1.095;

  return t1Sec * Math.pow(d2Meters / d1Meters, b);
}

/**
 * Genera el conjunto de pronósticos de competición para distancias estándar y personalizadas
 */
export function calculateRacePredictions(
  userVo2Max: number, 
  activities: ActivitySession[],
  customDistanceKm?: number
): {
  vdot: number;
  weeklyRunningKm: number;
  standardPredictions: Record<'1500m' | '5k' | '10k' | '21k' | '42k', VDotPrediction>;
  customPrediction?: VDotPrediction;
} {
  // 1. Filtrar sesiones reales de carrera a pie
  const runSessions = activities.filter(a => a.sport === 'running' || a.sport === 'trail');
  const weeklyRunningKm = runSessions.reduce((acc, a) => acc + (a.distanceKm || 0), 0);

  // 2. Extraer el mejor esfuerzo real o calibrar con VO2máx
  let calibratedVdot = userVo2Max ? userVo2Max * 0.94 : 45; // VDOT suele ser ~94% del VO2máx de laboratorio

  // Si hay actividades reales con distancia y tiempo, calcular VDOT real
  const runsWithPace = runSessions.filter(a => (a.distanceKm || 0) >= 2 && a.durationMin > 0);
  if (runsWithPace.length > 0) {
    const vdots = runsWithPace.map(a => calculateVDOT((a.distanceKm || 5) * 1000, a.durationMin * 60));
    const maxObservedVdot = Math.max(...vdots);
    // Ponderación: 70% rendimiento real observado, 30% VO2máx fisiológico
    calibratedVdot = Number(((maxObservedVdot * 0.7) + (calibratedVdot * 0.3)).toFixed(1));
  }

  // Factor de confianza basado en kilometraje registrado
  const confidence = Math.min(96, Math.max(70, Math.round(75 + (weeklyRunningKm / 20) * 8)));

  const buildPred = (km: number, name: string, tip: string): VDotPrediction => {
    const distM = km * 1000;
    const vdotSec = predictTimeVDOT(calibratedVdot, distM);
    const riegelSec = predictTimeRiegel(vdotSec * (5000 / distM), 5000, distM, weeklyRunningKm);
    
    // Promedio ponderado ensemble: VDOT aporta la capacidad VO2, Riegel-Vickers aporta la fatiga muscular
    const ensembleSec = Math.round(vdotSec * 0.6 + riegelSec * 0.4);
    const paceSec = ensembleSec / km;

    return {
      targetDistanceKm: km,
      name,
      timeSec: ensembleSec,
      timeFormatted: formatSecondsToTime(ensembleSec),
      paceFormatted: formatPace(paceSec),
      paceSecPerKm: Math.round(paceSec),
      vdotTimeSec: Math.round(vdotSec),
      riegelTimeSec: Math.round(riegelSec),
      confidencePercent: confidence,
      strategyTip: tip,
    };
  };

  const standardPredictions: Record<'1500m' | '5k' | '10k' | '21k' | '42k', VDotPrediction> = {
    '1500m': buildPred(1.5, '1.500 Metros / Milla', 'Prueba de potencia aeróbica pura. Arranca rápido los primeros 300m y sostén el ritmo sin mirar el reloj.'),
    '5k': buildPred(5.0, '5 Kilómetros', 'Ritmo de umbral exigente. No salgas por encima de ritmo en el km 1 para retrasar la acumulación de lactato.'),
    '10k': buildPred(10.0, '10 Kilómetros', 'Divide la prueba: 6 km de control de crucero y 4 km aumentando progresivamente la cadencia.'),
    '21k': buildPred(21.0975, 'Media Maratón', 'Estrategia clave de geles: toma 30-40g de hidratos en los km 7 y 14 con agua para conservar glucógeno.'),
    '42k': buildPred(42.195, 'Maratón Completa', 'Disciplina absoluta de ritmo: mantente 3 a 5 segundos por encima del ritmo objetivo los primeros 10 km.'),
  };

  let customPrediction: VDotPrediction | undefined;
  if (customDistanceKm && customDistanceKm > 0) {
    customPrediction = buildPred(
      customDistanceKm, 
      `${customDistanceKm} km`, 
      'Mantén un ritmo regular desde el inicio basado en tu potencia aeróbica calibrada.'
    );
  }

  return {
    vdot: calibratedVdot,
    weeklyRunningKm,
    standardPredictions,
    customPrediction,
  };
}

// ============================================================================
// 2. ALGORITMOS DE POTENCIA CICLISTA Y FTP (COGGAN, MONOD & SCHERRER, MARTIN)
// ============================================================================

/**
 * Calcula Potencia Crítica (CP) y Capacidad Anaeróbica de Trabajo (W')
 * según el modelo hiperbólico de 2 parámetros de Monod & Scherrer (1965).
 */
export function calculateCriticalPower(
  p1Watts: number, 
  t1Sec: number, 
  p2Watts: number, 
  t2Sec: number
): { cp: number; wPrimeKj: number } {
  if (t2Sec <= t1Sec || p1Watts <= p2Watts) {
    return { cp: Math.round(p2Watts * 0.95), wPrimeKj: 15 };
  }

  // Trabajo total en Joules = Potencia * Tiempo
  const w1 = p1Watts * t1Sec;
  const w2 = p2Watts * t2Sec;

  // CP es la pendiente de la recta Trabajo vs Tiempo
  const cp = (w2 - w1) / (t2Sec - t1Sec);
  // W' es la ordenada en el origen
  const wPrimeJoules = w1 - cp * t1Sec;

  return {
    cp: Math.round(cp),
    wPrimeKj: Number((Math.max(5000, wPrimeJoules) / 1000).toFixed(1)),
  };
}

/**
 * Calcula las 7 Zonas de Potencia de Coggan + Sweet Spot
 */
export function calculateCogganZones(ftpWatts: number, userWeightKg: number = 70): PowerZone[] {
  const wkg = (watts: number) => Number((watts / userWeightKg).toFixed(2));

  return [
    {
      zoneIndex: 1,
      code: 'Z1',
      name: 'Recuperación Activa',
      minWatts: 0,
      maxWatts: Math.round(ftpWatts * 0.55),
      minWkg: 0,
      maxWkg: wkg(Math.round(ftpWatts * 0.55)),
      color: '#38BDF8', // Cyan claro
      description: 'Favorece el aclaramiento de lactato y regeneración tras días duros sin fatigar el sistema nervioso.',
    },
    {
      zoneIndex: 2,
      code: 'Z2',
      name: 'Resistencia Aeróbica (Base)',
      minWatts: Math.round(ftpWatts * 0.56),
      maxWatts: Math.round(ftpWatts * 0.75),
      minWkg: wkg(Math.round(ftpWatts * 0.56)),
      maxWkg: wkg(Math.round(ftpWatts * 0.75)),
      color: '#10B981', // Verde esmeralda
      description: 'Construye mitocondrias y optimiza la oxidación de ácidos grasos. Sostenible durante 3 a 6 horas.',
    },
    {
      zoneIndex: 3,
      code: 'Z3',
      name: 'Tempo Aeróbico',
      minWatts: Math.round(ftpWatts * 0.76),
      maxWatts: Math.round(ftpWatts * 0.90),
      minWkg: wkg(Math.round(ftpWatts * 0.76)),
      maxWkg: wkg(Math.round(ftpWatts * 0.90)),
      color: '#F59E0B', // Ámbar
      description: 'Ritmo rápido de grupeta. Exige concentración y consumo regular de glucógeno.',
    },
    {
      zoneIndex: 4,
      code: 'SS',
      name: 'Sweet Spot (Punto Dulce)',
      minWatts: Math.round(ftpWatts * 0.84),
      maxWatts: Math.round(ftpWatts * 0.97),
      minWkg: wkg(Math.round(ftpWatts * 0.84)),
      maxWkg: wkg(Math.round(ftpWatts * 0.97)),
      color: '#FB923C', // Naranja suave
      description: 'El máximo retorno fisiológico por minuto invertido para elevar tu umbral sin agotarte.',
    },
    {
      zoneIndex: 5,
      code: 'Z4',
      name: 'Umbral Lactato (FTP)',
      minWatts: Math.round(ftpWatts * 0.91),
      maxWatts: Math.round(ftpWatts * 1.05),
      minWkg: wkg(Math.round(ftpWatts * 0.91)),
      maxWkg: wkg(Math.round(ftpWatts * 1.05)),
      color: '#F97316', // Naranja intenso
      description: 'Tu potencia umbral funcional máxima sostenible ~45-60 min. Eleva la tolerancia al lactato.',
    },
    {
      zoneIndex: 6,
      code: 'Z5',
      name: 'Potencia VO2 Máx',
      minWatts: Math.round(ftpWatts * 1.06),
      maxWatts: Math.round(ftpWatts * 1.20),
      minWkg: wkg(Math.round(ftpWatts * 1.06)),
      maxWkg: wkg(Math.round(ftpWatts * 1.20)),
      color: '#EF4444', // Rojo
      description: 'Intervalos de 3 a 5 minutos al 100% del consumo de oxígeno. Agotamiento respiratorio.',
    },
    {
      zoneIndex: 7,
      code: 'Z6',
      name: 'Capacidad Anaeróbica',
      minWatts: Math.round(ftpWatts * 1.21),
      maxWatts: Math.round(ftpWatts * 1.50),
      minWkg: wkg(Math.round(ftpWatts * 1.21)),
      maxWkg: wkg(Math.round(ftpWatts * 1.50)),
      color: '#A855F7', // Púrpura
      description: 'Esfuerzos de 30 segundos a 2 minutos. Metabolismo glucolítico sin aporte de oxígeno.',
    },
    {
      zoneIndex: 8,
      code: 'Z7',
      name: 'Potencia Neuromuscular',
      minWatts: Math.round(ftpWatts * 1.51),
      maxWatts: Math.round(ftpWatts * 3.00),
      minWkg: wkg(Math.round(ftpWatts * 1.51)),
      maxWkg: wkg(Math.round(ftpWatts * 3.00)),
      color: '#EC4899', // Rosa
      description: 'Sprints máximos de 5 a 15 segundos. Reclutamiento de fibras musculares rápidas tipo IIb.',
    },
  ];
}

/**
 * Estima o calcula con precisión el FTP del atleta a partir de telemetría real
 * utilizando el modelo físico de potencia aerodinámica/gravedad (Martin et al.)
 * y el modelo de Coggan de 20 minutos.
 */
export function estimateAthleteFtp(
  activities: ActivitySession[],
  userWeightKg: number = 72,
  storedManualFtp?: number | null
): FtpEstimationResult {
  // 1. Si el atleta tiene un FTP manual guardado (e.g. de un test de rodillo o potenciómetro)
  if (storedManualFtp && storedManualFtp >= 100 && storedManualFtp <= 550) {
    const wkg = Number((storedManualFtp / userWeightKg).toFixed(2));
    const cp = calculateCriticalPower(storedManualFtp * 1.2, 180, storedManualFtp / 0.95, 1200);
    return {
      ftpWatts: storedManualFtp,
      ftpWkg: wkg,
      criticalPowerWatts: cp.cp,
      wPrimeKj: cp.wPrimeKj,
      sourceMethod: 'manual',
      methodLabel: 'Test Oficial / Configuración Manual',
      confidencePercent: 98,
      best20MinWatts: Math.round(storedManualFtp / 0.95),
      best5MinWatts: Math.round(storedManualFtp * 1.2),
      best1MinWatts: Math.round(storedManualFtp * 1.65),
      zones: calculateCogganZones(storedManualFtp, userWeightKg),
    };
  }

  // 2. Extraer actividades reales de ciclismo
  const cyclingActivities = activities.filter(a => a.sport === 'cycling' || a.sport === 'mtb');

  // Si no hay actividades de ciclismo, usar una línea base fisiológica saludable
  if (cyclingActivities.length === 0) {
    const defaultFtp = Math.round(userWeightKg * 2.8); // 2.8 W/kg nivel amateur activo
    return {
      ftpWatts: defaultFtp,
      ftpWkg: 2.8,
      criticalPowerWatts: defaultFtp,
      wPrimeKj: 16,
      sourceMethod: 'telemetry_physics',
      methodLabel: 'Estimación Base Fisiológica',
      confidencePercent: 70,
      zones: calculateCogganZones(defaultFtp, userWeightKg),
    };
  }

  // 3. Estimar potencia mecánica mediante el modelo físico de Martin et al. (1998)
  // P = P_aero + P_rolling + P_gravity
  let maxEstimated20mWatts = 0;

  for (const act of cyclingActivities) {
    if (!act.distanceKm || !act.durationMin || act.durationMin < 15) continue;
    
    const speedMs = (act.distanceKm * 1000) / (act.durationMin * 60); // m/s
    const totalMassKg = userWeightKg + 9.0; // Ciclista + bicicleta equipada
    const elevationM = act.elevationGainM || 0;
    
    // Potencia contra gravedad en subida
    const pGravity = (totalMassKg * 9.81 * elevationM) / (act.durationMin * 60);
    // Potencia contra resistencia aerodinámica (CdA = 0.32 en bici de carretera)
    const pAero = 0.5 * 1.225 * 0.32 * Math.pow(speedMs, 3);
    // Potencia contra resistencia a la rodadura (Crr = 0.004)
    const pRolling = totalMassKg * 9.81 * 0.004 * speedMs;
    // Potencia mecánica media estimada
    const estimatedAvgWatts = pGravity + pAero + pRolling;

    // Normalización de potencia para tramos de 20 min en salidas largas
    const estimated20Min = Math.round(estimatedAvgWatts * 1.08);
    if (estimated20Min > maxEstimated20mWatts && estimated20Min < 480) {
      maxEstimated20mWatts = estimated20Min;
    }
  }

  // Coggan: FTP = 95% de la mejor potencia media en 20 minutos
  const detected20Min = maxEstimated20mWatts > 120 ? maxEstimated20mWatts : Math.round(userWeightKg * 3.1);
  const calculatedFtp = Math.round(detected20Min * 0.95);
  const ftpWkg = Number((calculatedFtp / userWeightKg).toFixed(2));

  // Modelo de Potencia Crítica (CP) y W'
  const cp5min = Math.round(calculatedFtp * 1.22);
  const cpModel = calculateCriticalPower(cp5min, 300, detected20Min, 1200);

  return {
    ftpWatts: calculatedFtp,
    ftpWkg,
    criticalPowerWatts: cpModel.cp,
    wPrimeKj: cpModel.wPrimeKj,
    sourceMethod: 'critical_power',
    methodLabel: 'Modelo Físico & Potencia Crítica (Martin/Coggan)',
    confidencePercent: 88,
    best20MinWatts: detected20Min,
    best5MinWatts: cp5min,
    best1MinWatts: Math.round(calculatedFtp * 1.62),
    zones: calculateCogganZones(calculatedFtp, userWeightKg),
  };
}
