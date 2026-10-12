/*
 * Primitivas de movimiento por cuadro (deterministas, aptas para Remotion).
 * Inspiradas en svg-animation-studio (createBlink, createTalk, createWaveArm,
 * createBob — MIT, Chan Meng) y en las tablas de tiempos de motion-design-skill
 * (MIT, LottieFiles), pero calculadas desde `frame` en vez de @keyframes CSS:
 * las animaciones CSS no se sincronizan con el render cuadro a cuadro de Remotion.
 */
import { Easing, interpolate } from 'remotion';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** pseudoaleatorio estable a partir de un entero */
export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Parpadeo natural: cada 2–4,5 s, cierre de ~2 cuadros y apertura de ~3,
 * a veces doble parpadeo. Devuelve 0 (abierto) … 1 (cerrado).
 */
export const blink = (frame: number, fps: number, seed = 1) => {
  let t = Math.round(fps * (0.6 + rand(seed) * 1.5));
  let k = 0;
  while (t <= frame + 10) {
    const d = frame - t;
    if (d >= 0 && d < 6) return d < 2 ? (d + 1) / 2 : 1 - (d - 1) / 5;
    const dbl = rand(seed * 31 + k) < 0.2;
    t += dbl ? 7 : Math.round(fps * (2 + rand(seed * 17 + k) * 2.5));
    k++;
  }
  return 0;
};

/** respiración: escala vertical muy leve del torso */
export const breathe = (frame: number, fps: number, amount = 0.008) =>
  1 + Math.sin((frame / fps) * Math.PI * 0.55) * amount;

/** balanceo idle (bob) en px */
export const bob = (frame: number, fps: number, px = 4, speed = 0.5) =>
  Math.sin((frame / fps) * Math.PI * 2 * speed) * px;

/**
 * Gesto con anticipación y sobrepaso: va de `from` a `to` grados empezando en
 * `at` (cuadro). Primero retrocede un poco (anticipación), luego llega pasándose
 * y se asienta (follow-through). Duración total ≈ 0,45 s.
 */
export const gesture = (frame: number, fps: number, at: number, from: number, to: number) => {
  const d = (frame - at) / fps;
  if (d <= 0) return from;
  const span = to - from;
  return interpolate(
    d,
    [0, 0.1, 0.28, 0.38, 0.46],
    [from, from - span * 0.12, to + span * 0.14, to - span * 0.04, to],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );
};

/** oscilación al hablar con las manos (secundaria, amortiguada por `energy` 0..1) */
export const handTalk = (frame: number, fps: number, energy: number, deg = 6) =>
  Math.sin((frame / fps) * Math.PI * 2 * 1.6) * deg * energy + Math.sin((frame / fps) * Math.PI * 2 * 0.7) * deg * 0.4 * energy;
