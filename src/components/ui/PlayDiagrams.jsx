import React from 'react';

/**
 * PlayDiagrams
 * Mini diagramas SVG de las jugadas (baloncesto, tenis y "posicion libre").
 * Son componentes PUROS (sin estado ni efectos), por eso los comparten el libro
 * de jugadas del simulador y las paginas publicas /jugadas (que se generan en
 * el servidor).
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/PlayDiagrams.jsx
 */

export const MiniBasket = ({ positions }) => (
  <svg className="ta-mini" viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" fill="#d6a566" opacity="0.92" />
    <rect x="31" y="0" width="38" height="38" fill="#233a68" />
    <path d="M6 0v28a44 44 0 0 0 88 0V0" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.9" />
    <rect x="31" y="0" width="38" height="38" fill="none" stroke="#fff" strokeWidth="1.2" />
    <circle cx="50" cy="10" r="2.4" fill="none" stroke="#ff7a1a" strokeWidth="1.4" />
    {positions && Object.entries(positions).map(([k, p]) => {
      if (k === 'ball') return <circle key={k} cx={p.x} cy={p.y} r="3" fill="#ff8a2b" stroke="#fff" strokeWidth="0.8" />;
      const off = k.startsWith('j');
      return <circle key={k} cx={p.x} cy={p.y} r="4.3" fill={off ? '#3b6bff' : '#e5383b'} stroke="#fff" strokeWidth="1" />;
    })}
  </svg>
);

export const MiniTennis = ({ positions }) => {
  // Cancha en vertical dentro del cuadrado: ancho 54 y alto 96, centrada.
  const mx = (x) => 23 + (x / 100) * 54;
  const my = (y) => 2 + (y / 100) * 96;
  return (
    <svg className="ta-mini" viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" fill="#1b4f86" />
      <rect x="23" y="2" width="54" height="96" fill="#2f6fb3" stroke="#fff" strokeWidth="1.2" />
      <line x1="23" y1="50" x2="77" y2="50" stroke="#fff" strokeWidth="2" />
      <line x1="23" y1={my(28.6)} x2="77" y2={my(28.6)} stroke="#fff" strokeWidth="1" />
      <line x1="23" y1={my(71.4)} x2="77" y2={my(71.4)} stroke="#fff" strokeWidth="1" />
      <line x1="50" y1={my(28.6)} x2="50" y2={my(71.4)} stroke="#fff" strokeWidth="1" />
      {positions && (
        <>
          <circle cx={mx(positions.ball.x)} cy={my(positions.ball.y)} r="3.4" fill="#c8f03c" stroke="#fff" strokeWidth="0.8" />
          <circle cx={mx(positions.alcaraz.x)} cy={my(positions.alcaraz.y)} r="4.6" fill="#c8f03c" stroke="#10150a" strokeWidth="1" />
          <circle cx={mx(positions.sinner.x)} cy={my(positions.sinner.y)} r="4.6" fill="#fff" stroke="#10150a" strokeWidth="1" />
        </>
      )}
    </svg>
  );
};

export const FreeIcon = ({ sport }) => (
  <svg className="ta-mini" viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" fill={sport === 'TENNIS' ? '#1b4f86' : '#16202f'} />
    <path d="M30 70 L50 30 L70 70" fill="none" stroke="var(--ta-accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7" />
    <circle cx="30" cy="70" r="6" fill="var(--ta-accent)" />
    <circle cx="70" cy="70" r="6" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="50" cy="30" r="6" fill="none" stroke="#fff" strokeWidth="2" />
  </svg>
);
