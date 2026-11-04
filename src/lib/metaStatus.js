/**
 * metaStatus
 * Convierte las respuestas del backend (/api/v1/meta/model y /api/v1/meta/status)
 * en texto listo para mostrar en /modelo y /estado. Funciones puras: no hacen red.
 *
 * Guardar en: tactical-sim-frontend/src/lib/metaStatus.js
 */

/** Frase para /modelo segun de donde salieron los datos. */
export function describeModelSource(meta) {
  if (!meta) return null;
  const age = typeof meta.ageSeconds === 'number' ? meta.ageSeconds : 0;
  switch (meta.source) {
    case 'cache-redis':
      return `Datos servidos desde la caché de Redis del backend (guardados hace ${age} s; el TTL es de 5 min).`;
    case 'cache-memoria':
      return `Datos servidos desde la caché en memoria del backend (hace ${age} s; sin Redis configurado).`;
    case 'obsoleto':
      return `El motor de IA no respondió: se muestra la última copia buena guardada en el backend (hace ${age} s).`;
    case 'origen':
      return 'Datos en vivo del motor de IA, pedidos por el backend y guardados ahora en su caché (TTL de 5 min).';
    default:
      return null;
  }
}

/** Extrae { model, meta } de la respuesta de /api/v1/meta/model, o null si no sirve. */
export function readModelEnvelope(body) {
  const data = body && body.data;
  if (!data || !data.model || !Array.isArray(data.model.models)) return null;
  return { model: data.model, meta: { source: data.source, ageSeconds: data.ageSeconds } };
}

/** Resume /api/v1/meta/status para las tarjetas de /estado. */
export function summarizeStatus(body) {
  const d = body && body.data;
  if (!d) return null;
  const redis = d.redis || {};
  const mirror = d.mirror || {};
  const cache = d.cache || {};
  const redisOk = !!redis.distributed && !!redis.healthy;
  return {
    instance: d.instance || null,
    redisOk,
    redisDetail: redis.distributed
      ? `${redis.detail || 'redis'} · ${redis.healthy ? 'responde' : 'sin respuesta'}`
      : 'Sin REDIS_URL: el backend usa memoria local (una sola instancia).',
    cacheDetail: `aciertos ${cache.hits ?? 0} · fallos ${cache.misses ?? 0} · copias obsoletas ${cache.staleServed ?? 0}`,
    mirrorDetail:
      `instancia ${d.instance || '—'} · ${mirror.rooms ?? 0} sala(s) · ${mirror.localViewers ?? 0} visor(es) aquí` +
      ` · último reparto en ${mirror.lastFanoutBatches ?? 0} lote(s)` +
      ` · otras instancias: ${mirror.peersAlive ? 'sí' : 'no detectadas'}`,
    busDetail: `eventos publicados ${mirror.busPublished ?? 0} · recibidos ${mirror.busReceived ?? 0} · frames repartidos ${mirror.framesFanned ?? 0}`,
  };
}
