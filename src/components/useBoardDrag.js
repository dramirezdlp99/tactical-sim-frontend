import { useRef, useState, useCallback } from 'react';

/**
 * useBoardDrag
 * Arrastre de fichas sobre un <svg>. Convierte la posición del puntero a
 * las coordenadas 0-100 que entiende el motor de IA usando la matriz real
 * del SVG (getScreenCTM), así el arrastre es exacto en cualquier tamaño de
 * pantalla, sin importar la proporción de la cancha (antes la cancha de
 * baloncesto se deformaba porque mezclaba % de CSS con un viewBox distinto).
 *
 * - toPercent(svgX, svgY) -> {x, y}: cada cancha define su propia conversión.
 * - clamp({x, y}) -> {x, y}: límites permitidos.
 * - onStart(): se llama al empezar a arrastrar (para pasar a "posición libre").
 *
 * Guardar en: tactical-sim-frontend/src/components/useBoardDrag.js
 */
export function useBoardDrag({ toPercent, clamp, onMove, onStart }) {
  const svgRef = useRef(null);
  const activeRef = useRef(null);
  const [draggingKey, setDraggingKey] = useState(null);

  const pointFromEvent = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return clamp(toPercent(p.x, p.y));
  }, [toPercent, clamp]);

  const bind = (key) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      activeRef.current = key;
      setDraggingKey(key);
      if (onStart) onStart(key);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e) => {
      if (activeRef.current !== key) return;
      const next = pointFromEvent(e);
      if (next) onMove(key, next);
    },
    onPointerUp: (e) => {
      if (activeRef.current === key) {
        activeRef.current = null;
        setDraggingKey(null);
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) { /* ya liberado */ }
      }
    },
    onPointerCancel: () => { activeRef.current = null; setDraggingKey(null); },
  });

  return { svgRef, draggingKey, bind };
}
