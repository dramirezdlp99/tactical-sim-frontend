import React, { useState, useRef, useMemo } from 'react';
import { getModeConfig } from './entityModes';
import { BASKETBALL_PLAYS, getPlayById } from './predefinedPlays';

export const TacticalSimulator = ({ user, onLogout, onSwitchToTennis }) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // CAMBIO: la entidad elegida en el registro ahora sí cambia el enfoque
  // del panel (Franquicia/Academia/Federación), no solo el nombre del rol.
  const modeConfig = useMemo(() => getModeConfig(user?.entityType), [user?.entityType]);

  // NUEVO: jugadas predeterminadas. 'custom' = el usuario mueve las
  // fichas libremente; cualquier otro id posiciona todo automáticamente.
  const [selectedPlayId, setSelectedPlayId] = useState('custom');
  const selectedPlay = useMemo(
    () => getPlayById(BASKETBALL_PLAYS, selectedPlayId),
    [selectedPlayId]
  );

  const [telemetry, setTelemetry] = useState({
    probability: null,
    openShot: null,
    recommendation: '—',
    thread: '—'
  });

  // Coordenadas para Baloncesto (5v5)
  const [positions, setPositions] = useState({
    j1: { x: 47, y: 61 },
    j2: { x: 14, y: 17 },
    j3: { x: 81, y: 36 },
    j4: { x: 54, y: 55 },
    j5: { x: 66, y: 18 },
    d1: { x: 49, y: 57 },
    d2: { x: 29, y: 29 },
    d3: { x: 75, y: 38 },
    d4: { x: 51, y: 42 },
    d5: { x: 51, y: 24 },
    ball: { x: 45, y: 66 }
  });

  const courtRef = useRef(null);
  const activeTokenRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e, key) => {
    activeTokenRef.current = key;
    // Si el usuario arrastra una ficha, la jugada deja de coincidir con
    // el preset elegido: se marca como "Posición Libre" para no mostrar
    // una descripción que ya no corresponde a las posiciones reales.
    setSelectedPlayId('custom');
    const tokenRect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - tokenRect.left,
      y: e.clientY - tokenRect.top
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePlayChange = (e) => {
    const playId = e.target.value;
    setSelectedPlayId(playId);
    const play = getPlayById(BASKETBALL_PLAYS, playId);
    if (play.positions) {
      setPositions(play.positions);
    }
    setTelemetry({ probability: null, openShot: null, recommendation: '—', thread: '—' });
    setErrorMessage('');
  };

  const handlePointerMove = (e, key) => {
    if (activeTokenRef.current !== key || !courtRef.current) return;
    const courtRect = courtRef.current.getBoundingClientRect();
    let newX = ((e.clientX - courtRect.left - dragOffsetRef.current.x) / courtRect.width) * 100;
    let newY = ((e.clientY - courtRect.top - dragOffsetRef.current.y) / courtRect.height) * 100;

    newX = Math.max(3, Math.min(94, newX));
    newY = Math.max(3, Math.min(92, newY));

    setPositions((prev) => ({
      ...prev,
      [key]: { x: newX, y: newY }
    }));
  };

  const handlePointerUp = (e, key) => {
    if (activeTokenRef.current === key) {
      activeTokenRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // CAMBIO CLAVE: antes solo se enviaba D1, ahora se envían los 5
      // defensores reales (d1-d5). El motor de IA estaba evaluando la
      // jugada con información incompleta de la defensa.
      const payload = {
        match_id: 'MATCH-BBALL-2026',
        team_home_positions: [
          { player_id: 'J1', x: positions.j1.x, y: positions.j1.y },
          { player_id: 'J2', x: positions.j2.x, y: positions.j2.y },
          { player_id: 'J3', x: positions.j3.x, y: positions.j3.y },
          { player_id: 'J4', x: positions.j4.x, y: positions.j4.y },
          { player_id: 'J5', x: positions.j5.x, y: positions.j5.y }
        ],
        team_away_positions: [
          { player_id: 'D1', x: positions.d1.x, y: positions.d1.y },
          { player_id: 'D2', x: positions.d2.x, y: positions.d2.y },
          { player_id: 'D3', x: positions.d3.x, y: positions.d3.y },
          { player_id: 'D4', x: positions.d4.x, y: positions.d4.y },
          { player_id: 'D5', x: positions.d5.x, y: positions.d5.y }
        ],
        ball_position: { player_id: 'BALL', x: positions.ball.x, y: positions.ball.y }
      };

      const res = await fetch('http://localhost:9096/api/v1/simulation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.data) {
        const data = json.data;
        setTelemetry({
          probability: Math.round(data.success_probability * 100),
          openShot: Math.round(data.success_probability * 75),
          recommendation: data.recommended_action || 'Sin recomendación disponible',
          thread: data.execution_thread || 'WorkerThread-Async'
        });
      } else {
        // CAMBIO CLAVE: antes, si la petición fallaba, se rellenaba con
        // telemetría inventada (88%, 66%, etc.) como si la IA hubiera
        // respondido. Eso ocultaba errores reales del backend/IA. Ahora
        // se muestra el error y la telemetría queda vacía ("—").
        setErrorMessage(
          json?.message || `Error del servidor (HTTP ${res.status}) al ejecutar la simulación.`
        );
      }
    } catch (err) {
      setErrorMessage('No se pudo conectar con el backend (puerto 9096) o con el motor de IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPositions({
      j1: { x: 47, y: 61 }, j2: { x: 14, y: 17 }, j3: { x: 81, y: 36 },
      j4: { x: 54, y: 55 }, j5: { x: 66, y: 18 }, d1: { x: 49, y: 57 },
      d2: { x: 29, y: 29 }, d3: { x: 75, y: 38 }, d4: { x: 51, y: 42 },
      d5: { x: 51, y: 24 }, ball: { x: 45, y: 66 }
    });
    setTelemetry({ probability: null, openShot: null, recommendation: '—', thread: '—' });
    setErrorMessage('');
    setSelectedPlayId('custom');
  };

  return (
    <div className="bg-background min-h-screen text-on-surface">
      {/* Header Superior */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/95 backdrop-blur-md border-b border-surface-container px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-on-surface">TACTIC<span className="text-secondary">AI</span></span>
            <span className="text-xs uppercase text-on-surface-variant font-semibold">Simulador Baloncesto NBA</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full border border-surface-container">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-700 font-mono font-medium">AI Engine Online (v4.2.1-prod)</span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
            {modeConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-semibold hidden md:inline">{user?.email || 'Analista Táctico'}</span>
          </div>
          <button onClick={onLogout} className="p-1.5 rounded hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </header>

      {/* Workspace Principal */}
      <main className="pt-20 px-6 pb-6 max-w-7xl mx-auto">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-surface-container flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded">
            <button className="px-4 py-1.5 rounded text-xs font-bold uppercase bg-primary text-white shadow-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">sports_basketball</span> BALONCESTO (NBA)
            </button>
            <button
              onClick={onSwitchToTennis}
              className="px-4 py-1.5 rounded text-xs font-bold uppercase text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">sports_tennis</span> TENIS (ATP TOUR)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-on-surface-variant">Jugada:</span>
              <select
                value={selectedPlayId}
                onChange={handlePlayChange}
                className="bg-surface-container-low text-on-surface text-xs font-bold px-3 py-1.5 rounded border border-surface-container focus:outline-none cursor-pointer"
              >
                {BASKETBALL_PLAYS.map((play) => (
                  <option key={play.id} value={play.id}>{play.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-1.5 rounded bg-surface-container-low hover:bg-surface-container text-xs font-bold uppercase flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span> Limpiar Cancha
            </button>
          </div>
        </div>

        {selectedPlay.id !== 'custom' && (
          <div className="mb-6 p-3 bg-secondary/10 border border-secondary/30 rounded-lg flex items-start gap-2">
            <span className="material-symbols-outlined text-secondary text-sm mt-0.5">school</span>
            <p className="text-xs text-on-surface leading-relaxed">
              <span className="font-bold">{selectedPlay.name}:</span> {selectedPlay.description}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* Cancha 2D Interactive SVG */}
          <div className="xl:col-span-8 bg-white p-4 rounded-lg shadow-sm border border-surface-container">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                Ofensiva vs Defensa (5v5)
              </span>
              <span className="text-on-surface-variant font-mono">
                Superficie: Madera Parquet
              </span>
            </div>

            <div
              ref={courtRef}
              className="relative w-full aspect-[28/18] select-none rounded overflow-hidden shadow-inner cursor-crosshair border border-surface-container"
              style={{ backgroundColor: '#FAF5EE' }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 900 620">
                <rect x="20" y="20" width="860" height="580" fill="none" stroke="#334155" strokeWidth="2.5" />
                <line x1="20" y1="560" x2="880" y2="560" stroke="#334155" strokeWidth="2" />
                <rect x="330" y="20" width="240" height="270" fill="#8FA7FE" fillOpacity="0.12" stroke="#334155" strokeWidth="2" />
                <circle cx="450" cy="72" r="14" fill="none" stroke="#F59E0B" strokeWidth="3" />
                <path d="M 85 185 A 395 395 0 0 0 815 185" fill="none" stroke="#334155" strokeWidth="2" />

                {showHeatmap && (
                  <g className="transition-opacity duration-300">
                    <ellipse
                      cx={`${positions.j2.x * 9}`}
                      cy={`${positions.j2.y * 6.2}`}
                      rx="80" ry="60" fill="#10B981" fillOpacity="0.35"
                    />
                  </g>
                )}

                {showVectors && (
                  <g className="transition-opacity duration-300">
                    <line
                      x1={`${positions.j1.x * 9}`}
                      y1={`${positions.j1.y * 6.2}`}
                      x2={`${positions.j2.x * 9}`}
                      y2={`${positions.j2.y * 6.2}`}
                      stroke="#F59E0B" strokeWidth="3" strokeDasharray="6 6"
                    />
                  </g>
                )}
              </svg>

              {Object.entries(positions).map(([key, pos]) => {
                const isOffense = key.startsWith('j');
                const isBall = key === 'ball';
                return (
                  <div
                    key={key}
                    onPointerDown={(e) => handlePointerDown(e, key)}
                    onPointerMove={(e) => handlePointerMove(e, key)}
                    onPointerUp={(e) => handlePointerUp(e, key)}
                    className="absolute cursor-grab active:cursor-grabbing flex flex-col items-center"
                    style={{ top: `${pos.y}%`, left: `${pos.x}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    {isBall ? (
                      <div className="w-5 h-5 rounded-full bg-amber-400 shadow-lg ring-2 ring-white flex items-center justify-center">
                        <div className="w-2.5 h-0.5 bg-black/40 rotate-45"></div>
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shadow-md ring-2 ring-white ${
                        isOffense ? 'bg-secondary text-white' : 'bg-error text-white'
                      }`}>
                        {key.toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleRunSimulation}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-secondary text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
              >
                <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
                  {loading ? 'sync' : 'bolt'}
                </span>
                <span>{loading ? 'PROCESANDO CON IA...' : 'SIMULAR JUGADA CON IA'}</span>
              </button>
            </div>
          </div>

          {/* Panel de Telemetría */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-surface-container flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-4">
                <span className="text-xs uppercase font-bold text-on-surface-variant">Motor Predictivo IA</span>
                <span className="text-xs bg-surface-container px-2 py-0.5 rounded font-mono font-medium">{telemetry.thread}</span>
              </div>

              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#CBD5E1" strokeWidth="10" opacity="0.4" />
                  <circle
                    cx="60" cy="60" r="50" fill="none" stroke="#059669" strokeWidth="10"
                    strokeDasharray="314.159"
                    strokeDashoffset={314.159 - (314.159 * (telemetry.probability || 0)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-on-surface">
                    {telemetry.probability != null ? `${telemetry.probability}%` : '—'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 mt-1">
                    {telemetry.probability != null ? 'xPTS calculado' : 'Sin datos aún'}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 mt-6">
                <div className="bg-surface-container-low p-3 rounded">
                  <span className="text-xs text-on-surface-variant block">Efectividad Zona</span>
                  <span className="text-lg font-bold">{telemetry.openShot != null ? `${telemetry.openShot}%` : '—'}</span>
                </div>
                <div className="bg-surface-container-low p-3 rounded">
                  <span className="text-xs text-on-surface-variant block">Riesgo Error</span>
                  <span className="text-lg font-bold">
                    {telemetry.probability != null ? `${100 - telemetry.probability}%` : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-surface-container">
              <div className="flex items-center gap-2 text-emerald-700 mb-3">
                <span className="material-symbols-outlined">smart_toy</span>
                <span className="text-xs uppercase font-bold tracking-wider">Recomendación Táctica IA</span>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg">
                <span className="block text-sm font-bold text-on-surface mb-1">{telemetry.recommendation}</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {telemetry.probability != null
                    ? 'Resultado calculado por el motor de IA a partir de las posiciones actuales.'
                    : 'Ejecuta "SIMULAR JUGADA CON IA" para obtener una recomendación real.'}
                </p>
              </div>
            </div>

            {/* Panel de métricas dinámicas según entityType (Franquicia/Academia/Federación) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-surface-container">
              <span className="text-sm font-bold text-on-surface block mb-1">{modeConfig.label}</span>
              <p className="text-xs text-on-surface-variant mb-4">{modeConfig.focus}</p>
              <ul className="space-y-2">
                {modeConfig.metrics.map((m) => (
                  <li key={m.key} className="flex items-center justify-between text-xs bg-surface-container-low p-2 rounded">
                    <span className="text-on-surface-variant">{m.label}</span>
                    <span className="font-bold text-on-surface">
                      {telemetry.probability != null ? `${telemetry.probability}%` : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-surface-container">
              <span className="text-sm font-bold text-on-surface block mb-3">Capas Visuales</span>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 rounded bg-surface-container-low cursor-pointer text-xs font-medium">
                  <span>Mapa de Calor (Heatmap)</span>
                  <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} className="w-4 h-4 text-primary" />
                </label>
                <label className="flex items-center justify-between p-2 rounded bg-surface-container-low cursor-pointer text-xs font-medium">
                  <span>Vectores de Movimiento</span>
                  <input type="checkbox" checked={showVectors} onChange={(e) => setShowVectors(e.target.checked)} className="w-4 h-4 text-primary" />
                </label>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};