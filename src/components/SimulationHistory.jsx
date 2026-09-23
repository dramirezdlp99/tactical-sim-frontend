import React, { useState, useEffect, useCallback } from 'react';
import { BACKEND_URL } from './apiConfig';

/**
 * SimulationHistory
 * Pantalla exclusiva del Analista Táctico: consulta el historial de
 * jugadas que un Entrenador guardó, y permite exportarlo a CSV.
 *
 * Guardar en: tactical-sim-frontend/src/components/SimulationHistory.jsx
 * (misma carpeta que AuthScreen.jsx, TacticalSimulator.jsx, etc.)
 */
export const SimulationHistory = ({ user, onLogout, onBackToSimulator }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const token = user?.token || localStorage.getItem('token') || '';

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/simulation/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data) {
        setRecords(json.data);
      } else {
        setErrorMessage(json?.message || 'No se pudo cargar el historial.');
      }
    } catch (err) {
      setErrorMessage('No se pudo conectar con el backend (puerto 9096).');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/simulation/history/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        setErrorMessage('No se pudo generar el archivo CSV.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'historial_simulaciones.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage('No se pudo descargar el archivo CSV.');
    } finally {
      setExporting(false);
    }
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // mantiene máximo 2 seleccionados
      return [...prev, id];
    });
  };

  const compareRecords = records.filter((r) => compareIds.includes(r.id));

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  };

  const pct = (value) => (value != null ? `${Math.round(value * 100)}%` : '—');

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/95 backdrop-blur-md border-b border-surface-container px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl tracking-tight text-on-surface">TACTIC<span className="text-secondary">AI</span></span>
          <span className="text-xs uppercase text-on-surface-variant font-semibold">Historial de Simulaciones</span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
            Modo Analista
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onBackToSimulator}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al Simulador
          </button>
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

      <main className="pt-20 px-6 pb-6 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-on-surface">Jugadas Guardadas</h1>
            <p className="text-sm text-on-surface-variant">
              Selecciona hasta 2 filas para comparar sus métricas lado a lado.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={exporting || records.length === 0}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-secondary text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-surface-container text-center text-sm text-on-surface-variant">
            Cargando historial...
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-surface-container text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-2">inbox</span>
            <p className="text-sm text-on-surface-variant">
              Aún no hay jugadas guardadas. Pídele a un Entrenador que guarde una simulación desde el simulador.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-surface-container overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container text-left text-xs uppercase text-on-surface-variant">
                  <th className="p-3 w-10"></th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Deporte</th>
                  <th className="p-3">Jugada</th>
                  <th className="p-3">Probabilidad</th>
                  <th className="p-3">Eficiencia</th>
                  <th className="p-3">Riesgo</th>
                  <th className="p-3">Acción Recomendada</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(r.id)}
                        onChange={() => toggleCompare(r.id)}
                        className="w-4 h-4 text-primary"
                      />
                    </td>
                    <td className="p-3 font-mono text-xs">{formatDate(r.createdAt)}</td>
                    <td className="p-3">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container-low">
                        {r.sport === 'BASKETBALL' ? 'Baloncesto' : 'Tenis'}
                      </span>
                    </td>
                    <td className="p-3">{r.playName || '—'}</td>
                    <td className="p-3 font-bold">{pct(r.successProbability)}</td>
                    <td className="p-3">{pct(r.secondaryEfficiency)}</td>
                    <td className="p-3 text-error">{pct(r.riskIndex)}</td>
                    <td className="p-3 font-mono text-xs">{r.recommendedAction || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {compareRecords.length === 2 && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-surface-container">
            <h2 className="text-sm font-bold text-on-surface mb-4">Comparativa de Jugadas</h2>
            <div className="grid grid-cols-2 gap-6">
              {compareRecords.map((r) => (
                <div key={r.id} className="p-4 bg-surface-container-low rounded-lg">
                  <p className="text-xs font-bold uppercase text-on-surface-variant mb-2">
                    {r.playName || 'Jugada'} · {formatDate(r.createdAt)}
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span>Probabilidad de Éxito</span><span className="font-bold">{pct(r.successProbability)}</span></div>
                    <div className="flex justify-between"><span>Eficiencia</span><span className="font-bold">{pct(r.secondaryEfficiency)}</span></div>
                    <div className="flex justify-between"><span>Riesgo</span><span className="font-bold text-error">{pct(r.riskIndex)}</span></div>
                    <div className="flex justify-between"><span>Acción</span><span className="font-mono text-xs">{r.recommendedAction}</span></div>
                  </div>
                  {r.tacticalNote && (
                    <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">{r.tacticalNote}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};