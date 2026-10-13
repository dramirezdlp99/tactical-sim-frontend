/**
 * serverConfig.js
 * URLs que usan las paginas renderizadas en el SERVIDOR (SSR, ISR, Streaming).
 * Se leen de variables de entorno del servicio en Render:
 *   BACKEND_URL   (opcional) URL del backend Spring Boot; si falta usa NEXT_PUBLIC_API_URL
 *   AI_ENGINE_URL URL del motor de IA (FastAPI)
 * Los valores por defecto son los de tus servicios actuales en Render.
 *
 * Guardar en: tactical-sim-frontend/src/lib/serverConfig.js
 */
const strip = (u) => String(u || '').replace(/\/+$/, '');

export const BACKEND_SERVER_URL = strip(
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://tactical-sim-backend.onrender.com'
);
export const AI_ENGINE_URL = strip(process.env.AI_ENGINE_URL || 'https://tactical-sim-ai-engine.onrender.com');
