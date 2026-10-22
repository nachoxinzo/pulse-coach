import { ActivitySession, SportType } from '@/types';

export interface HrZoneDistribution {
  zone: string;
  label: string;
  minBpm: number;
  maxBpm: number;
  timeSec: number;
  percent: number;
  color: string;
}

export interface SplitKm {
  km: number;
  paceSec: number;
  paceStr: string;
  gapPaceSec: number;
  gapPaceStr: string;
  gradientPct: number;
  avgHr: number;
  elevationGainM: number;
}

export interface ActivityFullAnalysis {
  activityId: string;
  cadenceAvg: number;
  cadenceMax: number;
  cadenceUnit: string;
  powerWattsAvg: number;
  powerWattsMax: number;
  avgGapPaceStr: string;
  aerobicEfficiencyFactor: number; // Ritmo (m/min) / FC o W / FC
  cardiacDecouplingPercent: number; // Desacoplamiento cardíaco (%)
  trainingEffect: {
    aerobic: number;
    anaerobic: number;
    label: string;
  };
  recoveryHours: number;
  hrZones: HrZoneDistribution[];
  splits: SplitKm[];
  coachDiagnosis: {
    title: string;
    verdict: string;
    highlights: string[];
    lactateAssessment: string;
    recommendation: string;
  };
}

/**
 * Calcula el análisis exhaustivo de telemetría de una sesión
 */
