import { Suspense } from 'react';
import { PublicShell, PageHead } from '../../components/public/PublicShell';
import { StatusCard, StatusSkeleton } from '../../components/public/StatusCard';
import { ModelGrid } from '../../components/public/ModelPanels';
import { timedFetch } from '../../lib/serverFetch';
import { AI_ENGINE_URL, BACKEND_SERVER_URL } from '../../lib/serverConfig';
import snapshot from '../../data/model-snapshot.json';

/**
 * /plataforma -> Streaming SSR.
 * El servidor responde enseguida con el marco de la pagina y va ENVIANDO cada
 * bloque a medida que esta listo, gracias a <Suspense>: mientras el backend o el
 * motor de IA contestan, el visitante ya ve el esqueleto y cada tarjeta aparece
 * sola cuando llega su dato (sin esperar a la mas lenta).
 */
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Plataforma en vivo', description: 'Estado de la plataforma, enviado por partes.' , alternates: { canonical: '/plataforma' } };

async function BackendCard({ t0 }) {
  const r = await timedFetch(`${BACKEND_SERVER_URL}/actuator/health`, { timeoutMs: 15000 });
  return <StatusCard title="Backend (Spring Boot)" url={BACKEND_SERVER_URL} result={r} detail={r.ok ? `estado: ${r.body?.status || 'desconocido'}` : null} reachedAt={Date.now() - t0} />;
}

async function AiCard({ t0 }) {
  const r = await timedFetch(`${AI_ENGINE_URL}/health`, { timeoutMs: 15000 });
  return <StatusCard title="Motor de IA (FastAPI)" url={AI_ENGINE_URL} result={r} detail={r.ok ? `${r.body?.service || 'servicio'} · versión ${r.body?.version || '—'}` : null} reachedAt={Date.now() - t0} />;
}

async function ModelBlock({ t0 }) {
  const r = await timedFetch(`${AI_ENGINE_URL}/api/v1/model/info`, { timeoutMs: 20000 });
  const live = r.ok && r.body?.models;
  return (
    <>
      <p className="ta-pub-source" data-live={live ? 'true' : 'false'}>
        {live
          ? `Métricas en vivo del motor de IA · llegaron a los ${Date.now() - t0} ms.`
          : `Instantánea incluida en la compilación: el motor no respondió (${r.error || `HTTP ${r.status}`}).`}
      </p>
      <ModelGrid models={(live ? r.body : snapshot).models} />
    </>
  );
}

export default function Plataforma() {
  const t0 = Date.now();
  const requested = new Date(t0).toISOString();
  return (
    <PublicShell>
      <PageHead
        eyebrow="Plataforma en vivo"
        title="Todo el sistema, por partes"
        lead="Esta página no espera a que todo esté listo: el servidor envía cada bloque en cuanto tiene su respuesta."
        mode="STREAMING"
        when={requested}
        note="Si un servicio está dormido verás su esqueleto hasta que despierte; los demás bloques ya aparecen."
      />
      <div className="ta-pub-panels">
        <Suspense fallback={<StatusSkeleton title="Backend (Spring Boot)" />}><BackendCard t0={t0} /></Suspense>
        <Suspense fallback={<StatusSkeleton title="Motor de IA (FastAPI)" />}><AiCard t0={t0} /></Suspense>
      </div>
      <section className="ta-pub-section">
        <h2>Modelo predictivo</h2>
        <Suspense fallback={<StatusSkeleton title="Métricas del modelo" />}><ModelBlock t0={t0} /></Suspense>
      </section>
    </PublicShell>
  );
}
