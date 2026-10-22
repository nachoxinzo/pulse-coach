import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { verifyPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Introduce tu correo y contraseña.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();

    const res = await db.execute({
      sql: 'SELECT id, email, password_hash, name, primary_device FROM users WHERE email = ?',
      args: [cleanEmail],
    });

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas o usuario no encontrado.' },
        { status: 401 }
      );
    }

    const user = res.rows[0];
    const passwordValid = verifyPassword(password, String(user.password_hash));

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas o usuario no encontrado.' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: String(user.id),
      email: String(user.email),
      name: String(user.name),
      primaryDevice: String(user.primary_device) as any,
    };

    const token = await createSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (error: any) {
    console.error('Error en inicio de sesión:', error);
    return NextResponse.json(
      { success: false, error: 'Error al iniciar sesión.' },
      { status: 500 }
    );
  }
}
