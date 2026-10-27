export type SportType = 
  | 'running' 
  | 'cycling' 
  | 'trail' 
  | 'mtb' 
  | 'hiking' 
  | 'walking' 
  | 'swimming' 
  | 'strength_mobility' 
  | 'cardio';

export interface BiometricMetrics {
  bodyBattery: number; // 0-100
  bodyBatteryTrend: 'charging' | 'draining' | 'stable';
  hrvStatus: 'balanced' | 'unbalanced' | 'low';
  hrvValueMs: number;
  sleepScore: number; // 0-100
  sleepHours: number;
  deepSleepHours: number;
  stressLevel: number; // 0-100
  trainingReadiness: number; // 0-100
  acuteLoad: number; // Carga últimos 7 días
  chronicLoad: number; // Carga últimos 28 días
  acwr: number; // Acute:Chronic Workload Ratio (0.8 - 1.3 ideal)
  acwrStatus: 'recuperacion' | 'optimo' | 'sobrecarga' | 'alto_riesgo';
  vo2Max: number;
  updatedAt?: string;
}

export interface ActivitySession {
  id: string;
  source: 'garmin' | 'strava';
  sport: SportType;
  sportLabel?: string;
  title: string;
  date: string;
  durationMin: number;
  distanceKm?: number;
  avgHr: number;
  maxHr: number;
  calories: number;
  elevationGainM?: number;
  avgPaceOrSpeed?: string;
  trainingEffect?: {
    aerobic: number;
    anaerobic: number;
  };
  relativeEffortStrava?: number;
}

export interface WorkoutStep {
  name: string;
  durationMin: number;
  intensity: 'Z1 Calentamiento' | 'Z2 Aeróbico Base' | 'Z3 Tempo' | 'Z4 Umbral' | 'Z5 Intervalos VO2' | 'Fuerza/Técnica';
  targetHr?: string;
  instruction: string;
}

export interface DailyWorkoutPlan {
  id: string;
  sport: SportType;
  title: string;
  category: 'primary' | 'alternative' | 'non_zero_rescue';
  intensityLevel: 'Baja' | 'Moderada' | 'Alta' | 'Recuperación Activa';
  estimatedDurationMin: number;
  rationale: string;
  targetZoneDescription: string;
  steps: WorkoutStep[];
  suggestedRouteDistanceKm?: number;
}

export interface NonZeroHabit {
  currentStreakDays: number;
  longestStreakDays: number;
  todayCompleted: boolean;
  todayCompletedWorkoutTitle?: string;
  reminderEnabled: boolean;
  reminderTime: string;
  weeklyDaysActive: boolean[];
}

export interface RoutePoint {
  lat: number;
  lng: number;
  elevationM: number;
}

export interface GeneratedRoute {
  id: string;
  name: string;
  sport: SportType;
  distanceKm: number;
  elevationGainM: number;
  estimatedTimeMin: number;
  terrainType: string;
  coordinates: [number, number][]; // [lat, lng]
  elevationProfile: { distanceKm: number; elevationM: number }[];
  gpxContent: string;
}

export interface OfficialTrailRoute {
  id: string;
  name: string;
  category: 'mtb' | 'trail';
  region: string;
  distanceKm: number;
  elevationGainM: number;
  difficulty: 'Fácil' | 'Moderada' | 'Técnica' | 'Muy exigente';
  estimatedTimeMin: number;
  terrainBreakdown: {
    trailPercent: number;
    trackPercent: number;
    roadPercent: number;
  };
  highlights: string[];
  description: string;
  codePRG?: string;
  startCoords: [number, number];
  coordinates: [number, number][];
  elevationProfile: { distanceKm: number; elevationM: number }[];
  gpxContent: string;
}

export interface PopularEvent {
  id: string;
  name: string;
  sport: SportType;
  dateStr: string; // e.g. "24 Mayo 2026"
  month: string;   // e.g. "MAY"
  day: string;     // e.g. "24"
  location: string; // e.g. "Xinzo de Limia (Ourense)"
  distanceFromUserKm: number; // e.g. 0, 18, 35
  distances: string[]; // e.g. ["8.4 km", "5 km"] or ["45 km", "25 km"]
  elevationGainM?: number;
  difficulty: 'Iniciación' | 'Media' | 'Exigente' | 'Gran Fondo';
  status: 'Inscripciones Abiertas' | 'Próximamente' | 'Últimos Dorsales' | 'Completado';
  platformName: string; // e.g. "Carreiras Galegas", "Deputación de Ourense", "Sportmaniacs"
  registrationUrl?: string;
  coachFitScore: number; // 0 - 100% de afinidad según VO2max y ACWR
  coachFitRationale: string;
  description: string;
  targetPreparationWeeks: number; // Semanas recomendadas de preparación
  officialDistanceKm: number; // Distancia principal de la prueba
  coordinates: [number, number][]; // [lat, lng] del trazado oficial
  elevationProfile: { distanceKm: number; elevationM: number }[];
  gpxContent: string; // XML GPX estándar listo para Strava y Garmin
  wikilocUrl?: string; // Enlace a tracks verificados en Wikiloc
  stravaSegmentUrl?: string; // Enlace a ruta o segmento oficial en Strava
  isVerifiedRoute?: boolean; // Trazado verificado sobre red vial real
}

export interface GearComponent {
  id: string;
  name: string;
  currentKm: number;
  maxKm: number;
  lastReplacedDate?: string;
  status: 'good' | 'warning' | 'replace';
}

export interface GearItem {
  id: string;
  garminUuid?: string;
  name: string;
  brand: string;
  model: string;
  type: 'shoes' | 'bike';
  sportType: 'running' | 'trail' | 'cycling' | 'mtb';
  currentKm: number;
  maxKm: number;
  purchaseDate: string;
  isDefault: boolean;
  isRetired?: boolean;
  status: 'good' | 'warning' | 'replace';
  components?: GearComponent[];
}

