import React, { useState } from 'react';
import { Icon } from './Icon';
import '../../styles/mirror.css';

/**
 * MirrorPanel
 * Botón "Proyectar" + ventana con el código de la sala, el enlace del
 * proyector y el estado en vivo (visores conectados). Se usa dentro de los
 * dos simuladores; la lógica de red vive en useMirrorEmitter.
 *
 * Guardar en: tactical-sim-frontend/src/components/ui/MirrorPanel.jsx
 */
const STATUS_LABEL = {
  connecting: 'Conectando…',
  live: 'En vivo',
  reconnecting: 'Reconectando…',
  error: 'Sin conexión',
};

export const MirrorPanel = ({ mirror, disabled }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const viewerUrl = mirror.roomCode
    ? `${window.location.origin}${window.location.pathname}?viewer=${mirror.roomCode}`
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(viewerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* el usuario puede copiar a mano desde el campo */ }
  };

  const handleClose = () => setOpen(false);

  return (
    <>
      <button
        type="button" className="ta-btn" onClick={() => setOpen(true)} disabled={disabled}
        title={disabled ? 'La duplicación requiere conexión al backend' : 'Proyectar esta pizarra en otra pantalla'}
      >
        <Icon name="cast" />
        {mirror.active ? <span className="ta-livebadge" data-s={mirror.status}><i /> {STATUS_LABEL[mirror.status]}</span> : 'Proyectar'}
      </button>

      {open && (
        <div className="ta-modal-back" onClick={handleClose} role="presentation">
          <div className="ta-modal" role="dialog" aria-modal="true" aria-label="Proyectar pizarra" onClick={(e) => e.stopPropagation()}>
            <div className="ta-modal-head">
              <h2><Icon name="cast" /> Proyectar</h2>
              <button type="button" className="ta-iconbtn" onClick={handleClose} aria-label="Cerrar"><Icon name="close" /></button>
            </div>

            {!mirror.roomCode && mirror.status !== 'connecting' && (
              <>
                <p className="ta-hint">
                  Muestra tu pizarra en tiempo real en una tablet, un proyector o la TV del camerino.
                  Cada movimiento de ficha y cada simulación se ve al instante, en modo solo lectura.
                </p>
                <ul className="ta-steps">
                  <li><b>1.</b> Pulsa “Iniciar proyección” para crear una sala.</li>
                  <li><b>2.</b> Abre el enlace en la otra pantalla (o la ventana del proyector).</li>
                  <li><b>3.</b> Arrastra las fichas: el proyector las sigue en vivo.</li>
                </ul>
                {mirror.error && <div className="ta-notice err" style={{ marginTop: 14 }}><Icon name="alert" /><div>{mirror.error}</div></div>}
                <button type="button" className="ta-btn ta-btn-primary ta-btn-block" style={{ marginTop: 16 }} onClick={mirror.start}>
                  <Icon name="cast" /> Iniciar proyección
                </button>
              </>
            )}

            {!mirror.roomCode && mirror.status === 'connecting' && <p className="ta-hint">Creando la sala…</p>}

            {mirror.roomCode && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <span className="ta-livebadge" data-s={mirror.status}><i /> {STATUS_LABEL[mirror.status]} · {mirror.viewers} {mirror.viewers === 1 ? 'visor' : 'visores'}</span>
                </div>
                <div className="ta-code" aria-label={`Código de sala ${mirror.roomCode}`}>
                  {mirror.roomCode.split('').map((c, i) => <span key={i}>{c}</span>)}
                </div>
                <p className="ta-hint" style={{ textAlign: 'center' }}>Código de la sala (compártelo solo con quien deba ver la pizarra)</p>
                <div className="ta-linkbox">
                  <input readOnly value={viewerUrl} onFocus={(e) => e.target.select()} aria-label="Enlace del proyector" />
                  <button type="button" className="ta-btn" onClick={copy}><Icon name={copied ? 'check' : 'link'} />{copied ? 'Copiado' : 'Copiar'}</button>
                </div>
                {mirror.error && <div className="ta-notice err" style={{ marginTop: 14 }}><Icon name="alert" /><div>{mirror.error}</div></div>}
                <div className="ta-dock" style={{ paddingTop: 16 }}>
                  <button type="button" className="ta-btn" onClick={() => window.open(viewerUrl, 'tacticai-projector', 'popup,width=1280,height=760')}>
                    <Icon name="stadium" /> Abrir ventana de proyector
                  </button>
                  <button type="button" className="ta-btn" onClick={() => { mirror.stop(); }} style={{ color: 'var(--ta-danger)' }}>
                    Detener
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
