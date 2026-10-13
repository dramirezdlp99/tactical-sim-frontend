import { getSiteUrl } from '../lib/site';

/** /robots.txt: permite indexar todo y apunta al sitemap. */
export default function robots() {
  const base = getSiteUrl();
  return { rules: [{ userAgent: '*', allow: '/' }], sitemap: `${base}/sitemap.xml`, host: base };
}
