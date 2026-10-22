import { DailyWorkoutPlan, WorkoutStep } from '@/types';

export interface WorkoutExportResult {
  success: boolean;
  filename: string;
  format: 'fit_workout' | 'zwo_workout' | 'json_garmin';
  downloadUrl?: string;
  message: string;
}

/**
 * Genera el archivo de entrenamiento estructurado en formato ZWO / FIT Workout
 * compatible con relojes Garmin Connect, COROS Training Hub, Wahoo y Zwift
 */
export function generateStructuredWorkoutContent(plan: DailyWorkoutPlan, userMaxHr: number = 185): {
  zwoXml: string;
  garminJson: any;
  filename: string;
} {
  const safeTitle = plan.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `workout_${safeTitle.toLowerCase()}`;

  // Formato estándar ZWO (Zwift/Garmin/COROS Workout XML)
  let zwoSteps = '';
  plan.steps.forEach((step, idx) => {
    const durationSec = step.durationMin * 60;
    let powerFraction = 0.65;
    if (step.intensity.includes('Z1')) powerFraction = 0.55;
    else if (step.intensity.includes('Z2')) powerFraction = 0.70;
    else if (step.intensity.includes('Z3')) powerFraction = 0.85;
    else if (step.intensity.includes('Z4')) powerFraction = 0.95;
    else if (step.intensity.includes('Z5')) powerFraction = 1.05;

    if (idx === 0 && step.intensity.includes('Z1')) {
      zwoSteps += `    <Warmup Duration="${durationSec}" PowerLow="0.50" PowerHigh="0.65">\n      <textevent message="${step.instruction.replace(/"/g, "'")}" />\n    </Warmup>\n`;
    } else if (idx === plan.steps.length - 1 && (step.intensity.includes('Z1') || step.intensity.includes('Recuperación'))) {
      zwoSteps += `    <Cooldown Duration="${durationSec}" PowerLow="0.65" PowerHigh="0.50">\n      <textevent message="${step.instruction.replace(/"/g, "'")}" />\n    </Cooldown>\n`;
    } else {
      zwoSteps += `    <SteadyState Duration="${durationSec}" Power="${powerFraction}">\n      <textevent message="${step.name}: ${step.instruction.replace(/"/g, "'")}" />\n    </SteadyState>\n`;
    }
  });

  const zwoXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Pulse Coach AI</author>
  <name>${plan.title}</name>
  <description>${plan.rationale}</description>
  <sportType>${plan.sport === 'running' || plan.sport === 'trail' ? 'run' : 'bike'}</sportType>
  <workout>
${zwoSteps}  </workout>
</workout_file>`;

  // Formato Garmin Workout JSON para API / Mobile
  const garminJson = {
    workoutName: plan.title,
    description: plan.rationale,
    sportType: plan.sport === 'running' || plan.sport === 'trail' ? 'RUNNING' : 'CYCLING',
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: plan.sport === 'running' || plan.sport === 'trail' ? 'RUNNING' : 'CYCLING',
        workoutSteps: plan.steps.map((s, i) => ({
          type: 'ExecutableStepDTO',
          stepId: i + 1,
          stepOrder: i + 1,
          stepType: i === 0 ? 'WARMUP' : i === plan.steps.length - 1 ? 'COOLDOWN' : 'INTERVAL',
          endCondition: 'TIME',
          endConditionValue: s.durationMin * 60,
          description: s.instruction,
          targetType: 'HEART_RATE_ZONE',
          targetValueLow: s.intensity.includes('Z4') ? 160 : s.intensity.includes('Z2') ? 130 : 115,
          targetValueHigh: s.intensity.includes('Z4') ? 175 : s.intensity.includes('Z2') ? 145 : 130,
        })),
      },
    ],
  };

  return {
    zwoXml,
    garminJson,
    filename,
  };
}

/**
 * Descarga el archivo de entrenamiento estructurado listo para importar a Garmin / COROS
 */
export function downloadStructuredWorkout(plan: DailyWorkoutPlan): void {
  const { zwoXml, filename } = generateStructuredWorkoutContent(plan);
  const blob = new Blob([zwoXml], { type: 'application/octet-stream;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.zwo`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
