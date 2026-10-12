import React from 'react';
import { Img, staticFile } from 'remotion';

/*
 * "Don Excusas" — constructor inventado, sin nacionalidad.
 * Estilo anime vectorizado (plano, sin contornos, ojos grandes, cachetes),
 * ilustrado con IA y recortado con chroma key: public/personajes/don-*.png
 * Poses: stand (mano abierta, "es que…") · run (corriendo con el costal de plata).
 * La animación es por transformaciones: `talk` rebota, `phase` trota, `dizzy` ladea.
 * Punto de apoyo (pies) igual que antes: (200, 548) de una caja 400×560.
 */
export const DonExcusas: React.FC<{
  height: number;
  pose?: 'stand' | 'run';
  phase?: number;
  talk?: number;
  smug?: number;
  dizzy?: boolean;
  style?: React.CSSProperties;
}> = ({ height, pose = 'stand', phase = 0, talk = 0, dizzy = false, style }) => {
  const w = height * (400 / 560);
  const run = pose === 'run';
  const ih = height * (run ? 0.86 : 0.979);
  const feet = height * (548 / 560);
  const bob = run ? -Math.abs(Math.sin(phase)) * height * 0.03 : 0;
  const tilt = run ? 4 + Math.sin(phase) * 3 : dizzy ? Math.sin(phase * 0.5) * 5 : 0;
  const sq = run ? 0 : talk * 0.03;
  return (
    <div style={{ position: 'absolute', width: w, height, ...style }}>
      <div style={{ position: 'absolute', left: w / 2 - height * 0.22, top: feet - height * 0.015, width: height * 0.44, height: height * 0.03, borderRadius: '50%', background: 'rgba(0,0,0,0.16)' }} />
      <Img
        src={staticFile(`personajes/${run ? 'don-run' : 'don-stand'}.png`)}
        style={{
          position: 'absolute',
          height: ih,
          left: '50%',
          top: feet - ih + bob,
          transform: `translateX(-50%) rotate(${tilt}deg) scale(${1 - sq * 0.5}, ${1 + sq})`,
          transformOrigin: '50% 100%',
        }}
      />
    </div>
  );
};