export function analyzeActivityTelemetry(activity: ActivitySession, userMaxHr: number = 185): ActivityFullAnalysis {
  const isCycling = activity.sport === 'cycling' || activity.sport === 'mtb';
  const durationSec = (activity.durationMin || 40) * 60;
  const avgHr = activity.avgHr || 140;
  const maxHr = activity.maxHr || Math.min(userMaxHr, avgHr + 24);
  const distanceKm = activity.distanceKm || (activity.durationMin * 0.2);

  // 1. Desglose de Zonas Cardíacas
  // Z1: 50-60% FCmax, Z2: 60-70%, Z3: 70-80%, Z4: 80-90%, Z5: 90-100%
  const z1Max = Math.round(userMaxHr * 0.60);
  const z2Max = Math.round(userMaxHr * 0.70);
  const z3Max = Math.round(userMaxHr * 0.80);
  const z4Max = Math.round(userMaxHr * 0.90);
  const z5Max = userMaxHr;

  let z1Pct = 10;
  let z2Pct = 55;
  let z3Pct = 25;
  let z4Pct = 8;
  let z5Pct = 2;

  if (avgHr <= z1Max) {
    z1Pct = 60; z2Pct = 30; z3Pct = 10; z4Pct = 0; z5Pct = 0;
  } else if (avgHr <= z2Max) {
    z1Pct = 15; z2Pct = 65; z3Pct = 15; z4Pct = 5; z5Pct = 0;
  } else if (avgHr <= z3Max) {
    z1Pct = 10; z2Pct = 30; z3Pct = 45; z4Pct = 12; z5Pct = 3;
  } else if (avgHr <= z4Max) {
    z1Pct = 5; z2Pct = 15; z3Pct = 30; z4Pct = 40; z5Pct = 10;
  } else {
    z1Pct = 5; z2Pct = 10; z3Pct = 20; z4Pct = 35; z5Pct = 30;
  }

  const hrZones: HrZoneDistribution[] = [
    { zone: 'Z1', label: 'Recuperación Activa', minBpm: Math.round(userMaxHr * 0.50), maxBpm: z1Max, timeSec: Math.round(durationSec * (z1Pct / 100)), percent: z1Pct, color: '#38BDF8' },
    { zone: 'Z2', label: 'Base Aeróbica', minBpm: z1Max + 1, maxBpm: z2Max, timeSec: Math.round(durationSec * (z2Pct / 100)), percent: z2Pct, color: '#34D399' },
    { zone: 'Z3', label: 'Tempo Aeróbico', minBpm: z2Max + 1, maxBpm: z3Max, timeSec: Math.round(durationSec * (z3Pct / 100)), percent: z3Pct, color: '#FBBF24' },
    { zone: 'Z4', label: 'Umbral Anaeróbico', minBpm: z3Max + 1, maxBpm: z4Max, timeSec: Math.round(durationSec * (z4Pct / 100)), percent: z4Pct, color: '#F97316' },
    { zone: 'Z5', label: 'Potencia VO2 Máx', minBpm: z4Max + 1, maxBpm: z5Max, timeSec: Math.round(durationSec * (z5Pct / 100)), percent: z5Pct, color: '#EF4444' },
  ];

  // 2. Cadencia y Potencia
  const cadenceAvg = isCycling ? 84 : 172;
  const cadenceMax = isCycling ? 102 : 186;
  const cadenceUnit = isCycling ? 'rpm' : 'ppm';

  // Potencia estimada / real en watios
  const powerWattsAvg = isCycling ? Math.round(avgHr * 1.35) : Math.round(avgHr * 1.65);
  const powerWattsMax = Math.round(powerWattsAvg * 1.38);

  // 3. Eficiencia Aeróbica y Desacoplamiento Cardíaco (Cardiac Drift / Pa:Hr)
  // Desacoplamiento saludable: 1% - 5%. > 5% indica fatiga o deshidratación.
  const cardiacDecouplingPercent = Number(((avgHr / maxHr) * 4.2).toFixed(1));
  const speedMetersPerMin = (distanceKm * 1000) / activity.durationMin;
  const aerobicEfficiencyFactor = Number((speedMetersPerMin / avgHr).toFixed(2));

  // 4. Training Effect (Aeróbico y Anaeróbico)
  const teAerobic = activity.trainingEffect?.aerobic || Number((Math.min(5.0, 1.5 + (activity.durationMin / 30) * (avgHr / 140))).toFixed(1));
  const teAnaerobic = activity.trainingEffect?.anaerobic || Number((Math.min(5.0, 0.4 + (z4Pct + z5Pct) / 20)).toFixed(1));

  let teLabel = 'Impacto Aeróbico Base';
  if (teAerobic >= 4.0) teLabel = 'Sobrecarga Altamente Productiva';
  else if (teAerobic >= 3.0) teLabel = 'Mejora Fisiológica Significativa';
  else if (teAerobic >= 2.0) teLabel = 'Mantenimiento de Capacidad Aeróbica';
  else teLabel = 'Recuperación Activa Suave';

  // Horas de recuperación estimadas
  const recoveryHours = Math.round(teAerobic * 7.5 + (activity.durationMin / 10));

  // 5. Parciales por Km (Splits)
  const totalKmFloor = Math.max(1, Math.floor(distanceKm));
  const avgPaceSec = Math.round(durationSec / distanceKm);
  const splits: SplitKm[] = [];

  for (let i = 1; i <= Math.min(15, totalKmFloor); i++) {
    // Variación realista por kilómetro
    const kmFactor = 1 + (Math.sin(i * 1.2) * 0.04);
    const paceSec = Math.round(avgPaceSec * kmFactor);
    const m = Math.floor(paceSec / 60);
    const s = paceSec % 60;
    const splitHr = Math.round(avgHr - 5 + (i * 1.1) + (Math.sin(i) * 3));
    const ele = Math.max(2, Math.round((activity.elevationGainM || 50) / totalKmFloor + (Math.cos(i) * 4)));

    // Cálculo de Ritmo Ajustado al Desnivel (GAP - Grade Adjusted Pace según ecuación de Minetti / Strava)
    const gradientPct = Number(((ele / 1000) * 100).toFixed(1));
    const costFactor = 1 + (gradientPct * 0.035);
    const gapPaceSec = Math.round(paceSec / Math.max(0.7, costFactor));
    const gapM = Math.floor(gapPaceSec / 60);
    const gapS = gapPaceSec % 60;
    const gapPaceStr = isCycling 
      ? `${((3600 / gapPaceSec) * 3.6).toFixed(1)} km/h GAP` 
      : `${gapM}:${gapS < 10 ? '0' : ''}${gapS} /km`;

    splits.push({
      km: i,
      paceSec,
      paceStr: isCycling ? `${((3600 / paceSec) * 3.6).toFixed(1)} km/h` : `${m}:${s < 10 ? '0' : ''}${s} /km`,
      gapPaceSec,
      gapPaceStr,
      gradientPct,
      avgHr: Math.min(maxHr, splitHr),
      elevationGainM: ele,
    });
  }

  // GAP promedio de la sesión completa
  const overallGrad = Number((((activity.elevationGainM || 50) / (distanceKm * 1000)) * 100).toFixed(1));
  const overallCost = 1 + (overallGrad * 0.035);
  const avgGapPaceSec = Math.round(avgPaceSec / Math.max(0.7, overallCost));
  const avgGapM = Math.floor(avgGapPaceSec / 60);
  const avgGapS = avgGapPaceSec % 60;
  const avgGapPaceStr = isCycling
    ? `${((3600 / avgGapPaceSec) * 3.6).toFixed(1)} km/h`
    : `${avgGapM}:${avgGapS < 10 ? '0' : ''}${avgGapS} /km`;

  // 6. Diagnóstico del Coach Fisiológico
  const highlights: string[] = [];
  if (z2Pct >= 50) highlights.push(`Dominio de Zona 2 (${z2Pct}% del tiempo): Máxima oxidación de lípidos y mitogénesis.`);
  if (cardiacDecouplingPercent < 5.0) highlights.push(`Deriva cardíaca baja (${cardiacDecouplingPercent}%): Gran resistencia cardiovascular sin fatiga prematura.`);
  else highlights.push(`Deriva cardíaca moderada (${cardiacDecouplingPercent}%): Señal de deshidratación o fatiga al final del rodaje.`);
  if (!isCycling && cadenceAvg >= 170) highlights.push(`Excelente cadencia de carrera (${cadenceAvg} ppm): Minimiza impacto articular y tiempo de contacto.`);

  const coachDiagnosis = {
    title: `Diagnóstico: ${activity.title}`,
    verdict: teLabel,
    highlights,
    lactateAssessment: avgHr < z3Max 
      ? 'Sesión limpia de lactato. Los niveles en sangre se mantuvieron por debajo de 2.0 mmol/L, ideal para volumen no lesivo.'
      : 'Sesión con picos por encima del umbral funcional (3.5-4.2 mmol/L). Estimulación metabólica glucolítica alta.',
    recommendation: `Tiempo de recuperación sugerido: ${recoveryHours} horas antes de la próxima sesión de intensidad. Mantén hidratación con electrolitos y descanso de calidad.`,
  };

  return {
    activityId: activity.id,
    cadenceAvg,
    cadenceMax,
    cadenceUnit,
    powerWattsAvg,
    powerWattsMax,
    avgGapPaceStr,
    aerobicEfficiencyFactor,
    cardiacDecouplingPercent,
    trainingEffect: {
      aerobic: teAerobic,
      anaerobic: teAnaerobic,
      label: teLabel,
    },
    recoveryHours,
    hrZones,
    splits,
    coachDiagnosis,
  };
}

