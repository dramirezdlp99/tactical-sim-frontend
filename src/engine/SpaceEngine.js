/**
 * SpaceEngine.js
 *
 * Administra el "pool" de Web Workers del laboratorio local y decide el modo
 * de ejecucion mas potente que permita el navegador:
 *
 *   'shared' -> N hilos + SharedArrayBuffer + Atomics (requiere que el sitio
 *               este aislado: cabeceras COOP/COEP, ver docs/ARQUITECTURA.md)
 *   'copy'   -> N hilos, cada uno devuelve su franja (sin memoria compartida)
 *   'main'   -> sin Workers: todo en el hilo principal (ultimo recurso)
 *
 * Solo hay una peticion en vuelo a la vez; si llegan mas mientras se calcula
 * (por ejemplo al arrastrar una ficha), se conserva SOLO la ultima: lo
 * demas ya no importa y asi la pizarra nunca se atrasa.
 *
 * Guardar en: tactical-sim-frontend/src/engine/SpaceEngine.js
 */
import { GW, GH, INPUT_LEN, packInput, computeAll, computeBand, runSamples, summarize, totalCells } from './spaceMath.js';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function detectCapabilities() {
  const hasWorker = typeof Worker !== 'undefined';
  const isolated = typeof globalThis.crossOriginIsolated !== 'undefined' ? globalThis.crossOriginIsolated : false;
  const hasSab = typeof SharedArrayBuffer !== 'undefined' && isolated;
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
  return { hasWorker, isolated, hasSab, cores };
}

export class SpaceEngine {
  constructor({ threads } = {}) {
    const caps = detectCapabilities();
    this.caps = caps;
    // Dejamos un nucleo libre para la interfaz, pero siempre al menos 2 hilos (con 1 no habria paralelismo).
    this.threads = Math.max(2, Math.min(threads || 4, caps.cores - 1, 6));
    this.mode = 'main';
    this.workers = [];
    this.ready = false;
    this._busy = false;
    this._pending = null;
    this._gen = 0;
    this._disposed = false;
  }

