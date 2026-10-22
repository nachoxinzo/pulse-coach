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

export async function GET() {
  await initDb();
  const user = await getCurrentUser();

  // Si no hay sesión iniciada pero disponemos de sesión activa de Garmin, cargamos las reales
  if (!user) {
    try {
      const { getGarminClient, mapGarminSport } = await import('@/lib/garmin-sync');
      const garmin = await getGarminClient();
      if (garmin) {
        const rawActivities = await garmin.getActivities(0, 15);
        if (rawActivities && rawActivities.length > 0) {
          const realActs = rawActivities.map((a: any) => {
            const sport = mapGarminSport(a.activityType?.typeKey, a.activityName);
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
              avgPaceOrSpeed: a.averageSpeed ? `${(a.averageSpeed * 3.6).toFixed(1)} km/h` : undefined,
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

  let metrics = await getUserBiometrics(user.userId);
  if (!metrics) {
    await seedUserData(user.userId);
    metrics = await getUserBiometrics(user.userId);
  }

  let activities = await getUserActivities(user.userId);
  const isMock = activities.some((a) => a.id.startsWith('act-'));
  if (isMock || activities.length === 0) {
    try {
      const { syncRealGarminData } = await import('@/lib/garmin-sync');
      await syncRealGarminData(user.userId);
      activities = await getUserActivities(user.userId);
      metrics = await getUserBiometrics(user.userId);
    } catch (e) {
      console.warn('Auto-sync Garmin en user/data:', e);
    }
  }

  const habit = await getUserHabit(user.userId);

  return NextResponse.json({
    authenticated: true,
    user,
    metrics: metrics || INITIAL_BIOMETRICS,
    activities: activities.length > 0 ? activities : RECENT_ACTIVITIES,
    habit: habit || INITIAL_NON_ZERO_HABIT,
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
