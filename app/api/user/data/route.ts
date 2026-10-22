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

  // Si no hay sesión iniciada, devolvemos datos locales iniciales
  if (!user) {
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
