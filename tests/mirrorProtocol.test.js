import { describe, it, expect } from 'vitest';
import {
  MIRROR_SUBPROTOCOL, buildEmitterProtocols, buildMirrorUrl, groupsLabel, isValidProtocolToken,
  parseAudience, receiversLabel, wsBaseUrl,
} from '../src/components/mirrorProtocol.js';

describe('WSS: la URL del WebSocket sale de la del backend', () => {
  it('https -> wss (produccion, cifrado) y http -> ws (local)', () => {
    expect(wsBaseUrl('https://tactical-sim-backend.onrender.com')).toBe('wss://tactical-sim-backend.onrender.com');
    expect(wsBaseUrl('http://localhost:9096')).toBe('ws://localhost:9096');
  });
  it('quita barras finales y tolera vacios', () => {
    expect(wsBaseUrl('https://x.com///')).toBe('wss://x.com');
    expect(wsBaseUrl('')).toBe('');
    expect(wsBaseUrl(undefined)).toBe('');
  });
  it('construye la URL del emisor y del visor con los parametros escapados', () => {
    expect(buildMirrorUrl('https://b.com', { room: 'ABC234', key: 'k-_1' })).toBe('wss://b.com/ws/mirror?room=ABC234&key=k-_1');
    expect(buildMirrorUrl('https://b.com', { room: 'ABC234' })).toBe('wss://b.com/ws/mirror?room=ABC234');
    expect(buildMirrorUrl('https://b.com', { room: 'a b', key: 'x&y' })).toBe('wss://b.com/ws/mirror?room=a%20b&key=x%26y');
  });
  it('el JWT nunca va en la URL', () => {
    const url = buildMirrorUrl('https://b.com', { room: 'ABC234', key: 'clave' });
    expect(url).not.toMatch(/token|jwt|Bearer/i);
  });
});

describe('JWT por subprotocolo', () => {
  const jwt = 'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhQGIuY28ifQ.c2lnLV9uYXR1cmU';
  it('un JWT es un valor valido de subprotocolo', () => {
    expect(isValidProtocolToken(jwt)).toBe(true);
  });
  it('rechaza valores con espacios, comas o vacios', () => {
    expect(isValidProtocolToken('a b')).toBe(false);
    expect(isValidProtocolToken('a,b')).toBe(false);
    expect(isValidProtocolToken('')).toBe(false);
    expect(isValidProtocolToken(null)).toBe(false);
  });
  it('el emisor pide el subprotocolo del servidor y el token', () => {
    expect(buildEmitterProtocols(jwt)).toEqual([MIRROR_SUBPROTOCOL, `jwt.${jwt}`]);
  });
  it('sin token valido no se abre el canal del emisor', () => {
    expect(buildEmitterProtocols(null)).toBeNull();
    expect(buildEmitterProtocols('')).toBeNull();
    expect(buildEmitterProtocols('con espacios')).toBeNull();
  });
});

describe('receptores por instancia', () => {
  it('lee el "hello" del servidor', () => {
    const a = parseAudience({ type: 'hello', role: 'viewer', viewers: 3, instance: 'srv-1a2', byInstance: { 'srv-1a2': 2, 'srv-9f0': 1 } });
    expect(a.total).toBe(3);
    expect(a.instance).toBe('srv-1a2');
    expect(a.groups).toEqual([{ id: 'srv-1a2', count: 2, mine: true }, { id: 'srv-9f0', count: 1, mine: false }]);
  });
  it('lee "viewers" y pone primero la instancia propia aunque no sea la primera del objeto', () => {
    const a = parseAudience({ type: 'viewers', count: 4, instance: 'srv-zzz', byInstance: { 'srv-aaa': 1, 'srv-zzz': 3 } });
    expect(a.total).toBe(4);
    expect(a.groups.map((g) => g.id)).toEqual(['srv-zzz', 'srv-aaa']);
  });
  it('omite instancias sin receptores y tolera mensajes viejos sin desglose', () => {
    expect(parseAudience({ type: 'viewers', count: 1, instance: 'a', byInstance: { a: 1, b: 0 } }).groups).toHaveLength(1);
    expect(parseAudience({ type: 'viewers', count: 2 })).toEqual({ total: 2, instance: null, groups: [] });
  });
  it('ignora lo que no es hello/viewers o no trae conteo', () => {
    expect(parseAudience({ type: 'frame' })).toBeNull();
    expect(parseAudience({ type: 'viewers' })).toBeNull();
    expect(parseAudience(null)).toBeNull();
  });
  it('textos para la interfaz', () => {
    expect(receiversLabel(1)).toBe('1 receptor');
    expect(receiversLabel(0)).toBe('0 receptores');
    expect(receiversLabel(5)).toBe('5 receptores');
    expect(groupsLabel([{ id: 'a', count: 2 }, { id: 'b', count: 1 }])).toBe('a (2) · b (1)');
  });
});
