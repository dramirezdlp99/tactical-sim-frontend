import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';

let api;
beforeAll(async () => {
  globalThis.window = globalThis; // offlineBoards consulta window.indexedDB
  api = await import('../src/components/offlineBoards.js');
});

const pos = { j1: { x: 10, y: 20 } };

describe('pizarras offline (IndexedDB)', () => {
  it('guarda y recupera una pizarra por deporte', async () => {
    const id = await api.saveLocalBoard({ sport: 'BASKETBALL', name: 'Jugada A', positions: pos, note: 'nota' });
    expect(id).toBeTruthy();
    const list = await api.getLocalBoards('BASKETBALL');
    const found = list.find((b) => b.id === id);
    expect(found.name).toBe('Jugada A');
    expect(found.positions).toEqual(pos);
    expect(found.note).toBe('nota');
  });

  it('separa por deporte', async () => {
    await api.saveLocalBoard({ sport: 'TENNIS', name: 'Saque T', positions: pos });
    const tennis = await api.getLocalBoards('TENNIS');
    expect(tennis.every((b) => b.sport === 'TENNIS')).toBe(true);
    expect(tennis.some((b) => b.name === 'Saque T')).toBe(true);
  });

  it('pone nombre por defecto cuando viene vacio', async () => {
    const id = await api.saveLocalBoard({ sport: 'BASKETBALL', name: '   ', positions: pos });
    const list = await api.getLocalBoards('BASKETBALL');
    expect(list.find((b) => b.id === id).name).toMatch(/^Pizarra /);
  });

  it('ordena de la mas reciente a la mas antigua', async () => {
    await api.saveLocalBoard({ sport: 'TENNIS', name: 'Vieja', positions: pos });
    await new Promise((r) => setTimeout(r, 15));
    await api.saveLocalBoard({ sport: 'TENNIS', name: 'Nueva', positions: pos });
    const list = await api.getLocalBoards('TENNIS');
    const iNew = list.findIndex((b) => b.name === 'Nueva');
    const iOld = list.findIndex((b) => b.name === 'Vieja');
    expect(iNew).toBeLessThan(iOld);
  });

  it('elimina una pizarra', async () => {
    const id = await api.saveLocalBoard({ sport: 'BASKETBALL', name: 'Borrar', positions: pos });
    await api.deleteLocalBoard(id);
    const list = await api.getLocalBoards('BASKETBALL');
    expect(list.find((b) => b.id === id)).toBeUndefined();
  });
});
