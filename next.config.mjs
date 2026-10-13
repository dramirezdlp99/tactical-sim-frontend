/**
 * Configuracion de Next.js para TacticAI.
 *
 * Cabeceras:
 *  - COOP + COEP en TODAS las rutas: aislan el origen (cross-origin isolated) y
 *    asi el navegador permite SharedArrayBuffer (memoria compartida entre los
 *    Web Workers del laboratorio local). Sin ellas la app funciona igual, pero
 *    en modo "copia de datos".
 *  - /sw.js nunca se cachea (para que las versiones nuevas del Service Worker
 *    lleguen enseguida).
 */
const isolation = [
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...isolation,
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
