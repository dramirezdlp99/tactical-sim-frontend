/**
 * pwaStore.js
 * Estado compartido de la PWA (Service Worker + instalacion), sin librerias.
 * Lo escribe registerSW.js y lo lee el hook usePwa() con useSyncExternalStore,
 * asi cualquier componente puede mostrar "lista sin conexion" o el boton Instalar.
 *
 * Guardar en: tactical-sim-frontend/src/pwa/pwaStore.js
 */
let state = { supported: false, ready: false, controlling: false, installEvent: null, installed: false };
const listeners = new Set();

export const getPwaState = () => state;
export const subscribePwa = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export function setPwaState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}
