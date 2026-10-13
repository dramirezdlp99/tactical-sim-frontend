/**
 * URL base de la API del backend (Spring Boot).
 *
 * En Next.js, las variables que empiezan con NEXT_PUBLIC_ se incrustan en el
 * codigo del navegador al COMPILAR (npm run build). Define en Render, en el
 * servicio del frontend:
 *   NEXT_PUBLIC_API_URL=https://tactical-sim-backend.onrender.com
 * Ojo: si la cambias, hay que volver a desplegar (la lee el build, no el arranque).
 *
 * Si no la defines: en produccion usa el backend de Render por defecto y en
 * desarrollo local usa http://localhost:9096 (igual que antes).
 *
 * Guardar en: tactical-sim-frontend/src/components/apiConfig.js
 */
const PRODUCTION_DEFAULT = 'https://tactical-sim-backend.onrender.com';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PRODUCTION_DEFAULT : 'http://localhost:9096');
