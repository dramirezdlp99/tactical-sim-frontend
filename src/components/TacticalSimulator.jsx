import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { getModeConfig } from './entityModes';
import { BASKETBALL_PLAYS, getPlayById } from './predefinedPlays';
import { BACKEND_URL } from './apiConfig';
import { useOnlineStatus } from './useOnlineStatus';
import { useLocalBoards } from './useLocalBoards';
import { useBoardDrag } from './useBoardDrag';
import { OfflineBanner } from './OfflineBanner';
import { TopBar, Notice } from './ui/Shell';
import { Icon } from './ui/Icon';
import { Card, Gauge, Meter, Toggle } from './ui/Widgets';
import { PlayLibrary } from './ui/PlayLibrary';
import { LocalBoards } from './ui/LocalBoards';
import { MirrorPanel } from './ui/MirrorPanel';
import { LocalLab } from './ui/LocalLab';
import { useMirrorEmitter } from './useMirrorEmitter';
import { useSpaceEngine } from '../engine/useSpaceEngine';
import { humanizeAction, toPct } from './ui/format';
import { BasketballCourt, bbToPercent, bbClamp, BB_BALL_OFFSET, BB_SCALE } from './courts/BasketballCourt';

const DEFAULT_POSITIONS = {
  j1: { x: 47, y: 61 }, j2: { x: 14, y: 17 }, j3: { x: 81, y: 36 },
  j4: { x: 54, y: 55 }, j5: { x: 66, y: 18 }, d1: { x: 49, y: 57 },
  d2: { x: 29, y: 29 }, d3: { x: 75, y: 38 }, d4: { x: 51, y: 42 },
  d5: { x: 51, y: 24 }, ball: { x: 45, y: 66 }
};

