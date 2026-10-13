'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { BrandMark } from './ui/Shell';

/**
 * AppClient: la aplicacion interactiva (login, simuladores, historial,
 * proyector) se renderiza SOLO en el navegador (CSR). Usa localStorage,
 * IndexedDB, Web Workers, WebSocket y arrastre con el puntero: nada de eso
 * existe en el servidor, asi que se carga con ssr:false y mientras tanto el
 * servidor entrega esta pantalla de arranque.
 *
 * Guardar en: tactical-sim-frontend/src/components/AppClient.jsx
 */
function Splash() {
  return (
    <div className="ta-splash" role="status" aria-live="polite">
      <BrandMark size={56} />
      <span>Cargando la sala táctica…</span>
    </div>
  );
}

const App = dynamic(() => import('../App'), { ssr: false, loading: () => <Splash /> });

export default function AppClient() {
  return <App />;
}
