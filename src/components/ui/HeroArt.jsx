import React from 'react';

/**
 * HeroArt
 * Ilustración de fondo del login/registro: una pizarra táctica gigante
 * (líneas de cancha en trazo fino, fichas, flechas de pase animadas y una
 * mancha de calor). Es la primera impresión de la plataforma: en vez de un
 * formulario sobre fondo liso, el usuario ve de inmediato qué hace TacticAI.
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/HeroArt.jsx
 */
export const HeroArt = () => (
  <svg className="ta-hero-art" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="ha-heat"><stop offset="0" stopColor="#3ddc97" stopOpacity="0.55" /><stop offset="1" stopColor="#3ddc97" stopOpacity="0" /></radialGradient>
      <linearGradient id="ha-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--ta-hero-bg)" stopOpacity="0" /><stop offset="0.75" stopColor="var(--ta-hero-bg)" stopOpacity="0.85" /></linearGradient>
      <marker id="ha-ar" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 10 10"><path d="M0 0 L10 5 L0 10 L2.6 5 z" fill="#ff7a1a" /></marker>
    </defs>
    <g transform="translate(250 30) scale(1.1)">
      <g fill="none" stroke="var(--ta-hero-line)" strokeOpacity="0.18" strokeWidth="2">
        <rect x="0" y="0" width="500" height="470" />
        <rect x="170" y="0" width="160" height="190" />
        <path d="M190 190 A60 60 0 0 1 310 190" />
        <path d="M190 190 A60 60 0 0 0 310 190" strokeDasharray="8 8" />
        <path d="M30 0 V139.5 A237.5 237.5 0 0 0 470 139.5 V0" />
        <path d="M210 50 A40 40 0 0 0 290 50" />
        <circle cx="250" cy="50" r="9" stroke="#ff7a1a" strokeOpacity="0.9" strokeWidth="3" />
      </g>
      <circle cx="370" cy="200" r="120" fill="url(#ha-heat)" />
      <path d="M205 400 Q 250 310 372 232" fill="none" stroke="#ff7a1a" strokeWidth="3.4" strokeLinecap="round" className="ta-flow" markerEnd="url(#ha-ar)" />
      <path d="M392 222 Q 420 120 272 66" fill="none" stroke="#ff7a1a" strokeWidth="3.4" strokeLinecap="round" className="ta-flow" markerEnd="url(#ha-ar)" />
      {[[190, 420, 'J1', 'o'], [395, 245, 'J3', 'o'], [90, 300, 'J2', 'o'], [440, 390, 'J4', 'o'], [235, 370, 'D1', 'd'], [350, 190, 'D3', 'd'], [150, 250, 'D2', 'd'], [270, 120, 'D5', 'd']].map(([x, y, t, k]) => (
        <g key={t} transform={`translate(${x} ${y})`}>
          <circle r="24" fill={k === 'o' ? '#2b55e6' : '#c42036'} stroke="#fff" strokeWidth="3" />
          <text textAnchor="middle" y="8" fontFamily="'Barlow Condensed'" fontWeight="800" fontSize="22" fill="#fff">{t}</text>
        </g>
      ))}
    </g>
    <rect width="800" height="900" fill="url(#ha-fade)" />
  </svg>
);