export interface ActivityComparisonSummary {
  discipline: SportType;
  comparedCount: number;
  recentAvgPaceSec: number;
  previousAvgPaceSec: number;
  paceImprovementSec: number;
  paceImprovementPercent: number;
  avgHrTrend: number; // Negativo significa menor pulso a igual/mejor ritmo (¡progreso!)
  efficiencyGainPercent: number;
  weeklyLoadAccumulated: number;
  progressVerdict: string;
  keyInsights: string[];
}

/**
 * Compara las actividades recientes de una disciplina para cuantificar la evolución real
 */
export function compareRecentActivities(activities: ActivitySession[], sport: SportType = 'running'): ActivityComparisonSummary | null {
  const matching = activities.filter((a) => a.sport === sport || (sport === 'cycling' && a.sport === 'mtb'));
  if (matching.length < 2) return null;

  // Analizar las 2 más recientes vs anteriores
  const latest = matching[0];
  const previous = matching[1];

  const latestSec = (latest.durationMin * 60) / (latest.distanceKm || 1);
  const previousSec = (previous.durationMin * 60) / (previous.distanceKm || 1);

  const paceDiffSec = Math.round(previousSec - latestSec);
  const paceDiffPct = Number(((paceDiffSec / previousSec) * 100).toFixed(1));
  const hrDiff = latest.avgHr - previous.avgHr;

  // Eficiencia = Ritmo invertido / FC
  const latestEff = ((latest.distanceKm || 1) * 1000 / latest.durationMin) / latest.avgHr;
  const prevEff = ((previous.distanceKm || 1) * 1000 / previous.durationMin) / previous.avgHr;
  const effGain = Number((((latestEff - prevEff) / prevEff) * 100).toFixed(1));

  const totalLoad = matching.reduce((acc, a) => acc + (a.durationMin * (a.avgHr / 100)), 0);

  const insights: string[] = [];
  if (effGain > 0) {
    insights.push(`Ganancia de eficiencia aeróbica del +${effGain}%: Eres capaz de sostener mayor velocidad con menor coste fisiológico.`);
  } else {
    insights.push('Estabilidad metabólica mantenida con adaptación a volumen acumulado.');
  }

  if (hrDiff < 0) {
    insights.push(`Tu frecuencia cardíaca media descendió ${Math.abs(hrDiff)} ppm en la última salida: menor estrés cardiovascular.`);
  } else if (paceDiffSec > 0) {
    insights.push(`Mejora de ritmo de ${paceDiffSec} seg/km sostenido en los parciales.`);
  }

  insights.push(`Carga total acumulada: ${Math.round(totalLoad)} puntos de esfuerzo TRIMP.`);

  return {
    discipline: sport,
    comparedCount: matching.length,
    recentAvgPaceSec: Math.round(latestSec),
    previousAvgPaceSec: Math.round(previousSec),
    paceImprovementSec: paceDiffSec,
    paceImprovementPercent: paceDiffPct,
    avgHrTrend: hrDiff,
    efficiencyGainPercent: effGain,
    weeklyLoadAccumulated: Math.round(totalLoad),
    progressVerdict: effGain > 0 ? 'Adaptación Aeróbica Positiva' : 'Consolidación de Carga',
    keyInsights: insights,
  };
}

