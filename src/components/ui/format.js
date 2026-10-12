/**
 * format.js
 * Utilidades de texto compartidas: convierte los códigos del motor de IA
 * (TIRO_INMEDIATO, PASE_A_J2, ACE_PROBABLE...) en frases legibles para el
 * entrenador, y da formato de porcentaje.
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/format.js
 */
export function humanizeAction(code) {
  if (!code || code === '—') return '—';
  const text = String(code).replace(/_/g, ' ').toLowerCase();
  const cap = text.charAt(0).toUpperCase() + text.slice(1);
  return cap.replace(/\b([jd]\d)\b/gi, (m) => m.toUpperCase());
}

export const toPct = (v) => (v == null ? null : Math.round(v * 100));
export const fmtPct = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);
