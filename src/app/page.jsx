import AppClient from '../components/AppClient';

/**
 * "/" -> CSR (Client-Side Rendering).
 * El servidor solo entrega la pantalla de arranque; la aplicacion (login,
 * simuladores, historial, proyector ?viewer=CODIGO) se dibuja en el navegador.
 * Guardar en: tactical-sim-frontend/src/app/page.jsx
 */
export const metadata = { title: 'Simulador táctico' };

export default function Home() {
  return <AppClient />;
}
