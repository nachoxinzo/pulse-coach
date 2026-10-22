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

    // ESTRATEGIA 1: Importación oficial de GPX a través de la API nativa de Garmin Connect
    if (gpxContent && typeof garmin.createCourseFromGpx === 'function') {
      try {
        const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
        const safeFilename = `${cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.gpx`;
        const gpxCourse = await garmin.createCourseFromGpx(blob, safeFilename, {
          name: cleanName,
          activityTypeId,
        });

        if (gpxCourse) {
          const courseId = (gpxCourse as any)?.courseId || (gpxCourse as any)?.id;
          const courseUrl = courseId ? `https://connect.garmin.com/modern/course/${courseId}` : undefined;
          return NextResponse.json({
            success: true,
            courseId,
            courseUrl,
            message: '¡Trayecto GPX completo importado con éxito en Garmin Connect con altimetría y distancias oficiales!',
          });
        }
      } catch (gpxErr: any) {
        console.warn('createCourseFromGpx fallback a geoPoints estructurados:', gpxErr.message);
      }
    }

    // ESTRATEGIA 2: Creación con CourseGeoPoint estructurados con distancia acumulada, altitud y marcas de tiempo
    let rawPoints: { latitude: number; longitude: number; elevation: number }[] = [];
    if (gpxContent) {
      rawPoints = parseRawPointsFromGpx(gpxContent);
    }

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

    // Generar CourseGeoPoint con distancias y marcas temporales continuas
    const startTimeMs = Date.now();
    let cumulativeDistMeters = 0;

    const geoPoints = rawPoints.map((pt, idx) => {
      if (idx > 0) {
        const prev = rawPoints[idx - 1];
        cumulativeDistMeters += haversineMeters(prev.latitude, prev.longitude, pt.latitude, pt.longitude);
      }
      const elapsedSeconds = Math.round(cumulativeDistMeters / speedMps);

      return {
        latitude: pt.latitude,
        longitude: pt.longitude,
        elevation: pt.elevation,
        distance: Number(cumulativeDistMeters.toFixed(1)),
        timestamp: startTimeMs + elapsedSeconds * 1000,
      };
    });

    const coursePayload = {
      name: cleanName,
      activityTypeId,
      geoPoints,
    };

    const result = await garmin.createCourse(coursePayload);
    const courseId = result?.courseId || result?.id;
    const courseUrl = courseId ? `https://connect.garmin.com/modern/course/${courseId}` : undefined;

    return NextResponse.json({
      success: true,
      courseId,
      courseUrl,
      message: '¡Trayecto enviado con éxito a tu cuenta de Garmin Connect! Sincroniza tu reloj para navegarlo.',
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
