/**
 * mirrorProtocol
 * Piezas PURAS (sin React ni red) del protocolo del espejo en tiempo real, para
 * poder probarlas y reutilizarlas en el emisor y en el proyector.
 *
 * - WSS: la URL del WebSocket sale de la del backend (https -> wss, http -> ws).
 *   En produccion Render sirve HTTPS, asi que la conexion es cifrada (WSS).
 * - JWT: el navegador no puede poner cabeceras Authorization en un WebSocket.
 *   Se manda en el subprotocolo ("tacticai.mirror" + "jwt.<token>"), que viaja
 *   en una cabecera del handshake y NO queda en la URL ni en los logs.
 * - Mensajes del servidor: "hello" y "viewers" traen cuantos receptores hay en
 *   total y en que instancia del backend esta cada grupo.
 *
 * Guardar en: tactical-sim-frontend/src/components/mirrorProtocol.js
 */
export const MIRROR_SUBPROTOCOL = 'tacticai.mirror';
export const MIRROR_PATH = '/ws/mirror';

/** https://x -> wss://x ; http://x -> ws://x (sin barra final). */
export function wsBaseUrl(backendUrl) {
  return String(backendUrl || '').replace(/\/+$/, '').replace(/^http/i, 'ws');
}

export function buildMirrorUrl(backendUrl, { room, key } = {}) {
  const params = [`room=${encodeURIComponent(room || '')}`];
  if (key) params.push(`key=${encodeURIComponent(key)}`);
  return `${wsBaseUrl(backendUrl)}${MIRROR_PATH}?${params.join('&')}`;
}

/** Caracteres permitidos en un subprotocolo WebSocket (RFC 6455 "token"). Un JWT los cumple. */
export const isValidProtocolToken = (value) => /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(String(value || ''));

/**
 * Subprotocolos que pide el EMISOR. Sin token devuelve null (no se puede abrir
 * el canal del emisor sin iniciar sesion). El visor no pide subprotocolos.
 */
export function buildEmitterProtocols(token) {
  if (!token || !isValidProtocolToken(token)) return null;
  return [MIRROR_SUBPROTOCOL, `jwt.${token}`];
}

/**
 * Normaliza "hello" y "viewers": { total, instance, groups: [{ id, count, mine }] }.
 * Las instancias salen ordenadas: primero la propia, luego por nombre.
 */
export function parseAudience(msg) {
  if (!msg || (msg.type !== 'hello' && msg.type !== 'viewers')) return null;
  const total = typeof msg.count === 'number' ? msg.count : typeof msg.viewers === 'number' ? msg.viewers : null;
  if (total == null) return null;
  const instance = typeof msg.instance === 'string' ? msg.instance : null;
  const groups = Object.entries(msg.byInstance && typeof msg.byInstance === 'object' ? msg.byInstance : {})
    .filter(([, count]) => typeof count === 'number' && count > 0)
    .map(([id, count]) => ({ id, count, mine: id === instance }))
    .sort((a, b) => (a.mine === b.mine ? a.id.localeCompare(b.id) : a.mine ? -1 : 1));
  return { total, instance, groups };
}

/** "3 receptores" / "1 receptor". */
export const receiversLabel = (n) => `${n} ${n === 1 ? 'receptor' : 'receptores'}`;

/** "srv-1a2 (2) · srv-9f0 (1)". */
export const groupsLabel = (groups) => groups.map((g) => `${g.id} (${g.count})`).join(' · ');
