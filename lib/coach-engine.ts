import { BiometricMetrics, DailyWorkoutPlan, SportType } from '@/types';

export function calculateReadinessVerdict(metrics: BiometricMetrics): {
  level: 'alta' | 'moderada' | 'baja';
  headline: string;
  advice: string;
} {
  const { trainingReadiness, bodyBattery, hrvStatus, acwr } = metrics;

  if (trainingReadiness >= 75 && bodyBattery >= 70 && hrvStatus === 'balanced' && acwr <= 1.25) {
    return {
      level: 'alta',
      headline: 'Capacidad de Rendimiento Óptima',
      advice: 'Tu sistema nervioso autónomo está recuperado y el ratio de fatiga es ideal. Tu cuerpo asimilará estímulos de intensidad o volumen.',
    };
  }

  if (trainingReadiness >= 50 && bodyBattery >= 45 && acwr <= 1.35) {
    return {
      level: 'moderada',
      headline: 'Capacidad Moderada — Enfoque Aeróbico',
      advice: 'Recuperación suficiente para rodajes aeróbicos en Zona 2 o fuerza técnica, pero evita series de máxima exigencia anaeróbica.',
    };
  }

  return {
    level: 'baja',
    headline: 'Fatiga Acumulada — Priorizar Asimilación',
    advice: 'VFC o Body Battery en niveles bajos. Se recomienda sesión regenerativa suave, estiramientos o micro-sesión de movilidad.',
  };
}

