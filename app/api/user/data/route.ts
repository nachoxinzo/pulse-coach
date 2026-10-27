import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  initDb, 
  getUserBiometrics, 
  getUserActivities, 
  getUserHabit, 
  updateUserBiometrics, 
  seedUserData 
} from '@/lib/db';
import { INITIAL_BIOMETRICS, INITIAL_NON_ZERO_HABIT, RECENT_ACTIVITIES } from '@/lib/mock-data';

export async function GET(request: Request) {
  await initDb();
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const forceSync = searchParams.get('sync') === 'true' || searchParams.get('refresh') === 'true';

  const { getDb } = await import('@/lib/db');
  const db = getDb();

  let targetUserId = user?.userId;
  if (!targetUserId) {
    const existing = await db.execute('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
    if (existing.rows.length > 0) {
      targetUserId = String(existing.rows[0].id);
    }
  }

  // Si disponemos de un perfil de usuario (sesión iniciada o perfil principal en local)
  if (targetUserId) {
    let metrics = await getUserBiometrics(targetUserId);
    if (!metrics) {
      await seedUserData(targetUserId);
      metrics = await getUserBiometrics(targetUserId);
    }

    let activities = await getUserActivities(targetUserId);
    const isMock = activities.some((a) => a.id.startsWith('act-'));

    // Calcular si la sincronización está obsoleta (más de 15 minutos sin refresco o datos iniciales vacíos/mock)
    const lastSyncTime = metrics?.updatedAt ? new Date(metrics.updatedAt).getTime() : 0;
    const isStale = lastSyncTime === 0 || (Date.now() - lastSyncTime > 15 * 60 * 1000);

    if (forceSync || isMock || activities.length === 0 || isStale) {
      try {
        const { syncRealGarminData } = await import('@/lib/garmin-sync');
        const syncRes = await syncRealGarminData(targetUserId);
        if (syncRes.success) {
          activities = await getUserActivities(targetUserId);
          metrics = await getUserBiometrics(targetUserId);
        }
      } catch (e) {
        console.warn('Auto-sync Garmin en user/data:', e);
      }
    }

    const habit = await getUserHabit(targetUserId);

    return NextResponse.json({
      authenticated: !!user,
      user: user || null,
      metrics: metrics || INITIAL_BIOMETRICS,
      activities: activities.length > 0 ? activities : RECENT_ACTIVITIES,
      habit: habit || INITIAL_NON_ZERO_HABIT,
    });
  }

  // Fallback si no hay usuario en DB pero disponemos de sesión activa de Garmin
  try {
    const { getGarminClient, mapGarminSport } = await import('@/lib/garmin-sync');
    const garmin = await getGarminClient();
    if (garmin) {
      const rawActivities = await garmin.getActivities(0, 50);
      if (rawActivities && rawActivities.length > 0) {
        const realActs = rawActivities.map((a: any) => {
          const sport = mapGarminSport(a.activityType?.typeKey, a.activityName);
          let avgPaceOrSpeed: string | undefined = undefined;
          if (a.averageSpeed && a.averageSpeed > 0) {
            if (sport === 'cycling' || sport === 'mtb') {
              avgPaceOrSpeed = `${(a.averageSpeed * 3.6).toFixed(1)} km/h`;
            } else {
              const sec = 1000 / a.averageSpeed;
              avgPaceOrSpeed = `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, '0')} /km`;
            }
          }
          return {
            id: `garmin-${a.activityId}`,
            source: 'garmin' as const,
            sport: sport as any,
            title: a.activityName || 'Entrenamiento Garmin',
            date: a.startTimeLocal ? a.startTimeLocal.slice(0, 16).replace('T', ' ') : 'Reciente',
            durationMin: Math.round((a.duration || 0) / 60),
            distanceKm: a.distance ? Number((a.distance / 1000).toFixed(2)) : undefined,
            avgHr: a.averageHR || 135,
            maxHr: a.maxHR || 165,
            calories: a.calories || 0,
            elevationGainM: a.elevationGain ? Math.round(a.elevationGain) : undefined,
            avgPaceOrSpeed,
          };
        });

        return NextResponse.json({
          authenticated: false,
          user: null,
          metrics: INITIAL_BIOMETRICS,
          activities: realActs,
          habit: INITIAL_NON_ZERO_HABIT,
        });
      }
    }
  } catch (e) {
    console.warn('Error leyendo actividades Garmin para vista por defecto:', e);
  }

  return NextResponse.json({
    authenticated: false,
    user: null,
    metrics: INITIAL_BIOMETRICS,
    activities: RECENT_ACTIVITIES,
    habit: INITIAL_NON_ZERO_HABIT,
  });
}

export async function PUT(request: Request) {
  await initDb();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await updateUserBiometrics(user.userId, body);
    const updated = await getUserBiometrics(user.userId);

    return NextResponse.json({ success: true, metrics: updated });
  } catch (error: any) {
    console.error('Error al actualizar datos de usuario:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar los datos biométricos.' }, { status: 500 });
  }
}