export const TacticalSimulator = ({ user, onLogout, onSwitchToTennis, onViewHistory }) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showRival, setShowRival] = useState(true);
  const [showLive, setShowLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // La entidad elegida en el registro cambia el enfoque del panel (Franquicia/Academia/Federación).
  const modeConfig = useMemo(() => getModeConfig(user?.entityType), [user?.entityType]);

  // 'custom' = el usuario mueve las fichas; cualquier otro id coloca todo automáticamente.
  const [selectedPlayId, setSelectedPlayId] = useState('custom');
  const selectedPlay = useMemo(() => getPlayById(BASKETBALL_PLAYS, selectedPlayId), [selectedPlayId]);

  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [result, setResult] = useState(null); // respuesta cruda del motor (0-1, sin redondear)
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const isCoach = user?.role === 'ROLE_COACH' || user?.role === 'ROLE_ADMIN';
  const isOnline = useOnlineStatus();

  // Laboratorio local: Web Workers + memoria compartida, recalcula mientras arrastras y funciona sin internet.
  const lab = useSpaceEngine('BASKETBALL', positions);

  // Duplicación de pantalla en tiempo real: cada cambio de la pizarra se emite al proyector.
  const mirror = useMirrorEmitter({ token: user?.token || localStorage.getItem('token') });
  useEffect(() => {
    if (mirror.active) mirror.send({ sport: 'BASKETBALL', positions, result, layers: { heat: showHeatmap, vectors: showVectors, rival: showRival } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, result, showHeatmap, showVectors, showRival, mirror.status]);

  const clearResult = useCallback(() => {
    setResult(null);
    setErrorMessage('');
    setSaveStatus('');
  }, []);

  // Modo Campo: pizarras en IndexedDB (sin backend)
  const localBoards = useLocalBoards('BASKETBALL', {
    getPositions: () => positions,
    getNote: () => (selectedPlay.id !== 'custom' ? selectedPlay.name : ''),
    onLoadBoard: (board) => {
      setPositions(board.positions);
      setSelectedPlayId('custom');
      clearResult();
    }
  });

  // Arrastre de fichas. El balón se dibuja desplazado, así que se descuenta ese desplazamiento.
  const drag = useBoardDrag({
    toPercent: bbToPercent,
    clamp: bbClamp,
    onStart: () => setSelectedPlayId('custom'),
    onMove: (key, next) => {
      const p = key === 'ball'
        ? bbClamp({ x: next.x - BB_BALL_OFFSET.x / BB_SCALE, y: next.y - BB_BALL_OFFSET.y / BB_SCALE })
        : next;
      setPositions((prev) => ({ ...prev, [key]: p }));
    }
  });

  const handleSelectPlay = (playId) => {
    setSelectedPlayId(playId);
    const play = getPlayById(BASKETBALL_PLAYS, playId);
    if (play.positions) setPositions(play.positions);
    clearResult();
  };

  const handleReset = () => {
    setPositions(DEFAULT_POSITIONS);
    setSelectedPlayId('custom');
    setResult(null);
    clearResult();
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Se envían los 5 atacantes, los 5 defensores y el balón.
      const payload = {
        match_id: 'MATCH-BBALL-2026',
        team_home_positions: ['j1', 'j2', 'j3', 'j4', 'j5'].map((k) => ({ player_id: k.toUpperCase(), x: positions[k].x, y: positions[k].y })),
        team_away_positions: ['d1', 'd2', 'd3', 'd4', 'd5'].map((k) => ({ player_id: k.toUpperCase(), x: positions[k].x, y: positions[k].y })),
        ball_position: { player_id: 'BALL', x: positions.ball.x, y: positions.ball.y }
      };
      const res = await fetch(`${BACKEND_URL}/api/v1/simulation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token || ''}` },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data) {
        setResult(json.data);
        setSaveStatus('');
      } else {
        // Nunca se inventan datos: si falla, se muestra el error real y la telemetría queda vacía.
        setErrorMessage(json?.message || `Error del servidor (HTTP ${res.status}) al ejecutar la simulación.`);
      }
    } catch (err) {
      setErrorMessage('No se pudo conectar con el backend o con el motor de IA.');
    } finally {
      setLoading(false);
    }
  };

  // Guarda la jugada (posiciones + resultado de la IA) en el historial del equipo. Solo Entrenador.
  const handleSavePlay = async () => {
    if (!result) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/simulation/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token || ''}` },
        body: JSON.stringify({
          sport: 'BASKETBALL',
          playName: selectedPlay.id !== 'custom' ? selectedPlay.name : 'Jugada Personalizada',
          positionsJson: JSON.stringify(positions),
          successProbability: result.success_probability,
          secondaryEfficiency: result.secondary_efficiency,
          riskIndex: result.risk_index,
          recommendedAction: result.recommended_action,
          tacticalNote: result.tactical_note
        })
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const probability = toPct(result?.success_probability);
  const zoneEff = toPct(result?.secondary_efficiency);
  const risk = toPct(result?.risk_index);
  const cleanShot = toPct(result?.clean_shot_probability);
  const passEff = toPct(result?.pass_effectiveness);
  const lensValues = [probability, zoneEff, risk != null ? 100 - risk : null];

  return (
    <div className="ta-app" data-sport="BASKETBALL">
      <TopBar
        user={user} isOnline={isOnline} sport="BASKETBALL"
        onTennis={onSwitchToTennis} onLogout={onLogout} onViewHistory={onViewHistory}
        modeLabel={modeConfig.label}
      />

      <main className="ta-page">
        {!isOnline && <OfflineBanner />}
        {errorMessage && <Notice tone="err" icon="alert">{errorMessage}</Notice>}

        <div className="ta-grid">
          {/* ---------- Columna izquierda: jugadas + maletín offline ---------- */}
          <div className="ta-col">
            <Card title="Libro de jugadas" icon="whistle">
              <PlayLibrary plays={BASKETBALL_PLAYS} selectedId={selectedPlayId} onSelect={handleSelectPlay} sport="BASKETBALL" />
              {selectedPlay.id !== 'custom' && (
                <div className="ta-brief"><b>{selectedPlay.name}</b>{selectedPlay.description}</div>
              )}
            </Card>
            <LocalBoards boards={localBoards} isOnline={isOnline} />
            <LocalLab sport="BASKETBALL" lab={lab} />
          </div>

          {/* ---------- Centro: la cancha ---------- */}
          <div className="ta-stage">
            <div className="ta-stage-head">
              <div className="ta-stage-title">
                Ataque vs defensa · 5v5
                <small>Media cancha NBA · escala real · arrastra las fichas</small>
              </div>
              <div className="ta-legend">
                <span><i style={{ background: '#3b6bff' }} />Ataque</span>
                <span><i style={{ background: '#e5383b' }} />Defensa</span>
                <span><i style={{ background: '#ff8a2b' }} />Balón</span>
              </div>
            </div>

            <div className="ta-court-wrap">
              <BasketballCourt
                positions={positions} result={result}
                showHeat={showHeatmap} showVectors={showVectors} showRival={showRival}
                drag={drag} liveHeat={showLive ? lab.heat : null}
              />
              {loading && <div className="ta-scan" />}
            </div>

            <div className="ta-dock">
              <div className="ta-dock-group">
                <button type="button" className="ta-btn" onClick={handleReset}><Icon name="reset" /> Limpiar cancha</button>
              </div>
              <div className="ta-dock-group">
                <MirrorPanel mirror={mirror} disabled={!isOnline} />
                {isCoach && (
                  <button
                    type="button" className="ta-btn" onClick={handleSavePlay}
                    disabled={!result || saveStatus === 'saving' || !isOnline}
                    title={!isOnline ? 'Requiere conexión: se reactiva al volver la señal' : undefined}
                  >
                    <Icon name={saveStatus === 'saved' ? 'check' : 'save'} />
                    {saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'saved' ? 'Guardada' : saveStatus === 'error' ? 'Reintentar' : 'Guardar en historial'}
                  </button>
                )}
                <button
                  type="button" className="ta-btn ta-btn-primary" onClick={handleRunSimulation}
                  disabled={loading || !isOnline}
                  title={!isOnline ? 'La simulación con IA requiere conexión al backend' : undefined}
                >
                  <Icon name={loading ? 'reset' : !isOnline ? 'wifioff' : 'bolt'} className={loading ? 'ta-spin' : ''} />
                  {loading ? 'Procesando…' : !isOnline ? 'Sin conexión' : 'Simular jugada con IA'}
                </button>
              </div>
            </div>
          </div>

          {/* ---------- Columna derecha: análisis ---------- */}
          <div className="ta-col ta-right">
            <Card
              title="Motor predictivo" icon="brain"
            >
              <Gauge value={probability} caption={probability != null ? 'Probabilidad de éxito' : 'Sin simulación'} />
              <div className="ta-meters">
                <Meter label="Tiro limpio" value={cleanShot} />
                <Meter label="Efectividad del pase" value={passEff} />
                <Meter label="Efectividad de zona" value={zoneEff} />
                <Meter label="Riesgo de pérdida de balón" value={risk} invert />
              </div>
              {result?.execution_thread && <div className="ta-model" style={{ marginTop: 12 }}>Ejecución: {result.execution_thread}</div>}
            </Card>

            <Card title="Recomendación" icon="target">
              {result ? (
                <div className="ta-reco">
                  <div className="ta-reco-action">{humanizeAction(result.recommended_action)}</div>
                  <p className="ta-reco-note" style={{ margin: 0 }}>{result.tactical_note}</p>
                  {result.model_info && <div className="ta-model">{result.model_info}</div>}
                </div>
              ) : (
                <div className="ta-empty">Mueve las fichas o elige una jugada y pulsa <b>Simular jugada con IA</b> para obtener la recomendación del cuerpo técnico virtual.</div>
              )}
            </Card>

            {result?.defense_scheme && (
              <Card title="Cuerpo técnico rival" icon="users">
                <div className="ta-rival">
                  <Icon name="whistle" />
                  <div>
                    <b>Así reaccionaría la defensa</b>
                    <span>{result.defense_scheme}</span>
                  </div>
                </div>
              </Card>
            )}

            <Card title={modeConfig.label} icon="stadium">
              <p className="ta-hint" style={{ marginBottom: 6 }}>{modeConfig.focus}</p>
              <div className="ta-lens">
                <ul>
                  {modeConfig.metrics.map((m, idx) => (
                    <li key={m.key}><span>{m.label}</span><span className="ta-num">{lensValues[idx] != null ? `${lensValues[idx]}%` : '—'}</span></li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card title="Capas de la cancha" icon="layers">
              <Toggle label="Espacio libre en vivo (local)" checked={showLive} onChange={setShowLive} />
              <Toggle label="Mapa de calor del motor de IA" checked={showHeatmap} onChange={setShowHeatmap} />
              <Toggle label="Acción recomendada" checked={showVectors} onChange={setShowVectors} />
              <Toggle label="Reacción de la defensa rival" checked={showRival} onChange={setShowRival} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
