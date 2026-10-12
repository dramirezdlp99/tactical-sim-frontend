import React, { useState, useEffect, useCallback } from 'react';
import { BACKEND_URL } from './apiConfig';
import { Icon } from './ui/Icon';
import { TopBar, Notice } from './ui/Shell';
import { humanizeAction } from './ui/format';

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
      setErrorMessage('No se pudo conectar con el backend.');
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

  const bar = (value, color) => (
    <div className="ta-pbar">
      <b>{pct(value)}</b>
      <i style={{ '--w': `${Math.round((value || 0) * 100)}%`, '--c': color }} />
    </div>
  );

  return (
    <div className="ta-app" data-sport="BASKETBALL">
      <TopBar user={user} onLogout={onLogout} onBack={onBackToSimulator} modeLabel="Modo analista" />

      <main className="ta-page" style={{ maxWidth: 1280 }}>
        <div className="ta-hist-head">
          <div>
            <span className="ta-eyebrow">Biblioteca de decisiones</span>
            <h1>Jugadas guardadas</h1>
            <p>Selecciona hasta 2 filas para compararlas lado a lado.</p>
          </div>
          <button type="button" onClick={handleExportCsv} disabled={exporting || records.length === 0} className="ta-btn ta-btn-primary">
            <Icon name="download" /> {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>

        {errorMessage && <Notice tone="err" icon="alert">{errorMessage}</Notice>}

        {loading ? (
          <div className="ta-card ta-state"><Icon name="reset" className="ta-spin" /><div>Cargando historial…</div></div>
        ) : records.length === 0 ? (
          <div className="ta-card ta-state">
            <Icon name="inbox" />
            <div>Aún no hay jugadas guardadas. Pídele a un Entrenador que guarde una simulación desde el simulador.</div>
          </div>
        ) : (
          <div className="ta-tablewrap">
            <table className="ta-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Fecha</th>
                  <th>Guardado por</th>
                  <th>Deporte</th>
                  <th>Jugada</th>
                  <th>Probabilidad</th>
                  <th>Eficiencia</th>
                  <th>Riesgo</th>
                  <th>Acción recomendada</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} data-sel={compareIds.includes(r.id) ? 1 : 0}>
                    <td><input type="checkbox" checked={compareIds.includes(r.id)} onChange={() => toggleCompare(r.id)} aria-label="Comparar esta jugada" /></td>
                    <td className="ta-mono" style={{ fontSize: 12, color: 'var(--ta-mute)' }}>{formatDate(r.createdAt)}</td>
                    <td style={{ color: 'var(--ta-mute)' }}>{r.savedByEmail || '—'}</td>
                    <td><span className={`ta-tag ${r.sport === 'BASKETBALL' ? 'bb' : 'tn'}`}>{r.sport === 'BASKETBALL' ? 'Baloncesto' : 'Tenis'}</span></td>
                    <td style={{ fontWeight: 600 }}>{r.playName || '—'}</td>
                    <td>{bar(r.successProbability, 'var(--ta-ok)')}</td>
                    <td>{bar(r.secondaryEfficiency, 'var(--ta-blue)')}</td>
                    <td>{bar(r.riskIndex, 'var(--ta-danger)')}</td>
                    <td className="ta-mono" style={{ fontSize: 12 }}>{r.recommendedAction ? humanizeAction(r.recommendedAction) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {compareRecords.length === 2 && (
          <div className="ta-compare">
            {compareRecords.map((r) => (
              <div key={r.id} className="ta-card">
                <h3>{r.playName || 'Jugada'}</h3>
                <small>{r.sport === 'BASKETBALL' ? 'Baloncesto' : 'Tenis'} · {formatDate(r.createdAt)}</small>
                <div style={{ marginTop: 12 }}>
                  <div className="ta-kv"><span>Probabilidad de éxito</span><b>{pct(r.successProbability)}</b></div>
                  <div className="ta-kv"><span>Eficiencia</span><b>{pct(r.secondaryEfficiency)}</b></div>
                  <div className="ta-kv"><span>Riesgo</span><b style={{ color: 'var(--ta-danger)' }}>{pct(r.riskIndex)}</b></div>
                  <div className="ta-kv"><span>Acción</span><b style={{ fontSize: 15 }}>{r.recommendedAction ? humanizeAction(r.recommendedAction) : '—'}</b></div>
                </div>
                {r.tacticalNote && <p className="ta-reco-note" style={{ marginBottom: 0 }}>{r.tacticalNote}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
