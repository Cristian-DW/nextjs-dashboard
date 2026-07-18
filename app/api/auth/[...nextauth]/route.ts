import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { Pool } from 'pg';

// Self-contained handler — avoids importing auth.ts which pulls in
// server-only and bcryptjs through the shared db module, which causes
// "i3 is not a constructor" bundling errors in Next.js standalone mode.
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const { handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsed = z.object({
                    email: z.string().email(),
                    password: z.string().min(6),
                }).safeParse(credentials);

                if (!parsed.success) return null;

                const { email, password } = parsed.data;
                try {
                    const res = await pool.query(
                        'SELECT * FROM users WHERE email = $1',
                        [email]
                    );
                    const user = res.rows[0];
                    if (!user) return null;

                    // Dynamic import avoids CJS/ESM bundling conflict with bcryptjs
                    const bcrypt = await import('bcryptjs');
                    const match = await bcrypt.compare(password, user.password);
                    return match ? user : null;
                } catch (err) {
                    console.error('[auth] authorize error:', err);
                    return null;
                }
            },
        }),
    ],
});

export const { GET, POST } = handlers;
