# TacticAI — Frontend

Simulador táctico de baloncesto y tenis. Next.js 16 + React 18. Se comunica con el backend Spring Boot y el motor de IA FastAPI (ver `docs/ARQUITECTURA.md`).

## Qué incluye

- Pizarra táctica con arrastre, jugadas predefinidas y simulación con IA.
- **Laboratorio local** (Web Workers + SharedArrayBuffer + Atomics) que funciona sin internet.
- **PWA** instalable con Service Worker y pizarras guardadas en IndexedDB (Modo Campo).
- Duplicación de pantalla en tiempo real (`/?viewer=CODIGO`).
- Páginas públicas con las cinco estrategias de renderizado: CSR, SSG, ISR, SSR y Streaming SSR (`/renderizado`).

## Requisitos

- Node.js 20.9 o superior.

## Uso local

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # pruebas unitarias (vitest)
npm run build && npm start   # produccion local
```

## Variables de entorno

| Variable | Para qué | Valor por defecto |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend para el navegador (se fija al compilar) | `https://tactical-sim-backend.onrender.com` en producción |
| `BACKEND_URL` | Backend para las páginas del servidor | igual que la anterior |
| `AI_ENGINE_URL` | Motor de IA para `/modelo`, `/estado`, `/plataforma` | `https://tactical-sim-ai-engine.onrender.com` |

Ejemplo `.env.local` para desarrollo:

```
NEXT_PUBLIC_API_URL=http://localhost:9096
BACKEND_URL=http://localhost:9096
AI_ENGINE_URL=http://localhost:8000
```

## Despliegue (Render)

Servicio **Web Service** de Node (no «Static Site»): Build `npm install && npm run build`, Start `npm start`. Agregar la URL resultante a `CORS_ALLOWED_ORIGINS` del backend.

## Documentación

- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): decisiones técnicas, cabeceras COOP/COEP, PWA, despliegue.
- [`docs/CUMPLIMIENTO.md`](docs/CUMPLIMIENTO.md): requisitos del caso de estudio → evidencia, y limitaciones.
