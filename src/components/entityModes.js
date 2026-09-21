/**
 * Define qué métricas y foco se muestran en el simulador según el
 * entityType devuelto por el backend tras login/registro. Esto es lo
 * que hace que la selección de "Alta Enterprise" deje de ser cosmética.
 *
 * Guardar en: tactical-sim-frontend/src/config/entityModes.js
 * (o la carpeta donde tengas el resto de config del proyecto)
 */
export const ENTITY_MODE_CONFIG = {
  FRANCHISE: {
    label: 'Modo Franquicia',
    badge: 'Franquicia / Club',
    focus: 'Scouting de rival y control de partido en vivo',
    metrics: [
      { key: 'xPTS', label: 'xPTS (Puntos Esperados)' },
      { key: 'opponentScouting', label: 'Scouting de Rival' },
      { key: 'liveMatchControl', label: 'Control de Partido en Vivo' },
    ],
  },
  ACADEMY: {
    label: 'Modo Academia',
    badge: 'Academia de Rendimiento',
    focus: 'Desarrollo biomecánico y proyección de talento',
    metrics: [
      { key: 'shotAngle', label: 'Ángulo de Lanzamiento' },
      { key: 'zoneEfficiency', label: 'Eficiencia por Zona' },
      { key: 'talentProjection', label: 'Proyección de Talentos' },
    ],
  },
  FEDERATION: {
    label: 'Modo Federación',
    badge: 'Federación Nacional',
    focus: 'Sinergia de selección y cobertura de torneos',
    metrics: [
      { key: 'fibaSynergy', label: 'Sinergia FIBA' },
      { key: 'tacticalFit', label: 'Compatibilidad Táctica de Selección' },
      { key: 'tournamentCoverage', label: 'Cobertura de Torneos Internacionales' },
    ],
  },
};

export function getModeConfig(entityType) {
  return ENTITY_MODE_CONFIG[entityType] || ENTITY_MODE_CONFIG.FRANCHISE;
}