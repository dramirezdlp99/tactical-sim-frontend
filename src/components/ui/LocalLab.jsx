import React from 'react';
import '../../styles/engine.css';
import { Icon } from './Icon';
import { Card, Meter } from './Widgets';

/**
 * LocalLab
 * Tarjeta del "laboratorio local": muestra, en vivo y SIN internet, la
 * estimacion geometrica que calculan los Web Workers mientras mueves las
 * fichas, y dice con total claridad COMO se esta ejecutando (hilos y si usan
 * memoria compartida). Incluye una prueba de rendimiento real: la misma carga
 * en un solo hilo frente al pool.
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/LocalLab.jsx
 */

const MODE_TEXT = {
  init: { label: 'Iniciando motor local…', tone: 'idle' },
  shared: { label: 'Memoria compartida', tone: 'ok' },
  copy: { label: 'Hilos con copia de datos', tone: 'warn' },
  main: { label: 'Hilo principal', tone: 'warn' },
};

export const LocalLab = ({ sport, lab }) => {
  const m = lab.metrics;
  const mode = MODE_TEXT[lab.mode] || MODE_TEXT.init;
  const isTennis = sport === 'TENNIS';
  const pct = (v) => (v == null ? null : Math.round(v * 100));

  return (
    <Card
      title="Laboratorio local"
      icon="cpu"
      right={<span className="ta-chip ta-lab-mode" data-tone={mode.tone}>{lab.mode === 'init' ? '…' : `${lab.threads} ${lab.threads === 1 ? 'hilo' : 'hilos'}`}</span>}
    >
      <p className="ta-hint">
        Estimación geométrica en vivo que corre en tu dispositivo, <b>sin internet</b>:
        reparte el cálculo entre varios hilos mientras arrastras las fichas.
      </p>

      <div className="ta-lab-mode-line" data-tone={mode.tone}>
        <Icon name={mode.tone === 'ok' ? 'check' : 'info'} />
        <span><b>{mode.label}</b>{lab.mode === 'shared' && ' · SharedArrayBuffer + Atomics'}</span>
      </div>
      {lab.mode === 'copy' && (
        <p className="ta-hint ta-lab-note">
          El sitio no está aislado (cross-origin isolated), así que el navegador no permite memoria
          compartida y cada hilo devuelve su franja. Todo funciona igual, solo cambia cómo se comparten los datos.
        </p>
      )}

      <div className="ta-meters" style={{ marginTop: 12 }}>
        <Meter label={isTennis ? 'Saque no devuelto (local)' : 'Tiro limpio (local)'} value={pct(m?.successRate)} />
        <Meter label={isTennis ? 'Zonas inalcanzables' : 'Zonas libres de alto valor'} value={pct(m?.openZonesPct)} />
        <Meter label={isTennis ? 'Distancia del restador al punto' : 'Separación del portador'} raw={m ? `${m.meanSeparationFt.toFixed(1)} ft` : null} />
      </div>

      <div className="ta-lab-foot">
        <span className="ta-model">{m ? `${m.samples.toLocaleString('es-CO')} muestras · ${m.ms.toFixed(1)} ms` : 'Esperando posiciones…'}</span>
        <button type="button" className="ta-btn" onClick={lab.benchmark} disabled={lab.benching || !lab.ready}>
          <Icon name="bolt" className={lab.benching ? 'ta-spin' : ''} /> {lab.benching ? 'Midiendo…' : 'Medir rendimiento'}
        </button>
      </div>

      {lab.bench && (
        <div className="ta-bench" role="status">
          <div><span>1 hilo</span><b>{lab.bench.singleMs.toFixed(0)} ms</b></div>
          <div><span>{lab.bench.threads} {lab.bench.threads === 1 ? 'hilo' : 'hilos'}</span><b>{lab.bench.poolMs != null ? `${lab.bench.poolMs.toFixed(0)} ms` : '—'}</b></div>
          <div><span>Mejora</span><b>{lab.bench.poolMs != null ? `×${lab.bench.speedup.toFixed(2)}` : '—'}</b></div>
          <small>{lab.bench.samples.toLocaleString('es-CO')} muestras por corrida · promedio de 3 · medido en este dispositivo</small>
        </div>
      )}
    </Card>
  );
};
