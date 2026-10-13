import { PublicShell, PageHead } from '../../components/public/PublicShell';
import { Icon } from '../../components/ui/Icon';

/**
 * /metodologia -> SSG (Static Site Generation).
 * Contenido que no cambia entre visitas: se genera una sola vez al compilar y se
 * sirve como HTML ya hecho (lo mas rapido posible, sin trabajo del servidor).
 */
export const dynamic = 'force-static';
export const metadata = { title: 'Metodología', description: 'Cómo calcula TacticAI la probabilidad de éxito de una jugada.' , alternates: { canonical: '/metodologia' } };

const STEPS = [
  { icon: 'whistle', title: 'Dibujas la jugada', text: 'Posicionas a los 5 atacantes, los 5 defensores y el balón (o sacador, restador y punto de caída en tenis) sobre una cancha a escala real.' },
  { icon: 'shield', title: 'El backend valida', text: 'Spring Boot comprueba tu sesión (JWT con verificación en dos pasos) y reenvía la jugada al motor de IA.' },
  { icon: 'cpu', title: 'El motor la simula', text: 'FastAPI reparte 4.000 escenarios entre varios procesos con memoria compartida. En cada uno mueve a los jugadores con ruido aleatorio.' },
  { icon: 'brain', title: 'El modelo la puntúa', text: 'Un modelo de regresión logística entrenado estima tiro limpio, efectividad del pase y riesgo de pérdida con las mismas características que usó al entrenar.' },
  { icon: 'users', title: 'El rival reacciona', text: 'El "Cuerpo Técnico Rival" ajusta la defensa (marcaje al hombre, ayudas en la pintura, restador que anticipa) y la jugada se evalúa contra esa respuesta.' },
  { icon: 'target', title: 'Recibes la recomendación', text: 'Ves la probabilidad de éxito, la acción sugerida (tiro, pase o penetración) y dónde se movería la defensa, todo dibujado sobre la cancha.' },
];

const METRICS = [
  ['Probabilidad de éxito', 'Resultado global de la jugada tras promediar los escenarios simulados.'],
  ['Tiro limpio', 'Probabilidad de que el portador tenga un tiro con al menos 4 pies de separación.'],
  ['Efectividad del pase', 'Qué tan probable es completar el mejor pase disponible, según las líneas libres.'],
  ['Riesgo de pérdida', 'Probabilidad de perder el balón por presión defensiva sobre el portador.'],
];

export default function Metodologia() {
  const built = new Date().toISOString();
  return (
    <PublicShell>
      <PageHead
        eyebrow="Cómo funciona"
        title="De la pizarra a la probabilidad"
        lead="Este es el recorrido completo de una simulación en TacticAI y qué significa cada número que ves en pantalla."
        mode="SSG"
        when={built}
        note="Esta hora es la de la compilación: no cambia al recargar."
      />

      <section className="ta-pub-section">
        <h2>El recorrido de una jugada</h2>
        <ol className="ta-pub-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="ta-pub-step-n">{i + 1}</span>
              <div>
                <h3><Icon name={s.icon} /> {s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ta-pub-section">
        <h2>Qué mide cada indicador</h2>
        <dl className="ta-pub-defs">
          {METRICS.map(([t, d]) => (
            <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
          ))}
        </dl>
      </section>

      <section className="ta-pub-section">
        <h2>Sin conexión también trabajas</h2>
        <p>
          El <b>laboratorio local</b> reparte entre varios hilos del navegador (Web Workers, con memoria compartida
          cuando el sitio está aislado) un mapa de espacio libre y una estimación Monte Carlo geométrica. Funciona sin
          internet porque la aplicación se guarda en el dispositivo (Service Worker) y tus pizarras viven en IndexedDB.
          Esa estimación es <b>local y aproximada</b>: la probabilidad del modelo entrenado solo se calcula con conexión al motor de IA.
        </p>
      </section>

      <section className="ta-pub-section ta-pub-warn">
        <h2><Icon name="alert" /> Límites que debes conocer</h2>
        <ul>
          <li>El modelo se entrenó con <b>datos sintéticos</b> (partidos simulados con reglas del juego), no con partidos reales. Sus probabilidades son una estimación didáctica.</li>
          <li>La reacción de la defensa rival se basa en <b>reglas explicables</b>, no en aprendizaje automático.</li>
          <li>La acción recomendada, la nota táctica y el mapa de calor del motor se calculan con geometría determinista.</li>
          <li>Las salas de duplicación de pantalla viven en la memoria del backend: si el servicio se reinicia, hay que crear una sala nueva.</li>
        </ul>
      </section>
    </PublicShell>
  );
}
