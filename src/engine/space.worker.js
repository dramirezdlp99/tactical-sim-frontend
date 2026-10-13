/**
 * space.worker.js
 *
 * Hilo de calculo del laboratorio local. Cada Worker recibe un numero de
 * hilo `w` (de `n`) y se encarga de SU franja de filas del mapa y de SU
 * porcion de muestras Monte Carlo.
 *
 * Dos modos (los elige SpaceEngine segun lo que permita el navegador):
 *   - MEMORIA COMPARTIDA: el mapa, las posiciones y los contadores viven en
 *     SharedArrayBuffer. Todos los hilos escriben en el MISMO mapa y suman a
 *     contadores comunes con Atomics.add, sin copiar datos entre hilos. El
 *     ultimo hilo en terminar avisa al hilo principal.
 *   - COPIA: cada hilo devuelve su franja (transferida, no clonada) y el hilo
 *     principal la ensambla. Se usa cuando el sitio no esta aislado
 *     (cross-origin isolated) y por tanto SharedArrayBuffer no esta permitido.
 *
 * Guardar en: tactical-sim-frontend/src/engine/space.worker.js
 */
import { computeBand, runSamples, GW } from './spaceMath.js';

let shared = null; // { grid, inp, ctrl } cuando hay memoria compartida

self.onmessage = (event) => {
  const m = event.data;

  if (m.type === 'init') {
    if (m.shared) {
      shared = {
        grid: new Float32Array(m.grid),
        inp: new Float32Array(m.inp),
        ctrl: new Int32Array(m.ctrl),
      };
    }
    self.postMessage({ type: 'ready' });
    return;
  }

  if (m.type !== 'run') return;

  const inp = shared ? shared.inp : m.inp;
  const rows = inp[3] | 0;
  const k = inp[1] | 0;
  const r0 = Math.floor((rows * m.w) / m.n);
  const r1 = Math.floor((rows * (m.w + 1)) / m.n);
  const s0 = Math.floor((k * m.w) / m.n);
  const s1 = Math.floor((k * (m.w + 1)) / m.n);
  const seed = ((inp[2] | 0) * 31 + m.w * 7919 + 1) >>> 0;

  if (shared) {
    const { grid, ctrl } = shared;
    const high = computeBand(grid, inp, r0, r1, 0);
    const { succ, sep } = runSamples(inp, s0, s1, seed);
    Atomics.add(ctrl, 2, high);
    Atomics.add(ctrl, 3, succ);
    Atomics.add(ctrl, 4, sep);
    // El ultimo hilo en llegar avisa. Atomics.add sincroniza las escrituras de todos los hilos.
    if (Atomics.add(ctrl, 1, 1) + 1 === m.n) self.postMessage({ type: 'done', gen: m.gen });
    return;
  }

  const band = new Float32Array(Math.max(0, r1 - r0) * GW);
  const high = computeBand(band, inp, r0, r1, r0);
  const { succ, sep } = runSamples(inp, s0, s1, seed);
  self.postMessage({ type: 'done', gen: m.gen, w: m.w, r0, band, high, succ, sep }, [band.buffer]);
};
