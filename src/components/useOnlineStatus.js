import { useState, useEffect } from 'react';

/**
 * useOnlineStatus
 *
 * Hook que expone si el navegador tiene conexión a internet en este
 * momento, actualizado en tiempo real mediante los eventos nativos
 * 'online' y 'offline' del navegador (no requiere ninguna librería
 * externa ni llamadas al backend para verificarlo).
 *
 * Se usa en TacticalSimulator.jsx y TennisSimulator.jsx para activar el
 * "Modo Campo": cuando no hay conexión, se deshabilitan las acciones que
 * dependen del backend (simular con IA, guardar en el historial del
 * equipo) pero se deja disponible todo lo que sí puede funcionar sin red
 * (editar la pizarra, guardar/cargar pizarras locales con IndexedDB).
 *
 * Guardar en: tactical-sim-frontend/src/components/useOnlineStatus.js
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}