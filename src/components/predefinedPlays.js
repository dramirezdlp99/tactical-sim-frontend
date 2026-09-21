/**
 * Jugadas predeterminadas: cada una trae las posiciones (x,y en % de
 * cancha, mismo sistema de coordenadas que ya usan TacticalSimulator.jsx
 * y TennisSimulator.jsx) y una descripción táctica breve, para que el
 * usuario no tenga que posicionar manualmente a los 10 jugadores desde
 * cero cada vez.
 *
 * Guardar en: tactical-sim-frontend/src/components/predefinedPlays.js
 * (o donde tengas entityModes.js, junto a los demás archivos de config)
 */

export const BASKETBALL_PLAYS = [
  {
    id: 'custom',
    name: 'Posición Libre (Manual)',
    description: 'Arrastra las fichas libremente sobre la cancha para diseñar tu propia jugada.',
    positions: null, // null = no tocar las posiciones actuales
  },
  {
    id: 'pick_and_roll_central',
    name: 'Pick & Roll Central',
    description:
      'El base (J1) utiliza un bloqueo del pívot (J5) en la zona central para generar un desajuste (mismatch) y decidir entre penetrar, lanzar o asistir al pívot que rueda hacia el aro.',
    positions: {
      j1: { x: 50, y: 80 },
      j2: { x: 20, y: 60 },
      j3: { x: 80, y: 60 },
      j4: { x: 15, y: 25 },
      j5: { x: 50, y: 55 },
      d1: { x: 50, y: 70 },
      d2: { x: 22, y: 50 },
      d3: { x: 78, y: 50 },
      d4: { x: 17, y: 30 },
      d5: { x: 50, y: 45 },
      ball: { x: 50, y: 80 },
    },
  },
  {
    id: 'ataque_abierto_5out',
    name: 'Ataque Abierto 5-Out',
    description:
      'Los cinco jugadores se abren al perímetro (nadie ocupa la zona pintada), maximizando el espacio para penetraciones individuales y generando líneas de pase claras hacia las esquinas.',
    positions: {
      j1: { x: 50, y: 85 },
      j2: { x: 12, y: 65 },
      j3: { x: 88, y: 65 },
      j4: { x: 20, y: 20 },
      j5: { x: 80, y: 20 },
      d1: { x: 50, y: 75 },
      d2: { x: 18, y: 58 },
      d3: { x: 82, y: 58 },
      d4: { x: 25, y: 28 },
      d5: { x: 75, y: 28 },
      ball: { x: 50, y: 85 },
    },
  },
  {
    id: 'isolation_ala',
    name: 'Aislamiento en el Ala',
    description:
      'Se despeja un lado de la cancha para que el mejor anotador (J3) juegue 1v1 contra su marcador, usando al resto del equipo como espaciadores en el lado contrario.',
    positions: {
      j1: { x: 30, y: 55 },
      j2: { x: 10, y: 70 },
      j3: { x: 90, y: 40 },
      j4: { x: 75, y: 15 },
      j5: { x: 60, y: 55 },
      d1: { x: 33, y: 48 },
      d2: { x: 15, y: 62 },
      d3: { x: 85, y: 45 },
      d4: { x: 72, y: 22 },
      d5: { x: 62, y: 62 },
      ball: { x: 90, y: 40 },
    },
  },
];

export const TENNIS_PLAYS = [
  {
    id: 'custom',
    name: 'Posición Libre (Manual)',
    description: 'Arrastra las fichas libremente sobre la cancha para diseñar tu propio servicio.',
    positions: null,
  },
  {
    id: 'saque_abierto_t',
    name: 'Saque Abierto a la T',
    description:
      'Saque dirigido a la línea central (la "T") buscando un ángulo cerrado que impida al rival abrir el punto con comodidad, ideal para preparar el golpe siguiente hacia campo abierto.',
    positions: {
      alcaraz: { x: 25, y: 90 },
      sinner: { x: 50, y: 10 },
      ball: { x: 50, y: 45 },
    },
  },
  {
    id: 'saque_cuerpo_red',
    name: 'Saque al Cuerpo y Red',
    description:
      'Saque dirigido al cuerpo del rival para reducir su ángulo de respuesta, seguido de una aproximación inmediata a la red para cerrar el punto con una volea.',
    positions: {
      alcaraz: { x: 25, y: 90 },
      sinner: { x: 45, y: 10 },
      ball: { x: 45, y: 35 },
    },
  },
  {
    id: 'saque_exterior_cruzado',
    name: 'Saque Exterior + Cruzado',
    description:
      'Saque abierto hacia el exterior para sacar al rival de la cancha y, con el campo abierto, definir el punto con un golpe cruzado hacia el lado contrario.',
    positions: {
      alcaraz: { x: 75, y: 90 },
      sinner: { x: 85, y: 10 },
      ball: { x: 88, y: 40 },
    },
  },
];

export function getPlayById(list, playId) {
  return list.find((p) => p.id === playId) || list[0];
}