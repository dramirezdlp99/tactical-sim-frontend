import React from 'react';
import { Icon } from './Icon';
import { Card } from './Widgets';

/**
 * LocalBoards
 * "Maletín offline": lista de pizarras guardadas en IndexedDB del
 * dispositivo (Modo Campo). La lógica vive en el hook useLocalBoards.
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/LocalBoards.jsx
 */
export const LocalBoards = ({ boards, isOnline }) => (
  <Card
    title="Maletín offline"
    icon="save"
    right={<span className="ta-chip" style={isOnline ? undefined : { color: 'var(--ta-warn)', borderColor: 'rgba(255,176,32,.4)', background: 'rgba(255,176,32,.1)' }}>{isOnline ? 'En línea' : 'Sin red'}</span>}
  >
    <p className="ta-hint">
      Guarda la pizarra en este dispositivo (funciona sin internet) para
      consultarla o editarla en camerinos y campos sin cobertura.
    </p>
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        className="ta-input"
        type="text"
        value={boards.name}
        onChange={(e) => boards.setName(e.target.value)}
        placeholder="Nombre de la pizarra"
        onKeyDown={(e) => { if (e.key === 'Enter') boards.save(); }}
      />
      <button type="button" className="ta-iconbtn" style={{ width: 40, height: 40, flexShrink: 0 }} onClick={boards.save} disabled={boards.status === 'saving'} title="Guardar en este dispositivo" aria-label="Guardar en este dispositivo">
        <Icon name={boards.status === 'saved' ? 'check' : 'save'} />
      </button>
    </div>
    {boards.status === 'error' && <p className="ta-hint" style={{ color: 'var(--ta-danger)', marginTop: 8 }}>No se pudo guardar en este navegador.</p>}
    {boards.list.length === 0 ? (
      <p className="ta-hint" style={{ marginTop: 10, fontStyle: 'italic' }}>Aún no hay pizarras guardadas en este dispositivo.</p>
    ) : (
      <ul className="ta-boards">
        {boards.list.map((b) => (
          <li key={b.id} className="ta-board">
            <div style={{ minWidth: 0 }}>
              <span className="ta-board-name">{b.name}</span>
              <small>{new Date(b.savedAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</small>
            </div>
            <div className="ta-board-actions">
              <button type="button" className="ta-iconbtn" onClick={() => boards.onLoad(b)} title="Cargar en la cancha" aria-label="Cargar en la cancha"><Icon name="upload" /></button>
              <button type="button" className="ta-iconbtn danger" onClick={() => boards.remove(b.id)} title="Eliminar" aria-label="Eliminar"><Icon name="trash" /></button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </Card>
);
