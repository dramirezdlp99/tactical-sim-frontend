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
import '../styles/theme.css';
import PwaRegister from '../components/PwaRegister';
import ThemeToggle from '../components/ThemeToggle';
import { getSiteUrl, SITE_NAME, SITE_DESCRIPTION } from '../lib/site';

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'TacticAI · Simulador táctico deportivo', template: '%s · TacticAI' },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['simulador táctico', 'pizarra táctica', 'baloncesto', 'tenis', 'inteligencia artificial', 'análisis deportivo'],
  authors: [{ name: 'TacticAI' }],
  category: 'sports',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/icons/apple-touch-icon.png' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'es_CO',
    title: 'TacticAI · Simulador táctico deportivo',
    description: SITE_DESCRIPTION,
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'TacticAI' }],
  },
  twitter: { card: 'summary', title: 'TacticAI · Simulador táctico deportivo', description: SITE_DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Cualquiera con navegador moderno',
  inLanguage: 'es',
  url: getSiteUrl(),
};

export const viewport = {
  themeColor: '#f3f5f9',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Layout raiz (SERVIDOR). Carga las tipografias y los estilos una sola vez para
 * todas las rutas, fija el tema (claro por defecto) y registra el Service Worker.
 * Guardar en: tactical-sim-frontend/src/app/layout.jsx
 */
const THEME_INIT = `try{var t=localStorage.getItem('ta-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='dark'?'#080b10':'#f3f5f9');}catch(e){document.documentElement.setAttribute('data-theme','light');}`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        {children}
        <ThemeToggle floating />
        <PwaRegister />
      </body>
    </html>
  );
}
