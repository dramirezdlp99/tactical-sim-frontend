import React from 'react';
import { Icon } from './Icon';
import ThemeToggle from '../ThemeToggle';

/**
 * Shell.jsx
 * Piezas de estructura compartidas por TODAS las pantallas internas:
 * la marca (BrandMark), la barra superior (TopBar) y el aviso de modo
 * campo. Así los dos simuladores y el historial comparten exactamente la
 * misma cabecera sin repetir código.
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/Shell.jsx
 */
export const BrandMark = ({ size = 34 }) => (
  <svg className="ta-brand-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <linearGradient id="ta-bm" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--ta-accent)" />
        <stop offset="1" stopColor="#ff3d71" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="#0d131c" stroke="url(#ta-bm)" strokeWidth="1.5" />
    <path d="M7 29c3-11 9-17 26-18" fill="none" stroke="url(#ta-bm)" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 5.5" />
    <path d="M8 31 31 12" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    <path d="m24 11.5 8 .5-.8 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="30" r="3" fill="url(#ta-bm)" />
  </svg>
);

export const Brand = () => (
  <div className="ta-brand">
    <BrandMark />
    <span className="ta-brand-name">TACTIC<b>AI</b></span>
  </div>
);

export const SportSwitch = ({ sport, onBasketball, onTennis }) => (
  <div className="ta-switch" role="group" aria-label="Deporte">
    <button type="button" aria-pressed={sport === 'BASKETBALL'} onClick={sport === 'BASKETBALL' ? undefined : onBasketball}>
      <Icon name="basketball" /> Baloncesto
    </button>
    <button type="button" aria-pressed={sport === 'TENNIS'} onClick={sport === 'TENNIS' ? undefined : onTennis}>
      <Icon name="tennis" /> Tenis
    </button>
  </div>
);

export const TopBar = ({ user, isOnline = true, sport, onBasketball, onTennis, onLogout, onViewHistory, onBack, modeLabel, children }) => (
  <header className="ta-top">
    <Brand />
    {sport && <SportSwitch sport={sport} onBasketball={onBasketball} onTennis={onTennis} />}
    {onBack && (
      <button type="button" className="ta-btn" onClick={onBack}>
        <Icon name="arrowleft" /> Volver al simulador
      </button>
    )}
    <div className="ta-top-spacer" />
    {children}
    {modeLabel && <span className="ta-chip ta-hide-sm">{modeLabel}</span>}
    <span className="ta-pill ta-hide-sm" data-state={isOnline ? 'on' : 'off'}>
      <span className="ta-dot" />
      {isOnline ? 'MOTOR IA EN LÍNEA' : 'MODO CAMPO · SIN RED'}
    </span>
    {user?.role === 'ROLE_ANALYST' && onViewHistory && (
      <button type="button" className="ta-btn ta-hide-sm" onClick={onViewHistory}>
        <Icon name="chart" /> Historial
      </button>
    )}
    <ThemeToggle />
    <div className="ta-user">
      <div className="ta-avatar">{user?.email?.charAt(0).toUpperCase() || 'A'}</div>
      <span className="ta-user-mail">{user?.email}</span>
    </div>
    <button type="button" className="ta-iconbtn danger" onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión">
      <Icon name="logout" />
    </button>
  </header>
);

export const Notice = ({ tone = 'info', icon = 'info', children }) => (
  <div className={`ta-notice ${tone}`} role={tone === 'err' ? 'alert' : 'status'}>
    <Icon name={icon} />
    <div>{children}</div>
  </div>
);
