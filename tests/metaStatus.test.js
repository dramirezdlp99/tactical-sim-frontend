import { describe, it, expect } from 'vitest';
import { describeModelSource, readModelEnvelope, summarizeStatus } from '../src/lib/metaStatus.js';

describe('describeModelSource (cache-aside del modelo)', () => {
  it('explica cada origen', () => {
    expect(describeModelSource({ source: 'cache-redis', ageSeconds: 42 })).toMatch(/caché de Redis.*42 s/);
    expect(describeModelSource({ source: 'cache-memoria', ageSeconds: 5 })).toMatch(/memoria/);
    expect(describeModelSource({ source: 'obsoleto', ageSeconds: 900 })).toMatch(/última copia buena/);
    expect(describeModelSource({ source: 'origen', ageSeconds: 0 })).toMatch(/en vivo/);
  });
  it('sin datos o con un origen desconocido devuelve null', () => {
    expect(describeModelSource(null)).toBeNull();
    expect(describeModelSource({ source: 'raro' })).toBeNull();
  });
});

describe('readModelEnvelope', () => {
  it('extrae el modelo y de donde salio', () => {
    const body = { success: true, data: { source: 'cache-redis', ageSeconds: 7, model: { models: { basketball: { available: true } } } } };
    expect(readModelEnvelope(body)).toEqual({ model: { models: { basketball: { available: true } } }, meta: { source: 'cache-redis', ageSeconds: 7 } });
  });
  it('rechaza respuestas incompletas para que la pagina use el respaldo', () => {
    expect(readModelEnvelope(null)).toBeNull();
    expect(readModelEnvelope({ data: {} })).toBeNull();
    expect(readModelEnvelope({ data: { model: { models: 'texto' } } })).toBeNull();
    expect(readModelEnvelope({ data: { model: { models: [] } } })).toBeNull();
    expect(readModelEnvelope({ data: { model: { models: {} } } })).toBeNull();
  });
});

describe('summarizeStatus (/estado)', () => {
  const body = {
    data: {
      instance: 'srv-1a2',
      redis: { mode: 'redis', distributed: true, healthy: true, detail: 'redis (TLS)' },
      cache: { hits: 9, misses: 2, staleServed: 1 },
      mirror: { rooms: 1, localViewers: 2, lastFanoutBatches: 1, peersAlive: false, busPublished: 4, busReceived: 0, framesFanned: 30 },
    },
  };
  it('resume Redis, cache y espejo', () => {
    const s = summarizeStatus(body);
    expect(s.redisOk).toBe(true);
    expect(s.redisDetail).toContain('redis (TLS)');
    expect(s.cacheDetail).toBe('aciertos 9 · fallos 2 · copias obsoletas 1');
    expect(s.mirrorDetail).toContain('instancia srv-1a2');
    expect(s.mirrorDetail).toContain('otras instancias: no detectadas');
    expect(s.busDetail).toContain('frames repartidos 30');
  });
  it('sin REDIS_URL lo dice con claridad y no lo da por sano', () => {
    const memory = { data: { ...body.data, redis: { mode: 'memoria', distributed: false, healthy: true } } };
    const s = summarizeStatus(memory);
    expect(s.redisOk).toBe(false);
    expect(s.redisDetail).toMatch(/memoria local/);
  });
  it('Redis configurado pero caido se marca como no sano', () => {
    const down = { data: { ...body.data, redis: { mode: 'redis', distributed: true, healthy: false, detail: 'redis (TLS)' } } };
    const s = summarizeStatus(down);
    expect(s.redisOk).toBe(false);
    expect(s.redisDetail).toMatch(/sin respuesta/);
  });
  it('sin cuerpo devuelve null', () => {
    expect(summarizeStatus(null)).toBeNull();
    expect(summarizeStatus({})).toBeNull();
  });
});
