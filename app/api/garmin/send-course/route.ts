import { NextResponse } from 'next/server';
import path from 'path';
import { GarminClient, Garmin, FileTokenStore } from 'garminconnect-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sport, coordinates, elevationProfile } = body;

    if (!name || !coordinates || coordinates.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Datos de ruta incompletos (se requieren al menos 2 puntos).' },
        { status: 400 }
      );
    }

    // Ruta de los tokens guardados
    const tokensPath = path.join(process.cwd(), 'tokens');
    const tokenStore = new FileTokenStore(tokensPath);
    const client = new GarminClient({ tokenStore });
    const hasTokens = await client.loadTokens();

    if (!hasTokens) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay sesión activa de Garmin Connect. Por favor verifica tus credenciales.' 
        },
        { status: 401 }
      );
    }

    const garmin = new Garmin(client);

    // Mapeo de deporte para Garmin: 1 = Running, 2 = Ciclismo/MTB, 3 = Senderismo/Trail
    let activityTypeId = 1;
    if (sport === 'cycling' || sport === 'mtb') {
      activityTypeId = 2;
    } else if (sport === 'trail') {
      activityTypeId = 3;
    }

    // Mapear coordenadas a geoPoints esperados por Garmin Connect
    // Para no exceder los límites de payload de Garmin, muestreamos a máx 300 puntos si es muy larga
    let sampledCoords = coordinates;
    const maxPoints = 250;
    if (coordinates.length > maxPoints) {
      const step = coordinates.length / maxPoints;
      sampledCoords = [];
      for (let i = 0; i < maxPoints; i++) {
        sampledCoords.push(coordinates[Math.floor(i * step)]);
      }
      sampledCoords.push(coordinates[coordinates.length - 1]);
    }

    const geoPoints = sampledCoords.map((coord: [number, number], idx: number) => {
      const ele = elevationProfile?.[idx]?.elevationM || 625;
      return {
        latitude: Number(coord[0].toFixed(6)),
        longitude: Number(coord[1].toFixed(6)),
        elevation: ele,
      };
    });

    // Enviar creación del trayecto a Garmin Connect
    const coursePayload = {
      name: name.slice(0, 48), // Garmin limita la longitud del nombre
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
