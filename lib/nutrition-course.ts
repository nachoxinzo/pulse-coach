/**
 * Motor de Integración de Nutrición y Clima en Rutas Deportivas
 * Genera puntos de trayecto (CoursePoints) de Comida (Food) y Agua (Water)
 * geolocalizados a lo largo de una ruta para Garmin Edge, Wahoo, Karoo y COROS.
 */

import { SportType } from '@/types';
import { calculateSportsNutrition, SportsNutritionPlan, WeatherType, FoodStrategy } from './sports-nutrition';

export interface HourlyWeatherForecast {
  targetDateIso: string;
  tempC: number;
  apparentTempC: number;
  humidityPct: number;
  windSpeedKmh: number;
  precipitationProb: number;
  weatherCode: number;
  conditionLabel: string;
  weatherCategory: WeatherType;
  sweatImpactAdvice: string;
}

export interface NutritionCoursePoint {
  id: string;
  name: string; // Nombre corto para pantalla del ciclocomputador (máx 15-20 caracteres)
  pointType: 'Food' | 'Water' | 'Generic';
  garminPointType: number; // 3 = Food, 2 = Water, 1 = Generic
  distanceMeters: number;
  distanceKm: number;
  minute: number;
  timeIso: string;
  lat: number;
  lng: number;
  elevationM: number;
  notes: string;
  foodName: string;
  portion: string;
  carbsGrams: number;
  waterMl: number;
}

export interface RouteGeoPoint {
  latitude: number;
  longitude: number;
  elevation: number;
  distance: number; // en metros desde la salida
}

/**
 * Consulta la previsión horaria meteorológica de Open-Meteo para una fecha y hora específicas
 */
