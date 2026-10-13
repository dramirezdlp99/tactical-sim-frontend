import Link from 'next/link';
import { PublicShell, PageHead } from '../../components/public/PublicShell';
import { MiniBasket, MiniTennis } from '../../components/ui/PlayDiagrams';
import { BASKETBALL_PLAYS, TENNIS_PLAYS } from '../../components/predefinedPlays';

/**
 * /jugadas -> SSG. El catalogo sale de predefinedPlays.js, que solo cambia al
 * publicar una version nueva, asi que se genera al compilar.
 */
export const dynamic = 'force-static';
export const metadata = { title: 'Libro de jugadas', description: 'Jugadas predefinidas de baloncesto y tenis.' };

function PlayCard({ play, sport }) {
  return (
    <Link href={`/jugadas/${play.id}`} className="ta-pub-card">
      {sport === 'TENNIS' ? <MiniTennis positions={play.positions} /> : <MiniBasket positions={play.positions} />}
      <div>
        <h3>{play.name}</h3>
        <p>{play.description}</p>
      </div>
    </Link>
  );
}

export default function Jugadas() {
  const built = new Date().toISOString();
  const bb = BASKETBALL_PLAYS.filter((p) => p.positions);
  const tn = TENNIS_PLAYS.filter((p) => p.positions);
  return (
    <PublicShell>
      <PageHead
        eyebrow="Libro de jugadas"
        title="Jugadas listas para simular"
        lead="Cada jugada tiene su propia página, generada de antemano. Ábrela en el simulador para moverla y medirla."
        mode="SSG"
        when={built}
        note="Cada ficha de jugada es una página estática (generateStaticParams)."
      />
      <section className="ta-pub-section">
        <h2>Baloncesto</h2>
        <div className="ta-pub-grid">{bb.map((p) => <PlayCard key={p.id} play={p} sport="BASKETBALL" />)}</div>
      </section>
      <section className="ta-pub-section">
        <h2>Tenis</h2>
        <div className="ta-pub-grid">{tn.map((p) => <PlayCard key={p.id} play={p} sport="TENNIS" />)}</div>
      </section>
    </PublicShell>
  );
}
