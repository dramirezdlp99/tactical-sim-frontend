import React from 'react';
import Link from 'next/link';
import { Brand } from '../ui/Shell';
import { PublicNav } from './PublicNav';
import { RenderBadge } from './RenderBadge';
import ThemeToggle from '../ThemeToggle';

/**
 * PublicShell (componente de SERVIDOR): marco comun de las paginas publicas
 * (cabecera con navegacion, contenido y pie).
 * Guardar en: tactical-sim-frontend/src/components/public/PublicShell.jsx
 */
export function PublicShell({ children }) {
  return (
    <div className="ta-pub">
      <header className="ta-pub-top">
        <Link href="/" className="ta-pub-brand" aria-label="TacticAI, ir a la aplicación"><Brand /></Link>
        <PublicNav />
        <ThemeToggle />
      </header>
      <main className="ta-pub-main">{children}</main>
      <footer className="ta-pub-foot">
        <span>TacticAI · Caso de Estudio 2 · Simulador táctico de baloncesto y tenis</span>
        <Link href="/renderizado">Mapa de renderizado</Link>
      </footer>
    </div>
  );
}

export function PageHead({ eyebrow, title, lead, mode, when, note }) {
  return (
    <section className="ta-pub-head">
      <span className="ta-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="ta-pub-lead">{lead}</p>
      {mode && <RenderBadge mode={mode} when={when} note={note} />}
    </section>
  );
}
