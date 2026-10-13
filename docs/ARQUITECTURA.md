# Arquitectura de TacticAI

TacticAI es un simulador táctico de baloncesto y tenis dividido en tres repositorios desplegados por separado.

```
Navegador (Next.js + React)  ──HTTPS/WSS──►  Backend Spring Boot  ──HTTPS──►  Motor de IA (FastAPI)
  tactical-sim-frontend                        tactical-sim-backend             tactical-sim-ai-engine
  Render · Web Service (Node)                  Render · Docker + Neon Postgres  Render · Python
```

| Repositorio | Tecnología | Responsabilidad |
|---|---|---|
| `tactical-sim-frontend` | Next.js 16, React 18 | Interfaz, pizarra táctica, laboratorio local, PWA, páginas públicas |
| `tactical-sim-backend` | Spring Boot 3.3, Java 21 | Autenticación JWT, historial, duplicación de pantalla (WebSocket), proxy a la IA |
| `tactical-sim-ai-engine` | FastAPI, NumPy | Simulación Monte Carlo, modelo logístico entrenado, respuesta defensiva |

## 1. Estrategias de renderizado (Next.js)

Cada ruta usa la estrategia que mejor encaja con su contenido. La página `/renderizado` del propio sitio lo muestra en vivo.

| Ruta | Estrategia | Por qué |
|---|---|---|
| `/` | **CSR** | El simulador necesita sesión, arrastre, Workers e IndexedDB: solo existe en el navegador. Se carga con `dynamic(..., { ssr: false })`. |
| `/metodologia`, `/renderizado` | **SSG** | Contenido fijo: se genera una vez en el build. |
| `/jugadas`, `/jugadas/[id]` | **SSG** con `generateStaticParams` | Una página estática por jugada predefinida (`dynamicParams = false`). |
| `/modelo` | **ISR** (`revalidate = 300`) | Muestra el estado del modelo de IA; se regenera cada 5 minutos. Si la IA está dormida usa `src/data/model-snapshot.json`. |
| `/estado` | **SSR** (`force-dynamic`) | Consulta backend e IA en cada petición: la hora y la latencia cambian cada vez. |
| `/plataforma` | **Streaming SSR** (`Suspense`) | Envía primero la estructura y va completando cada tarjeta cuando responde su servicio. |

Las páginas del servidor llaman a los servicios con `timedFetch` (`src/lib/serverFetch.js`): tiene límite de tiempo y nunca lanza, porque los servicios gratuitos de Render se duermen y una página pública no debe quedarse colgada.

## 2. Laboratorio local: Web Workers y SharedArrayBuffer

El laboratorio calcula **en el dispositivo y sin internet** un mapa de espacio libre y una simulación Monte Carlo geométrica (σ = 2,5, igual que el servidor).

- `src/engine/spaceMath.js`: matemática pura, sin DOM. La usan los Workers, el hilo principal (respaldo) y las pruebas.
- `src/engine/space.worker.js`: cada hilo calcula una franja del mapa y una parte de las muestras.
- `src/engine/SpaceEngine.js`: administra el pool y elige el modo más potente disponible:

| Modo | Condición | Qué hace |
|---|---|---|
| `shared` | `crossOriginIsolated` = true | N hilos escriben en un `SharedArrayBuffer` y suman con `Atomics`. |
| `copy` | Hay Workers pero no aislamiento | N hilos devuelven su franja por mensaje. |
| `main` | Sin Workers | Todo en el hilo principal. |

Hilos = `max(2, min(4, núcleos − 1, 6))`. Si llegan varias peticiones mientras se calcula (arrastrando una ficha), solo se conserva la última, así la pizarra no se atrasa.

**Honestidad sobre el rendimiento:** la mejora del benchmark depende del número de núcleos del dispositivo. En equipos de 2 núcleos puede ser ≈ ×1 o incluso menor; en equipos de 6 a 8 núcleos es claramente mayor. El resultado es una *estimación geométrica local*, no la probabilidad del modelo entrenado del servidor, y la interfaz lo rotula así.

## 3. Cabeceras de seguridad (COOP / COEP)

`SharedArrayBuffer` solo existe en páginas aisladas. `next.config.mjs` envía en **todas** las rutas:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Consecuencias que se tuvieron en cuenta:

- Las fuentes se sirven desde el propio sitio (`@fontsource`), no desde Google Fonts, para que `require-corp` no las bloquee.
- Las llamadas al backend son `fetch` con CORS, que el backend ya permite (`CORS_ALLOWED_ORIGINS`); el WebSocket no se ve afectado.
- Si un día se incrusta un recurso de otro origen (imagen, iframe), ese origen debe enviar `Cross-Origin-Resource-Policy`.

## 4. PWA y modo sin conexión

