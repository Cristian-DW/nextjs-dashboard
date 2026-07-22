import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/app/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — always allow
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic) return NextResponse.next();

  // Protected paths — require session
  const user = await getSessionFromRequest(request);

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)'],
};
