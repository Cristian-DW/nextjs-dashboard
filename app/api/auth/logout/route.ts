import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/app/lib/session';

const COOKIE_NAME_LOCAL = 'deltux_session';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME_LOCAL,
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
