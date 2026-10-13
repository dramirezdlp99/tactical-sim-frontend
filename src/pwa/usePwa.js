import { useSyncExternalStore } from 'react';
import { getPwaState, subscribePwa } from './pwaStore';
import { promptInstall } from './registerSW';

/**
 * usePwa: { supported, offlineReady, canInstall, installed, install }
 * Guardar en: tactical-sim-frontend/src/pwa/usePwa.js
 */
export function usePwa() {
  const s = useSyncExternalStore(subscribePwa, getPwaState, getPwaState);
  return {
    supported: s.supported,
    offlineReady: s.ready,
    canInstall: !!s.installEvent,
    installed: s.installed,
    install: promptInstall,
  };
}
