import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Cabeceras de "aislamiento de origen cruzado" (cross-origin isolation).
 *
 * Los navegadores solo permiten SharedArrayBuffer (memoria compartida entre
 * hilos) si la pagina se sirve con estas dos cabeceras. Sin ellas la app
 * sigue funcionando: el laboratorio local cae al modo "copia de datos".
 *
 * Aqui se aplican al servidor de desarrollo y a `vite preview`. En produccion
 * las debe enviar el hosting (ver docs/ARQUITECTURA.md, seccion Cabeceras).
 */
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    headers: isolationHeaders
  },
  preview: {
    headers: isolationHeaders
  },
  worker: {
    format: 'es'
  }
});
