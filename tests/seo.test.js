import { describe, it, expect, afterEach } from 'vitest';
import sitemap from '../src/app/sitemap.js';
import robots from '../src/app/robots.js';
import { getSiteUrl, playPaths, PUBLIC_ROUTES } from '../src/lib/site.js';

const SAVED = { ...process.env };
afterEach(() => { process.env = { ...SAVED }; });

describe('SEO tecnico', () => {
  it('la URL base respeta NEXT_PUBLIC_SITE_URL y quita la barra final', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ejemplo.com/';
    expect(getSiteUrl()).toBe('https://ejemplo.com');
  });
  it('usa la URL de produccion de Vercel si no hay una explicita', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'mi-app.vercel.app';
    expect(getSiteUrl()).toBe('https://mi-app.vercel.app');
  });
  it('el sitemap incluye cada ruta publica y cada jugada, sin duplicados', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ejemplo.com';
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain('https://ejemplo.com');
    for (const r of PUBLIC_ROUTES.filter((r) => r.path !== '/')) expect(urls).toContain(`https://ejemplo.com${r.path}`);
    for (const p of playPaths()) expect(urls).toContain(`https://ejemplo.com${p}`);
    expect(new Set(urls).size).toBe(urls.length);
    expect(playPaths().length).toBeGreaterThan(0);
  });
  it('robots.txt permite indexar y apunta al sitemap', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ejemplo.com';
    const r = robots();
    expect(r.rules[0].allow).toBe('/');
    expect(r.sitemap).toBe('https://ejemplo.com/sitemap.xml');
  });
});
