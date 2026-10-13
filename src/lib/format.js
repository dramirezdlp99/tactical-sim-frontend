/**
 * format.js (servidor y navegador)
 * Guardar en: tactical-sim-frontend/src/lib/format.js
 */
export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'medium' });

export const pct = (v, digits = 1) => (v == null ? '—' : `${(v * 100).toFixed(digits)} %`);
export const num = (v, digits = 3) => (v == null ? '—' : Number(v).toFixed(digits));
export const int = (v) => (v == null ? '—' : Number(v).toLocaleString('es-CO'));
