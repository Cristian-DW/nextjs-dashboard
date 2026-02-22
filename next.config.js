/** @type {import('next').NextConfig} */
const nextConfig = {
    serverComponentsExternalPackages: ['pg', 'bcrypt'],
    experimental: {
        serverComponentsExternalPackages: ['pg', 'bcrypt'],
    },
};

module.exports = nextConfig;
