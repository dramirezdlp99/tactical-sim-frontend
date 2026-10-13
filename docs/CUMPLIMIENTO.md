# Cumplimiento del Caso de Estudio 2 — TacticAI

Este documento relaciona cada capacidad pedida con **dónde está implementada** y **cómo comprobarla**. Está escrito sin exagerar: al final se listan las limitaciones conocidas.

| Capacidad | Dónde está | Cómo comprobarla |
|---|---|---|
| Simulador táctico de baloncesto y tenis (arrastrar fichas, jugadas predefinidas) | `src/components/TacticalSimulator.jsx`, `TennisSimulator.jsx`, `predefinedPlays.js` | Entrar a `/`, mover fichas, elegir una jugada |
| Simulación con IA (probabilidades, Monte Carlo, respuesta defensiva) | Repo `tactical-sim-ai-engine`, endpoint `/api/v1/simulation/*` | Botón de simular; `pytest` en el repo de IA |
| Modelo predictivo entrenado | `app/ml/`, `app/services/trained_model.py`; resumen público en `/api/v1/model/info` y página `/modelo` | Abrir `/modelo` |
| Autenticación y roles | Backend: JWT, `ROLE_*`; `AuthScreen.jsx` | Registrar y entrar con un usuario |
| Historial de simulaciones del equipo | `SimulationHistory.jsx` + backend | Simular y revisar el historial |
| Duplicación de pantalla en tiempo real | Backend `/ws/mirror`, `useMirrorEmitter.js`, `MirrorViewer.jsx` | Emitir y abrir `/?viewer=CODIGO` en otra pestaña |
| Modo Campo / offline (sección 2.2) | `offlineBoards.js` (IndexedDB), `OfflineBanner.jsx`, `public/sw.js` | DevTools → Network → *Offline* → recargar → guardar una pizarra |
| Web Workers | `src/engine/space.worker.js`, `SpaceEngine.js` | Panel «Laboratorio local» → chip de hilos |
| SharedArrayBuffer + Atomics | `SpaceEngine.js` (modo `shared`), cabeceras en `next.config.mjs` | En la consola: `crossOriginIsolated` → `true`; el panel dice «Memoria compartida» |
| Medición de rendimiento | Botón «Medir rendimiento» (1 hilo vs. pool) | Pulsarlo; ver nota de honestidad en `ARQUITECTURA.md` |
| Service Worker y PWA instalable | `public/sw.js`, `manifest.webmanifest`, iconos, `PwaRegister.jsx` | Botón «Instalar» / Lighthouse → PWA |
| Renderizado CSR | `/` | `/renderizado` |
| Renderizado SSG | `/metodologia`, `/jugadas`, `/jugadas/[id]` | `npm run build` lista las rutas con ● y ○ |
| Renderizado ISR | `/modelo` (`revalidate = 300`) | Recargar pasados 5 minutos; la hora de generación cambia |
| Renderizado SSR | `/estado` | Cada recarga cambia la hora |
| Streaming SSR | `/plataforma` | Las tarjetas llegan una a una |
| SEO técnico (metadatos, canonical, Open Graph, JSON-LD, sitemap, robots) | `src/app/layout.jsx`, `sitemap.js`, `robots.js`, `src/lib/site.js` | Ver código fuente de `/metodologia`, `/sitemap.xml`, `/robots.txt` |
| Capa de IA detrás del gateway | Clave interna `X-Internal-Key` backend → IA (`app/core/internal_auth.py`, `WebClientConfig.java`) | Llamar a `/api/v1/simulation/predict` sin la clave → 401 |
| Pruebas automáticas | `tests/` (frontend), `tests/` (IA), `src/test` (backend) | `npm test`, `python -m pytest`, `mvn test` |
| Integración continua | `.github/workflows/ci.yml` en los tres repositorios | Pestaña *Actions* de GitHub |

## Limitaciones conocidas

- **Sin broker de mensajes:** la «capa asíncrona» se resuelve con Web Workers (cliente), hilos del motor de IA y el relevo WebSocket. No hay una cola de eventos (RabbitMQ/Kafka) porque el volumen no lo justifica; sería el siguiente paso para escalar.
- **Un único gateway:** el módulo `gateway` del backend cumple la autenticación y el enrutamiento, pero no hay un API Gateway dedicado ni gateways regionales.
- **Pruebas de navegadores:** la verificación automática se hizo en Chromium. En Firefox y Safari la memoria compartida depende de las cabeceras COOP/COEP y, si el navegador no las soporta, el laboratorio cae solo al modo «copia» o «hilo principal» (la app sigue funcionando).

- **Datos sintéticos:** el modelo logístico se entrenó con datos generados por reglas, no con partidos reales. Sirve para demostrar la arquitectura, no para tomar decisiones deportivas reales.
- **Defensa basada en reglas:** la respuesta defensiva es heurística, no aprendida.
- **Estimación local ≠ IA:** el laboratorio local es geométrico y se rotula como «estimación local».
- **Rendimiento de los hilos:** la ganancia depende de los núcleos del equipo; con 2 núcleos puede ser nula.
- **Servicios gratuitos de Render:** se duermen tras inactividad; la primera petición puede tardar ~50 s. Las páginas SSR/ISR tienen límite de tiempo y respaldo para ello.
- **Salas de espejo en memoria:** se pierden si el backend se reinicia.
- **Pruebas de interfaz:** las pruebas automáticas cubren la lógica (motor, almacenamiento, utilidades); la interfaz completa se verificó manualmente en el navegador.
