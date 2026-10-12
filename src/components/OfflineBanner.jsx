import React from 'react';
import { Notice } from './ui/Shell';

/**
 * OfflineBanner
 *
 * Aviso visible cuando el navegador detecta que no hay conexión a
 * internet. Deja claro al usuario que está en "Modo Campo": puede seguir
 * editando y guardando pizarras localmente, pero no puede ejecutar
 * simulaciones con IA ni guardar en el historial del equipo hasta que
 * vuelva la conexión.
 *
 * Guardar en: tactical-sim-frontend/src/components/OfflineBanner.jsx
 */
export const OfflineBanner = () => (
  <Notice tone="warn" icon="wifioff">
    <b>Modo Campo activo: sin conexión a internet.</b> Puedes seguir editando y
    guardando pizarras en este dispositivo; la simulación con IA y el historial
    del equipo se reactivan automáticamente al recuperar la señal.
  </Notice>
);
