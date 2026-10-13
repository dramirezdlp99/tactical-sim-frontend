import React from 'react';

/**
 * TennisCourt
 * Cancha de tenis de individuales a escala real (10 px = 1 pie, 78 x 27 ft),
 * vista desde arriba y en HORIZONTAL (formato de transmisión), con el saque
 * fluyendo de izquierda a derecha. Antes la cancha se dibujaba horizontal pero
 * el motor de IA y las jugadas predefinidas ya asumían una cancha VERTICAL
 * (x = ancho, y = largo), así que el punto de caída se interpretaba mal. Ahora
 * ambos hablan el mismo idioma:
 *   motor x (0-100, ancho de 27 ft)  ->  pantalla vertical  (x * 2,7 px)
 *   motor y (0-100, largo de 78 ft)  ->  pantalla horizontal ((100 - y) * 7,8 px)
 * Es decir, el sacador (y alto, ej. 90) queda a la IZQUIERDA y el restador
 * (y bajo, ej. 10) a la DERECHA; la red está en y = 50.
 *
 * Guardar en: tactical-sim-frontend/src/components/courts/TennisCourt.jsx
 */

const KX = 2.7;   // px por unidad del motor, eje del ancho
const KY = 7.8;   // px por unidad del motor, eje del largo
const SERVICE_Y = 28.6; // misma línea de saque que usa el motor de IA

export const tnToScreen = (p) => ({ x: (100 - p.y) * KY, y: p.x * KX });
export const tnToPercent = (sx, sy) => ({ x: sy / KX, y: 100 - sx / KY });
export const tnClamp = (p) => ({
  x: Math.max(1, Math.min(99, p.x)),
  y: Math.max(2, Math.min(98, p.y)),
});

const SURFACES = {
  hard: { court: '#2f74c0', outer: '#1d4f86', glow: '#5fa0e8', name: 'Pista dura' },
  clay: { court: '#c8683d', outer: '#a14c28', glow: '#e89a72', name: 'Arcilla' },
  grass: { court: '#4c9a52', outer: '#357a3b', glow: '#8fd193', name: 'Césped' },
};

const initials = (name) => {
  const parts = String(name || '?').replace('.', '').trim().split(/\s+/);
  return (parts[parts.length - 1] || '?').slice(0, 2).toUpperCase();
};

const SX_SERVICE_RIGHT = (100 - SERVICE_Y) * KY;
const SX_SERVICE_LEFT = SERVICE_Y * KY;

const CourtLines = ({ surface }) => {
  const s = SURFACES[surface] || SURFACES.hard;
  return (
    <>
      <defs>
        <filter id="ta-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={surface === 'grass' ? 0.9 : 0.55} numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0" />
        </filter>
        <radialGradient id="ta-tn-light" cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </radialGradient>
        {surface === 'grass' && (
          <pattern id="ta-mow" width="90" height="360" patternUnits="userSpaceOnUse">
            <rect width="45" height="360" fill="#000" opacity="0.045" />
          </pattern>
        )}
      </defs>
      <rect x="-70" y="-85" width="920" height="485" fill={s.outer} />
      <rect x="0" y="-45" width="780" height="360" fill={s.court} />
      {surface === 'grass' && <rect x="0" y="-45" width="780" height="360" fill="url(#ta-mow)" />}
      <rect x="-70" y="-85" width="920" height="485" filter="url(#ta-grain)" opacity="0.9" />

      {/* zona válida del saque (caja de saque del restador) */}
      <rect x="390" y="0" width={SX_SERVICE_RIGHT - 390} height="270" fill="#fff" fillOpacity="0.05" />
      <text x={(390 + SX_SERVICE_RIGHT) / 2} y="-12" textAnchor="middle" fontSize="15" letterSpacing="4" fill="#fff" fillOpacity="0.5">ZONA DE SAQUE</text>

      <g fill="none" stroke="#f6f8fb" strokeWidth="3.4" strokeLinecap="square">
        <rect x="0" y="-45" width="780" height="360" />
        <line x1="0" y1="0" x2="780" y2="0" />
        <line x1="0" y1="270" x2="780" y2="270" />
        <line x1={SX_SERVICE_LEFT} y1="0" x2={SX_SERVICE_LEFT} y2="270" />
        <line x1={SX_SERVICE_RIGHT} y1="0" x2={SX_SERVICE_RIGHT} y2="270" />
        <line x1={SX_SERVICE_LEFT} y1="135" x2={SX_SERVICE_RIGHT} y2="135" />
        <line x1="0" y1="135" x2="12" y2="135" />
        <line x1="768" y1="135" x2="780" y2="135" />
      </g>

      {/* red */}
      <rect x="383" y="-40" width="14" height="350" fill="#000" opacity="0.28" />
      <line x1="390" y1="-50" x2="390" y2="320" stroke="#10151c" strokeWidth="5" />
      <line x1="390" y1="-50" x2="390" y2="320" stroke="#f1f4f8" strokeWidth="2.4" strokeDasharray="2.2 3.4" />
      <circle cx="390" cy="-52" r="6.5" fill="#1a212b" stroke="#aeb8c6" strokeWidth="1.6" />
      <circle cx="390" cy="322" r="6.5" fill="#1a212b" stroke="#aeb8c6" strokeWidth="1.6" />
      <rect x="-70" y="-85" width="920" height="485" fill="url(#ta-tn-light)" pointerEvents="none" />
    </>
  );
};

