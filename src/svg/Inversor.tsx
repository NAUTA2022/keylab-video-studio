import React from 'react';
import { Img, staticFile } from 'remotion';

/*
 * El inversionista — mismo estilo anime vectorizado que Don Excusas,
 * ilustrado con IA y recortado: public/personajes/inversor.png (cara roja,
 * vapor por las orejas, celular en la mano, puño arriba).
 * La rabia se anima por transformaciones: `rage` tiembla, `shout` infla.
 * Punto de apoyo (pies): (200, 548) de una caja 400×560.
 */
export const Inversor: React.FC<{
  height: number;
  mood?: 'shock' | 'angry';
  rage?: number;
  shout?: number;
  frame?: number;
  style?: React.CSSProperties;
}> = ({ height, rage = 0, shout = 0, frame = 0, style }) => {
  const w = height * (400 / 560);
  const ih = height * 0.979;
  const feet = height * (548 / 560);
  const shake = rage > 0.4 ? Math.sin(frame * 2.2) * 6 * rage : 0;
  const s = 1 + shout * 0.035;
  return (
    <div style={{ position: 'absolute', width: w, height, ...style }}>
      <div style={{ position: 'absolute', left: w / 2 - height * 0.2, top: feet - height * 0.015, width: height * 0.4, height: height * 0.03, borderRadius: '50%', background: 'rgba(0,0,0,0.16)' }} />
      <Img
        src={staticFile('personajes/inversor.png')}
        style={{
          position: 'absolute',
          height: ih,
          left: '50%',
          top: feet - ih,
          transform: `translateX(calc(-50% + ${shake}px)) rotate(${shake * 0.3}deg) scale(${s})`,
          transformOrigin: '50% 100%',
        }}
      />
    </div>
  );
};
