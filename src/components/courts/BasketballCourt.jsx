import React, { useMemo } from 'react';

/**
 * BasketballCourt
 * Media cancha NBA dibujada a escala real (1 unidad del motor = 0,5 pies =
 * 5 px del SVG): zona pintada de 16 ft, línea de tiros libres a 19 ft, aro a
 * 5 ft de la línea de fondo (el motor de IA lo ubica en x=50, y=10), triple de
 * 23,75 ft con esquinas a 22 ft, área restringida de 4 ft y línea de medio campo
 * a 47 ft. Todo lo que el motor devuelve se dibuja encima:
 *   - mapa de calor  -> zonas de espacio libre reales (heat_map_coords)
 *   - vectores       -> la acción recomendada (tiro / pase / penetración)
 *   - reacción rival -> dónde se moverá la defensa (predicted_defense)
 *
 * Guardar en: tactical-sim-frontend/src/components/courts/BasketballCourt.jsx
 */

export const BB_SCALE = 5;
/** El balón se dibuja ligeramente desplazado para no tapar el número del jugador que lo porta. */
export const BB_BALL_OFFSET = { x: 17, y: 14 };
const HOOP = { x: 250, y: 50 };

export const bbToPercent = (sx, sy) => ({ x: sx / BB_SCALE, y: sy / BB_SCALE });
export const bbClamp = (p) => ({
  x: Math.max(3, Math.min(97, p.x)),
  y: Math.max(3, Math.min(93, p.y)),
});

const px = (p) => ({ x: p.x * BB_SCALE, y: p.y * BB_SCALE });

/** Acorta un segmento para que la flecha no se meta debajo de las fichas. */
function trim(a, b, startGap, endGap) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  return {
    from: { x: a.x + ux * startGap, y: a.y + uy * startGap },
    to: { x: b.x - ux * endGap, y: b.y - uy * endGap },
    mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    len,
  };
}

function nearestOffense(positions) {
  const ball = positions.ball;
  let best = null, bestD = Infinity;
  ['j1', 'j2', 'j3', 'j4', 'j5'].forEach((k) => {
    const p = positions[k];
    if (!p) return;
    const d = Math.hypot(p.x - ball.x, p.y - ball.y);
    if (d < bestD) { bestD = d; best = k; }
  });
  return best;
}

const Court = () => (
  <>
    <defs>
      <pattern id="ta-wood" width="72" height="500" patternUnits="userSpaceOnUse">
        {[['#d8a866', 0], ['#cf9d5c', 12], ['#dfb273', 24], ['#d3a361', 36], ['#dcae6d', 48], ['#cd9a58', 60]].map(([c, x]) => (
          <rect key={x} x={x} y="0" width="12" height="500" fill={c} />
        ))}
        {[0, 12, 24, 36, 48, 60].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="#8a5f2a" strokeOpacity="0.28" strokeWidth="0.7" />)}
        {[[6, 120], [18, 300], [30, 60], [42, 410], [54, 210], [66, 350]].map(([x, y]) => <line key={x} x1={x - 6} y1={y} x2={x + 6} y2={y} stroke="#8a5f2a" strokeOpacity="0.3" strokeWidth="0.7" />)}
      </pattern>
      <radialGradient id="ta-spot" cx="50%" cy="22%" r="80%">
        <stop offset="0" stopColor="#fff" stopOpacity="0.30" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.38" />
      </radialGradient>
      <linearGradient id="ta-paint" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a4680" />
        <stop offset="1" stopColor="#1d3262" />
      </linearGradient>
    </defs>

    {/* zona fuera de juego */}
    <rect x="-26" y="-26" width="552" height="552" fill="#0d131b" />
    <rect x="-8" y="-8" width="516" height="486" rx="3" fill="#7b5a36" />
    {/* parquet */}
    <rect x="0" y="0" width="500" height="470" fill="url(#ta-wood)" />
    {/* zona pintada */}
    <rect x="170" y="0" width="160" height="190" fill="url(#ta-paint)" />
    <circle cx="250" cy="190" r="60" fill="#2a4680" />
    <text x="250" y="132" textAnchor="middle" fontSize="27" letterSpacing="9" fill="#fff" fillOpacity="0.16" fontFamily="'Barlow Condensed'" fontWeight="800">TACTICAI</text>

    <g fill="none" stroke="#f7f2e7" strokeWidth="3" strokeLinecap="round">
      <rect x="0" y="0" width="500" height="470" />
      <rect x="170" y="0" width="160" height="190" />
      <path d="M190 190 A60 60 0 0 1 310 190" />
      <path d="M190 190 A60 60 0 0 0 310 190" strokeDasharray="9 9" />
      <path d="M30 0 V139.5 A237.5 237.5 0 0 0 470 139.5 V0" />
      <path d="M210 50 A40 40 0 0 0 290 50" strokeWidth="2.6" />
      <path d="M190 470 A60 60 0 0 1 310 470" />
      <path d="M230 470 A20 20 0 0 1 270 470" strokeWidth="2.4" />
      {[80, 110, 140, 170].map((y) => (
        <g key={y} strokeWidth="2.6"><line x1="162" y1={y} x2="170" y2={y} /><line x1="330" y1={y} x2="338" y2={y} /></g>
      ))}
      <line x1="220" y1="40" x2="280" y2="40" strokeWidth="5" />
      <line x1="250" y1="40" x2="250" y2="41" />
    </g>
    <circle cx={HOOP.x} cy={HOOP.y} r="9" fill="none" stroke="#ff6a13" strokeWidth="3.6" />
    <circle cx={HOOP.x} cy={HOOP.y} r="9" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
    <rect x="0" y="0" width="500" height="470" fill="url(#ta-spot)" pointerEvents="none" />
  </>
);

