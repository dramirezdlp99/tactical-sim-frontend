/**
 * spaceMath.js
 *
 * Matematica pura del "laboratorio local" de TacticAI. NO toca el DOM ni
 * ningun API del navegador, por eso la usan tres sitios con el mismo codigo:
 *   1) los Web Workers (cada hilo calcula su franja),
 *   2) el hilo principal (respaldo si el navegador no soporta Workers),
 *   3) las pruebas automaticas.
 *
 * Que calcula (todo en el sistema 0-100 del motor, igual que la pizarra):
 *   - Un mapa de "espacio libre rentable": para cada celda de la cancha,
 *     cuanto espacio deja la defensa y cuanto valdria un tiro desde ahi.
 *   - Una simulacion Monte Carlo local: mueve a los jugadores con el mismo
 *     ruido que usa el servidor (sigma = 2,5) miles de veces y cuenta en
 *     cuantas el portador sigue con tiro limpio (>= 4 pies de separacion).
 *
 * IMPORTANTE (honestidad): es una estimacion GEOMETRICA rapida que funciona
 * sin internet. No usa el modelo entrenado del servidor; por eso en pantalla
 * se llama "estimacion local" y no "probabilidad de la IA".
 *
 * Guardar en: tactical-sim-frontend/src/engine/spaceMath.js
 */

export const GW = 100;            // columnas del mapa (1 celda = 1 unidad del motor)
export const GH = 100;            // filas reservadas en el buffer (baloncesto usa 94, tenis 100)
export const BB_ROWS = 94;
export const TN_ROWS = 100;
export const INPUT_LEN = 40;      // posiciones empaquetadas + parametros
export const HIGH_VALUE = 0.7;    // una celda con valor >= 0,70 cuenta como "zona de alto valor" (aro o triple libres)
export const OPEN_SEPARATION = 8; // 4 pies (1 unidad del motor = 0,5 pies) = tiro "limpio"
export const NOISE_SIGMA = 2.5;   // mismo ruido que el Monte Carlo del servidor

const HOOP_X = 50;
const HOOP_Y = 10;
const THREE_R = 47.5;             // 23,75 pies en unidades del motor
const FT_X = 0.27;                // tenis: pies por unidad en el ancho (27 ft)
const FT_Y = 0.78;                // tenis: pies por unidad en el largo (78 ft)
const REACH_FT = 18;              // alcance comodo de un restador de elite
const SEP_CAP = 30;               // tope de separacion que se acumula (evita desbordes de enteros)

export const BB_KEYS = ['j1', 'j2', 'j3', 'j4', 'j5', 'd1', 'd2', 'd3', 'd4', 'd5', 'ball'];
export const TN_KEYS = ['alcaraz', 'sinner', 'ball'];

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (t) => { const c = clamp(t, 0, 1); return c * c * (3 - 2 * c); };

/** Empaqueta posiciones y parametros en un Float32Array plano (apto para memoria compartida). */
export function packInput(sport, positions, samples, seed, out = new Float32Array(INPUT_LEN)) {
  const isTennis = sport === 'TENNIS';
  const keys = isTennis ? TN_KEYS : BB_KEYS;
  out.fill(0);
  out[0] = isTennis ? 1 : 0;
  out[1] = samples;
  out[2] = seed % 16777216;
  out[3] = isTennis ? TN_ROWS : BB_ROWS;
  keys.forEach((k, i) => {
    const p = positions?.[k] || { x: 50, y: 50 };
    out[4 + 2 * i] = p.x;
    out[5 + 2 * i] = p.y;
  });
  return out;
}

/** Cuantas celdas cuentan para el porcentaje de "zonas de alto valor". */
export function totalCells(inp) {
  return inp[0] === 1 ? GW * 50 : GW * BB_ROWS; // tenis: solo la mitad donde cae el saque
}

// ---------------------------------------------------------------- mapa de calor

function basketballCell(x, y, inp) {
  let dmin2 = Infinity;
  for (let i = 0; i < 5; i++) {
    const dx = x - inp[14 + 2 * i];
    const dy = y - inp[15 + 2 * i];
    const d2 = dx * dx + dy * dy;
    if (d2 < dmin2) dmin2 = d2;
  }
  const open = smooth(Math.sqrt(dmin2) / 16);           // >= 16 unidades = totalmente libre
  const dh = Math.hypot(x - HOOP_X, y - HOOP_Y);
  let ev;                                                // puntos esperados de un tiro desde la celda
  if (dh <= THREE_R) ev = 2 * clamp(0.66 - 0.0095 * dh, 0.38, 0.66);   // cerca del aro ~1,3; media distancia ~0,8
  else ev = 1.08 * clamp(1 - (dh - 55) / 25, 0, 1);      // triple (36 % x 3), con atenuacion lejos del aro
  return (open * ev) / 1.32;                              // 1,32 = valor maximo bajo el aro
}