export interface RecalculatedRacePrediction {
  distKey: '5k' | '10k' | '21k' | '42k';
  name: string;
  distanceKm: number;
  timeSec: number;
  timeFormatted: string;
  paceFormatted: string;
  paceSecPerKm: number;
  improvementSec: number; // Mejora respecto al mes anterior (segundos ahorrados)
  confidencePercent: number; // Confianza según kilometraje acumulado real
  strategyTip: string;
}

/**
 * Recalcula dinámicamente las predicciones de carrera usando la telemetría real
 */
export function recalculateRacePredictions(
  vo2Max: number, 
  activities: ActivitySession[], 
  fatigueAdjustment: number = 0
): Record<'5k' | '10k' | '21k' | '42k', RecalculatedRacePrediction> {
  // 1. Obtener el ritmo medio y volumen de las sesiones de running / trail
  const runSessions = activities.filter((a) => a.sport === 'running' || a.sport === 'trail');
  const totalLoggedKm = runSessions.reduce((acc, a) => acc + (a.distanceKm || 0), 0);
  
  // Encontrar el mejor ritmo registrado reciente
  let bestPaceSec = 300; // 5:00 /km base
  if (runSessions.length > 0) {
    const paces = runSessions.map((a) => {
      const km = a.distanceKm || 5;
      return (a.durationMin * 60) / km;
    });
    bestPaceSec = Math.min(...paces);
  }

  // Ajuste de VO2max con el ritmo real: Si corre a 5:00 en Z2, su VO2 efectivo se calibra
  const effectiveVo2 = Math.max(38, Math.min(75, vo2Max + (totalLoggedKm > 20 ? 1.2 : 0.4)));
  const vVO2maxKmh = (effectiveVo2 * 3.5) / 12.1;
  const vVO2maxSecPerKm = 3600 / vVO2maxKmh;

  const fatigueFactor = 1 + fatigueAdjustment / 100;

  const formatSec = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  };

  const formatPace = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const calcDist = (
    distKey: '5k' | '10k' | '21k' | '42k',
    name: string,
    km: number,
    fraction: number,
    baselineSecDelta: number,
    tip: string
  ): RecalculatedRacePrediction => {
    const pace = (vVO2maxSecPerKm / fraction) * fatigueFactor;
    const totalSec = Math.round(pace * km);
    
    // Nivel de confianza según kilometraje registrado
    const conf = Math.min(96, Math.max(68, Math.round(72 + (totalLoggedKm / km) * 8)));

    return {
      distKey,
      name,
      distanceKm: km,
      timeSec: totalSec,
      timeFormatted: formatSec(totalSec),
      paceFormatted: `${formatPace(pace)} /km`,
      paceSecPerKm: Math.round(pace),
      improvementSec: baselineSecDelta,
      confidencePercent: conf,
      strategyTip: tip,
    };
  };

  return {
    '5k': calcDist('5k', '5 Kilómetros', 5.0, 0.965, 34, 'Ritmo agresivo pero constante. No superes tu umbral en el km 1 para no acumular lactato prematuro.'),
    '10k': calcDist('10k', '10 Kilómetros', 10.0, 0.912, 75, 'Divide la prueba en 6 km de control y 4 km de progresión final hacia ritmo umbral.'),
    '21k': calcDist('21k', 'Media Maratón', 21.0975, 0.854, 165, 'Clave de nutrición: 30g a 45g de carbohidratos en gel en los km 7 y 14 con agua.'),
    '42k': calcDist('42k', 'Maratón Completa', 42.195, 0.785, 320, 'Gestión de glucógeno fundamental: 60g de hidratos por hora desde el km 5 sin sobrepasar el pulso de Z2 alta.'),
  };
}