const Arrow = ({ id, color }) => (
  <marker id={id} markerWidth="9" markerHeight="9" refX="6.5" refY="4.5" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 9 9">
    <path d="M0 0 L9 4.5 L0 9 L2.4 4.5 z" fill={color} />
  </marker>
);

const Action = ({ result, positions }) => {
  const action = result?.recommended_action || '';
  const holderKey = nearestOffense(positions);
  const holder = px(positions[holderKey]);
  const labelPill = (pt, text) => (
    <g transform={`translate(${pt.x}, ${pt.y})`}>
      <rect x={-text.length * 4.6 - 9} y="-13" width={text.length * 9.2 + 18} height="26" rx="13" fill="#0a0f16" fillOpacity="0.88" stroke="var(--ta-accent)" strokeWidth="1.5" />
      <text textAnchor="middle" y="6" fontSize="16" letterSpacing="1.5" fill="var(--ta-accent)">{text}</text>
    </g>
  );

  if (action === 'TIRO_INMEDIATO') {
    const t = trim(holder, HOOP, 24, 14);
    return (
      <g>
        <circle cx={HOOP.x} cy={HOOP.y} r="14" fill="none" stroke="var(--ta-accent)" strokeWidth="3" className="ta-pulse" />
        <line x1={t.from.x} y1={t.from.y} x2={t.to.x} y2={t.to.y} stroke="var(--ta-accent)" strokeWidth="4.5" strokeLinecap="round" className="ta-flow" markerEnd="url(#ta-ar)" />
        {labelPill(t.mid, 'TIRO')}
      </g>
    );
  }
  if (action.startsWith('PASE_A_')) {
    const rk = action.replace('PASE_A_', '').toLowerCase();
    const rp = positions[rk];
    if (rp) {
      const t = trim(holder, px(rp), 24, 26);
      return (
        <g>
          <circle cx={px(rp).x} cy={px(rp).y} r="27" fill="none" stroke="var(--ta-accent)" strokeWidth="3" className="ta-pulse" />
          <line x1={t.from.x} y1={t.from.y} x2={t.to.x} y2={t.to.y} stroke="var(--ta-accent)" strokeWidth="4.5" strokeLinecap="round" className="ta-flow" markerEnd="url(#ta-ar)" />
          {labelPill(t.mid, `PASE ${rk.toUpperCase()}`)}
        </g>
      );
    }
  }
  if (action === 'PENETRAR_AL_ARO') {
    const t = trim(holder, { x: HOOP.x, y: HOOP.y + 24 }, 24, 8);
    const nx = -(t.to.y - t.from.y), ny = t.to.x - t.from.x;
    const n = Math.hypot(nx, ny) || 1;
    const c1 = { x: t.from.x + (t.to.x - t.from.x) * 0.3 + (nx / n) * 38, y: t.from.y + (t.to.y - t.from.y) * 0.3 + (ny / n) * 38 };
    const c2 = { x: t.from.x + (t.to.x - t.from.x) * 0.7 - (nx / n) * 38, y: t.from.y + (t.to.y - t.from.y) * 0.7 - (ny / n) * 38 };
    return (
      <g>
        <path d={`M ${t.from.x} ${t.from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${t.to.x} ${t.to.y}`} fill="none" stroke="var(--ta-accent)" strokeWidth="5" strokeLinecap="round" className="ta-flow" markerEnd="url(#ta-ar)" />
        {labelPill(t.mid, 'PENETRACIÓN')}
      </g>
    );
  }
  return (
    <g transform={`translate(${holder.x}, ${holder.y})`}>
      <circle r="30" fill="none" stroke="var(--ta-accent)" strokeWidth="3" strokeDasharray="6 6" className="ta-flow" />
      {labelPill({ x: 0, y: -48 }, 'REPOSICIONAR')}
    </g>
  );
};

