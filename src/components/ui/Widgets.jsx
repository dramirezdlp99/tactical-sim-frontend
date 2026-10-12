import React from 'react';
import { Icon } from './Icon';

/**
 * Widgets.jsx
 * Componentes visuales reutilizables del panel de análisis:
 *  - Gauge: medidor semicircular animado con la probabilidad principal.
 *  - Meter: barra horizontal con etiqueta y valor (métricas secundarias).
 *  - Toggle: interruptor accesible para las capas de la cancha.
 *  - Card: tarjeta con título e ícono.
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/Widgets.jsx
 */

export const Card = ({ title, icon, right, children, className = '' }) => (
  <section className={`ta-card ${className}`}>
    {(title || right) && (
      <div className="ta-card-head">
        <h3 className="ta-card-title" style={{ margin: 0 }}>
          {icon && <Icon name={icon} />} {title}
        </h3>
        {right}
      </div>
    )}
    {children}
  </section>
);

/** Arco de 240° (de 150° a 390°) para el medidor. */
const ARC_R = 82;
const ARC_LEN = (240 / 360) * 2 * Math.PI * ARC_R;
const polar = (deg) => {
  const rad = (deg * Math.PI) / 180;
  return [100 + ARC_R * Math.cos(rad), 100 + ARC_R * Math.sin(rad)];
};
const ARC_PATH = (() => {
  const [x1, y1] = polar(150);
  const [x2, y2] = polar(390);
  return `M ${x1} ${y1} A ${ARC_R} ${ARC_R} 0 1 1 ${x2} ${y2}`;
})();

export const Gauge = ({ value, caption }) => {
  const has = value != null;
  const pct = has ? Math.max(0, Math.min(100, value)) : 0;
  const tone = !has ? 'var(--ta-dim)' : pct >= 66 ? 'var(--ta-ok)' : pct >= 40 ? 'var(--ta-warn)' : 'var(--ta-danger)';
  const ticks = Array.from({ length: 13 }, (_, i) => {
    const deg = 150 + (240 / 12) * i;
    const rad = (deg * Math.PI) / 180;
    const r1 = 66, r2 = i % 3 === 0 ? 58 : 61;
    return <line key={i} x1={100 + r1 * Math.cos(rad)} y1={100 + r1 * Math.sin(rad)} x2={100 + r2 * Math.cos(rad)} y2={100 + r2 * Math.sin(rad)} stroke="var(--ta-line)" strokeWidth="1.6" strokeLinecap="round" />;
  });
  return (
    <div className="ta-gauge">
      <svg viewBox="0 0 200 175" role="img" aria-label={has ? `${pct} por ciento` : 'Sin datos'}>
        <path d={ARC_PATH} className="ta-arc-track" fill="none" strokeWidth="14" strokeLinecap="round" />
        <path
          d={ARC_PATH} className="ta-arc-fill" fill="none" stroke={tone} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={ARC_LEN} strokeDashoffset={ARC_LEN * (1 - pct / 100)}
          style={{ filter: has ? `drop-shadow(0 0 8px ${tone})` : 'none' }}
        />
        {ticks}
      </svg>
      <div className="ta-gauge-read">
        <div className="ta-gauge-value" style={{ color: has ? 'var(--ta-text)' : 'var(--ta-dim)' }}>
          {has ? pct : '—'}{has && <sup>%</sup>}
        </div>
        <div className="ta-gauge-cap">{caption}</div>
      </div>
    </div>
  );
};

export const Meter = ({ label, value, invert = false, suffix = '%', raw }) => {
  const has = value != null || raw != null;
  const pct = value != null ? Math.max(0, Math.min(100, value)) : 0;
  const good = invert ? 100 - pct : pct;
  const color = !has ? 'var(--ta-dim)' : good >= 66 ? 'var(--ta-ok)' : good >= 40 ? 'var(--ta-warn)' : 'var(--ta-danger)';
  return (
    <div>
      <div className="ta-meter-top">
        <span className="ta-meter-label">{label}</span>
        <span className="ta-meter-value">{raw != null ? raw : value != null ? `${pct}${suffix}` : '—'}</span>
      </div>
      {value != null && (
        <div className="ta-meter-bar"><i style={{ width: `${pct}%`, background: color }} /></div>
      )}
    </div>
  );
};

export const Toggle = ({ label, checked, onChange }) => (
  <label className="ta-toggle">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="ta-sw" />
  </label>
);
