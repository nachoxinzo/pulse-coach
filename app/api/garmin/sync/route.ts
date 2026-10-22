import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { syncRealGarminData } from '@/lib/garmin-sync';
import { getDb, getUserActivities, getUserBiometrics } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    let targetUserId = user?.userId;

    // Si el usuario no ha iniciado sesión, buscamos el usuario principal o creamos una sesión por defecto
    if (!targetUserId) {
      const db = getDb();
      const existing = await db.execute('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
      if (existing.rows.length > 0) {
        targetUserId = String(existing.rows[0].id);
      } else {
        return NextResponse.json({
          success: false,
          error: 'Por favor, regístrate o inicia sesión en «Entrar / Registro» antes de sincronizar tus actividades.',
        }, { status: 401 });
      }
    }

    const syncRes = await syncRealGarminData(targetUserId);
    if (!syncRes.success) {
      return NextResponse.json({
        success: false,
        error: syncRes.message,
      }, { status: 400 });
    }

    const activities = await getUserActivities(targetUserId);
    const metrics = await getUserBiometrics(targetUserId);

    return NextResponse.json({
      success: true,
      message: syncRes.message,
      activitiesCount: syncRes.activitiesCount,
      activities,
      metrics,
    });
  } catch (error: any) {
    console.error('Error sincronizando con Garmin:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al conectar con Garmin Connect.',
    }, { status: 500 });
  }
}
