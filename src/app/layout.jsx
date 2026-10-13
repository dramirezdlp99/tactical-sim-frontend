import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '../index.css';
import '../styles/tacticai.css';
import '../styles/mirror.css';
import '../styles/engine.css';
import '../styles/public.css';
import PwaRegister from '../components/PwaRegister';

export const metadata = {
  title: { default: 'TacticAI · Simulador táctico deportivo', template: '%s · TacticAI' },
  description: 'TacticAI: pizarra táctica de baloncesto y tenis con IA, modo campo sin conexión y duplicación de pantalla.',
  applicationName: 'TacticAI',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/icons/apple-touch-icon.png' },
};

export const viewport = {
  themeColor: '#080b10',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Layout raiz (SERVIDOR). Carga las tipografias y los estilos una sola vez para
 * todas las rutas y registra el Service Worker.
 * Guardar en: tactical-sim-frontend/src/app/layout.jsx
 */
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
