'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * PublicNav (componente de CLIENTE: necesita saber la ruta activa).
 * Guardar en: tactical-sim-frontend/src/components/public/PublicNav.jsx
 */
const LINKS = [
  { href: '/', label: 'Aplicación', tag: 'CSR' },
  { href: '/metodologia', label: 'Metodología', tag: 'SSG' },
  { href: '/jugadas', label: 'Jugadas', tag: 'SSG' },
  { href: '/modelo', label: 'Modelo', tag: 'ISR' },
  { href: '/estado', label: 'Estado', tag: 'SSR' },
  { href: '/plataforma', label: 'Plataforma', tag: 'Streaming' },
];

export function PublicNav() {
  const pathname = usePathname() || '/';
  return (
    <nav className="ta-pub-nav" aria-label="Secciones públicas">
      {LINKS.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} className="ta-pub-link" aria-current={active ? 'page' : undefined}>
            {l.label}<small>{l.tag}</small>
          </Link>
        );
      })}
    </nav>
  );
}
