import React from 'react';
import { MiniBasket, MiniTennis, FreeIcon } from './PlayDiagrams';

/**
 * PlayLibrary
 * Biblioteca visual de jugadas: cada jugada es una tarjeta con un mini
 * diagrama dibujado con las posiciones reales del preset (en vez de un
 * simple <select>). El entrenador reconoce la jugada de un vistazo.
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/PlayLibrary.jsx
 */

export const PlayLibrary = ({ plays, selectedId, onSelect, sport }) => (
  <div className="ta-plays" role="list">
    {plays.map((play) => (
      <button
        key={play.id}
        type="button"
        role="listitem"
        className="ta-play"
        aria-pressed={selectedId === play.id}
        onClick={() => onSelect(play.id)}
      >
        {play.positions
          ? (sport === 'TENNIS' ? <MiniTennis positions={play.positions} /> : <MiniBasket positions={play.positions} />)
          : <FreeIcon sport={sport} />}
        <div>
          <div className="ta-play-name">{play.name}</div>
          <div className="ta-play-desc">{play.description}</div>
        </div>
      </button>
    ))}
  </div>
);
