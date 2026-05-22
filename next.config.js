/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        serverComponentsExternalPackages: ['pg', 'bcryptjs'],
    },
    // Expose runtime env vars to Edge Runtime (middleware / NextAuth)
    env: {
        AUTH_SECRET: process.env.AUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    },
};

module.exports = nextConfig;
