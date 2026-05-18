/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    serverComponentsExternalPackages: ['pg', 'bcrypt'],
    experimental: {
        serverComponentsExternalPackages: ['pg', 'bcrypt'],
    },
};

module.exports = nextConfig;
