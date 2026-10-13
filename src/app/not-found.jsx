import Link from 'next/link';
import { PublicShell } from '../components/public/PublicShell';

export const metadata = { title: 'Página no encontrada' };

export default function NotFound() {
  return (
    <PublicShell>
      <section className="ta-pub-head">
        <span className="ta-eyebrow">Error 404</span>
        <h1>Esa jugada no existe</h1>
        <p className="ta-pub-lead">La página que buscas no está en TacticAI. Vuelve a la pizarra o revisa las secciones públicas.</p>
        <Link href="/" className="ta-btn ta-btn-primary" style={{ display: 'inline-flex' }}>Ir a la aplicación</Link>
      </section>
    </PublicShell>
  );
}
