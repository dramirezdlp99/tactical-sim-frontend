'use client';

import React, { useEffect, useState } from 'react';

/**
 * ThemeToggle: alterna entre modo claro (por defecto) y modo oscuro.
 * La eleccion se guarda en localStorage ('ta-theme'); el script de arranque del
 * layout la aplica antes de pintar para que no haya parpadeo.
 *
 * Guardar en: tactical-sim-frontend/src/components/ThemeToggle.jsx
 */
export const THEME_KEY = 'ta-theme';

const Sun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const Moon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#080b10' : '#f3f5f9');
}

export default function ThemeToggle({ floating = false }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* almacenamiento bloqueado: el cambio vale solo para esta visita */ }
  };

  const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  return (
    <button
      type="button"
      className={`ta-theme-btn${floating ? ' ta-theme-float' : ''}`}
      onClick={toggle}
      title={label}
      aria-label={label}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}