- `public/manifest.webmanifest` + iconos: la app es instalable.
- `public/sw.js`: **Service Worker sin lista fija de precache**. La página le informa (mensaje `CACHE_URLS`) de los recursos que realmente cargó y él los guarda; así nunca queda desactualizado respecto al build.
  - Navegación a `/`: red primero; sin red, cae al shell guardado.
  - Páginas públicas: se sirven desde caché si ya se visitaron; si no, se muestra `offline.html`.
  - No intercepta `/api`, `_next/image` ni peticiones RSC.
- Las pizarras se guardan en **IndexedDB** (`offlineBoards.js`) y funcionan sin conexión (Modo Campo).

## 5. Duplicación de pantalla (espejo)

El analista emite su pizarra por WebSocket (`/ws/mirror`) a una sala con código; los espectadores abren `/?viewer=CODIGO`. Las salas viven **en memoria** del backend: se pierden si el servicio se reinicia o se duerme, y expiran por inactividad.

## 6. Variables de entorno

| Variable | Dónde | Uso |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Frontend (build) | URL del backend para el navegador. Se incrusta al compilar: cambiarla exige un nuevo deploy. |
| `BACKEND_URL` | Frontend (servidor) | URL del backend para las páginas SSR/ISR. |
| `AI_ENGINE_URL` | Frontend (servidor) | URL del motor de IA para `/modelo`, `/estado`, `/plataforma`. |
| `CORS_ALLOWED_ORIGINS` | Backend | Orígenes permitidos (HTTP y WebSocket). Debe incluir la URL del frontend. |

## 7. Despliegue

- **Frontend:** Render *Web Service* (Node 20+). Build: `npm install && npm run build`. Start: `npm start`. Next no se puede publicar como sitio estático porque usa SSR/ISR.
- **Backend:** Render con el `Dockerfile` del repositorio; base de datos en Neon.
- **IA:** Render Python (`runtime.txt` = 3.11.9).

## 8. Pruebas y CI

| Repositorio | Pruebas | CI |
|---|---|---|
| Frontend | vitest: matemática del laboratorio (determinismo, franjas = un hilo), motor sin Workers, IndexedDB (fake-indexeddb), jugadas, formato, `timedFetch` | Node 20 y 22: `npm test`, `npm run build`, `npm audit` |
| IA | pytest: simulación, modelo entrenado, respuesta defensiva, `/api/v1/model/info` | Python 3.11 |
| Backend | JUnit: controlador y WebSocket del espejo (sin base de datos) | JDK 21: `mvn test` |

## 9. SEO técnico

Se entiende como código limpio y estructurado para que los buscadores puedan leer y posicionar el sitio:

- **Metadatos por ruta** (`export const metadata` / `generateMetadata`): título con plantilla `… · TacticAI`, descripción y `canonical` propios; `lang="es"` en `<html>`.
- **Open Graph y Twitter Card** en el layout, para vistas previas al compartir el enlace.
- **Datos estructurados JSON-LD** (`schema.org/WebApplication`) en el layout.
- **`/sitemap.xml` y `/robots.txt`** generados por Next (`src/app/sitemap.js`, `robots.js`); el sitemap lista las rutas públicas y cada jugada.
- **HTML semántico** en las páginas públicas: un único `h1`, `header`, `nav` con `aria-label`, `main`, `footer`.
- **Renderizado en el servidor:** las páginas públicas (SSG/ISR/SSR/Streaming) entregan el contenido ya en el HTML, que es lo que leen los buscadores.
- **Límite conocido:** `/` es CSR a propósito (necesita sesión y APIs del navegador), así que su contenido no se indexa; es la compensación del patrón CSR.

La URL base sale de `NEXT_PUBLIC_SITE_URL` (opcional) o de la variable que Vercel define sola (`VERCEL_PROJECT_PRODUCTION_URL`).

## 10. Mapa por capas

| Capa | En TacticAI | Dónde |
|---|---|---|
| Cliente | Next.js/React, PWA, Web Workers. No contiene reglas de negocio ni credenciales. | `tactical-sim-frontend` (Vercel) |
| Borde / gateway | Módulo `gateway` del backend: autenticación JWT con 2FA, CORS por lista de orígenes, rutas públicas explícitas y todo lo demás bajo autenticación. El navegador no conoce la URL del motor de IA. | `tactical-sim-backend` |
| Aplicación | API REST `/api/v1/*`, variables de entorno para toda configuración sensible, módulos separados (usuarios, simulación, espejo). | `tactical-sim-backend` |
| Asíncrona | Web Workers en el cliente para el cálculo pesado; relevo WebSocket del espejo; hilo secundario en el motor de IA para no bloquear el *event loop*. No hay broker de mensajes (ver límites). | frontend, backend, IA |
| IA | Servicio FastAPI independiente, «detrás» del backend: la simulación exige una clave interna (`AI_INTERNAL_KEY` ↔ cabecera `X-Internal-Key`). | `tactical-sim-ai-engine` |
| Datos | Postgres (Neon). Solo el backend accede; el frontend nunca habla con la base de datos. | backend + Neon |
| DevOps | GitHub Actions (CI en los tres repos), `Dockerfile` del backend, despliegue en Render y Vercel. | los tres repos |
