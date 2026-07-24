import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { z } from 'zod';
import { createSession, sessionCookieOptions } from '@/app/lib/session';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid credentials format.' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Fetch user from database
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = res.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Create JWT session
    const token = await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    const cookieOpts = sessionCookieOptions(token);
    response.cookies.set(cookieOpts);

    return response;
  } catch (error) {
    console.error('[login] error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
