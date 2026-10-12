import { useState, useRef, useCallback, useEffect } from 'react';
import { BACKEND_URL } from './apiConfig';

/**
 * useMirrorEmitter
 * Duplicación de pantalla en tiempo real (Caso de Estudio 2, sección 2.2):
 * el entrenador "proyecta" su pizarra y cualquier otra pantalla (tablet,
 * proyector, TV del camerino) la ve moverse en vivo.
 *
 * Funcionamiento:
 *  1. POST /api/v1/mirror/rooms (con JWT) crea una sala y devuelve un código
 *     de 6 caracteres (para el visor) y una clave secreta (solo del emisor).
 *  2. El emisor abre un WebSocket a /ws/mirror?room=CODIGO&key=CLAVE y envía
 *     "frames" JSON con las posiciones y el último resultado de la IA.
 *  3. El servidor reenvía cada frame, tal cual, a todos los visores.
 *  4. Además, cada frame se publica en un BroadcastChannel del navegador:
 *     si el proyector es otra pestaña/ventana del MISMO navegador, la imagen
 *     llega al instante y sin pasar por internet.
 *
 * Se reconecta solo con espera creciente (Render corta conexiones inactivas
 * y el backend gratuito se duerme); el servidor guarda el último frame, así
 * que el visor se resincroniza en cuanto el emisor vuelve.
 *
 * Guardar en: tactical-sim-frontend/src/components/useMirrorEmitter.js
 */
const wsBase = () => BACKEND_URL.replace(/^http/i, 'ws');
export const mirrorChannelName = (code) => `tacticai-mirror-${code}`;
const MIN_FRAME_INTERVAL_MS = 33; // ~30 fotogramas por segundo como máximo
const MAX_RETRIES = 6;

export function useMirrorEmitter({ token }) {
  const [status, setStatus] = useState('idle'); // idle | connecting | live | reconnecting | error
  const [roomCode, setRoomCode] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [error, setError] = useState('');

  const wsRef = useRef(null);
  const keyRef = useRef(null);
  const codeRef = useRef(null);
  const stoppedRef = useRef(true);
  const retryRef = useRef(0);
  const retryTimerRef = useRef(null);
  const lastFrameRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const flushTimerRef = useRef(null);
  const channelRef = useRef(null);

  const clearTimers = () => {
    clearTimeout(retryTimerRef.current);
    clearTimeout(flushTimerRef.current);
  };

  const connect = useCallback(() => {
    const url = `${wsBase()}/ws/mirror?room=${encodeURIComponent(codeRef.current)}&key=${encodeURIComponent(keyRef.current)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
      setStatus('live');
      setError('');
      if (lastFrameRef.current) ws.send(lastFrameRef.current);
    };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      if (msg.type === 'ping') ws.send('{"type":"pong"}');
      else if (msg.type === 'viewers' && typeof msg.count === 'number') setViewers(msg.count);
      else if (msg.type === 'hello' && typeof msg.viewers === 'number') setViewers(msg.viewers);
      else if (msg.type === 'closed') {
        stoppedRef.current = true;
        setStatus('error');
        setError(msg.reason || 'La sala se cerró.');
      }
    };

    ws.onclose = () => {
      if (stoppedRef.current) return;
      if (retryRef.current >= MAX_RETRIES) {
        stoppedRef.current = true;
        setStatus('error');
        setError('Se perdió la conexión con la sala (venció o el servidor se reinició). Inicia la proyección de nuevo.');
        return;
      }
      setStatus('reconnecting');
      const wait = Math.min(1000 * 2 ** retryRef.current, 8000);
      retryRef.current += 1;
      retryTimerRef.current = setTimeout(connect, wait);
    };
  }, []);

  const start = useCallback(async () => {
    setStatus('connecting');
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mirror/rooms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data?.roomCode) {
        setStatus('error');
        setError(json?.message || `No se pudo crear la sala (HTTP ${res.status}).`);
        return;
      }
      codeRef.current = json.data.roomCode;
      keyRef.current = json.data.emitterKey;
      setRoomCode(json.data.roomCode);
      stoppedRef.current = false;
      retryRef.current = 0;
      if ('BroadcastChannel' in window) channelRef.current = new BroadcastChannel(mirrorChannelName(json.data.roomCode));
      connect();
    } catch (e) {
      setStatus('error');
      setError('No se pudo conectar con el backend para crear la sala.');
    }
  }, [token, connect]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    clearTimers();
    try { wsRef.current?.close(); } catch (e) { /* ya cerrado */ }
    try { channelRef.current?.close(); } catch (e) { /* ya cerrado */ }
    wsRef.current = null;
    channelRef.current = null;
    keyRef.current = null;
    codeRef.current = null;
    lastFrameRef.current = null;
    setStatus('idle');
    setRoomCode(null);
    setViewers(0);
    setError('');
  }, []);

  // Envía el frame más reciente; si llegan muchos seguidos, solo sale el último (suavizado ~30 fps).
  const send = useCallback((frame) => {
    if (stoppedRef.current) return;
    const text = JSON.stringify({ type: 'frame', ts: Date.now(), ...frame });
    lastFrameRef.current = text;
    const flush = () => {
      lastSentAtRef.current = Date.now();
      try { channelRef.current?.postMessage(lastFrameRef.current); } catch (e) { /* canal cerrado */ }
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(lastFrameRef.current);
    };
    const wait = MIN_FRAME_INTERVAL_MS - (Date.now() - lastSentAtRef.current);
    clearTimeout(flushTimerRef.current);
    if (wait <= 0) flush();
    else flushTimerRef.current = setTimeout(flush, wait);
  }, []);

  useEffect(() => () => {
    stoppedRef.current = true;
    clearTimers();
    try { wsRef.current?.close(); } catch (e) { /* nada */ }
    try { channelRef.current?.close(); } catch (e) { /* nada */ }
  }, []);

  return { status, roomCode, viewers, error, start, stop, send, active: status !== 'idle' && status !== 'error' };
}
