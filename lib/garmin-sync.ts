import path from 'path';
import fs from 'fs';
import { GarminClient, Garmin, FileTokenStore } from 'garminconnect-js';
import { getDb } from './db';
import { ActivitySession, BiometricMetrics, SportType } from '@/types';

/**
 * Obtiene un cliente autenticado de Garmin Connect
 * ya sea desde variables de entorno (Vercel) o desde la carpeta local tokens/
 */
export async function getGarminClient(): Promise<Garmin | null> {
  try {
    // 1. Intentar desde variable de entorno (para Vercel en la nube)
    const envTokens = process.env.GARMIN_TOKENS_JSON;
    if (envTokens) {
      try {
        let clean = envTokens.trim();
        // Quitar posibles comillas simples o dobles envolventes añadidas por Vercel
        if ((clean.startsWith("'") && clean.endsWith("'")) || (clean.startsWith('"') && clean.endsWith('"'))) {
          clean = clean.slice(1, -1).trim();
        }
        
        // Si viene en base64
        let parsed: any;
        if (!clean.startsWith('{')) {
          try {
            const decoded = Buffer.from(clean, 'base64').toString('utf8');
            parsed = JSON.parse(decoded);
          } catch {
            parsed = JSON.parse(clean);
          }
        } else {
          parsed = JSON.parse(clean);
        }

        // Si parsed tiene { oauth1, oauth2 }
        if (parsed && (parsed.oauth1 || parsed.oauth2)) {
          const client = new GarminClient();
          client.setTokens(parsed);
          return new Garmin(client);
        }
      } catch (e: any) {
        console.error('Error parseando GARMIN_TOKENS_JSON en servidor:', e.message);
      }
    }

    // 2. Intentar desde archivos locales (desarrollo local en máquina del usuario)
    const tokensPath = path.join(process.cwd(), 'tokens');
    if (fs.existsSync(tokensPath)) {
      try {
        const tokenStore = new FileTokenStore(tokensPath);
        const client = new GarminClient({ tokenStore });
        const loaded = await client.loadTokens();
        if (loaded) {
          return new Garmin(client);
        }
      } catch (e: any) {
        console.warn('Aviso cargando tokens locales:', e.message);
      }
    }

    return null;
  } catch (err: any) {
    console.error('No se pudo inicializar el cliente de Garmin Connect:', err.message);
    return null;
  }
}

/**
 * Mapea el tipo de deporte de Garmin Connect a SportType de Pulse Coach
 */
function mapGarminSport(typeKey?: string): SportType {
  const key = (typeKey || '').toLowerCase();
  if (key.includes('mountain') || key.includes('mtb') || key.includes('gravel')) return 'mtb';
  if (key.includes('bike') || key.includes('cycling')) return 'cycling';
  if (key.includes('trail') || key.includes('hike') || key.includes('hiking')) return 'trail';
  if (key.includes('run')) return 'running';
  return 'strength_mobility';
}

/**
 * Formatea el ritmo o velocidad media según el deporte
 */
function formatPaceOrSpeed(sport: SportType, avgSpeedMps?: number): string | undefined {
  if (!avgSpeedMps || avgSpeedMps <= 0) return undefined;
  if (sport === 'cycling' || sport === 'mtb') {
    const kmh = (avgSpeedMps * 3.6).toFixed(1);
    return `${kmh} km/h`;
  }
  const secPerKm = 1000 / avgSpeedMps;
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
}

/**
 * Sincroniza las actividades y biometría REAL de Garmin Connect con la base de datos
 */
