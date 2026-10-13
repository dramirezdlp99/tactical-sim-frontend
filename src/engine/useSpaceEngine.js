import { useEffect, useRef, useState, useCallback } from 'react';
import { SpaceEngine } from './SpaceEngine';
import { paintGrid } from './heatImage';

/**
 * useSpaceEngine
 * Conecta la pizarra con el laboratorio local (Workers + memoria compartida):
 * cada vez que cambian las posiciones, recalcula el mapa de espacio libre y la
 * estimacion Monte Carlo SIN bloquear la interfaz y SIN necesitar internet.
 *
 * Devuelve:
 *   mode / threads  -> como se esta ejecutando ('shared' | 'copy' | 'main')
 *   metrics         -> { successRate, meanSeparationFt, openZonesPct, ms, samples }
 *   heat            -> { url } imagen del mapa para dibujar en la cancha
 *   benchmark()     -> compara 1 hilo contra el pool y guarda el resultado en `bench`
 *
 * Guardar en: tactical-sim-frontend/src/engine/useSpaceEngine.js
 */
export function useSpaceEngine(sport, positions, { samples = 6000 } = {}) {
  const engineRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState({ mode: 'init', threads: 0, isolated: false });
  const [metrics, setMetrics] = useState(null);
  const [heat, setHeat] = useState(null);
  const [bench, setBench] = useState(null);
  const [benching, setBenching] = useState(false);

  useEffect(() => {
    let alive = true;
    const engine = new SpaceEngine();
    engineRef.current = engine;
    engine.init().then(() => {
      if (!alive) return;
      setInfo({ mode: engine.mode, threads: engine.mode === 'main' ? 1 : engine.threads, isolated: engine.caps.isolated });
      setReady(true);
    });
    return () => { alive = false; engine.dispose(); engineRef.current = null; };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!ready || !engine) return undefined;
    let cancelled = false;
    // requestAnimationFrame agrupa los cambios rapidos del arrastre en un solo calculo por cuadro.
    const frame = requestAnimationFrame(async () => {
      const r = await engine.run(sport, positions, { samples });
      if (!r || cancelled) return;
      setMetrics({ successRate: r.successRate, meanSeparationFt: r.meanSeparationFt, openZonesPct: r.openZonesPct, ms: r.ms, samples: r.samples });
      setHeat(paintGrid(r.grid, sport));
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [ready, sport, positions, samples]);

  const benchmark = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    setBenching(true);
    try {
      setBench(await engine.benchmark(sport, positions));
    } finally {
      setBenching(false);
    }
  }, [sport, positions]);

  return { ready, ...info, metrics, heat, bench, benching, benchmark };
}
