import { describe, it, expect } from 'vitest';
import { pct, num, int, fmtDateTime } from '../src/lib/format.js';

describe('format', () => {
  it('pct convierte fracciones a porcentaje y tolera nulos', () => {
    expect(pct(0.4567)).toBe('45.7 %');
    expect(pct(0.5, 0)).toBe('50 %');
    expect(pct(null)).toBe('—');
    expect(pct(undefined)).toBe('—');
  });
  it('num fija los decimales y tolera nulos', () => {
    expect(num(1.23456)).toBe('1.235');
    expect(num(2, 1)).toBe('2.0');
    expect(num(null)).toBe('—');
  });
  it('int formatea enteros y tolera nulos', () => {
    expect(int(null)).toBe('—');
    expect(int(1500)).toMatch(/1.?500/);
  });
  it('fmtDateTime entrega texto no vacio para una fecha ISO', () => {
    expect(fmtDateTime('2026-10-12T18:00:00Z').length).toBeGreaterThan(5);
  });
});
