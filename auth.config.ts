import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                return isLoggedIn; // Redirect unauthenticated to /login automatically
            }
            return true; // Allow access to all other pages
        },
    },
    providers: [],
} satisfies NextAuthConfig;
