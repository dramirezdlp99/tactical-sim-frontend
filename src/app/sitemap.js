import { getSiteUrl, PUBLIC_ROUTES, playPaths } from '../lib/site';

/** /sitemap.xml: lo genera Next al compilar (SSG). Lista las rutas publicas y cada jugada. */
export default function sitemap() {
  const base = getSiteUrl();
  const now = new Date();
  const fixed = PUBLIC_ROUTES.map((r) => ({ url: `${base}${r.path === '/' ? '' : r.path}`, lastModified: now, changeFrequency: r.changeFrequency, priority: r.priority }));
  const plays = playPaths().map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 }));
  return [...fixed, ...plays];
}
