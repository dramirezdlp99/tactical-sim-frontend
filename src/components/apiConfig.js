/**
 * URL base de la API del backend (Spring Boot).
 *
 * Antes cada componente tenía 'http://localhost:9096' quemado en el
 * código. Eso funciona en desarrollo local, pero se rompe apenas el
 * frontend se despliega (Vercel) y el backend vive en otro dominio
 * (Render, un VPS, etc.) — el navegador seguiría intentando llamar a
 * "localhost" de la máquina de cada visitante, no a tu servidor real.
 *
 * Vite expone las variables que empiezan con VITE_ a través de
 * import.meta.env. En local, si no defines nada, cae al valor de
 * respaldo (localhost:9096) para que el desarrollo siga funcionando
 * igual que antes sin configuración extra.
 *
 * Para producción: en el panel de Vercel del proyecto, agrega la
 * variable de entorno VITE_API_URL con la URL real del backend
 * desplegado, por ejemplo:
 *   VITE_API_URL=https://tactical-sim-backend.onrender.com
 *
 * Para desarrollo local opcional: crea un archivo .env (NO subirlo a
 * git, ya está en .gitignore) con:
 *   VITE_API_URL=http://localhost:9096
 */
export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:9096';