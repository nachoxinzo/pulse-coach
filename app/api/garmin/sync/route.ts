import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { syncRealGarminData } from '@/lib/garmin-sync';
import { getUserActivities, getUserBiometrics } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Debes iniciar sesión para sincronizar.' }, { status: 401 });
    }

    const syncRes = await syncRealGarminData(user.userId);
    const activities = await getUserActivities(user.userId);
    const metrics = await getUserBiometrics(user.userId);

    return NextResponse.json({
      success: syncRes.success,
      message: syncRes.message,
      activitiesCount: syncRes.activitiesCount,
      activities,
      metrics,
    });
  } catch (error: any) {
    console.error('Error sincronizando con Garmin:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al conectar con Garmin.' }, { status: 500 });
  }
}
