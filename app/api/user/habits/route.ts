import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { initDb, updateUserHabit, getUserHabit } from '@/lib/db';

export async function POST(request: Request) {
  await initDb();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await updateUserHabit(user.userId, body);
    return NextResponse.json({ success: true, habit: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
