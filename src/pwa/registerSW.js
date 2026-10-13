import { setPwaState, getPwaState } from './pwaStore';

/**
 * registerSW.js
 * Registra el Service Worker (public/sw.js) que permite abrir TacticAI SIN
 * conexion despues de la primera visita, y captura el evento de instalacion
 * ("Agregar a la pantalla de inicio") para ofrecerlo desde la interfaz.
 *
 * - `enabled`: solo se activa en produccion (en desarrollo un Service Worker
 *   cacheando archivos confunde mas de lo que ayuda).
 * - Despues de que la pagina carga, le avisa al Service Worker que archivos
 *   uso (scripts, estilos, fuentes) para que los guarde: asi funciona igual
 *   con cualquier empaquetador (Vite hoy, Next.js despues) sin lista fija.
 *
 * Guardar en: tactical-sim-frontend/src/pwa/registerSW.js
 */
export function initPwa({ enabled = true } = {}) {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setPwaState({ installEvent: e });
  });
  window.addEventListener('appinstalled', () => setPwaState({ installEvent: null, installed: true }));

  if (!enabled || !('serviceWorker' in navigator)) return;
  setPwaState({ supported: true });

  const start = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const sw = await navigator.serviceWorker.ready;
      setPwaState({ controlling: !!navigator.serviceWorker.controller });
      navigator.serviceWorker.addEventListener('controllerchange', () => setPwaState({ controlling: true }));

      // Que el Service Worker guarde todo lo que esta pagina ya cargo.
      const urls = performance.getEntriesByType('resource')
        .map((r) => r.name)
        .filter((u) => u.startsWith(window.location.origin))
        .concat([window.location.href]);
      (sw.active || reg.active)?.postMessage({ type: 'CACHE_URLS', urls });

      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'CACHE_READY') setPwaState({ ready: true });
      });
      // Si ya estaba instalado de visitas anteriores, el aviso no vuelve a llegar: se pregunta.
      (sw.active || reg.active)?.postMessage({ type: 'PING_CACHE' });
    } catch (err) {
      setPwaState({ supported: false });
    }
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

export async function promptInstall() {
  const ev = getPwaState().installEvent;
  if (!ev) return false;
  ev.prompt();
  const choice = await ev.userChoice.catch(() => null);
  setPwaState({ installEvent: null });
  return choice?.outcome === 'accepted';
}
