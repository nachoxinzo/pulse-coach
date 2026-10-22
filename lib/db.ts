import { createClient, Client } from '@libsql/client';
import crypto from 'crypto';
import { BiometricMetrics, ActivitySession, NonZeroHabit, GearItem } from '@/types';
import { INITIAL_BIOMETRICS, INITIAL_NON_ZERO_HABIT, RECENT_ACTIVITIES } from './mock-data';

let clientInstance: Client | null = null;

export function getDb(): Client {
  if (!clientInstance) {
    const url = process.env.TURSO_DATABASE_URL || 'file:pulse_coach_v2.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;
    clientInstance = createClient({ url, authToken });
  }
  return clientInstance;
}

/**
 * Inicializa las tablas de la base de datos de forma segura e idempotente
 */
export async function initDb(): Promise<void> {
  const db = getDb();

  // 1. Tabla de usuarios
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      primary_device TEXT NOT NULL DEFAULT 'garmin',
      created_at TEXT NOT NULL
    )
  `);

  // 2. Tabla de métricas biométricas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS biometric_metrics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      body_battery INTEGER NOT NULL,
      body_battery_trend TEXT NOT NULL,
      hrv_status TEXT NOT NULL,
      hrv_value_ms INTEGER NOT NULL,
      sleep_score INTEGER NOT NULL,
      sleep_hours REAL NOT NULL,
      deep_sleep_hours REAL NOT NULL,
      stress_level INTEGER NOT NULL,
      training_readiness INTEGER NOT NULL,
      acute_load INTEGER NOT NULL,
      chronic_load INTEGER NOT NULL,
      acwr REAL NOT NULL,
      acwr_status TEXT NOT NULL,
      vo2_max INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_biometrics_user ON biometric_metrics (user_id)`);

  // 3. Tabla de sesiones y actividades
  await db.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      sport TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      duration_min INTEGER NOT NULL,
      distance_km REAL,
      avg_hr INTEGER NOT NULL,
      max_hr INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      elevation_gain_m INTEGER,
      avg_pace_or_speed TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_activities_user ON activities (user_id)`);

  // 4. Tabla de hábitos Non-Zero
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      current_streak_days INTEGER NOT NULL DEFAULT 0,
      longest_streak_days INTEGER NOT NULL DEFAULT 0,
      today_completed INTEGER NOT NULL DEFAULT 0,
      today_completed_workout_title TEXT,
      reminder_enabled INTEGER NOT NULL DEFAULT 1,
      reminder_time TEXT NOT NULL DEFAULT '18:30',
      weekly_days_active_json TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_habits_user ON user_habits (user_id)`);

  // 5. Tabla de equipamiento y material (Zapatillas y Bicis reales)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gear (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      garmin_uuid TEXT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      type TEXT NOT NULL,
      sport_type TEXT NOT NULL,
      current_km REAL NOT NULL,
      max_km INTEGER NOT NULL,
      purchase_date TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_retired INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'good',
      components_json TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_gear_user ON gear (user_id)`);
}

/**
 * Inicializa los datos por defecto para un nuevo usuario registrado
 */
export async function seedUserData(userId: string): Promise<void> {
  const db = getDb();

  // 1. Métricas biométricas iniciales
  const metricsId = crypto.randomUUID();
  await db.execute({
    sql: `
      INSERT INTO biometric_metrics (
        id, user_id, body_battery, body_battery_trend, hrv_status, hrv_value_ms, 
        sleep_score, sleep_hours, deep_sleep_hours, stress_level, training_readiness, 
        acute_load, chronic_load, acwr, acwr_status, vo2_max, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      metricsId,
      userId,
      INITIAL_BIOMETRICS.bodyBattery,
      INITIAL_BIOMETRICS.bodyBatteryTrend,
      INITIAL_BIOMETRICS.hrvStatus,
      INITIAL_BIOMETRICS.hrvValueMs,
      INITIAL_BIOMETRICS.sleepScore,
      INITIAL_BIOMETRICS.sleepHours,
      INITIAL_BIOMETRICS.deepSleepHours,
      INITIAL_BIOMETRICS.stressLevel,
      INITIAL_BIOMETRICS.trainingReadiness,
      INITIAL_BIOMETRICS.acuteLoad,
      INITIAL_BIOMETRICS.chronicLoad,
      INITIAL_BIOMETRICS.acwr,
      INITIAL_BIOMETRICS.acwrStatus,
      INITIAL_BIOMETRICS.vo2Max,
      new Date().toISOString(),
    ],
  });

  // 2. Actividades iniciales
  for (const act of RECENT_ACTIVITIES) {
    await db.execute({
      sql: `
        INSERT INTO activities (
          id, user_id, source, sport, title, date, duration_min, distance_km, avg_hr, max_hr, calories, elevation_gain_m, avg_pace_or_speed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        crypto.randomUUID(),
        userId,
        act.source,
        act.sport,
        act.title,
        act.date,
        act.durationMin,
        act.distanceKm || null,
        act.avgHr,
        act.maxHr,
        act.calories,
        act.elevationGainM || null,
        act.avgPaceOrSpeed || null,
      ],
    });
  }

  // 3. Hábito inicial
  await db.execute({
    sql: `
      INSERT INTO user_habits (
        id, user_id, current_streak_days, longest_streak_days, today_completed, 
        today_completed_workout_title, reminder_enabled, reminder_time, weekly_days_active_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      crypto.randomUUID(),
      userId,
      INITIAL_NON_ZERO_HABIT.currentStreakDays,
      INITIAL_NON_ZERO_HABIT.longestStreakDays,
      INITIAL_NON_ZERO_HABIT.todayCompleted ? 1 : 0,
      INITIAL_NON_ZERO_HABIT.todayCompletedWorkoutTitle || null,
      INITIAL_NON_ZERO_HABIT.reminderEnabled ? 1 : 0,
      INITIAL_NON_ZERO_HABIT.reminderTime,
      JSON.stringify(INITIAL_NON_ZERO_HABIT.weeklyDaysActive),
    ],
  });
}

