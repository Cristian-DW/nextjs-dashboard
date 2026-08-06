/**
 * Custom JWT authentication utilities
 * Replaces NextAuth v5 beta which has bundling/proxy issues on SAP BTP
 * Uses jose (built into Next.js) for JWT signing/verification
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fallback-secret-change-in-production'
);

const SESSION_COOKIE = 'deltux_session';
const MAX_AGE = 60 * 60 * 8; // 8 hours

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export async function createSession(user: SessionUser): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload.user as SessionUser) || null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    path: '/',
  };
}
