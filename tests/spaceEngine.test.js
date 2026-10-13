import { describe, it, expect } from 'vitest';
import { SpaceEngine, detectCapabilities } from '../src/engine/SpaceEngine.js';

const BB = {
  j1: { x: 50, y: 60 }, j2: { x: 20, y: 50 }, j3: { x: 80, y: 50 }, j4: { x: 15, y: 25 }, j5: { x: 85, y: 25 },
  d1: { x: 50, y: 52 }, d2: { x: 25, y: 45 }, d3: { x: 75, y: 45 }, d4: { x: 20, y: 22 }, d5: { x: 80, y: 22 },
  ball: { x: 50, y: 60 },
};

describe('SpaceEngine sin Workers (respaldo en el hilo principal)', () => {
  it('detecta que Node no tiene Worker y cae al modo main sin romper', async () => {
    expect(detectCapabilities().hasWorker).toBe(false);
    const eng = await new SpaceEngine().init();
    expect(eng.mode).toBe('main');
    expect(eng.ready).toBe(true);
    eng.dispose();
  });

  it('usa al menos 2 hilos aunque haya pocos nucleos', () => {
    const eng = new SpaceEngine({ threads: 1 });
    expect(eng.threads).toBeGreaterThanOrEqual(2);
    expect(eng.threads).toBeLessThanOrEqual(6);
  });

  it('calcula metricas coherentes', async () => {
    const eng = await new SpaceEngine().init();
    const r = await eng.run('BASKETBALL', BB, { samples: 3000 });
    expect(r).toBeTruthy();
    expect(JSON.stringify(r)).toContain('successRate');
    eng.dispose();
  });

  it('si llegan varias peticiones seguidas solo se atiende la primera y la ultima', async () => {
    const eng = await new SpaceEngine().init();
    const a = eng.run('BASKETBALL', BB, { samples: 2000 });
    const b = eng.run('BASKETBALL', BB, { samples: 2000 });
    const c = eng.run('BASKETBALL', BB, { samples: 2000 });
    const [ra, rb, rc] = await Promise.all([a, b, c]);
    expect(ra).not.toBeNull();
    expect(rb).toBeNull();
    expect(rc).not.toBeNull();
    eng.dispose();
  });
});
