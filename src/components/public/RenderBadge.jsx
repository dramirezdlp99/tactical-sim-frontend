import React from 'react';
import { fmtDateTime } from '../../lib/format';

/**
 * RenderBadge (SERVIDOR): etiqueta que dice con que patron de renderizado se
 * genero la pagina y CUANDO, para poder comprobarlo a simple vista (recarga y
 * mira si la hora cambia).
 * Guardar en: tactical-sim-frontend/src/components/public/RenderBadge.jsx
 */
export const MODES = {
  CSR: { name: 'CSR · Client-Side Rendering', hint: 'Se dibuja en tu navegador' },
  SSG: { name: 'SSG · Static Site Generation', hint: 'Generada UNA vez al compilar' },
  ISR: { name: 'ISR · Incremental Static Regeneration', hint: 'Estática, se regenera sola cada 5 minutos' },
  SSR: { name: 'SSR · Server-Side Rendering', hint: 'Se genera en el servidor en CADA petición' },
  STREAMING: { name: 'Streaming SSR', hint: 'El servidor la envía por partes con Suspense' },
};

export function RenderBadge({ mode, when, note }) {
  const m = MODES[mode];
  return (
    <div className="ta-render-badge" data-mode={mode}>
      <b><i />{m.name}</b>
      <span>{m.hint}</span>
      {when && <time dateTime={when}>Generada: {fmtDateTime(when)}</time>}
      {note && <em>{note}</em>}
    </div>
  );
}
