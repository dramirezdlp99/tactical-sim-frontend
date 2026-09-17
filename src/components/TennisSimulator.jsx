import React, { useState, useRef } from 'react';

export const TennisSimulator = ({ user, onLogout, onSwitchToBasketball }) => {
  const [surface, setSurface] = useState('hard'); // 'hard', 'clay', 'grass'
  const [loading, setLoading] = useState(false);

  // Partido y Tenistas dinámicos
  const [matchPreset, setMatchPreset] = useState('alcaraz-sinner');
  const [playerServer, setPlayerServer] = useState('C. ALCARAZ');
  const [playerReceiver, setPlayerReceiver] = useState('J. SINNER');

  const [positions, setPositions] = useState({
    alcaraz: { x: 9, y: 58 },  // Servidor
    sinner: { x: 92, y: 40 },   // Restador
    ball: { x: 46, y: 55 }      // Pelota
  });

  const [telemetry, setTelemetry] = useState({
    holdProb: 78,
    aceProb: 38.4,
    shortPoint: 49.1,
    recommendation: 'Servicio al cuerpo con trayectoria descendente a la T externa',
    speed: '212 km/h',
    rpm: '2,850 RPM'
  });

  const courtRef = useRef(null);
  const activeTokenRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleMatchChange = (e) => {
    const val = e.target.value;
    setMatchPreset(val);
    if (val === 'alcaraz-sinner') {
      setPlayerServer('C. ALCARAZ');
      setPlayerReceiver('J. SINNER');
    } else if (val === 'nadal-djokovic') {
      setPlayerServer('R. NADAL');
      setPlayerReceiver('N. DJOKOVIC');
    } else {
      setPlayerServer('D. MEDVEDEV');
      setPlayerReceiver('A. ZVEREV');
    }
  };

  const handlePointerDown = (e, key) => {
    activeTokenRef.current = key;
    const tokenRect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - tokenRect.left,
      y: e.clientY - tokenRect.top
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e, key) => {
    if (activeTokenRef.current !== key || !courtRef.current) return;
    const courtRect = courtRef.current.getBoundingClientRect();
    let newX = ((e.clientX - courtRect.left - dragOffsetRef.current.x) / courtRect.width) * 100;
    let newY = ((e.clientY - courtRect.top - dragOffsetRef.current.y) / courtRect.height) * 100;

    newX = Math.max(3, Math.min(95, newX));
    newY = Math.max(5, Math.min(92, newY));

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

  const handleRunTennisSimulation = async () => {
    setLoading(true);

    try {
      const token = user?.token || localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:9096/api/v1/simulation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          match_id: `ATP-${matchPreset.toUpperCase()}-2026`,
          team_home_positions: [{ player_id: playerServer, x: positions.alcaraz.x, y: positions.alcaraz.y }],
          team_away_positions: [{ player_id: playerReceiver, x: positions.sinner.x, y: positions.sinner.y }],
          ball_position: { player_id: 'BALL', x: positions.ball.x, y: positions.ball.y }
        })
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setTelemetry({
          holdProb: Math.round(data.success_probability * 100),
          aceProb: Math.round(data.success_probability * 45),
          shortPoint: Math.round(data.success_probability * 60),
          recommendation: 'Drive Paralelo al Fondo de la Cancha',
          speed: '218 km/h',
          rpm: '2,920 RPM'
        });
      } else {
        setTelemetry((prev) => ({
          ...prev,
          holdProb: Math.floor(75 + Math.random() * 15)
        }));
      }
    } catch (err) {
      setTelemetry((prev) => ({
        ...prev,
        holdProb: Math.floor(75 + Math.random() * 15)
      }));
    } finally {
      setLoading(false);
    }
  };

  const getSurfaceColor = () => {
    if (surface === 'clay') return '#f5d5cc'; // Tierra Batida
    if (surface === 'grass') return '#d4ecd5'; // Hierba Wimbledon
    return '#dce9ff'; // Pista Dura Decoturf
  };

  return (
    <div className="bg-background min-h-screen text-on-surface">
      {/* Header Superior */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/95 backdrop-blur-md border-b border-surface-container px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-on-surface">TACTIC<span className="text-secondary">AI</span></span>
            <span className="text-xs uppercase text-on-surface-variant font-semibold">Simulador Tenis ATP</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full border border-surface-container">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-700 font-mono font-medium">Hawk-Eye Core Active</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-semibold hidden md:inline">{user?.email || 'Analista ATP'}</span>
          </div>
          <button onClick={onLogout} className="p-1.5 rounded hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </header>

      <main className="pt-20 px-6 pb-6 max-w-7xl mx-auto">
        {/* Barra de Controles, Selector de Partido y Superficie */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-surface-container flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded">
            <button
              onClick={onSwitchToBasketball}
              className="px-4 py-1.5 rounded text-xs font-bold uppercase text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">sports_basketball</span> Baloncesto (NBA)
            </button>
            <button className="px-4 py-1.5 rounded text-xs font-bold uppercase bg-primary text-white shadow-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">sports_tennis</span> Tenis (ATP TOUR)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-on-surface-variant">Partido:</span>
              <select
                value={matchPreset}
                onChange={handleMatchChange}
                className="bg-surface-container-low text-on-surface text-xs font-bold px-3 py-1.5 rounded border border-surface-container focus:outline-none cursor-pointer"
              >
                <option value="alcaraz-sinner">C. Alcaraz vs J. Sinner</option>
                <option value="nadal-djokovic">R. Nadal vs N. Djokovic</option>
                <option value="medvedev-zverev">D. Medvedev vs A. Zverev</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-on-surface-variant">Superficie:</span>
              <select
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="bg-surface-container-low text-on-surface text-xs font-bold px-3 py-1.5 rounded border border-surface-container focus:outline-none cursor-pointer"
              >
                <option value="hard">Pista Dura (US Open)</option>
                <option value="clay">Tierra Batida (Roland Garros)</option>
                <option value="grass">Hierba Natural (Wimbledon)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workspace Principal en 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Cancha de Tenis ATP (7 columnas) */}
          <div className="lg:col-span-7 bg-white p-4 rounded-lg shadow-sm border border-surface-container">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {playerServer} vs {playerReceiver} (Set 3 Break Point)
              </span>
              <span className="text-on-surface-variant font-mono">Escala 78ft x 36ft</span>
            </div>

            {/* Cancha de Tenis Reglamentaria SVG */}
            <div
              ref={courtRef}
              className="relative w-full aspect-[28/15] select-none rounded overflow-hidden shadow-inner cursor-crosshair border border-surface-container"
              style={{ backgroundColor: '#eff4ff' }}
            >
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 1000 520">
                {/* Pista Central */}
                <rect x="70" y="50" width="860" height="420" rx="4" fill={getSurfaceColor()} />
                <rect x="100" y="70" width="800" height="380" fill="none" stroke="#0b1c30" strokeWidth="2.5" />
                
                {/* Pasillos de Dobles y Líneas de Saque */}
                <line x1="100" y1="115" x2="900" y2="115" stroke="#0b1c30" strokeWidth="1.8" />
                <line x1="100" y1="405" x2="900" y2="405" stroke="#0b1c30" strokeWidth="1.8" />
                <line x1="280" y1="115" x2="280" y2="405" stroke="#0b1c30" strokeWidth="2" />
                <line x1="720" y1="115" x2="720" y2="405" stroke="#0b1c30" strokeWidth="2" />
                <line x1="280" y1="260" x2="720" y2="260" stroke="#0b1c30" strokeWidth="2" />

                {/* Red Central */}
                <line x1="500" y1="58" x2="500" y2="462" stroke="#131b2e" strokeWidth="4.5" />
                <line x1="500" y1="70" x2="500" y2="450" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="2 3" />

                {/* Vector de Saque */}
                <path d="M 90,320 Q 380,290 680,270" fill="none" stroke="#069669" strokeWidth="3" strokeDasharray="6 4" />
                <circle cx="680" cy="270" r="6" fill="#069669" />
              </svg>

              {/* Fichas Arrastrables */}
              {Object.entries(positions).map(([key, pos]) => {
                const isBall = key === 'ball';
                const isServer = key === 'alcaraz';
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
                      <div className="w-5 h-5 rounded-full bg-yellow-400 shadow-lg ring-2 ring-white flex items-center justify-center">
                        <div className="w-2.5 h-0.5 bg-black/40 rotate-45"></div>
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shadow-md ring-2 ring-white ${
                        isServer ? 'bg-primary text-white' : 'bg-error text-white'
                      }`}>
                        {isServer ? 'S' : 'R'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleRunTennisSimulation}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
                  {loading ? 'sync' : 'sports_score'}
                </span>
                <span>{loading ? 'CALCULANDO SERVICIO...' : 'SIMULAR SERVICIO & TRAYECTORIA CON IA'}</span>
              </button>
            </div>
          </div>

          {/* Panel de Telemetría ATP (5 columnas) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-surface-container flex flex-col items-center">
              <span className="text-xs uppercase font-bold text-on-surface-variant block mb-4 w-full">Telemetría Probabilística de Servicio</span>

              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#CBD5E1" strokeWidth="12" opacity="0.4" />
                  <circle
                    cx="60" cy="60" r="50" fill="none" stroke="#059669" strokeWidth="12"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * telemetry.holdProb) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-on-surface">{telemetry.holdProb}%</span>
                  <span className="text-xs uppercase font-bold text-emerald-700">HOLD PROB</span>
                </div>
              </div>

              <div className="w-full space-y-3 mt-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Ace / Saque no devuelto</span>
                    <span>{telemetry.aceProb}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${telemetry.aceProb}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Punto Corto (&lt; 4 golpes)</span>
                    <span className="text-emerald-700">{telemetry.shortPoint}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${telemetry.shortPoint}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-surface-container">
              <span className="text-xs uppercase font-bold text-emerald-700 block mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">smart_toy</span> Recomendación Táctica TacticAI
              </span>
              <div className="bg-surface-container-low p-3 rounded-lg">
                <span className="block text-sm font-bold text-on-surface mb-1">{telemetry.recommendation}</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {playerReceiver} muestra un retroceso tras la línea de fondo ante el punto de quiebre. Su índice de reacción al bote resulta en devoluciones cortas.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-surface-container grid grid-cols-2 gap-3 text-center">
              <div className="bg-surface-container-low p-2 rounded">
                <span className="text-xs text-on-surface-variant block">Velocidad</span>
                <span className="text-sm font-bold text-on-surface">{telemetry.speed}</span>
              </div>
              <div className="bg-surface-container-low p-2 rounded">
                <span className="text-xs text-on-surface-variant block">Spin Rate</span>
                <span className="text-sm font-bold text-on-surface">{telemetry.rpm}</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};