import React, { useState, useMemo, useCallback } from 'react';
import { TENNIS_PLAYS, getPlayById } from './predefinedPlays';
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
import { humanizeAction, toPct } from './ui/format';
import { TennisCourt, SURFACE_OPTIONS, tnToPercent, tnClamp } from './courts/TennisCourt';

// Cancha en el sistema del motor: x = ancho (0-100), y = largo (0-100). El sacador está en y alto.
const DEFAULT_POSITIONS = {
  alcaraz: { x: 25, y: 92 },
  sinner: { x: 50, y: 8 },
  ball: { x: 38, y: 40 }
};

const MATCHES = {
  'alcaraz-sinner': { server: 'C. ALCARAZ', receiver: 'J. SINNER', label: 'C. Alcaraz vs J. Sinner' },
  'nadal-djokovic': { server: 'R. NADAL', receiver: 'N. DJOKOVIC', label: 'R. Nadal vs N. Djokovic' },
  'medvedev-zverev': { server: 'D. MEDVEDEV', receiver: 'A. ZVEREV', label: 'D. Medvedev vs A. Zverev' }
};

export const TennisSimulator = ({ user, onLogout, onSwitchToBasketball, onViewHistory }) => {
  const [surface, setSurface] = useState('hard'); // 'hard', 'clay', 'grass'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showRival, setShowRival] = useState(true);

  const [selectedPlayId, setSelectedPlayId] = useState('custom');
  const selectedPlay = useMemo(() => getPlayById(TENNIS_PLAYS, selectedPlayId), [selectedPlayId]);

  const [matchPreset, setMatchPreset] = useState('alcaraz-sinner');
  const match = MATCHES[matchPreset];

  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [result, setResult] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const isCoach = user?.role === 'ROLE_COACH' || user?.role === 'ROLE_ADMIN';
  const isOnline = useOnlineStatus();


  const clearResult = useCallback(() => {
    setResult(null);
    setErrorMessage('');
    setSaveStatus('');
  }, []);

  const localBoards = useLocalBoards('TENNIS', {
    getPositions: () => positions,
    getNote: () => (selectedPlay.id !== 'custom' ? selectedPlay.name : ''),
    onLoadBoard: (board) => {
      setPositions(board.positions);
      setSelectedPlayId('custom');
      clearResult();
    }
  });

  const drag = useBoardDrag({
    toPercent: tnToPercent,
    clamp: tnClamp,
    onStart: () => setSelectedPlayId('custom'),
    onMove: (key, next) => setPositions((prev) => ({ ...prev, [key]: next }))
  });

  const handleSelectPlay = (playId) => {
    setSelectedPlayId(playId);
    const play = getPlayById(TENNIS_PLAYS, playId);
    if (play.positions) setPositions(play.positions);
    clearResult();
  };

  const handleReset = () => {
    setPositions(DEFAULT_POSITIONS);
    setSelectedPlayId('custom');
    clearResult();
  };

  const handleRun = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const token = user?.token || localStorage.getItem('token') || '';
      const res = await fetch(`${BACKEND_URL}/api/v1/simulation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          match_id: `ATP-${matchPreset.toUpperCase()}-2026`,
          team_home_positions: [{ player_id: match.server, x: positions.alcaraz.x, y: positions.alcaraz.y }],
          team_away_positions: [{ player_id: match.receiver, x: positions.sinner.x, y: positions.sinner.y }],
          ball_position: { player_id: 'BALL', x: positions.ball.x, y: positions.ball.y }
        })
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data) {
        setResult(json.data);
        setSaveStatus('');
      } else {
        setErrorMessage(json?.message || `Error del servidor (HTTP ${res.status}) al ejecutar la simulación.`);
      }
    } catch (err) {
      setErrorMessage('No se pudo conectar con el backend o con el motor de IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlay = async () => {
    if (!result) return;
    setSaveStatus('saving');
    try {
      const token = user?.token || localStorage.getItem('token') || '';
      const res = await fetch(`${BACKEND_URL}/api/v1/simulation/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sport: 'TENNIS',
          playName: selectedPlay.id !== 'custom' ? selectedPlay.name : 'Saque Personalizado',
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
  const angle = toPct(result?.secondary_efficiency);
  const doubleFault = toPct(result?.risk_index);

  return (
    <div className="ta-app" data-sport="TENNIS">
      <TopBar
        user={user} isOnline={isOnline} sport="TENNIS"
        onBasketball={onSwitchToBasketball} onLogout={onLogout} onViewHistory={onViewHistory}
        modeLabel="Tenis · ATP Tour"
      />

      <main className="ta-page">
        {!isOnline && <OfflineBanner />}
        {errorMessage && <Notice tone="err" icon="alert">{errorMessage}</Notice>}

        <div className="ta-grid">
          <div className="ta-col">
            <Card title="Libro de saques" icon="whistle">
              <PlayLibrary plays={TENNIS_PLAYS} selectedId={selectedPlayId} onSelect={handleSelectPlay} sport="TENNIS" />
              {selectedPlay.id !== 'custom' && (
                <div className="ta-brief"><b>{selectedPlay.name}</b>{selectedPlay.description}</div>
              )}
            </Card>
            <LocalBoards boards={localBoards} isOnline={isOnline} />
          </div>

          <div className="ta-stage">
            <div className="ta-stage-head">
              <div className="ta-stage-title">
                Saque · {match.label}
                <small>Cancha de individuales · 78 × 27 ft · arrastra sacador, restador y punto de caída</small>
              </div>
              <div className="ta-legend">
                <span><i style={{ background: '#c8f03c' }} />Sacador</span>
                <span><i style={{ background: '#f7f9fc' }} />Restador</span>
                <span><i style={{ background: '#a4cf15', boxShadow: '0 0 0 2px #fff3' }} />Punto de caída</span>
              </div>
            </div>

            <div className="ta-toolbar">
              <span className="ta-field-label">Partido</span>
              <select className="ta-select" value={matchPreset} onChange={(e) => setMatchPreset(e.target.value)} aria-label="Partido">
                {Object.entries(MATCHES).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
              </select>
              <span className="ta-field-label">Superficie</span>
              <select className="ta-select" value={surface} onChange={(e) => setSurface(e.target.value)} aria-label="Superficie">
                {SURFACE_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="ta-court-wrap">
              <TennisCourt
                positions={positions} result={result} surface={surface}
                showHeat={showHeatmap} showVectors={showVectors} showRival={showRival}
                drag={drag} serverName={match.server} receiverName={match.receiver}
              />
              {loading && <div className="ta-scan" />}
            </div>

            <div className="ta-dock">
              <div className="ta-dock-group">
                <button type="button" className="ta-btn" onClick={handleReset}><Icon name="reset" /> Limpiar cancha</button>
              </div>
              <div className="ta-dock-group">
                {isCoach && (
                  <button type="button" className="ta-btn" onClick={handleSavePlay} disabled={!result || saveStatus === 'saving' || !isOnline}
                    title={!isOnline ? 'Requiere conexión: se reactiva al volver la señal' : undefined}>
                    <Icon name={saveStatus === 'saved' ? 'check' : 'save'} />
                    {saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'saved' ? 'Guardada' : saveStatus === 'error' ? 'Reintentar' : 'Guardar en historial'}
                  </button>
                )}
                <button type="button" className="ta-btn ta-btn-primary" onClick={handleRun} disabled={loading || !isOnline}
                  title={!isOnline ? 'La simulación con IA requiere conexión al backend' : undefined}>
                  <Icon name={loading ? 'reset' : !isOnline ? 'wifioff' : 'bolt'} className={loading ? 'ta-spin' : ''} />
                  {loading ? 'Procesando…' : !isOnline ? 'Sin conexión' : 'Simular saque con IA'}
                </button>
              </div>
            </div>
          </div>

          <div className="ta-col ta-right">
            <Card title="Motor predictivo" icon="brain">
              <Gauge value={probability} caption={probability != null ? 'Punto ganado al saque' : 'Sin simulación'} />
              <div className="ta-meters">
                <Meter label="Limpieza del ángulo de saque" value={angle} />
                <Meter label="Riesgo de doble falta" value={doubleFault} invert />
                <Meter label="Velocidad estimada" raw={result?.ball_speed_kmh != null ? `${Math.round(result.ball_speed_kmh)} km/h` : null} />
                <Meter label="Efecto (spin)" raw={result?.spin_rate_rpm != null ? `${Math.round(result.spin_rate_rpm)} rpm` : null} />
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
                <div className="ta-empty">Coloca sacador, restador y el punto de caída; luego pulsa <b>Simular saque con IA</b>.</div>
              )}
            </Card>

            {result?.defense_scheme && (
              <Card title="Cuerpo técnico rival" icon="users">
                <div className="ta-rival">
                  <Icon name="whistle" />
                  <div><b>Así reaccionaría el restador</b><span>{result.defense_scheme}</span></div>
                </div>
              </Card>
            )}

            <Card title="Capas de la cancha" icon="layers">
              <Toggle label="Zona de impacto (calor)" checked={showHeatmap} onChange={setShowHeatmap} />
              <Toggle label="Trayectoria del saque" checked={showVectors} onChange={setShowVectors} />
              <Toggle label="Anticipación del restador" checked={showRival} onChange={setShowRival} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
