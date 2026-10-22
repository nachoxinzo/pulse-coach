import { NextResponse } from 'next/server';
import { getGarminClient } from '@/lib/garmin-sync';

export const dynamic = 'force-dynamic';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseRawPointsFromGpx(gpx: string): { latitude: number; longitude: number; elevation: number }[] {
  const points: { latitude: number; longitude: number; elevation: number }[] = [];
  const regex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)">[\s\S]*?<ele>([^<]+)<\/ele>[\s\S]*?<\/trkpt>/g;
  let match;
  while ((match = regex.exec(gpx)) !== null) {
    points.push({
      latitude: Number(parseFloat(match[1]).toFixed(6)),
      longitude: Number(parseFloat(match[2]).toFixed(6)),
      elevation: Math.round(parseFloat(match[3])),
    });
  }
  return points;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sport, coordinates, elevationProfile, gpxContent } = body;

    if (!name || (!coordinates && !gpxContent)) {
      return NextResponse.json(
        { success: false, error: 'Datos de ruta incompletos (se requieren coordenadas o archivo GPX).' },
        { status: 400 }
      );
    }

    const garmin = await getGarminClient();
    if (!garmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay sesión activa de Garmin Connect. Por favor verifica tus credenciales.' 
        },
        { status: 401 }
      );
    }

    // Mapeo de actividad en Garmin Connect: 1 = Running, 2 = Ciclismo/MTB, 3 = Senderismo/Trail
    let activityTypeId = 1;
    let speedMps = 3.33; // ~5:00 min/km para carrera a pie
    if (sport === 'cycling' || sport === 'mtb') {
      activityTypeId = 2;
      speedMps = 5.55; // ~20 km/h para ciclismo
    } else if (sport === 'trail' || sport === 'hiking') {
      activityTypeId = 3;
      speedMps = 2.5; // ~15:00 min/km para montaña técnica
    }

    const cleanName = name.slice(0, 48);

    // Extraer puntos con su altitud real del GPX si está disponible
    let rawPoints: { latitude: number; longitude: number; elevation: number }[] = [];
    if (gpxContent) {
      rawPoints = parseRawPointsFromGpx(gpxContent);
    }

    // Si no vino GPX, construir desde coordinates y elevationProfile
    if (rawPoints.length === 0 && Array.isArray(coordinates)) {
      rawPoints = coordinates.map((coord: [number, number], idx: number) => {
        let ele = 620;
        if (Array.isArray(elevationProfile) && elevationProfile.length > 0) {
          const profileIdx = Math.min(
            elevationProfile.length - 1,
            Math.floor((idx / Math.max(1, coordinates.length - 1)) * (elevationProfile.length - 1))
          );
          ele = elevationProfile[profileIdx]?.elevationM || 620;
        }
        return {
          latitude: Number(coord[0].toFixed(6)),
          longitude: Number(coord[1].toFixed(6)),
          elevation: ele,
        };
      });
    }

    if (rawPoints.length < 2) {
      return NextResponse.json(
        { success: false, error: 'La ruta no contiene suficientes puntos georreferenciados válidos.' },
        { status: 400 }
      );
    }

    // Calcular métricas altimétricas y distancias reales requeridas por Garmin Connect
    const startTimeMs = Date.now();
    let cumulativeDistMeters = 0;
    let totalGainMeters = 0;
    let totalLossMeters = 0;
    let minEle = rawPoints[0].elevation;
    let maxEle = rawPoints[0].elevation;

    const geoPoints = rawPoints.map((pt, idx) => {
      if (idx > 0) {
        const prev = rawPoints[idx - 1];
        cumulativeDistMeters += haversineMeters(prev.latitude, prev.longitude, pt.latitude, pt.longitude);
        const diff = pt.elevation - prev.elevation;
        if (diff > 0) totalGainMeters += diff;
        else totalLossMeters += Math.abs(diff);
      }
      if (pt.elevation < minEle) minEle = pt.elevation;
      if (pt.elevation > maxEle) maxEle = pt.elevation;

      const elapsedSeconds = Math.round(cumulativeDistMeters / speedMps);

      return {
        latitude: pt.latitude,
        longitude: pt.longitude,
        elevation: pt.elevation,
        distance: Number(cumulativeDistMeters.toFixed(1)),
        timestamp: startTimeMs + elapsedSeconds * 1000,
      };
    });

    // Construcción del payload oficial de Garmin Connect con todos los campos de elevación y distancia requeridos
    const coursePayload = {
      activityTypePk: activityTypeId,
      hasTurnDetectionDisabled: false,
      geoPoints,
      courseLines: [],
      coursePoints: [],
      startPoint: geoPoints[0],
      elapsedSeconds: Math.round(cumulativeDistMeters / speedMps),
      openStreetMap: false,
      coordinateSystem: 'WGS84',
      rulePK: 2, // Privado por defecto
      courseName: cleanName,
      matchedToSegments: false,
      includeLaps: false,
      hasPaceBand: false,
      hasPowerGuide: false,
      favorite: false,
      speedMeterPerSecond: speedMps,
      sourceTypeId: 3,
      distanceMeter: Number(cumulativeDistMeters.toFixed(1)),
      elevationGainMeter: Math.round(totalGainMeters),
      elevationLossMeter: Math.round(totalLossMeters),
      minElevation: Math.round(minEle),
      maxElevation: Math.round(maxEle),
    };

    // Llamada directa a la API oficial de cursos de Garmin Connect
    const result = await (garmin as any).client.connectapi('/course-service/course', {
      method: 'POST',
      json: coursePayload,
    });

    const courseId = result?.courseId || result?.id;
    const courseUrl = courseId ? `https://connect.garmin.com/modern/course/${courseId}` : undefined;

    return NextResponse.json({
      success: true,
      courseId,
      courseUrl,
      distanceMeters: coursePayload.distanceMeter,
      elevationGainMeters: coursePayload.elevationGainMeter,
      message: '¡Trayecto enviado con éxito a tu cuenta de Garmin Connect con distancia y desnivel oficial!',
    });
  } catch (error: any) {
    console.error('Error enviando curso a Garmin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al conectar con la API de Garmin Connect.' 
      },
      { status: 500 }
    );
  }
}
