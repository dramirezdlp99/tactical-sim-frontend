import { describe, it, expect } from 'vitest';
import { BASKETBALL_PLAYS, TENNIS_PLAYS, getPlayById } from '../src/components/predefinedPlays.js';

describe('jugadas predefinidas', () => {
  it('cada lista tiene la opcion libre y ids unicos', () => {
    for (const list of [BASKETBALL_PLAYS, TENNIS_PLAYS]) {
      expect(list[0].id).toBe('custom');
      const ids = list.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('las posiciones estan dentro de la cancha (0-100)', () => {
    for (const p of [...BASKETBALL_PLAYS, ...TENNIS_PLAYS]) {
      if (!p.positions) continue;
      for (const pt of Object.values(p.positions)) {
        expect(pt.x).toBeGreaterThanOrEqual(0);
        expect(pt.x).toBeLessThanOrEqual(100);
        expect(pt.y).toBeGreaterThanOrEqual(0);
        expect(pt.y).toBeLessThanOrEqual(100);
      }
    }
  });
  it('getPlayById devuelve la jugada o la primera si no existe', () => {
    expect(getPlayById(BASKETBALL_PLAYS, 'pick_and_roll_central').id).toBe('pick_and_roll_central');
    expect(getPlayById(BASKETBALL_PLAYS, 'no-existe').id).toBe('custom');
  });
  it('toda jugada con posiciones trae descripcion', () => {
    for (const p of [...BASKETBALL_PLAYS, ...TENNIS_PLAYS]) expect(p.description.length).toBeGreaterThan(10);
  });
});