function tennisCell(x, y, inp) {
  const targetLow = inp[5] >= 50;                        // sacador abajo (y alto) -> el saque cae arriba (y < 50)
  if (targetLow ? y >= 50 : y < 50) return 0;
  const dx = (x - inp[6]) * FT_X;
  const dy = (y - inp[7]) * FT_Y;
  const reach = smooth((Math.hypot(dx, dy) - 3) / REACH_FT);   // lejos del restador = dificil de devolver
  return reach * (0.6 + 0.4 * (Math.abs(y - 50) / 50));        // premia la profundidad
}

/**
 * Rellena las filas [r0, r1) del mapa. `base` es la fila que corresponde al
 * indice 0 de `out` (0 si `out` es el mapa completo; r0 si es solo la franja).
 * Devuelve cuantas celdas son de "alto valor".
 */
export function computeBand(out, inp, r0, r1, base = 0) {
  const cell = inp[0] === 1 ? tennisCell : basketballCell;
  let high = 0;
  for (let row = r0; row < r1; row++) {
    const y = row + 0.5;
    const off = (row - base) * GW;
    for (let col = 0; col < GW; col++) {
      const v = cell(col + 0.5, y, inp);
      out[off + col] = v;
      if (v >= HIGH_VALUE) high++;
    }
  }
  return high;
}

// ---------------------------------------------------------------- Monte Carlo local

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGauss(rng) {
  let spare = null;
  return () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let u = 0;
    while (u === 0) u = rng();
    const v = rng();
    const mag = Math.sqrt(-2 * Math.log(u));
    spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  };
}

/**
 * Ejecuta las muestras [from, to) del Monte Carlo y devuelve:
 *   succ = muestras donde el portador sigue con tiro limpio (baloncesto) o el
 *          restador NO llega al punto del saque (tenis)
 *   sep  = suma de separaciones x 100 (entero, para poder acumular con Atomics)
 */
export function runSamples(inp, from, to, seed) {
  const gauss = makeGauss(mulberry32(seed));
  let succ = 0;
  let sep = 0;
  if (inp[0] === 1) {
    const rx = inp[6], ry = inp[7], bx = inp[8], by = inp[9];
    for (let s = from; s < to; s++) {
      const dx = (rx + gauss() * NOISE_SIGMA - bx - gauss() * NOISE_SIGMA) * FT_X;
      const dy = (ry + gauss() * NOISE_SIGMA - by - gauss() * NOISE_SIGMA) * FT_Y;
      const d = Math.hypot(dx, dy);
      if (d > REACH_FT) succ++;
      sep += Math.round(Math.min(d, SEP_CAP) * 100);
    }
    return { succ, sep };
  }
  // baloncesto: el portador es el atacante mas cercano al balon
  const bx = inp[24], by = inp[25];
  let hx = inp[4], hy = inp[5], best = Infinity;
  for (let i = 0; i < 5; i++) {
    const d = Math.hypot(inp[4 + 2 * i] - bx, inp[5 + 2 * i] - by);
    if (d < best) { best = d; hx = inp[4 + 2 * i]; hy = inp[5 + 2 * i]; }
  }
  for (let s = from; s < to; s++) {
    const px = hx + gauss() * NOISE_SIGMA;
    const py = hy + gauss() * NOISE_SIGMA;
    let dmin2 = Infinity;
    for (let i = 0; i < 5; i++) {
      const dx = px - (inp[14 + 2 * i] + gauss() * NOISE_SIGMA);
      const dy = py - (inp[15 + 2 * i] + gauss() * NOISE_SIGMA);
      const d2 = dx * dx + dy * dy;
      if (d2 < dmin2) dmin2 = d2;
    }
    const d = Math.sqrt(dmin2);
    if (d >= OPEN_SEPARATION) succ++;
    sep += Math.round(Math.min(d, SEP_CAP) * 100);
  }
  return { succ, sep };
}

/** Calculo completo en un solo hilo (respaldo y referencia para las pruebas). */
export function computeAll(inp, grid = new Float32Array(GW * GH)) {
  const rows = inp[3] | 0;
  const high = computeBand(grid, inp, 0, rows, 0);
  const k = inp[1] | 0;
  const { succ, sep } = runSamples(inp, 0, k, (inp[2] | 0) + 1);
  return { grid, high, succ, sep, samples: k, total: totalCells(inp) };
}

/** Convierte los acumulados en las cifras que muestra la interfaz. */
export function summarize(inp, { high, succ, sep, samples }) {
  const isTennis = inp[0] === 1;
  const k = Math.max(1, samples);
  const meanUnits = sep / 100 / k;
  return {
    sport: isTennis ? 'TENNIS' : 'BASKETBALL',
    successRate: succ / k,                                  // tiro limpio (baloncesto) / saque no devuelto (tenis)
    meanSeparationFt: isTennis ? meanUnits : meanUnits * 0.5,
    openZonesPct: high / totalCells(inp),
    samples,
  };
}