export async function fetchHourlyWeatherForecast(
  lat: number,
  lng: number,
  targetDate: Date
): Promise<HourlyWeatherForecast> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&forecast_days=7&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al consultar Open-Meteo');
    const data = await res.json();

    const hourly = data.hourly;
    if (!hourly || !hourly.time || hourly.time.length === 0) {
      throw new Error('Respuesta meteorológica vacía');
    }

    // Buscar el índice más cercano a targetDate
    const targetIsoPrefix = targetDate.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
    let closestIdx = hourly.time.findIndex((t: string) => t.startsWith(targetIsoPrefix));

    if (closestIdx === -1) {
      // Buscar por diferencia de tiempo mínima
      const targetTimeMs = targetDate.getTime();
      let minDiff = Infinity;
      closestIdx = 0;
      hourly.time.forEach((t: string, idx: number) => {
        const diff = Math.abs(new Date(t).getTime() - targetTimeMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
    }

    const temp = Math.round(hourly.temperature_2m[closestIdx] ?? 18);
    const appTemp = Math.round(hourly.apparent_temperature[closestIdx] ?? temp);
    const humidity = hourly.relative_humidity_2m[closestIdx] ?? 60;
    const wind = Math.round(hourly.wind_speed_10m[closestIdx] ?? 12);
    const rainProb = hourly.precipitation_probability[closestIdx] ?? 5;
    const wCode = hourly.weather_code[closestIdx] ?? 0;

    let condition = 'Despejado / Soleado';
    if (wCode >= 1 && wCode <= 3) condition = 'Intervalos Nubosos';
    else if (wCode >= 51 && wCode <= 67) condition = 'Lluvia / Llovizna';
    else if (wCode >= 71) condition = 'Nieve';
    else if (wCode >= 80) condition = 'Chubascos';

    // Categorizar temperatura para el modelo de sudoración
    let category: WeatherType = 'moderate';
    let advice = 'Condiciones templadas: hidratación estándar de ~850 ml/h para 99 kg.';
    if (temp < 13) {
      category = 'cool';
      advice = 'Tiempo fresco: la sudoración se reduce (~700 ml/h), no descuides el aporte de carbohidratos.';
    } else if (temp >= 13 && temp <= 22) {
      category = 'moderate';
      advice = 'Temperatura ideal: mantén ingestas regulares cada 25-30 min y 1 bidón de 750ml por hora.';
    } else if (temp > 22 && temp <= 28) {
      category = 'hot';
      advice = 'Calor moderado-alto: sudoración elevada (~1.050 ml/h para 99 kg). Aumenta la sal y bebe en cada aviso.';
    } else {
      category = 'very_hot';
      advice = 'Calor extremo (>28°C): riesgo térmico alto a 99 kg (~1.250 ml/h). Máxima prioridad a la reposición de sodio.';
    }

    return {
      targetDateIso: targetDate.toISOString(),
      tempC: temp,
      apparentTempC: appTemp,
      humidityPct: humidity,
      windSpeedKmh: wind,
      precipitationProb: rainProb,
      weatherCode: wCode,
      conditionLabel: condition,
      weatherCategory: category,
      sweatImpactAdvice: advice,
    };
  } catch (err) {
    console.warn('Fallback de previsión meteorológica:', err);
    return {
      targetDateIso: targetDate.toISOString(),
      tempC: 18,
      apparentTempC: 18,
      humidityPct: 65,
      windSpeedKmh: 12,
      precipitationProb: 10,
      weatherCode: 1,
      conditionLabel: 'Previsión estimada',
      weatherCategory: 'moderate',
      sweatImpactAdvice: 'Estimación templada: ~850 ml/h de reposición recomendada para 99 kg.',
    };
  }
}

/**
 * Calcula la velocidad media estimada en función del deporte y desnivel
 */
export function getEstimatedSpeedKmh(sport: SportType): number {
  switch (sport) {
    case 'cycling':
      return 24; // Ciclismo carretera estándar
    case 'mtb':
      return 16; // MTB / Pistas forestales
    case 'trail':
      return 8.5; // Trail montaña
    case 'running':
      return 11.5; // Running asfalto
    default:
      return 22;
  }
}

/**
 * Genera la lista de CoursePoints de Nutrición e Hidratación para incrustar en el track
 */
export function generateNutritionCoursePoints(options: {
  geoPoints: RouteGeoPoint[];
  sport: SportType;
  startTime: Date;
  weightKg?: number;
  weatherCategory?: WeatherType;
  foodStrategy?: FoodStrategy;
  speedKmh?: number;
}): {
  coursePoints: NutritionCoursePoint[];
  nutritionPlan: SportsNutritionPlan;
  totalDistanceMeters: number;
  estimatedDurationMin: number;
} {
  const {
    geoPoints,
    sport,
    startTime,
    weightKg = 99,
    weatherCategory = 'moderate',
    foodStrategy = 'real_food',
  } = options;

  if (geoPoints.length < 2) {
    throw new Error('La ruta debe contener al menos 2 puntos georreferenciados.');
  }

  const totalDistanceMeters = geoPoints[geoPoints.length - 1].distance;
  const speedKmh = options.speedKmh || getEstimatedSpeedKmh(sport);
  const speedMps = (speedKmh * 1000) / 3600;

  // Duración estimada en minutos
  const estimatedDurationMin = Math.max(30, Math.round((totalDistanceMeters / speedMps) / 60));

  // Calcular plan nutricional científico (Jeukendrup + ACSM 99 kg)
  const nutritionPlan = calculateSportsNutrition({
    weightKg,
    durationMin: estimatedDurationMin,
    sport,
    weather: weatherCategory,
    foodStrategy,
    gutTrainingLevel: 'standard',
    intensity: 'endurance_z2',
  });

  const coursePoints: NutritionCoursePoint[] = [];

  // Mapear cada elemento del timeline a un punto kilométrico del recorrido
  // Excluimos la ingesta previa (min < 0) porque se hace en parado antes de salir
  const activeTimeline = nutritionPlan.timeline.filter((item) => item.min > 0 && item.min < estimatedDurationMin - 10);

  activeTimeline.forEach((item, idx) => {
    // Distancia teórica en metros a ese minuto
    const targetDistMeters = Math.min(totalDistanceMeters - 200, (item.min / 60) * speedKmh * 1000);

    // Encontrar el punto de geoPoints más cercano a targetDistMeters
    let closestPoint = geoPoints[0];
    for (let i = 0; i < geoPoints.length; i++) {
      if (geoPoints[i].distance >= targetDistMeters) {
        closestPoint = geoPoints[i];
        break;
      }
    }

    const isSandwich = item.foodName.toLowerCase().includes('sándwich') || item.foodName.toLowerCase().includes('sandwich');
    const isWaterOnly = item.foodName.toLowerCase().includes('agua') || item.foodName.toLowerCase().includes('bidón');

    // Nombre conciso adaptado a pantallas de Garmin Edge (máx 16 caracteres para no truncar)
    let shortName = 'Comer';
    let pointType: 'Food' | 'Water' = 'Food';
    let garminPointType = 3; // Food

    if (isWaterOnly) {
      shortName = 'Beber Agua';
      pointType = 'Water';
      garminPointType = 2;
    } else if (isSandwich) {
      shortName = '1/2 Sándwich';
      pointType = 'Food';
      garminPointType = 3;
    } else {
      shortName = 'Guayaba (26g)';
      pointType = 'Food';
      garminPointType = 3;
    }

    const pointTimeMs = startTime.getTime() + item.min * 60 * 1000;
    const distanceKm = Number((closestPoint.distance / 1000).toFixed(1));

    coursePoints.push({
      id: `cp-nutri-${idx + 1}`,
      name: shortName,
      pointType,
      garminPointType,
      distanceMeters: Math.round(closestPoint.distance),
      distanceKm,
      minute: item.min,
      timeIso: new Date(pointTimeMs).toISOString(),
      lat: closestPoint.latitude,
      lng: closestPoint.longitude,
      elevationM: closestPoint.elevation,
      notes: `${item.foodName} (${item.portion}) + ${item.waterMl}ml agua. ${item.notes}`,
      foodName: item.foodName,
      portion: item.portion,
      carbsGrams: item.carbsGrams,
      waterMl: item.waterMl,
    });
  });

  return {
    coursePoints,
    nutritionPlan,
    totalDistanceMeters,
    estimatedDurationMin,
  };
}

/**
 * Genera el archivo XML en formato TCX (Training Center Database) con CoursePoints
 * Compatible con Garmin Edge, Wahoo ELEMNT, Hammerhead Karoo y COROS.
 */
export function buildTcxXml(options: {
  courseName: string;
  sport: SportType;
  startTime: Date;
  geoPoints: RouteGeoPoint[];
  coursePoints: NutritionCoursePoint[];
  speedMps: number;
}): string {
  const { courseName, geoPoints, coursePoints, startTime, speedMps } = options;

  if (geoPoints.length < 2) return '';

  const totalDist = geoPoints[geoPoints.length - 1].distance;
  const totalSeconds = Math.round(totalDist / speedMps);

  const startPt = geoPoints[0];
  const endPt = geoPoints[geoPoints.length - 1];

  // Construir Trackpoints
  const trackpointsXml = geoPoints
    .map((pt) => {
      const elapsedSec = Math.round(pt.distance / speedMps);
      const ptTime = new Date(startTime.getTime() + elapsedSec * 1000).toISOString();
      return `        <Trackpoint>
          <Time>${ptTime}</Time>
          <Position>
            <LatitudeDegrees>${pt.latitude.toFixed(6)}</LatitudeDegrees>
            <LongitudeDegrees>${pt.longitude.toFixed(6)}</LongitudeDegrees>
          </Position>
          <AltitudeMeters>${Math.round(pt.elevation)}</AltitudeMeters>
          <DistanceMeters>${pt.distance.toFixed(1)}</DistanceMeters>
        </Trackpoint>`;
    })
    .join('\n');

  // Construir CoursePoints de Nutrición
  const coursePointsXml = coursePoints
    .map((cp) => {
      return `      <CoursePoint>
        <Name>${escapeXml(cp.name)}</Name>
        <Time>${cp.timeIso}</Time>
        <Position>
          <LatitudeDegrees>${cp.lat.toFixed(6)}</LatitudeDegrees>
          <LongitudeDegrees>${cp.lng.toFixed(6)}</LongitudeDegrees>
        </Position>
        <AltitudeMeters>${Math.round(cp.elevationM)}</AltitudeMeters>
        <PointType>${cp.pointType}</PointType>
        <Notes>${escapeXml(cp.notes)}</Notes>
      </CoursePoint>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Courses>
    <Course>
      <Name>${escapeXml(courseName)}</Name>
      <Lap>
        <TotalTimeSeconds>${totalSeconds}</TotalTimeSeconds>
        <DistanceMeters>${totalDist.toFixed(1)}</DistanceMeters>
        <Begin>
          <LatitudeDegrees>${startPt.latitude.toFixed(6)}</LatitudeDegrees>
          <LongitudeDegrees>${startPt.longitude.toFixed(6)}</LongitudeDegrees>
        </Begin>
        <End>
          <LatitudeDegrees>${endPt.latitude.toFixed(6)}</LatitudeDegrees>
          <LongitudeDegrees>${endPt.longitude.toFixed(6)}</LongitudeDegrees>
        </End>
        <Intensity>Active</Intensity>
      </Lap>
      <Track>
${trackpointsXml}
      </Track>
${coursePointsXml}
    </Course>
  </Courses>
</TrainingCenterDatabase>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
