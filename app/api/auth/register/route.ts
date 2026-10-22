import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, initDb, seedUserData } from '@/lib/db';
import { hashPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { email, password, name, primaryDevice } = body;

    // Validación rigurosa de entradas
    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Dirección de correo electrónico inválida.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe contener al menos 8 caracteres para garantizar la seguridad.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();
    const validDevice = ['garmin', 'coros', 'igpsport', 'strava'].includes(primaryDevice)
      ? primaryDevice
      : 'garmin';

    const db = getDb();

    // Comprobar si el usuario ya existe
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [cleanEmail],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una cuenta registrada con este correo electrónico.' },
        { status: 409 }
      );
    }

    // Hashear contraseña con sal única
    const passwordHash = hashPassword(password);
    const userId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Guardar nuevo usuario
    await db.execute({
      sql: 'INSERT INTO users (id, email, password_hash, name, primary_device, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [userId, cleanEmail, passwordHash, cleanName, validDevice, createdAt],
    });

    // Inicializar datos biométricos y hábitos iniciales aislados para este nuevo usuario
    await seedUserData(userId);

    // Generar sesión JWT
    const token = await createSessionToken({
      userId,
      email: cleanEmail,
      name: cleanName,
      primaryDevice: validDevice,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        userId,
        email: cleanEmail,
        name: cleanName,
        primaryDevice: validDevice,
      },
    });

    // Cookie segura HTTP-Only
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14, // 14 días
    });

    return response;
  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error al procesar el registro. Inténtalo de nuevo más tarde.' },
      { status: 500 }
    );
  }
}