  /** Crea los workers. Si algo falla, cae al modo 'main' sin romper la app. */
  async init() {
    const { hasWorker, hasSab } = this.caps;
    if (!hasWorker) { this.mode = 'main'; this.ready = true; return this; }

    try {
      if (hasSab) {
        this.sabGrid = new SharedArrayBuffer(GW * GH * 4);
        this.sabInp = new SharedArrayBuffer(INPUT_LEN * 4);
        this.sabCtrl = new SharedArrayBuffer(8 * 4);
        this.grid = new Float32Array(this.sabGrid);
        this.inp = new Float32Array(this.sabInp);
        this.ctrl = new Int32Array(this.sabCtrl);
      } else {
        this.grid = new Float32Array(GW * GH);
        this.inp = new Float32Array(INPUT_LEN);
      }

      const boot = [];
      for (let i = 0; i < this.threads; i++) {
        const worker = new Worker(new URL('./space.worker.js', import.meta.url), { type: 'module' });
        this.workers.push(worker);
        boot.push(new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('worker sin respuesta')), 4000);
          worker.onmessage = (e) => { if (e.data?.type === 'ready') { clearTimeout(timer); resolve(); } };
          worker.onerror = (e) => { clearTimeout(timer); reject(e.error || new Error(e.message || 'error de worker')); };
        }));
        worker.postMessage(hasSab
          ? { type: 'init', shared: true, grid: this.sabGrid, inp: this.sabInp, ctrl: this.sabCtrl }
          : { type: 'init', shared: false });
      }
      await Promise.all(boot);
      this.mode = hasSab ? 'shared' : 'copy';
    } catch (err) {
      this._teardownWorkers();
      this.mode = 'main';
      this.grid = new Float32Array(GW * GH);
    }
    this.ready = true;
    return this;
  }

  /**
   * Calcula el estado local para unas posiciones. Devuelve null si una peticion
   * mas reciente la reemplazo antes de empezar.
   */
  run(sport, positions, { samples = 6000 } = {}) {
    return new Promise((resolve) => {
      const job = { sport, positions, samples, resolve };
      if (this._busy) {
        if (this._pending) this._pending.resolve(null);
        this._pending = job;
        return;
      }
      this._execute(job);
    });
  }

  async _execute(job) {
    this._busy = true;
    let out = null;
    try {
      out = await this._compute(job.sport, job.positions, job.samples);
    } catch (err) {
      out = null;
    }
    this._busy = false;
    job.resolve(out);
    if (this._pending && !this._disposed) {
      const next = this._pending;
      this._pending = null;
      this._execute(next);
    }
  }

  async _compute(sport, positions, samples) {
    const t0 = now();
    const seed = (++this._gen * 2654435761) >>> 0;
    const input = packInput(sport, positions, samples, seed);
    let acc;
    if (this.mode === 'shared') acc = await this._runShared(input);
    else if (this.mode === 'copy') acc = await this._runCopy(input);
    else {
      const r = computeAll(input, this.grid);
      acc = { grid: this.grid, high: r.high, succ: r.succ, sep: r.sep, samples };
    }
    const ms = now() - t0;
    return { ...summarize(input, acc), grid: acc.grid, mode: this.mode, threads: this.mode === 'main' ? 1 : this.threads, ms, input };
  }

  _runShared(input) {
    return new Promise((resolve, reject) => {
      this.inp.set(input);
      Atomics.store(this.ctrl, 1, 0);
      Atomics.store(this.ctrl, 2, 0);
      Atomics.store(this.ctrl, 3, 0);
      Atomics.store(this.ctrl, 4, 0);
      const gen = this._gen;
      const timer = setTimeout(() => reject(new Error('tiempo agotado')), 8000);
      this._onDone = (msg) => {
        if (msg.gen !== gen) return;
        clearTimeout(timer);
        resolve({
          grid: this.grid,
          high: Atomics.load(this.ctrl, 2),
          succ: Atomics.load(this.ctrl, 3),
          sep: Atomics.load(this.ctrl, 4),
          samples: input[1] | 0,
        });
      };
      this.workers.forEach((w, i) => {
        w.onmessage = (e) => { if (e.data?.type === 'done') this._onDone?.(e.data); };
        w.postMessage({ type: 'run', gen, w: i, n: this.threads });
      });
    });
  }

  _runCopy(input) {
    return new Promise((resolve, reject) => {
      const gen = this._gen;
      const n = this.threads;
      let received = 0;
      let high = 0, succ = 0, sep = 0;
      const timer = setTimeout(() => reject(new Error('tiempo agotado')), 8000);
      this.workers.forEach((w, i) => {
        w.onmessage = (e) => {
          const m = e.data;
          if (m?.type !== 'done' || m.gen !== gen) return;
          this.grid.set(m.band, m.r0 * GW);
          high += m.high; succ += m.succ; sep += m.sep;
          if (++received === n) {
            clearTimeout(timer);
            resolve({ grid: this.grid, high, succ, sep, samples: input[1] | 0 });
          }
        };
        w.postMessage({ type: 'run', gen, w: i, n, inp: input });
      });
    });
  }

  /**
   * Prueba de rendimiento honesta: la misma carga (mapa + muestras Monte Carlo)
   * en UN solo hilo frente al pool. Devuelve milisegundos de cada uno.
   */
  async benchmark(sport, positions, { samples = 240000, reps = 3 } = {}) {
    while (this._busy) await new Promise((r) => setTimeout(r, 10));
    this._busy = true;
    try {
      const input = packInput(sport, positions, samples, 12345);
      const scratch = new Float32Array(GW * GH);
      let t0 = now();
      for (let i = 0; i < reps; i++) {
        computeBand(scratch, input, 0, input[3] | 0, 0);
        runSamples(input, 0, samples, 777 + i);
      }
      const singleMs = (now() - t0) / reps;

      let poolMs = null;
      if (this.mode !== 'main') {
        t0 = now();
        for (let i = 0; i < reps; i++) {
          this._gen++;
          const inp2 = packInput(sport, positions, samples, 12345 + i);
          if (this.mode === 'shared') await this._runShared(inp2);
          else await this._runCopy(inp2);
        }
        poolMs = (now() - t0) / reps;
      }
      return { singleMs, poolMs, threads: this.mode === 'main' ? 1 : this.threads, mode: this.mode, samples, speedup: poolMs ? singleMs / poolMs : 1 };
    } finally {
      this._busy = false;
      if (this._pending && !this._disposed) {
        const next = this._pending;
        this._pending = null;
        this._execute(next);
      }
    }
  }

  _teardownWorkers() {
    this.workers.forEach((w) => { try { w.terminate(); } catch (e) { /* ya cerrado */ } });
    this.workers = [];
  }

  dispose() {
    this._disposed = true;
    if (this._pending) { this._pending.resolve(null); this._pending = null; }
    this._teardownWorkers();
  }
}

export { totalCells };
