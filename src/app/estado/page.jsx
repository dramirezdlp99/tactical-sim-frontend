import { PublicShell, PageHead } from '../../components/public/PublicShell';
import { StatusCard } from '../../components/public/StatusCard';
import { timedFetch } from '../../lib/serverFetch';
import { AI_ENGINE_URL, BACKEND_SERVER_URL } from '../../lib/serverConfig';

/**
 * /estado -> SSR (Server-Side Rendering).
 * La pagina se arma COMPLETA en el servidor en cada peticion: consulta el estado
 * real del backend y del motor de IA en ese instante y recien entonces responde.
 * Por eso la hora cambia en cada recarga y siempre ves datos frescos.
 */
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Estado de los servicios', description: 'Estado en tiempo real del backend y del motor de IA.' , alternates: { canonical: '/estado' } };

export default async function Estado() {
  const [backend, ai] = await Promise.all([
    timedFetch(`${BACKEND_SERVER_URL}/actuator/health`),
    timedFetch(`${AI_ENGINE_URL}/health`),
  ]);
  const requested = new Date().toISOString();
  return (
    <PublicShell>
      <PageHead
        eyebrow="Estado en vivo"
        title="¿Están despiertos los servicios?"
        lead="Consulta ahora mismo al backend y al motor de IA. En el plan gratis de Render se duermen tras un rato sin uso, y despertarlos puede tardar hasta un minuto."
        mode="SSR"
        when={requested}
        note="Recarga: la hora cambia en cada petición."
      />
      <div className="ta-pub-panels">
        <StatusCard title="Backend (Spring Boot)" url={BACKEND_SERVER_URL} result={backend} detail={backend.ok ? `estado: ${backend.body?.status || 'desconocido'}` : null} />
        <StatusCard title="Motor de IA (FastAPI)" url={AI_ENGINE_URL} result={ai} detail={ai.ok ? `${ai.body?.service || 'servicio'} · versión ${ai.body?.version || '—'}` : null} />
      </div>
    </PublicShell>
  );
}
