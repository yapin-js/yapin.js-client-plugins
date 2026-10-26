/**
 * The store writes JSON files and the auth code uses node:crypto, so nothing here may be bundled for
 * the edge runtime. Next keeps server components and route handlers on Node by default; the
 * `serverExternalPackages` entry stops it trying to bundle the framework package, which reads files
 * from its own directory.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['yapin.js-client'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
          { key: 'x-content-type-options', value: 'nosniff' },
          { key: 'x-frame-options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