export function generateDailyPlans(
  metrics: BiometricMetrics,
  availableTimeMin: number,
  selectedSport: SportType | 'all'
): DailyWorkoutPlan[] {
  const verdict = calculateReadinessVerdict(metrics);
  const plans: DailyWorkoutPlan[] = [];

  // 1. PRIMARY WORKOUT
  if (verdict.level === 'alta') {
    if (selectedSport === 'running' || selectedSport === 'all') {
      if (availableTimeMin >= 60) {
        plans.push({
          id: 'plan-run-threshold',
          sport: 'running',
          title: 'Tempo Progresivo + Bloques en Umbral',
          category: 'primary',
          intensityLevel: 'Alta',
          estimatedDurationMin: availableTimeMin,
          suggestedRouteDistanceKm: Math.round((availableTimeMin / 5.2) * 10) / 10,
          targetZoneDescription: 'Zonas 2 a 4 (145 - 172 ppm)',
          rationale: `Tu Readiness (${metrics.trainingReadiness}%) y VFC equilibrada permiten asimilar trabajo de umbral anaeróbico sin riesgo.`,
          steps: [
            { name: 'Calentamiento Progresivo', durationMin: 15, intensity: 'Z1 Calentamiento', instruction: 'Trote suave y 3 progresiones dinámicas.' },
            { name: 'Bloque Umbral (Tempo)', durationMin: Math.min(30, availableTimeMin - 25), intensity: 'Z4 Umbral', instruction: 'Ritmo exigente pero controlado (aprox. ritmo de 10K).' },
            { name: 'Vuelta a la calma', durationMin: 10, intensity: 'Z1 Calentamiento', instruction: 'Trote regenerativo y respiraciones profundas.' },
          ],
        });
      } else if (availableTimeMin >= 30) {
        plans.push({
          id: 'plan-run-fartlek',
          sport: 'running',
          title: 'Fartlek Dinámico Piramidal',
          category: 'primary',
          intensityLevel: 'Alta',
          estimatedDurationMin: availableTimeMin,
          suggestedRouteDistanceKm: Math.round((availableTimeMin / 5.0) * 10) / 10,
          targetZoneDescription: 'Zona 2 alternada con Zona 4/5',
          rationale: 'Aprovecha tus 30-45 min con cambios de ritmo cortos que activan tu capacidad aeróbica máxima.',
          steps: [
            { name: 'Activación', durationMin: 10, intensity: 'Z2 Aeróbico Base', instruction: 'Rodaje cómodo y movilidad de tobillos.' },
            { name: 'Intervalos 1-2-3-2-1 min', durationMin: availableTimeMin - 18, intensity: 'Z4 Umbral', instruction: 'Cambios de ritmo vivos con recuperación al trote suave.' },
            { name: 'Enfriamiento', durationMin: 8, intensity: 'Z1 Calentamiento', instruction: 'Vuelta a la calma para bajar pulsaciones.' },
          ],
        });
      }
    } else if (selectedSport === 'mtb') {
      plans.push({
        id: 'plan-mtb-power',
        sport: 'mtb',
        title: 'BTT Subidas de Fuerza & Pistas Rápidas',
        category: 'primary',
        intensityLevel: 'Alta',
        estimatedDurationMin: availableTimeMin,
        suggestedRouteDistanceKm: Math.round((availableTimeMin / 3.2) * 10) / 10,
        targetZoneDescription: 'Zona 3 y 4 en repechos de monte',
        rationale: 'Tu recuperación te permite afrontar desniveles y aceleraciones en tierra sin sobrecargar articulaciones.',
        steps: [
          { name: 'Aproximación por pista suave', durationMin: 12, intensity: 'Z1 Calentamiento', instruction: 'Cadencia ágil sobre tierra compacta.' },
          { name: 'Bloques de potencia en subida', durationMin: availableTimeMin - 22, intensity: 'Z4 Umbral', instruction: 'Repechos a ritmo vivo manteniendo tracción en la rueda trasera.' },
          { name: 'Vuelta suave por pista llana', durationMin: 10, intensity: 'Z1 Calentamiento', instruction: 'Pedaleo relajado para soltar piernas.' },
        ],
      });
    } else if (selectedSport === 'cycling') {
      plans.push({
        id: 'plan-cycle-vo2',
        sport: 'cycling',
        title: 'Series Sub-Umbral & Cadencia Alta',
        category: 'primary',
        intensityLevel: 'Alta',
        estimatedDurationMin: availableTimeMin,
        suggestedRouteDistanceKm: Math.round((availableTimeMin / 2.2) * 10) / 10,
        targetZoneDescription: 'Zona 3/4 (85-95% FTP)',
        rationale: 'Excelente día para transferir potencia sobre los pedales sin comprometer el impacto articular.',
        steps: [
          { name: 'Rodaje suave', durationMin: 12, intensity: 'Z1 Calentamiento', instruction: 'Cadencia 90 rpm sin resistencia.' },
          { name: 'Intervalos de fuerza-resistencia', durationMin: availableTimeMin - 22, intensity: 'Z4 Umbral', instruction: 'Bloques de 4 min sostenidos con 2 min de recuperación.' },
          { name: 'Giro suave regenerativo', durationMin: 10, intensity: 'Z1 Calentamiento', instruction: 'Descenso paulatino de frecuencia cardíaca.' },
        ],
      });
    } else if (selectedSport === 'trail') {
      plans.push({
        id: 'plan-trail-hills',
        sport: 'trail',
        title: 'Técnica de Subida & Ritmo en Desnivel',
        category: 'primary',
        intensityLevel: 'Alta',
        estimatedDurationMin: availableTimeMin,
        suggestedRouteDistanceKm: Math.round((availableTimeMin / 7.0) * 10) / 10,
        targetZoneDescription: 'Zona 3 y 4 en ascensos',
        rationale: 'Tu cuerpo tolerará bien el esfuerzo neuromuscular de las cuestas.',
        steps: [
          { name: 'Trote suave y calentamiento', durationMin: 12, intensity: 'Z2 Aeróbico Base', instruction: 'Aproximación por senda llana.' },
          { name: 'Repeticiones en cuesta suave', durationMin: availableTimeMin - 22, intensity: 'Z4 Umbral', instruction: 'Foco en impulsión y apoyo de mediopié.' },
          { name: 'Descenso controlado', durationMin: 10, intensity: 'Z1 Calentamiento', instruction: 'Bajar pulsaciones con técnica fluida.' },
        ],
      });
    } else {
      plans.push({
        id: 'plan-strength-hiit',
        sport: 'strength_mobility',
        title: 'Fuerza Explosiva & Potencia de Tren Inferior',
        category: 'primary',
        intensityLevel: 'Alta',
        estimatedDurationMin: availableTimeMin,
        targetZoneDescription: 'Frecuencia cardíaca mixta + Fuerza',
        rationale: 'Tu sistema neuromuscular está al 100% para trabajar carga y potencia.',
        steps: [
          { name: 'Movilidad articular y activación glúteos', durationMin: 8, intensity: 'Fuerza/Técnica', instruction: 'Bandas elásticas y rotaciones de cadera.' },
          { name: 'Circuito Sentadillas búlgaras + Peso muerto + Saltos', durationMin: availableTimeMin - 14, intensity: 'Fuerza/Técnica', instruction: '4 series de 8-10 reps por pierna con buena técnica.' },
          { name: 'Descompresión lumbar', durationMin: 6, intensity: 'Z1 Calentamiento', instruction: 'Estiramientos suaves de psoas y cadena posterior.' },
        ],
      });
    }
  }

  // Si no se añadió plan primario (o readiness moderada/baja)
  if (plans.length === 0) {
    if (verdict.level === 'moderada') {
      plans.push({
        id: 'plan-aerobic-z2',
        sport: selectedSport === 'cycling' ? 'cycling' : selectedSport === 'trail' ? 'trail' : 'running',
        title: 'Fondo Continuo en Zona 2 (Construcción Base)',
        category: 'primary',
        intensityLevel: 'Moderada',
        estimatedDurationMin: availableTimeMin,
        suggestedRouteDistanceKm: Math.round((availableTimeMin / 5.5) * 10) / 10,
        targetZoneDescription: 'Zona 2 estricta (130 - 144 ppm)',
        rationale: `Tu Body Battery (${metrics.bodyBattery}%) es suficiente para sumar volumen aeróbico sin generar estrés celular excesivo.`,
        steps: [
          { name: 'Inicio progresivo', durationMin: 8, intensity: 'Z1 Calentamiento', instruction: 'Ritmo conversacional muy suave.' },
          { name: 'Crucero aeróbico constante', durationMin: availableTimeMin - 16, intensity: 'Z2 Aeróbico Base', instruction: 'Mantén respiración nasal si es posible, sin sobrepasar la Z2.' },
          { name: 'Cierre suave', durationMin: 8, intensity: 'Z1 Calentamiento', instruction: 'Caminar o trote ligero final.' },
        ],
      });
    } else {
      // verdict === 'baja'
      plans.push({
        id: 'plan-active-recovery',
        sport: 'strength_mobility',
        title: 'Recuperación Activa & Descompresión Miofascial',
        category: 'primary',
        intensityLevel: 'Recuperación Activa',
        estimatedDurationMin: Math.min(30, availableTimeMin),
        targetZoneDescription: 'Zona 1 (Por debajo de 120 ppm)',
        rationale: `Tu ACWR o HRV indican fatiga acumulada. Esta sesión acelera el aclaramiento de lactato y activa el sistema parasimpático.`,
        steps: [
          { name: 'Liberación con foam roller o pelota', durationMin: 10, intensity: 'Fuerza/Técnica', instruction: 'Gemelos, cuádriceps, glúteos e isquios.' },
          { name: 'Movilidad de cadera y columna torácica', durationMin: 12, intensity: 'Fuerza/Técnica', instruction: 'Cat-cow, posición del caballero y rotaciones.' },
          { name: 'Respiración diafragmática 4-7-8', durationMin: 5, intensity: 'Z1 Calentamiento', instruction: 'Tumbado boca arriba para reducir cortisol.' },
        ],
      });
    }
  }

  // 2. ALTERNATIVE WORKOUT (Different sport or stimulus)
  if (selectedSport !== 'strength_mobility') {
    plans.push({
      id: 'plan-alt-strength',
      sport: 'strength_mobility',
      title: 'Fuerza de Mantenimiento & Prevención Lesiones',
      category: 'alternative',
      intensityLevel: 'Moderada',
      estimatedDurationMin: Math.min(35, availableTimeMin),
      targetZoneDescription: 'Fuerza Funcional y Core',
      rationale: 'Alternativa ideal si prefieres entrenar en casa sin impacto sobre articulaciones.',
      steps: [
        { name: 'Activación de core (Planchas & Bird-Dog)', durationMin: 8, intensity: 'Fuerza/Técnica', instruction: '3 rondas de 30s de estabilidad abdominal.' },
        { name: 'Fuerza compensatoria (Puentes glúteo + Zancadas)', durationMin: 18, intensity: 'Fuerza/Técnica', instruction: 'Movimiento controlado enfocando la pisada y alineación.' },
        { name: 'Movilidad de tobillo y cadera', durationMin: 6, intensity: 'Fuerza/Técnica', instruction: 'Rango de movimiento articular.' },
      ],
    });
  } else {
    plans.push({
      id: 'plan-alt-cardio',
      sport: 'running',
      title: 'Paseo Rápido / Trote Suave Regenerativo',
      category: 'alternative',
      intensityLevel: 'Baja',
      estimatedDurationMin: availableTimeMin,
      suggestedRouteDistanceKm: Math.round((availableTimeMin / 8.0) * 10) / 10,
      targetZoneDescription: 'Zona 1 / Zona 2 baja',
      rationale: 'Cambia de estímulo con aire fresco para oxigenar las piernas sin agotarte.',
      steps: [
        { name: 'Paseo activo vigoroso', durationMin: availableTimeMin / 2, intensity: 'Z1 Calentamiento', instruction: 'Paso firme al aire libre.' },
        { name: 'Trote suave o marcha constante', durationMin: availableTimeMin / 2, intensity: 'Z2 Aeróbico Base', instruction: 'Disfruta del entorno.' },
      ],
    });
  }

  // 3. NON-ZERO RESCUE OPTION (10 - 15 min Express)
  // Always present so the user NEVER breaks their streak!
  plans.push({
    id: 'plan-rescue-nonzero',
    sport: 'strength_mobility',
    title: 'Micro-Dosis Non-Zero: 12 min de Movilidad & Core',
    category: 'non_zero_rescue',
    intensityLevel: 'Baja',
    estimatedDurationMin: 12,
    targetZoneDescription: 'Salud y Continuidad (Cero Fatiga)',
    rationale: '«Un 1% hoy es infinitamente mejor que un 0%». Aunque tengas poco tiempo o pocas ganas, esta sesión mantiene tu racha y tu metabolismo activo.',
    steps: [
      { name: 'Respiración & Apertura Torácica', durationMin: 3, intensity: 'Fuerza/Técnica', instruction: 'Liberar tensión de hombros y cuello.' },
      { name: 'Circuito 1: Plancha frontal + Puentes de glúteo', durationMin: 5, intensity: 'Fuerza/Técnica', instruction: '2 vueltas de 45 segundos cada ejercicio.' },
      { name: 'Estiramiento profundo de caderas & psoas', durationMin: 4, intensity: 'Z1 Calentamiento', instruction: 'Relajar la zona lumbar tras el día sentado.' },
    ],
  });

  return plans;
}
