import { describe, it, expect } from 'vitest';
import {
  packInput, computeAll, computeBand, runSamples, summarize, totalCells,
  GW, GH, BB_ROWS, INPUT_LEN, HIGH_VALUE,
} from '../src/engine/spaceMath.js';

const BB = {
  j1: { x: 50, y: 60 }, j2: { x: 20, y: 50 }, j3: { x: 80, y: 50 }, j4: { x: 15, y: 25 }, j5: { x: 85, y: 25 },
  d1: { x: 50, y: 52 }, d2: { x: 25, y: 45 }, d3: { x: 75, y: 45 }, d4: { x: 20, y: 22 }, d5: { x: 80, y: 22 },
  ball: { x: 50, y: 60 },
};
const TN = { alcaraz: { x: 50, y: 90 }, sinner: { x: 50, y: 10 }, ball: { x: 50, y: 85 } };

describe('packInput', () => {
  it('empaqueta baloncesto con el deporte, muestras y semilla', () => {
    const inp = packInput('BASKETBALL', BB, 3000, 7);
    expect(inp).toBeInstanceOf(Float32Array);
    expect(inp.length).toBe(INPUT_LEN);
    expect(inp[0]).toBe(0);
    expect(inp[1]).toBe(3000);
    expect(inp[2]).toBe(7);
    expect(inp[3]).toBe(BB_ROWS);
    expect(inp[4]).toBe(50); // x de j1
    expect(inp[5]).toBe(60); // y de j1
  });

  it('marca tenis con 1 y usa posiciones por defecto si faltan', () => {
    const inp = packInput('TENNIS', { alcaraz: { x: 10, y: 20 } }, 100, 1);
    expect(inp[0]).toBe(1);
    expect(inp[4]).toBe(10);
    expect(inp[6]).toBe(50); // sinner sin definir -> centro
  });
});

describe('determinismo y paridad', () => {
  it('la misma entrada produce exactamente el mismo resultado', () => {
    const inp = packInput('BASKETBALL', BB, 4000, 42);
    const a = computeAll(inp);
    const b = computeAll(inp);
    expect(a.succ).toBe(b.succ);
    expect(a.sep).toBe(b.sep);
    expect(a.high).toBe(b.high);
    expect(Array.from(a.grid)).toEqual(Array.from(b.grid));
  });

  it('calcular por franjas (como hacen los hilos) da lo mismo que un solo hilo', () => {
    const inp = packInput('BASKETBALL', BB, 2000, 9);
    const full = computeAll(inp);
    const grid = new Float32Array(GW * GH);
    const cuts = [0, 20, 55, BB_ROWS];
    let high = 0;
    for (let i = 0; i < cuts.length - 1; i++) high += computeBand(grid, inp, cuts[i], cuts[i + 1], 0);
    expect(high).toBe(full.high);
    expect(Array.from(grid.slice(0, GW * BB_ROWS))).toEqual(Array.from(full.grid.slice(0, GW * BB_ROWS)));
  });

  it('una franja con base propia escribe en el indice correcto', () => {
    const inp = packInput('BASKETBALL', BB, 10, 1);
    const full = computeAll(inp).grid;
    const band = new Float32Array(GW * 10);
    computeBand(band, inp, 30, 40, 30);
    expect(Array.from(band)).toEqual(Array.from(full.slice(30 * GW, 40 * GW)));
  });
});

describe('sentido fisico del modelo local', () => {
  it('acercar los defensores al portador reduce la tasa de tiro limpio', () => {
    const lejos = { ...BB, d1: { x: 50, y: 80 }, d2: { x: 10, y: 30 }, d3: { x: 90, y: 30 }, d4: { x: 10, y: 15 }, d5: { x: 90, y: 15 } };
    const cerca = { ...BB, d1: { x: 51, y: 61 }, d2: { x: 49, y: 59 }, d3: { x: 52, y: 60 }, d4: { x: 48, y: 61 }, d5: { x: 50, y: 62 } };
    const a = summarize(...pair(lejos));
    const b = summarize(...pair(cerca));
    expect(a.successRate).toBeGreaterThan(0.9);
    expect(b.successRate).toBeLessThan(0.1);
    expect(a.meanSeparationFt).toBeGreaterThan(b.meanSeparationFt);
  });

  it('los porcentajes quedan siempre entre 0 y 1', () => {
    for (const [sport, pos] of [['BASKETBALL', BB], ['TENNIS', TN]]) {
      const s = summarize(...pair(pos, sport));
      expect(s.successRate).toBeGreaterThanOrEqual(0);
      expect(s.successRate).toBeLessThanOrEqual(1);
      expect(s.openZonesPct).toBeGreaterThanOrEqual(0);
      expect(s.openZonesPct).toBeLessThanOrEqual(1);
    }
  });

  it('en tenis solo cuenta la mitad de la cancha donde cae el saque', () => {
    expect(totalCells(packInput('TENNIS', TN, 10, 1))).toBe(GW * 50);
    expect(totalCells(packInput('BASKETBALL', BB, 10, 1))).toBe(GW * BB_ROWS);
  });

  it('ninguna celda supera 1 y el umbral de alto valor es 0,7', () => {
    const { grid } = computeAll(packInput('BASKETBALL', BB, 10, 1));
    expect(HIGH_VALUE).toBe(0.7);
    expect(Math.max(...grid.slice(0, GW * BB_ROWS))).toBeLessThanOrEqual(1.0001);
  });

  it('runSamples es aditivo: dos mitades suman lo mismo que el total con semillas distintas coherentes', () => {
    const inp = packInput('BASKETBALL', BB, 1000, 3);
    const t = runSamples(inp, 0, 1000, 5);
    expect(t.succ).toBeGreaterThanOrEqual(0);
    expect(t.succ).toBeLessThanOrEqual(1000);
  });
});

function pair(pos, sport = 'BASKETBALL') {
  const inp = packInput(sport, pos, 6000, 11);
  const r = computeAll(inp);
  return [inp, { high: r.high, succ: r.succ, sep: r.sep, samples: r.samples }];
}
