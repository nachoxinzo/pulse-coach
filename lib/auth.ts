import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'pulse-coach-secret-salt-development-key-2026';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'pulse_session';

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  primaryDevice: 'garmin' | 'coros' | 'igpsport' | 'strava';
}

/**
 * Hashea una contraseña usando PBKDF2 con sal criptográfica única
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña contra su hash usando timingSafeEqual
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;

    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const bufOriginal = Buffer.from(originalHash, 'hex');
    const bufTest = Buffer.from(testHash, 'hex');

    if (bufOriginal.length !== bufTest.length) return false;
    return crypto.timingSafeEqual(bufOriginal, bufTest);
  } catch {
    return false;
  }
}

/**
 * Emite un JWT seguro firmado para la sesión de usuario
 */
export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(JWT_SECRET);
}

/**
 * Verifica un token JWT
 */
export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      primaryDevice: payload.primaryDevice as 'garmin' | 'coros' | 'igpsport' | 'strava',
    };
  } catch {
    return null;
  }
}

/**
 * Obtiene el usuario autenticado desde las cookies de Next.js
 */
export async function getCurrentUser(): Promise<UserSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
