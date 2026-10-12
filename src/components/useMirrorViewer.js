import { useState, useEffect, useRef } from 'react';
import { BACKEND_URL } from './apiConfig';
import { mirrorChannelName } from './useMirrorEmitter';

/**
 * useMirrorViewer
 * Lado "proyector" de la duplicación de pantalla: se conecta como visor de
 * SOLO LECTURA a la sala (basta el código; no hay login ni clave) y expone el
 * último frame recibido. Usa el WebSocket del backend y, si el emisor está en
 * el mismo navegador, también el BroadcastChannel (llega al instante). Los
 * frames llevan marca de tiempo y se descartan los más viejos que el último
 * mostrado, para no "retroceder" si llegan por dos caminos.
 *
 * Guardar en: tactical-sim-frontend/src/components/useMirrorViewer.js
 */
const wsBase = () => BACKEND_URL.replace(/^http/i, 'ws');
const MAX_RETRIES = 8;

export function useMirrorViewer(roomCode) {
  const [status, setStatus] = useState('connecting'); // connecting | live | closed | error
  const [emitterOnline, setEmitterOnline] = useState(false);
  const [frame, setFrame] = useState(null);
  const [message, setMessage] = useState('');
  const lastTsRef = useRef(0);

  useEffect(() => {
    if (!roomCode) return undefined;
    let stopped = false;
    let ws = null;
    let retry = 0;
    let timer = null;
    let channel = null;

    const acceptFrame = (text) => {
      let msg;
      try { msg = JSON.parse(text); } catch (e) { return; }
      if (msg.type !== 'frame') return;
      if (typeof msg.ts === 'number' && msg.ts < lastTsRef.current) return;
      lastTsRef.current = msg.ts || Date.now();
      setFrame(msg);
      setEmitterOnline(true);
    };

    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(mirrorChannelName(roomCode));
      channel.onmessage = (e) => acceptFrame(e.data);
    }

    const connect = () => {
      ws = new WebSocket(`${wsBase()}/ws/mirror?room=${encodeURIComponent(roomCode)}`);
      ws.onopen = () => { retry = 0; setStatus('live'); setMessage(''); };
      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch (e) { return; }
        if (msg.type === 'frame') acceptFrame(event.data);
        else if (msg.type === 'ping') ws.send('{"type":"pong"}');
        else if (msg.type === 'emitter') setEmitterOnline(!!msg.online);
        else if (msg.type === 'closed') { stopped = true; setStatus('closed'); setMessage(msg.reason || 'La sala se cerró.'); }
      };
      ws.onclose = () => {
        if (stopped) return;
        if (retry >= MAX_RETRIES) {
          setStatus('error');
          setMessage('No se pudo conectar. Revisa el código de la sala (puede haber vencido).');
          return;
        }
        setStatus('connecting');
        const wait = Math.min(1000 * 2 ** retry, 8000);
        retry += 1;
        timer = setTimeout(connect, wait);
      };
    };
    connect();

    return () => {
      stopped = true;
      clearTimeout(timer);
      try { ws?.close(); } catch (e) { /* nada */ }
      try { channel?.close(); } catch (e) { /* nada */ }
    };
  }, [roomCode]);

  return { status, emitterOnline, frame, message };
}
