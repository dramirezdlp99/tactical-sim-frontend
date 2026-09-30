import React from 'react';

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
  <div className="mb-6 p-3 bg-amber-100 border border-amber-300 text-amber-900 text-xs rounded-lg font-semibold flex items-center gap-2">
    <span className="material-symbols-outlined text-sm">wifi_off</span>
    Modo Campo activo: sin conexión a internet. Puedes seguir editando y
    guardando pizarras localmente en este dispositivo; la simulación con IA
    y el historial del equipo se reactivan automáticamente al recuperar la
    señal.
  </div>
);