const Token = ({ pos, label, tag, kind, dragging, bind }) => {
  const s = tnToScreen(pos);
  const server = kind === 'server';
  return (
    <g className="ta-token" data-drag={dragging ? 1 : 0} style={{ transform: `translate(${s.x}px, ${s.y}px)`, filter: 'drop-shadow(0 5px 4px rgba(0,0,0,.45))' }} {...bind}>
      <circle r="26" fill="transparent" />
      <circle r="20" fill={server ? '#c8f03c' : '#f7f9fc'} stroke={server ? '#0f1706' : '#0b0f15'} strokeWidth="2.6" className="ta-token-ring" />
      <text textAnchor="middle" y="6.5" fontSize="19" fill="#0b0f15" letterSpacing="0.6">{label}</text>
      <g transform="translate(0, 38)">
        <rect x={-(tag.length * 4.9 + 10)} y="-11" width={tag.length * 9.8 + 20} height="22" rx="11" fill="#0a0f16" fillOpacity="0.9" stroke={server ? '#c8f03c' : '#aeb8c6'} strokeOpacity="0.7" />
        <text textAnchor="middle" y="5.5" fontSize="14.5" letterSpacing="1.4" fill="#eef2f8">{tag}</text>
      </g>
    </g>
  );
};

export const TennisCourt = ({ positions, result, surface, showHeat, showVectors, showRival, drag, serverName, receiverName, liveHeat }) => {
  const server = tnToScreen(positions.alcaraz);
  const target = tnToScreen(positions.ball);
  const returner = tnToScreen(positions.sinner);
  const ghost = result?.predicted_defense?.[0];

  // trayectoria curva: el control se desplaza perpendicular para dar sensación de arco
  const mx = (server.x + target.x) / 2, my = (server.y + target.y) / 2;
  const dx = target.x - server.x, dy = target.y - server.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(70, len * 0.22);
  const cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend - 30;
  const traj = `M ${server.x + (dx / len) * 24} ${server.y + (dy / len) * 24} Q ${cx} ${cy} ${target.x - (dx / len) * 12} ${target.y - (dy / len) * 12}`;

  return (
    <svg ref={drag.svgRef} className="ta-court" data-sport="TENNIS" viewBox="-70 -85 920 485" role="img" aria-label="Cancha de tenis interactiva">
      <defs>
        <radialGradient id="ta-tn-heat"><stop offset="0" stopColor="#c8f03c" stopOpacity="0.8" /><stop offset="0.55" stopColor="#c8f03c" stopOpacity="0.28" /><stop offset="1" stopColor="#c8f03c" stopOpacity="0" /></radialGradient>
        <radialGradient id="ta-tn-ball" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#f2ff7a" /><stop offset="1" stopColor="#a4cf15" /></radialGradient>
        <marker id="ta-tn-ar" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 10 10"><path d="M0 0 L10 5 L0 10 L2.6 5 z" fill="#c8f03c" /></marker>
      </defs>
      <CourtLines surface={surface} />

      {/* Zonas que el restador no alcanza, calculadas en vivo por los Web Workers (sin internet) */}
      {liveHeat?.url && (
        <image className="ta-live-heat" href={liveHeat.url} x="0" y="0" width="780" height="270" preserveAspectRatio="none" opacity="0.85" pointerEvents="none" />
      )}

      {showHeat && result && (
        <g className="ta-ghost" pointerEvents="none">
          <circle cx={target.x} cy={target.y} r="86" fill="url(#ta-tn-heat)" />
          <circle cx={target.x} cy={target.y} r="22" fill="none" stroke="#c8f03c" strokeWidth="3" className="ta-pulse" />
        </g>
      )}

      {showRival && ghost && (
        <g className="ta-ghost" pointerEvents="none">
          <line x1={returner.x} y1={returner.y} x2={tnToScreen(ghost).x} y2={tnToScreen(ghost).y} stroke="#ff7b86" strokeWidth="3" strokeDasharray="3 7" strokeLinecap="round" />
          <circle cx={tnToScreen(ghost).x} cy={tnToScreen(ghost).y} r="20" fill="#e5383b" fillOpacity="0.22" stroke="#ff7b86" strokeWidth="2.4" strokeDasharray="5 5" />
          <text x={tnToScreen(ghost).x} y={tnToScreen(ghost).y + 6} textAnchor="middle" fontFamily="'Barlow Condensed'" fontWeight="800" fontSize="17" fill="#ffd0d5">ANT.</text>
        </g>
      )}

      {showVectors && result && (
        <g className="ta-ghost" pointerEvents="none">
          <path d={traj} fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="6" transform="translate(5 9)" strokeLinecap="round" />
          <path d={traj} fill="none" stroke="#c8f03c" strokeWidth="4.5" strokeLinecap="round" className="ta-flow" markerEnd="url(#ta-tn-ar)" />
          {result.ball_speed_kmh != null && (
            <g transform={`translate(${cx}, ${cy - 4})`}>
              <rect x="-62" y="-14" width="124" height="28" rx="14" fill="#0a0f16" fillOpacity="0.9" stroke="#c8f03c" />
              <text textAnchor="middle" y="6" fontFamily="'Barlow Condensed'" fontWeight="700" fontSize="17" letterSpacing="1.2" fill="#c8f03c">{Math.round(result.ball_speed_kmh)} KM/H</text>
            </g>
          )}
        </g>
      )}

      <Token pos={positions.alcaraz} label={initials(serverName)} tag={serverName} kind="server" dragging={drag.draggingKey === 'alcaraz'} bind={drag.bind('alcaraz')} />
      <Token pos={positions.sinner} label={initials(receiverName)} tag={receiverName} kind="receiver" dragging={drag.draggingKey === 'sinner'} bind={drag.bind('sinner')} />

      <g className="ta-token" data-drag={drag.draggingKey === 'ball' ? 1 : 0} style={{ transform: `translate(${target.x}px, ${target.y}px)`, filter: 'drop-shadow(0 4px 3px rgba(0,0,0,.5))' }} {...drag.bind('ball')}>
        <circle r="24" fill="transparent" />
        <circle r="10.5" fill="url(#ta-tn-ball)" stroke="#42560a" strokeWidth="1.2" />
        <path d="M-9 -4 Q0 2 9 -4 M-9 4 Q0 -2 9 4" fill="none" stroke="#fff" strokeWidth="1.3" strokeOpacity="0.9" />
      </g>
    </svg>
  );
};

export const SURFACE_OPTIONS = Object.entries(SURFACES).map(([id, v]) => ({ id, name: v.name }));
