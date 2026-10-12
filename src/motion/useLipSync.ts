import { useCurrentFrame } from 'remotion';

/**
 * Apertura de boca 0..1 por cuadro (sincronía labial) leyendo la curva que genera
 * `python3 scripts/lipsync.py <voz.mp3>` → <voz>.labios.json.
 * `offsetSec` = segundo de la pista de voz que suena en el cuadro 0 de la escena.
 */
export const lipAt = (curve: { fps: number; v: number[] }, frame: number, offsetSec = 0) => {
  const i = frame + Math.round(offsetSec * curve.fps);
  return i >= 0 && i < curve.v.length ? curve.v[i] : 0;
};

export const useLipSync = (curve: { fps: number; v: number[] }, offsetSec = 0) => lipAt(curve, useCurrentFrame(), offsetSec);
