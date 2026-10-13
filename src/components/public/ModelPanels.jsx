import React from 'react';
import { Icon } from '../ui/Icon';
import { int, num } from '../../lib/format';

/**
 * ModelPanels (SERVIDOR): tablas de metricas del modelo predictivo, compartidas
 * por /modelo (ISR) y /plataforma (Streaming).
 * Guardar en: tactical-sim-frontend/src/components/public/ModelPanels.jsx
 */
const SPORT_NAMES = { basketball: 'Baloncesto', tennis: 'Tenis' };
const HEAD_NAMES = { shot: 'Tiro', pass: 'Pase', drive: 'Penetración', serve: 'Saque' };

function AucBar({ auc, baseline, ceiling }) {
  // La barra va de 0,5 (azar) a 1,0 (perfecto).
  const w = (v) => `${Math.max(0, Math.min(100, ((v - 0.5) / 0.5) * 100))}%`;
  return (
    <div className="ta-auc" role="img" aria-label={`AUC ${num(auc, 2)}`}>
      <i style={{ width: w(auc) }} />
      {ceiling != null && <b style={{ left: w(ceiling) }} title={`Techo posible con estos datos: ${num(ceiling, 2)}`} />}
    </div>
  );
}

export function SportModelCard({ sport, model }) {
  if (!model?.available) {
    return (
      <article className="ta-pub-panel">
        <h3>{SPORT_NAMES[sport] || sport}</h3>
        <p className="ta-pub-note">Modelo no disponible: el motor usa fórmulas geométricas deterministas.</p>
      </article>
    );
  }
  return (
    <article className="ta-pub-panel">
      <h3>{SPORT_NAMES[sport] || sport} <small>{model.model_type === 'logistic_regression' ? 'Regresión logística' : model.model_type} · {model.version}</small></h3>
      <p className="ta-pub-note">
        {int(model.n_samples)} muestras · entrenado el {model.trained_at} · datos <b>{model.data_source === 'synthetic' ? 'sintéticos' : 'reales'}</b>
      </p>
      <table className="ta-pub-table">
        <thead>
          <tr><th>Cabeza</th><th>AUC (validación)</th><th>Brier</th><th>Calibración (ECE)</th><th>Variables</th></tr>
        </thead>
        <tbody>
          {Object.entries(model.heads).map(([name, h]) => (
            <tr key={name}>
              <td>{HEAD_NAMES[name] || name}</td>
              <td>
                <span className="ta-auc-num">{num(h.auc, 2)}</span>
                <AucBar auc={h.auc} baseline={h.auc_baseline} ceiling={h.auc_ceiling_synthetic} />
              </td>
              <td>{num(h.brier, 3)}</td>
              <td>{num(h.ece, 3)}</td>
              <td>{h.n_features}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {model.synthetic_data_warning && (
        <p className="ta-pub-callout"><Icon name="alert" /> {model.synthetic_data_warning}</p>
      )}
    </article>
  );
}

export function ModelGrid({ models }) {
  return (
    <div className="ta-pub-panels">
      {Object.entries(models).map(([sport, model]) => <SportModelCard key={sport} sport={sport} model={model} />)}
    </div>
  );
}
