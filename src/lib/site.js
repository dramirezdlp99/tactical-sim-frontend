/**
 * site.js (servidor)
 * URL publica del sitio y rutas indexables. La usan el layout (metadataBase),
 * sitemap.js y robots.js, para que todas las URLs absolutas salgan del mismo sitio.
 *
 * Orden de prioridad de la URL base:
 *   1) NEXT_PUBLIC_SITE_URL (la fijas tu en Vercel si usas dominio propio)
 *   2) VERCEL_PROJECT_PRODUCTION_URL (Vercel la pone sola)
 *   3) la URL de produccion conocida, o localhost en desarrollo
 *
 * Guardar en: tactical-sim-frontend/src/lib/site.js
 */
import { BASKETBALL_PLAYS, TENNIS_PLAYS } from '../components/predefinedPlays';

const strip = (u) => String(u || '').replace(/\/+$/, '');

export function getSiteUrl() {
  const explicit = strip(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;
  const vercel = strip(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`;
  return process.env.NODE_ENV === 'production' ? 'https://tactical-sim-frontend.vercel.app' : 'http://localhost:3000';
}

export const SITE_NAME = 'TacticAI';
export const SITE_DESCRIPTION =
  'TacticAI: pizarra táctica de baloncesto y tenis con IA, simulación multihilo, modo campo sin conexión y duplicación de pantalla.';

/** Rutas publicas con su frecuencia de cambio y prioridad para el sitemap. */
export const PUBLIC_ROUTES = [
  { path: '/', changeFrequency: 'monthly', priority: 1 },
  { path: '/metodologia', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/jugadas', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/modelo', changeFrequency: 'daily', priority: 0.7 },
  { path: '/renderizado', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/estado', changeFrequency: 'always', priority: 0.3 },
  { path: '/plataforma', changeFrequency: 'always', priority: 0.3 },
];

export function playPaths() {
  return [...BASKETBALL_PLAYS, ...TENNIS_PLAYS].filter((p) => p.positions).map((p) => `/jugadas/${p.id}`);
}
