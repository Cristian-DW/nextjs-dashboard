/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Required for NextAuth to work correctly behind SAP BTP reverse proxies
    skipMiddlewareUrlNormalize: true,
    experimental: {
        serverComponentsExternalPackages: ['pg', 'bcryptjs'],
        serverActions: {
            allowedOrigins: [
                '2e3ddffatrial-dev-deltux-pos-approuter.cfapps.us10-001.hana.ondemand.com',
                '2e3ddffatrial-dev-deltux-pos-ui.cfapps.us10-001.hana.ondemand.com',
                'localhost:8080',
                'localhost:3000',
            ],
        },
    },
};

module.exports = nextConfig;
