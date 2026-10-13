import React from 'react';
import { Icon } from '../ui/Icon';

/**
 * StatusCard (SERVIDOR): tarjeta de estado de un servicio.
 * Guardar en: tactical-sim-frontend/src/components/public/StatusCard.jsx
 */
export function StatusCard({ title, url, result, detail, reachedAt }) {
  const ok = result.ok;
  return (
    <article className="ta-pub-panel ta-status" data-ok={ok ? 'true' : 'false'}>
      <h3><Icon name={ok ? 'check' : 'alert'} /> {title}</h3>
      <p className="ta-status-state">{ok ? 'En línea' : 'Sin respuesta'}</p>
      <dl>
        <div><dt>Respuesta</dt><dd>{ok ? `${result.ms} ms · HTTP ${result.status}` : result.error || `HTTP ${result.status}`}</dd></div>
        {detail && <div><dt>Detalle</dt><dd>{detail}</dd></div>}
        {reachedAt != null && <div><dt>Llegó a los</dt><dd>{reachedAt} ms de iniciada la petición</dd></div>}
        <div><dt>Servicio</dt><dd className="ta-status-url">{url}</dd></div>
      </dl>
    </article>
  );
}

export function StatusSkeleton({ title }) {
  return (
    <article className="ta-pub-panel ta-status ta-skeleton" aria-busy="true">
      <h3><Icon name="cpu" /> {title}</h3>
      <p className="ta-status-state">Consultando…</p>
      <div className="ta-skel-line" /><div className="ta-skel-line short" /><div className="ta-skel-line" />
    </article>
  );
}
