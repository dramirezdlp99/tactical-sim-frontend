import { PublicShell, PageHead } from '../../components/public/PublicShell';
import { ModelGrid } from '../../components/public/ModelPanels';
import { timedFetch } from '../../lib/serverFetch';
import { AI_ENGINE_URL, BACKEND_SERVER_URL } from '../../lib/serverConfig';
import { describeModelSource, readModelEnvelope } from '../../lib/metaStatus';
import snapshot from '../../data/model-snapshot.json';

/**
 * /modelo -> ISR (Incremental Static Regeneration).
 * La pagina se sirve como HTML estatico (rapido), pero cada 5 minutos Next la
 * vuelve a generar en segundo plano con datos frescos del motor de IA: la
 * primera visita despues de vencido el plazo recibe la copia anterior y dispara
 * la regeneracion; las siguientes ya ven la nueva (stale-while-revalidate).
 *
 * Si el motor esta dormido (plan gratis de Render) o no responde, se usa la
 * instantanea incluida en la compilacion y la pagina lo dice claramente.
 */
export const revalidate = 300;
export const metadata = { title: 'Modelo predictivo', description: 'Métricas de validación del modelo entrenado de TacticAI.' , alternates: { canonical: '/modelo' } };

async function loadModel() {
  // 1) Backend: responde desde su cache de Redis (cache-aside, TTL 5 min) y solo pregunta a la IA si hace falta.
  const viaBackend = await timedFetch(`${BACKEND_SERVER_URL}/api/v1/meta/model`, { timeoutMs: 8000, init: { next: { revalidate: 300 } } });
  const envelope = viaBackend.ok ? readModelEnvelope(viaBackend.body) : null;
  if (envelope) {
    return { data: envelope.model, live: true, ms: viaBackend.ms, error: null, note: describeModelSource(envelope.meta) };
  }
  // 2) Respaldo: directo a la IA (como antes de existir la cache del backend).
  const r = await timedFetch(`${AI_ENGINE_URL}/api/v1/model/info`, { timeoutMs: 8000, init: { next: { revalidate: 300 } } });
  if (r.ok && r.body?.models) {
    return { data: r.body, live: true, ms: r.ms, error: null, note: null };
  }
  // 3) Ultimo recurso: la instantanea incluida en la compilacion.
  return { data: snapshot, live: false, ms: r.ms, error: r.error || `HTTP ${r.status}`, note: null };
}

export default async function Modelo() {
  const generated = new Date().toISOString();
  const { data, live, ms, error, note } = await loadModel();
  return (
    <PublicShell>
      <PageHead
        eyebrow="Modelo predictivo"
        title="Qué tan bueno es el modelo"
        lead="Métricas de validación de los modelos entrenados que usa el motor de IA. Se actualizan solas sin volver a publicar el sitio."
        mode="ISR"
        when={generated}
        note="Recarga: la hora solo cambia cuando vence la ventana de 5 minutos y se regenera."
      />
      <p className="ta-pub-source" data-live={live ? 'true' : 'false'}>
        {live
          ? `${note || 'Datos en vivo del motor de IA.'} (respuesta en ${ms} ms)`
          : `Instantánea incluida en la compilación: el motor de IA no respondió (${error}).`}
      </p>
      <ModelGrid models={data.models} />
      <section className="ta-pub-section">
        <h2>Cómo leer estas métricas</h2>
        <dl className="ta-pub-defs">
          <div><dt>AUC</dt><dd>0,5 es acertar al azar y 1,0 es perfecto. La marca blanca de la barra es el techo posible con estos datos sintéticos.</dd></div>
          <div><dt>Brier</dt><dd>Error cuadrático de las probabilidades. Más bajo es mejor.</dd></div>
          <div><dt>ECE</dt><dd>Qué tan calibradas están: si dice 70 %, ¿ocurre ~70 % de las veces? Más bajo es mejor.</dd></div>
        </dl>
      </section>
    </PublicShell>
  );
}
