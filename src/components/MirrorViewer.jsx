import React, { useMemo } from 'react';
import { useMirrorViewer } from './useMirrorViewer';
import { Brand } from './ui/Shell';
import { Icon } from './ui/Icon';
import { humanizeAction, toPct } from './ui/format';
import { BasketballCourt } from './courts/BasketballCourt';
import { TennisCourt } from './courts/TennisCourt';
import '../styles/mirror.css';

/**
 * MirrorViewer
 * Pantalla del proyector (se abre con ?viewer=CODIGO). No exige login: el
 * código de sala es la llave de lectura. Muestra la pizarra del emisor en
 * tiempo real, a pantalla completa y sin controles de edición, junto con la
 * probabilidad y la acción recomendada de la última simulación.
 *
 * Guardar en: tactical-sim-frontend/src/components/MirrorViewer.jsx
 */
const NOOP_DRAG = { svgRef: { current: null }, draggingKey: null, bind: () => ({}) };

const STATUS = {
  connecting: 'Conectando…',
  live: 'En línea',
  closed: 'Sala cerrada',
  error: 'Sin conexión',
};

export const MirrorViewer = ({ roomCode }) => {
  const code = useMemo(() => String(roomCode || '').trim().toUpperCase(), [roomCode]);
  const { status, emitterOnline, frame, message } = useMirrorViewer(code);
  const sport = frame?.sport || 'BASKETBALL';
  const result = frame?.result || null;
  const layers = frame?.layers || { heat: true, vectors: true, rival: true };
  const probability = toPct(result?.success_probability);

  return (
    <div className="ta-app ta-viewer" data-sport={sport}>
      <div className="ta-viewer-top">
        <Brand />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="ta-chip">Sala {code}</span>
          <span className="ta-pill" data-state={status === 'live' && emitterOnline ? 'on' : 'off'}>
            <span className="ta-dot" /> {STATUS[status]}{status === 'live' && !emitterOnline ? ' · esperando al emisor' : ''}
          </span>
        </div>
      </div>

      <div className="ta-viewer-stage">
        {!frame ? (
          <div className="ta-viewer-wait">
            <Icon name={status === 'closed' || status === 'error' ? 'wifioff' : 'cast'} />
            <h2>{status === 'closed' || status === 'error' ? 'Sin señal' : 'Esperando la pizarra…'}</h2>
            <p>{message || 'En cuanto el entrenador mueva una ficha o simule una jugada, aparecerá aquí.'}</p>
          </div>
        ) : sport === 'TENNIS' ? (
          <TennisCourt
            positions={frame.positions} result={result} surface={frame.surface || 'hard'}
            showHeat={layers.heat} showVectors={layers.vectors} showRival={layers.rival}
            drag={NOOP_DRAG} serverName={frame.serverName || 'SACADOR'} receiverName={frame.receiverName || 'RESTADOR'}
          />
        ) : (
          <BasketballCourt
            positions={frame.positions} result={result}
            showHeat={layers.heat} showVectors={layers.vectors} showRival={layers.rival}
            drag={NOOP_DRAG}
          />
        )}
      </div>

      {result && (
        <div className="ta-viewer-bar">
          <div className="big" style={{ color: 'var(--ta-ok)' }}>{probability != null ? `${probability}%` : '—'}</div>
          <div>
            <div className="act">{humanizeAction(result.recommended_action)}</div>
            <p>{result.tactical_note}</p>
          </div>
        </div>
      )}
    </div>
  );
};
