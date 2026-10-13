/* ==========================================================================
 * TacticAI · Service Worker (modo campo real)
 *
 * Objetivo: despues de la PRIMERA visita con internet, la app abre y funciona
 * sin conexion (pizarras, jugadas, laboratorio local). No depende del
 * empaquetador: no tiene una lista fija de archivos con hash; aprende lo que la
 * pagina carga (ver registerSW.js) y lo guarda.
 *
 * Estrategias:
 *   - Navegacion (HTML): red primero con limite de 4 s; si falla, la copia
 *     guardada de esa pagina; la raiz cae a la copia de la aplicacion; el resto
 *     de paginas sin copia muestran /offline.html.
 *   - Archivos con hash (/assets/, /_next/static/): copia primero (nunca cambian).
 *   - Resto del mismo origen (iconos, manifiesto): copia y se refresca en segundo plano.
 *   - NUNCA se intercepta otro origen: el backend (API/WebSocket) y el motor de IA
 *     van siempre directo a la red; sin conexion fallan de forma normal y la
 *     interfaz ya lo comunica con el aviso de Modo Campo.
 *
 * Para publicar una version nueva basta con cambiar VERSION.
 * ========================================================================== */
const VERSION = 'v3';
const SHELL = `tacticai-shell-${VERSION}`;
const IMMUTABLE = `tacticai-immutable-${VERSION}`;
const RUNTIME = `tacticai-runtime-${VERSION}`;
const CURRENT = [SHELL, IMMUTABLE, RUNTIME];

const PRECACHE = ['/', '/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tacticai-') && !CURRENT.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isImmutable = (url) => url.pathname.startsWith('/assets/') || url.pathname.startsWith('/_next/static/');

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response && response.ok) {
      const url = new URL(request.url);
      cache.put(url.origin + url.pathname, response.clone());
      if (url.pathname === '/') cache.put('/', response.clone());
    }
    return response;
  } catch (err) {
    const url = new URL(request.url);
    const exact = await cache.match(url.origin + url.pathname);
    if (exact) return exact;
    // Solo la raiz puede caer a la copia de la aplicacion; una pagina publica que nunca se visito no.
    if (url.pathname === '/') {
      const shell = await cache.match('/');
      if (shell) return shell;
    }
    return (
      (await cache.match('/offline.html')) ||
      new Response('Sin conexion', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => { if (response && response.ok) cache.put(request, response.clone()); return response; })
    .catch(() => null);
  return hit || (await refresh) || new Response('', { status: 504 });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;      // backend / IA / WebSocket: siempre a la red
  if (url.pathname === '/sw.js') return;
  // Next.js: datos de React Server Components, imagenes optimizadas y API: siempre a la red.
  if (request.headers.get('RSC') || url.searchParams.has('_rsc') || url.pathname.startsWith('/_next/image') || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
  } else if (isImmutable(url)) {
    event.respondWith(cacheFirst(request, IMMUTABLE));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'SKIP_WAITING') { self.skipWaiting(); return; }

  if (msg.type === 'CACHE_URLS' && Array.isArray(msg.urls)) {
    event.waitUntil((async () => {
      const shell = await caches.open(SHELL);
      const immutable = await caches.open(IMMUTABLE);
      const runtime = await caches.open(RUNTIME);
      await Promise.allSettled(msg.urls.map(async (u) => {
        const url = new URL(u, self.location.origin);
        if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;
        const target = isImmutable(url) ? immutable : url.pathname === '/' || !url.pathname.includes('.') ? shell : runtime;
        const key = target === shell ? url.origin + url.pathname : url.href;
        if (await target.match(key)) return;
        const res = await fetch(url.href);
        if (res && res.ok) await target.put(key, res);
      }));
      const clientsList = await self.clients.matchAll();
      clientsList.forEach((c) => c.postMessage({ type: 'CACHE_READY' }));
    })());
  }

  if (msg.type === 'PING_CACHE') {
    event.waitUntil((async () => {
      const shell = await caches.open(SHELL);
      const hasShell = await shell.match('/');
      const keys = await (await caches.open(IMMUTABLE)).keys();
      if (hasShell && keys.length > 0) {
        const clientsList = await self.clients.matchAll();
        clientsList.forEach((c) => c.postMessage({ type: 'CACHE_READY' }));
      }
    })());
  }
});
