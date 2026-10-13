'use client';

import { useEffect } from 'react';
import { initPwa } from '../pwa/registerSW';

/**
 * PwaRegister: registra el Service Worker (solo en produccion) una vez que la
 * pagina cargo. No dibuja nada.
 * Guardar en: tactical-sim-frontend/src/components/PwaRegister.jsx
 */
export default function PwaRegister() {
  useEffect(() => {
    initPwa({ enabled: process.env.NODE_ENV === 'production' });
  }, []);
  return null;
}