const Token = ({ id, pos, kind, dragging, bind, isHolder }) => {
  const { x, y } = px(pos);
  const label = id.toUpperCase();
  if (kind === 'ball') {
    return (
      <g className="ta-token" data-drag={dragging ? 1 : 0} style={{ transform: `translate(${x + BB_BALL_OFFSET.x}px, ${y + BB_BALL_OFFSET.y}px)`, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,.5))' }} {...bind}>
        <circle r="22" fill="transparent" />
        <circle r="11.5" fill="url(#ta-ball)" stroke="#2a1405" strokeWidth="1.2" />
        <path d="M-11 0 H11 M0 -11.5 V11.5 M-8 -8 Q0 0 -8 8 M8 -8 Q0 0 8 8" fill="none" stroke="#2a1405" strokeWidth="1" strokeOpacity="0.75" />
      </g>
    );
  }
  const off = kind === 'off';
  return (
    <g className="ta-token" data-drag={dragging ? 1 : 0} style={{ transform: `translate(${x}px, ${y}px)`, filter: 'drop-shadow(0 5px 4px rgba(0,0,0,.45))' }} {...bind}>
      {isHolder && <circle r="29" fill="none" stroke="var(--ta-accent)" strokeWidth="2.5" strokeOpacity="0.8" />}
      <circle r="20" fill={off ? 'url(#ta-off)' : 'url(#ta-def)'} stroke="#fff" strokeWidth="2.6" className="ta-token-ring" strokeOpacity="0.95" />
      {!off && <circle r="14.5" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="2 3" />}
      <text textAnchor="middle" y="6.5" fontSize="19" fill="#fff" letterSpacing="0.5">{label}</text>
    </g>
  );
};

export const BasketballCourt = ({ positions, result, showHeat, showVectors, showRival, drag, liveHeat }) => {
  const holderKey = useMemo(() => nearestOffense(positions), [positions]);
  const heat = result?.heat_map_coords || [];
  const ghosts = result?.predicted_defense || [];

  return (
    <svg ref={drag.svgRef} className="ta-court" data-sport="BASKETBALL" viewBox="-26 -26 552 552" role="img" aria-label="Media cancha de baloncesto interactiva">
      <defs>
        <radialGradient id="ta-off" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#7d9bff" /><stop offset="1" stopColor="#1f45d6" /></radialGradient>
        <radialGradient id="ta-def" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#ff7b86" /><stop offset="1" stopColor="#b3162b" /></radialGradient>
        <radialGradient id="ta-ball" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#ffb25e" /><stop offset="1" stopColor="#d9570b" /></radialGradient>
        <radialGradient id="ta-heat"><stop offset="0" stopColor="#3ddc97" stopOpacity="0.85" /><stop offset="0.6" stopColor="#3ddc97" stopOpacity="0.3" /><stop offset="1" stopColor="#3ddc97" stopOpacity="0" /></radialGradient>
        <Arrow id="ta-ar" color="#ff7a1a" />
      </defs>
      <Court />

      {/* Espacio libre rentable calculado en vivo por los Web Workers (funciona sin internet) */}
      {liveHeat?.url && (
        <image className="ta-live-heat" href={liveHeat.url} x="0" y="0" width="500" height="470" preserveAspectRatio="none" opacity="0.85" pointerEvents="none" />
      )}

      {showHeat && heat.length > 0 && (
        <g className="ta-ghost" pointerEvents="none">
          {heat.map(([hx, hy], i) => (
            <circle key={i} cx={hx * BB_SCALE} cy={hy * BB_SCALE} r={i === 0 ? 92 : 62} fill="url(#ta-heat)" opacity={i === 0 ? 1 : 0.7} />
          ))}
        </g>
      )}

      {showRival && ghosts.length > 0 && (
        <g className="ta-ghost" pointerEvents="none">
          {ghosts.map((g) => {
            const key = g.player_id.toLowerCase();
            const cur = positions[key];
            if (!cur) return null;
            const a = px(cur), b = { x: g.x * BB_SCALE, y: g.y * BB_SCALE };
            return (
              <g key={g.player_id}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ff7b86" strokeWidth="3" strokeDasharray="3 7" strokeLinecap="round" />
                <circle cx={b.x} cy={b.y} r="20" fill="#e5383b" fillOpacity="0.2" stroke="#ff7b86" strokeWidth="2.4" strokeDasharray="5 5" />
                <text x={b.x} y={b.y + 6} textAnchor="middle" fontFamily="'Barlow Condensed'" fontWeight="800" fontSize="17" fill="#ffd0d5">{g.player_id}</text>
              </g>
            );
          })}
        </g>
      )}

      {showVectors && result && <g className="ta-ghost" pointerEvents="none"><Action result={result} positions={positions} /></g>}

      {Object.entries(positions).filter(([k]) => k !== 'ball').map(([k, pos]) => (
        <Token key={k} id={k} pos={pos} kind={k.startsWith('j') ? 'off' : 'def'} dragging={drag.draggingKey === k} bind={drag.bind(k)} isHolder={!!result && k === holderKey} />
      ))}
      <Token id="ball" pos={positions.ball} kind="ball" dragging={drag.draggingKey === 'ball'} bind={drag.bind('ball')} />
    </svg>
  );
};