/**
 * Obtiene las métricas biométricas aisladas del usuario
 */
export async function getUserBiometrics(userId: string): Promise<BiometricMetrics | null> {
  const db = getDb();
  const res = await db.execute({
    sql: `
      SELECT body_battery, body_battery_trend, hrv_status, hrv_value_ms, sleep_score,
             sleep_hours, deep_sleep_hours, stress_level, training_readiness,
             acute_load, chronic_load, acwr, acwr_status, vo2_max
      FROM biometric_metrics 
      WHERE user_id = ? 
      ORDER BY updated_at DESC LIMIT 1
    `,
    args: [userId],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  return {
    bodyBattery: Number(row.body_battery),
    bodyBatteryTrend: String(row.body_battery_trend) as any,
    hrvStatus: String(row.hrv_status) as any,
    hrvValueMs: Number(row.hrv_value_ms),
    sleepScore: Number(row.sleep_score),
    sleepHours: Number(row.sleep_hours),
    deepSleepHours: Number(row.deep_sleep_hours),
    stressLevel: Number(row.stress_level),
    trainingReadiness: Number(row.training_readiness),
    acuteLoad: Number(row.acute_load),
    chronicLoad: Number(row.chronic_load),
    acwr: Number(row.acwr),
    acwrStatus: String(row.acwr_status) as any,
    vo2Max: Number(row.vo2_max),
  };
}

/**
 * Actualiza las métricas biométricas de un usuario
 */
export async function updateUserBiometrics(userId: string, metrics: Partial<BiometricMetrics>): Promise<void> {
  const db = getDb();
  const current = await getUserBiometrics(userId) || INITIAL_BIOMETRICS;
  const updated = { ...current, ...metrics };

  await db.execute({
    sql: `
      UPDATE biometric_metrics SET
        body_battery = ?,
        body_battery_trend = ?,
        hrv_status = ?,
        hrv_value_ms = ?,
        sleep_score = ?,
        sleep_hours = ?,
        deep_sleep_hours = ?,
        stress_level = ?,
        training_readiness = ?,
        acute_load = ?,
        chronic_load = ?,
        acwr = ?,
        acwr_status = ?,
        vo2_max = ?,
        updated_at = ?
      WHERE user_id = ?
    `,
    args: [
      updated.bodyBattery,
      updated.bodyBatteryTrend,
      updated.hrvStatus,
      updated.hrvValueMs,
      updated.sleepScore,
      updated.sleepHours,
      updated.deepSleepHours,
      updated.stressLevel,
      updated.trainingReadiness,
      updated.acuteLoad,
      updated.chronicLoad,
      updated.acwr,
      updated.acwrStatus,
      updated.vo2Max,
      new Date().toISOString(),
      userId,
    ],
  });
}

/**
 * Obtiene las actividades del usuario
 */
export async function getUserActivities(userId: string): Promise<ActivitySession[]> {
  const db = getDb();
  const res = await db.execute({
    sql: `
      SELECT id, source, sport, title, date, duration_min, distance_km, avg_hr, max_hr, calories, elevation_gain_m, avg_pace_or_speed
      FROM activities
      WHERE user_id = ?
      ORDER BY date DESC
    `,
    args: [userId],
  });

  return res.rows.map((r) => ({
    id: String(r.id),
    source: String(r.source) as 'garmin' | 'strava',
    sport: String(r.sport) as any,
    title: String(r.title),
    date: String(r.date),
    durationMin: Number(r.duration_min),
    distanceKm: r.distance_km ? Number(r.distance_km) : undefined,
    avgHr: Number(r.avg_hr),
    maxHr: Number(r.max_hr),
    calories: Number(r.calories),
    elevationGainM: r.elevation_gain_m ? Number(r.elevation_gain_m) : undefined,
    avgPaceOrSpeed: r.avg_pace_or_speed ? String(r.avg_pace_or_speed) : undefined,
  }));
}

/**
 * Obtiene el hábito del usuario
 */
export async function getUserHabit(userId: string): Promise<NonZeroHabit | null> {
  const db = getDb();
  const res = await db.execute({
    sql: `
      SELECT current_streak_days, longest_streak_days, today_completed, 
             today_completed_workout_title, reminder_enabled, reminder_time, weekly_days_active_json
      FROM user_habits
      WHERE user_id = ?
      LIMIT 1
    `,
    args: [userId],
  });

  if (res.rows.length === 0) return null;
  const r = res.rows[0];

  let weeklyDaysActive = [true, true, true, true, false, false, false];
  try {
    if (r.weekly_days_active_json) {
      weeklyDaysActive = JSON.parse(String(r.weekly_days_active_json));
    }
  } catch {
    // fallback
  }

  return {
    currentStreakDays: Number(r.current_streak_days),
    longestStreakDays: Number(r.longest_streak_days),
    todayCompleted: Boolean(r.today_completed),
    todayCompletedWorkoutTitle: r.today_completed_workout_title ? String(r.today_completed_workout_title) : undefined,
    reminderEnabled: Boolean(r.reminder_enabled),
    reminderTime: String(r.reminder_time || '18:30'),
    weeklyDaysActive,
  };
}

/**
 * Actualiza el estado del hábito para el usuario
 */
export async function updateUserHabit(userId: string, habit: Partial<NonZeroHabit>): Promise<NonZeroHabit> {
  const db = getDb();
  const current = (await getUserHabit(userId)) || INITIAL_NON_ZERO_HABIT;
  const updated: NonZeroHabit = { ...current, ...habit };

  await db.execute({
    sql: `
      UPDATE user_habits SET
        current_streak_days = ?,
        longest_streak_days = ?,
        today_completed = ?,
        today_completed_workout_title = ?,
        reminder_enabled = ?,
        reminder_time = ?,
        weekly_days_active_json = ?
      WHERE user_id = ?
    `,
    args: [
      updated.currentStreakDays,
      updated.longestStreakDays,
      updated.todayCompleted ? 1 : 0,
      updated.todayCompletedWorkoutTitle || null,
      updated.reminderEnabled ? 1 : 0,
      updated.reminderTime,
      JSON.stringify(updated.weeklyDaysActive),
      userId,
    ],
  });

  return updated;
}

/**
 * Obtiene el equipamiento registrado de un usuario
 */
export async function getUserGear(userId: string): Promise<GearItem[]> {
  const db = getDb();
  await initDb();
  const res = await db.execute({
    sql: 'SELECT * FROM gear WHERE user_id = ? ORDER BY is_retired ASC, current_km DESC',
    args: [userId],
  });

  return res.rows.map((r: any) => {
    let components = undefined;
    if (r.components_json) {
      try {
        components = JSON.parse(String(r.components_json));
      } catch {
        // fallback
      }
    }

    return {
      id: String(r.id),
      garminUuid: r.garmin_uuid ? String(r.garmin_uuid) : undefined,
      name: String(r.name),
      brand: String(r.brand),
      model: String(r.model),
      type: String(r.type) as 'shoes' | 'bike',
      sportType: String(r.sport_type) as any,
      currentKm: Number(r.current_km),
      maxKm: Number(r.max_km),
      purchaseDate: String(r.purchase_date),
      isDefault: Boolean(r.is_default),
      isRetired: Boolean(r.is_retired),
      status: String(r.status) as any,
      components,
    };
  });
}

/**
 * Guarda o actualiza la lista de equipamiento de un usuario
 */
export async function saveUserGear(userId: string, items: GearItem[]): Promise<void> {
  const db = getDb();
  await initDb();

  for (const item of items) {
    await db.execute({
      sql: `
        INSERT INTO gear (
          id, user_id, garmin_uuid, name, brand, model, type, sport_type,
          current_km, max_km, purchase_date, is_default, is_retired, status, components_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          brand = excluded.brand,
          model = excluded.model,
          type = excluded.type,
          sport_type = excluded.sport_type,
          current_km = excluded.current_km,
          max_km = excluded.max_km,
          purchase_date = excluded.purchase_date,
          is_default = excluded.is_default,
          is_retired = excluded.is_retired,
          status = excluded.status,
          components_json = excluded.components_json,
          updated_at = excluded.updated_at
      `,
      args: [
        item.id,
        userId,
        item.garminUuid || null,
        item.name,
        item.brand,
        item.model,
        item.type,
        item.sportType,
        item.currentKm,
        item.maxKm,
        item.purchaseDate,
        item.isDefault ? 1 : 0,
        item.isRetired ? 1 : 0,
        item.status,
        item.components ? JSON.stringify(item.components) : null,
        new Date().toISOString(),
      ],
    });
  }
}