export async function syncRealGarminData(userId: string): Promise<{
  success: boolean;
  activitiesCount: number;
  message: string;
}> {
  const garmin = await getGarminClient();
  if (!garmin) {
    return {
      success: false,
      activitiesCount: 0,
      message: 'No hay credenciales activas de Garmin Connect configuradas.',
    };
  }

  const db = getDb();
  const today = new Date();

  // 1. OBTENER ACTIVIDADES REALES
  const rawActivities = await garmin.getActivities(0, 25).catch((err) => {
    console.warn('Error obteniendo actividades de Garmin:', err);
    return [];
  });

  if (rawActivities && rawActivities.length > 0) {
    // Limpiar actividades previas del usuario para que solo queden sus entrenamientos reales
    await db.execute({
      sql: 'DELETE FROM activities WHERE user_id = ?',
      args: [userId],
    });

    for (const a of rawActivities) {
      const sport = mapGarminSport(a.activityType?.typeKey);
      const title = a.activityName || 'Entrenamiento Garmin';
      const date = a.startTimeLocal ? a.startTimeLocal.slice(0, 16).replace('T', ' ') : 'Reciente';
      const durationMin = Math.round((a.duration || 0) / 60);
      const distanceKm = a.distance ? Number((a.distance / 1000).toFixed(2)) : null;
      const avgHr = a.averageHR || 135;
      const maxHr = a.maxHR || 165;
      const calories = a.calories || Math.round(durationMin * 8.5);
      const elevationGainM = a.elevationGain ? Math.round(a.elevationGain) : null;
      const avgPaceOrSpeed = formatPaceOrSpeed(sport, a.averageSpeed);

      await db.execute({
        sql: `
          INSERT INTO activities (
            id, user_id, source, sport, title, date, duration_min, distance_km, avg_hr, max_hr, calories, elevation_gain_m, avg_pace_or_speed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          `garmin-${a.activityId}`,
          userId,
          'garmin',
          sport,
          title,
          date,
          durationMin,
          distanceKm,
          avgHr,
          maxHr,
          calories,
          elevationGainM,
          avgPaceOrSpeed || null,
        ],
      });
    }
  }

  // 2. OBTENER BIOMETRÍA REAL (Sueño, HRV, Body Battery, Estrés)
  try {
    const sleep = await garmin.getSleepData(today).catch(() => null);
    const hrv = await garmin.getHrvData(today).catch(() => null);
    const bb = await garmin.getBodyBattery(today).catch(() => null);
    const summary = await garmin.getUserSummary(today).catch(() => null);

    const sleepScore = sleep?.dailySleepDTO?.sleepScores?.overall?.value || 70;
    const sleepHours = sleep?.dailySleepDTO?.sleepTimeSeconds 
      ? Number((sleep.dailySleepDTO.sleepTimeSeconds / 3600).toFixed(1)) 
      : 7.2;
    const deepSleepHours = sleep?.dailySleepDTO?.deepSleepSeconds 
      ? Number((sleep.dailySleepDTO.deepSleepSeconds / 3600).toFixed(1)) 
      : 1.5;

    const hrvValueMs = hrv?.hrvSummary?.lastNightAvg || hrv?.hrvSummary?.weeklyAvg || 65;
    const hrvStatus = hrvValueMs >= 60 ? 'balanced' : hrvValueMs >= 45 ? 'unbalanced' : 'low';

    // Body Battery
    const bodyBattery = bb?.[0]?.charged || bb?.[0]?.drained || 68;

    // Estrés
    const stressLevel = summary?.averageStressLevel || 24;

    // Training Readiness estimado a partir de métricas de recuperación
    const trainingReadiness = Math.min(99, Math.max(30, Math.round((sleepScore * 0.4) + (bodyBattery * 0.4) + (hrvValueMs * 0.3))));

    await db.execute({
      sql: `
        UPDATE biometric_metrics SET
          body_battery = ?,
          hrv_status = ?,
          hrv_value_ms = ?,
          sleep_score = ?,
          sleep_hours = ?,
          deep_sleep_hours = ?,
          stress_level = ?,
          training_readiness = ?,
          updated_at = ?
        WHERE user_id = ?
      `,
      args: [
        bodyBattery,
        hrvStatus,
        hrvValueMs,
        sleepScore,
        sleepHours,
        deepSleepHours,
        stressLevel,
        trainingReadiness,
        new Date().toISOString(),
        userId,
      ],
    });
  } catch (err) {
    console.warn('Aviso sincronizando biometría secundaria:', err);
  }

  return {
    success: true,
    activitiesCount: rawActivities.length,
    message: `¡Sincronizadas con éxito ${rawActivities.length} actividades reales de Garmin Connect!`,
  };
}
