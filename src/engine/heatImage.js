/**
 * heatImage.js
 * Convierte el mapa de "espacio libre rentable" (Float32Array 100 x N) en una
 * imagen PNG (data URL) que la cancha dibuja como <image> dentro de su SVG, de
 * modo que escala exactamente igual que la cancha en cualquier pantalla.
 *
 * El baloncesto se dibuja tal cual (columna = x, fila = y). El tenis se
 * TRANSPONE porque la cancha de tenis se dibuja en horizontal: el largo de la
 * pista (y del motor) va de derecha a izquierda y el ancho (x) de arriba abajo.
 *
 * Guardar en: tactical-sim-frontend/src/engine/heatImage.js
 */
import { GW, BB_ROWS, TN_ROWS } from './spaceMath';

/**
 * Rampas de color (de poco a mucho valor). Cada deporte usa una que contraste con
 * su superficie: sobre el parquet naranja, cian -> menta -> blanco calido; sobre la
 * pista azul, ambar -> amarillo -> blanco.
 */
const RAMPS = {
  BASKETBALL: [[0.25, [30, 175, 255]], [0.7, [61, 235, 170]], [1, [255, 250, 190]]],
  TENNIS: [[0.25, [255, 138, 43]], [0.65, [255, 205, 70]], [1, [255, 255, 215]]],
};

function color(v, ramp, out) {
  if (v < 0.25) { out[3] = 0; return; }
  let lo = ramp[0], hi = ramp[ramp.length - 1];
  for (let i = 0; i < ramp.length - 1; i++) {
    if (v <= ramp[i + 1][0]) { lo = ramp[i]; hi = ramp[i + 1]; break; }
  }
  const t = Math.max(0, Math.min(1, (v - lo[0]) / (hi[0] - lo[0] || 1)));
  out[0] = lo[1][0] + (hi[1][0] - lo[1][0]) * t;
  out[1] = lo[1][1] + (hi[1][1] - lo[1][1]) * t;
  out[2] = lo[1][2] + (hi[1][2] - lo[1][2]) * t;
  out[3] = Math.min(1, (v - 0.25) / 0.75) ** 1.3 * 235;
}

let scratchCanvas = null;

/** Devuelve { url, width, height } o null si no hay canvas disponible (entornos sin DOM). */
export function paintGrid(grid, sport) {
  if (typeof document === 'undefined') return null;
  const isTennis = sport === 'TENNIS';
  const w = isTennis ? TN_ROWS : GW;
  const h = isTennis ? GW : BB_ROWS;
  if (!scratchCanvas) scratchCanvas = document.createElement('canvas');
  const canvas = scratchCanvas;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(w, h);
  const px = [0, 0, 0, 0];
  const ramp = RAMPS[isTennis ? 'TENNIS' : 'BASKETBALL'];
  const rows = isTennis ? TN_ROWS : BB_ROWS;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < GW; col++) {
      color(grid[row * GW + col], ramp, px);
      // tenis: columna de pantalla = (rows-1-row) [largo invertido], fila de pantalla = col [ancho]
      const x = isTennis ? rows - 1 - row : col;
      const y = isTennis ? col : row;
      const o = (y * w + x) * 4;
      img.data[o] = px[0]; img.data[o + 1] = px[1]; img.data[o + 2] = px[2]; img.data[o + 3] = px[3];
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL('image/png'), width: w, height: h };
}
