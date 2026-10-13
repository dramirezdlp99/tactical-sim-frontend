import Link from 'next/link';
import { PublicShell, PageHead } from '../../components/public/PublicShell';
import { MODES } from '../../components/public/RenderBadge';

/**
 * /renderizado -> SSG. Mapa de los 5 patrones de renderizado del proyecto: que
 * ruta usa cada uno, por que, y como comprobarlo.
 */
export const dynamic = 'force-static';
export const metadata = { title: 'Mapa de renderizado', description: 'Qué patrón de renderizado usa cada ruta de TacticAI y por qué.' };

const ROWS = [
  { mode: 'CSR', route: '/', why: 'La pizarra usa localStorage, IndexedDB, Web Workers, WebSocket y arrastre con el puntero: solo existen en el navegador.', check: 'Desactiva JavaScript y verás solo la pantalla de arranque.' },
  { mode: 'SSG', route: '/metodologia, /jugadas, /jugadas/[id], /renderizado', why: 'El contenido no cambia entre visitas: se genera al compilar y se sirve como HTML ya hecho.', check: 'Recarga varias veces: la hora de generación nunca cambia.' },
  { mode: 'ISR', route: '/modelo', why: 'Las métricas cambian solo al reentrenar: no hace falta calcularlas en cada visita, pero tampoco republicar el sitio.', check: 'La hora cambia cada 5 minutos, no en cada recarga.' },
  { mode: 'SSR', route: '/estado', why: 'Debe mostrar el estado real de los servicios en el momento de la petición.', check: 'La hora cambia en cada recarga.' },
  { mode: 'STREAMING', route: '/plataforma', why: 'Reúne datos de varios servicios con tiempos distintos: se envía cada bloque en cuanto está listo.', check: 'Con un servicio dormido, ves el resto de la página mientras ese bloque sigue como esqueleto.' },
];

export default function Renderizado() {
  return (
    <PublicShell>
      <PageHead
        eyebrow="Arquitectura"
        title="Cinco patrones, cada uno donde corresponde"
        lead="TacticAI no usa un solo modo de renderizado por moda: cada ruta usa el que mejor encaja con sus datos."
        mode="SSG"
        when={new Date().toISOString()}
      />
      <div className="ta-pub-rows">
        {ROWS.map((r) => (
          <article key={r.mode} className="ta-pub-row" data-mode={r.mode}>
            <h3>{MODES[r.mode].name}</h3>
            <p className="ta-pub-route">{r.route}</p>
            <p><b>Por qué:</b> {r.why}</p>
            <p><b>Cómo comprobarlo:</b> {r.check}</p>
          </article>
        ))}
      </div>
      <p className="ta-pub-note">
        Estas páginas públicas se pueden abrir sin iniciar sesión. <Link href="/">Volver a la aplicación</Link>.
      </p>
    </PublicShell>
  );
}
