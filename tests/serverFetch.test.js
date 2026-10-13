import { describe, it, expect, vi } from 'vitest';
import { timedFetch } from '../src/lib/serverFetch.js';

describe('timedFetch', () => {
  it('devuelve ok y el cuerpo JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ a: 1 }) })));
    const r = await timedFetch('http://x');
    expect(r).toMatchObject({ ok: true, status: 200, body: { a: 1 }, error: null });
    vi.unstubAllGlobals();
  });
  it('nunca lanza: un error de red queda en el resultado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('caido'); }));
    const r = await timedFetch('http://x');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(0);
    expect(r.error).toContain('caido');
    vi.unstubAllGlobals();
  });
  it('corta por tiempo y lo explica', async () => {
    vi.stubGlobal('fetch', vi.fn((url, { signal }) => new Promise((_, rej) => {
      signal.addEventListener('abort', () => rej(Object.assign(new Error('abort'), { name: 'AbortError' })));
    })));
    const r = await timedFetch('http://x', { timeoutMs: 30 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/sin respuesta/);
    vi.unstubAllGlobals();
  });
  it('cuerpo no JSON no rompe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => { throw new Error('x'); } })));
    const r = await timedFetch('http://x');
    expect(r).toMatchObject({ ok: false, status: 503, body: null });
    vi.unstubAllGlobals();
  });
});
