import { NextResponse } from 'next/server';

// NextAuth handler removed — authentication is now handled by:
// POST /api/auth/login   → credentials validation & JWT cookie
// POST /api/auth/logout  → clear session cookie
// GET  /api/auth/session → check current session

export async function GET() {
  return NextResponse.json({ message: 'Auth handled by custom JWT system' }, { status: 200 });
}

export async function POST() {
  return NextResponse.json({ message: 'Auth handled by custom JWT system' }, { status: 200 });
}
