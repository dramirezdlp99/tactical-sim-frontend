import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell, PageHead } from '../../../components/public/PublicShell';
import { MiniBasket, MiniTennis } from '../../../components/ui/PlayDiagrams';
import { BASKETBALL_PLAYS, TENNIS_PLAYS } from '../../../components/predefinedPlays';

/**
 * /jugadas/[id] -> SSG con parametros: generateStaticParams le dice a Next que
 * ids existen y genera una pagina HTML por cada uno al compilar. Cualquier otro
 * id responde 404 (dynamicParams = false).
 */
export const dynamicParams = false;

const ALL = [
  ...BASKETBALL_PLAYS.filter((p) => p.positions).map((p) => ({ ...p, sport: 'BASKETBALL' })),
  ...TENNIS_PLAYS.filter((p) => p.positions).map((p) => ({ ...p, sport: 'TENNIS' })),
];

export function generateStaticParams() {
  return ALL.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const play = ALL.find((p) => p.id === id);
  return play ? { title: play.name, description: play.description, alternates: { canonical: `/jugadas/${id}` } } : {};
}

const LABELS = {
  j1: 'Atacante J1', j2: 'Atacante J2', j3: 'Atacante J3', j4: 'Atacante J4', j5: 'Atacante J5',
  d1: 'Defensor D1', d2: 'Defensor D2', d3: 'Defensor D3', d4: 'Defensor D4', d5: 'Defensor D5',
  ball: 'Balón', alcaraz: 'Sacador', sinner: 'Restador',
};

export default async function JugadaDetalle({ params }) {
  const { id } = await params;
  const play = ALL.find((p) => p.id === id);
  if (!play) notFound();
  const built = new Date().toISOString();

  return (
    <PublicShell>
      <PageHead
        eyebrow={play.sport === 'TENNIS' ? 'Tenis' : 'Baloncesto'}
        title={play.name}
        lead={play.description}
        mode="SSG"
        when={built}
        note={`Página estática generada para el id «${play.id}».`}
      />
      <section className="ta-pub-detail">
        <div className="ta-pub-diagram">
          {play.sport === 'TENNIS' ? <MiniTennis positions={play.positions} /> : <MiniBasket positions={play.positions} />}
        </div>
        <div>
          <h2>Posiciones iniciales</h2>
          <p className="ta-pub-note">Coordenadas del motor: 0 a 100 (porcentaje de la cancha).</p>
          <table className="ta-pub-table">
            <thead><tr><th>Ficha</th><th>x</th><th>y</th></tr></thead>
            <tbody>
              {Object.entries(play.positions).map(([k, p]) => (
                <tr key={k}><td>{LABELS[k] || k}</td><td>{p.x}</td><td>{p.y}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="ta-pub-actions">
            <Link href="/" className="ta-btn ta-btn-primary">Abrir el simulador</Link>
            <Link href="/jugadas" className="ta-btn">Todas las jugadas</Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
