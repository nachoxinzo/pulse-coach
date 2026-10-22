import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getUserGear, saveUserGear } from '@/lib/db';
import { fetchGarminGear } from '@/lib/garmin-gear';
import { GearItem } from '@/types';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    let targetUserId = user?.userId;

    if (!targetUserId) {
      const db = getDb();
      const existing = await db.execute('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
      if (existing.rows.length > 0) {
        targetUserId = String(existing.rows[0].id);
      }
    }

    // Extraer material real desde Garmin Connect
    const garminResult = await fetchGarminGear();

    if (garminResult.success && garminResult.gear.length > 0) {
      // Si tenemos usuario, persistir en base de datos Turso SQLite
      if (targetUserId) {
        try {
          await saveUserGear(targetUserId, garminResult.gear);
        } catch (dbErr) {
          console.warn('Aviso guardando gear en Turso:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        source: 'garmin',
        gear: garminResult.gear,
        message: garminResult.message,
      });
    }

    // Si falló Garmin Connect o no devolvió datos, intentar recuperar lo guardado en BD
    if (targetUserId) {
      const dbGear = await getUserGear(targetUserId);
      if (dbGear.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'database',
          gear: dbGear,
          message: 'Equipamiento cargado desde la base de datos.',
        });
      }
    }

    return NextResponse.json({
      success: garminResult.success,
      source: 'garmin',
      gear: garminResult.gear,
      message: garminResult.message,
    });
  } catch (error: any) {
    console.error('Error en API /api/garmin/gear:', error);
    return NextResponse.json({
      success: false,
      gear: [],
      error: error.message || 'Error al procesar el equipamiento de Garmin.',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gear } = body as { gear: GearItem[] };

    if (!gear || !Array.isArray(gear)) {
      return NextResponse.json({ success: false, error: 'Lista de equipamiento inválida' }, { status: 400 });
    }

    const user = await getCurrentUser();
    let targetUserId = user?.userId;

    if (!targetUserId) {
      const db = getDb();
      const existing = await db.execute('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
      if (existing.rows.length > 0) {
        targetUserId = String(existing.rows[0].id);
      }
    }

    if (targetUserId) {
      await saveUserGear(targetUserId, gear);
    }

    return NextResponse.json({
      success: true,
      message: 'Equipamiento guardado correctamente.',
      count: gear.length,
    });
  } catch (error: any) {
    console.error('Error guardando equipamiento en API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al guardar equipamiento.',
    }, { status: 500 });
  }
}
