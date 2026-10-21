import React from 'react';
import { blink } from '../motion/primitives';

/*
 * Bailarín con su perrito: personaje original dibujado en código (estilo plano,
 * sin contornos), totalmente articulado y sincronizado al pulso de la música
 * (120 BPM = un tiempo cada 15 cuadros a 30 fps):
 *  - cadera que se balancea y rebota (paso de samba), torso que se inclina
 *  - muslo, pierna y pie de cada lado con rodilla que se dobla en contratiempo
 *  - hombro y codo de cada brazo, manos arriba que saludan
 *  - cabeza que se ladea, parpadeo natural y boca que sonríe/abre en cada tiempo
 *  - perrito que salta en los tiempos, mueve la cola y las orejas
 * Coordenadas locales 0..260 de ancho x 0..420 de alto; pies en y=410.
 * `frame` es el cuadro local; `beat` cuadros por tiempo.
 */
const SKIN = '#B9784F';
const SKIN_D = '#9C6240';
const HAIR = '#2A1C17';
const SHIRT = '#F7D23E';
const SHIRT_D = '#E2B91F';
const TRIM = '#1F9D55';
const SHORTS = '#2D52FF';
const SHOE = '#F5F5F5';

const seg = (x: number, y: number, len: number, w: number, color: string, ang: number, child?: React.ReactNode) => (
  <g transform={`translate(${x} ${y}) rotate(${ang})`}>
    <rect x={-w / 2} y={-w / 2} width={w} height={len + w / 2} rx={w / 2} fill={color} />
    {child ? <g transform={`translate(0 ${len})`}>{child}</g> : null}
  </g>
);

export const Bailarin: React.FC<{ height: number; frame: number; beat?: number; seed?: number; dog?: boolean; style?: React.CSSProperties }> = ({
  height,
  frame,
  beat = 15,
  seed = 7,
  dog = true,
  style,
}) => {
  const W = dog ? 420 : 260;
  const H = 420;
  const k = height / H;
  const ph = (frame / beat) * Math.PI; // medio ciclo por tiempo
  const s = Math.sin(ph); // -1..1, cambia de lado cada tiempo
  const b = Math.abs(Math.sin(ph)); // rebote en cada tiempo
  const hipX = 130 + s * 12;
  const hipY = 238 + b * 10;
  const torso = s * 9;
  const lid = blink(frame, 30, seed);
  const mouth = 0.35 + 0.65 * b;
  // piernas: rodilla adelante en contratiempo
  const kneeL = 12 + Math.max(0, s) * 38;
  const kneeR = 12 + Math.max(0, -s) * 38;
  const thighL = 8 - s * 16;
  const thighR = -8 - s * 16;
  // brazos arriba saludando
  const armL = 150 + Math.sin(ph * 2) * 18;
  const armR = -150 + Math.sin(ph * 2 + 1) * 18;
  const foreL = -40 + Math.sin(ph * 2 + 0.6) * 30;
  const foreR = 40 + Math.sin(ph * 2 + 1.6) * 30;
  const headTilt = -s * 10;
  // perrito
  const dj = Math.abs(Math.sin(ph + 0.8)) * 34;
  const tail = Math.sin(frame * 1.1) * 28;
  const ear = Math.sin(frame * 0.5) * 12;
  const dx = 330;
  const dy = 372 - dj;
  return (
    <div style={{ position: 'absolute', width: W * k, height, ...style }}>
      <svg width={W * k} height={height} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* sombras */}
        <ellipse cx={130} cy={412} rx={70 - b * 8} ry={9} fill="rgba(0,0,0,0.28)" />
        {dog ? <ellipse cx={dx} cy={412} rx={40 - dj * 0.4} ry={7} fill="rgba(0,0,0,0.25)" /> : null}

        {/* pierna de atrás (derecha) */}
        {seg(hipX + 18, hipY, 78, 30, SKIN_D, thighR, seg(0, 0, 78, 26, SKIN_D, kneeR, <rect x={-16} y={-6} width={44} height={20} rx={9} fill="#DDDDDD" />))}
        {/* brazo de atrás (derecho) */}
        <g transform={`rotate(${torso} ${hipX} ${hipY})`}>
          {seg(hipX + 36, hipY - 100, 62, 22, SKIN_D, armR, seg(0, 0, 58, 20, SKIN_D, foreR, <circle cx={0} cy={6} r={14} fill={SKIN_D} />))}
        </g>
        {/* short */}
        <g transform={`rotate(${torso * 0.5} ${hipX} ${hipY})`}>
          <path d={`M${hipX - 42} ${hipY - 20} L${hipX + 42} ${hipY - 20} L${hipX + 46} ${hipY + 34} L${hipX + 4} ${hipY + 34} L${hipX} ${hipY + 12} L${hipX - 4} ${hipY + 34} L${hipX - 46} ${hipY + 34} Z`} fill={SHORTS} />
        </g>
        {/* pierna de adelante (izquierda) */}
        {seg(hipX - 18, hipY, 78, 30, SKIN, thighL, seg(0, 0, 78, 26, SKIN, kneeL, <rect x={-28} y={-6} width={44} height={20} rx={9} fill={SHOE} />))}
        {/* torso + cabeza + brazo de adelante */}
        <g transform={`rotate(${torso} ${hipX} ${hipY})`}>
          <path d={`M${hipX - 44} ${hipY - 18} Q${hipX - 50} ${hipY - 90} ${hipX - 38} ${hipY - 112} L${hipX + 38} ${hipY - 112} Q${hipX + 50} ${hipY - 90} ${hipX + 44} ${hipY - 18} Z`} fill={SHIRT} />
          <path d={`M${hipX - 44} ${hipY - 30} L${hipX + 44} ${hipY - 30} L${hipX + 44} ${hipY - 18} L${hipX - 44} ${hipY - 18} Z`} fill={SHIRT_D} />
          <path d={`M${hipX - 16} ${hipY - 112} L${hipX} ${hipY - 92} L${hipX + 16} ${hipY - 112} Z`} fill={TRIM} />
          <rect x={hipX - 40} y={hipY - 114} width={80} height={8} rx={4} fill={TRIM} />
          {/* cuello y cabeza */}
          <rect x={hipX - 9} y={hipY - 128} width={18} height={20} fill={SKIN_D} />
          <g transform={`rotate(${headTilt} ${hipX} ${hipY - 124})`}>
            <circle cx={hipX} cy={hipY - 166} r={42} fill={SKIN} />
            {/* pelo rizado */}
            {[-34, -20, -6, 8, 22, 34].map((o, i) => (
              <circle key={i} cx={hipX + o} cy={hipY - 204 + Math.abs(o) * 0.3} r={15} fill={HAIR} />
            ))}
            <circle cx={hipX - 40} cy={hipY - 180} r={11} fill={HAIR} />
            <circle cx={hipX + 40} cy={hipY - 180} r={11} fill={HAIR} />
            {/* ojos grandes con brillo y párpado */}
            {[-15, 15].map((o, i) => (
              <g key={i}>
                <ellipse cx={hipX + o} cy={hipY - 170} rx={8} ry={11} fill="#1B1420" />
                <circle cx={hipX + o + 3} cy={hipY - 174} r={3} fill="#FFFFFF" />
                {lid > 0.02 ? <rect x={hipX + o - 10} y={hipY - 182} width={20} height={lid * 23} fill={SKIN} /> : null}
              </g>
            ))}
            {/* cachetes */}
            <circle cx={hipX - 26} cy={hipY - 152} r={7} fill="#E58A7C" opacity={0.7} />
            <circle cx={hipX + 26} cy={hipY - 152} r={7} fill="#E58A7C" opacity={0.7} />
            {/* boca sonriente que se abre en cada tiempo */}
            <path d={`M${hipX - 13} ${hipY - 150} Q${hipX} ${hipY - 150 + 10 + mouth * 12} ${hipX + 13} ${hipY - 150} Z`} fill="#6A1F2B" />
            <path d={`M${hipX - 9} ${hipY - 150} L${hipX + 9} ${hipY - 150} L${hipX + 7} ${hipY - 146} L${hipX - 7} ${hipY - 146} Z`} fill="#FFFFFF" />
          </g>
          {seg(hipX - 36, hipY - 100, 62, 22, SKIN, armL, seg(0, 0, 58, 20, SKIN, foreL, <circle cx={0} cy={6} r={14} fill={SKIN} />))}
        </g>

        {/* perrito */}
        {dog ? (
          <g transform={`translate(${dx} ${dy})`}>
            {/* cola */}
            <g transform={`rotate(${tail - 40} -34 -26)`}>
              <rect x={-38} y={-60} width={9} height={36} rx={4.5} fill="#C98B4E" />
            </g>
            {/* patas */}
            {[-24, -10, 12, 26].map((o, i) => (
              <rect key={i} x={o - 4} y={-12} width={9} height={dj > 10 ? 18 : 30} rx={4} fill={i % 2 ? '#B57A41' : '#C98B4E'} transform={`rotate(${dj > 10 ? (i < 2 ? 25 : -25) : 0} ${o} -12)`} />
            ))}
            {/* cuerpo */}
            <ellipse cx={0} cy={-26} rx={40} ry={22} fill="#D99A5B" />
            <ellipse cx={4} cy={-18} rx={24} ry={11} fill="#F2D3A8" />
            {/* cabeza */}
            <g transform={`rotate(${-dj * 0.4} 34 -46)`}>
              <circle cx={40} cy={-52} r={22} fill="#D99A5B" />
              <ellipse cx={56} cy={-46} rx={12} ry={9} fill="#F2D3A8" />
              <circle cx={64} cy={-49} r={4.5} fill="#1B1420" />
              <circle cx={40} cy={-58} r={4.5} fill="#1B1420" />
              <circle cx={41.5} cy={-59.5} r={1.5} fill="#FFFFFF" />
              <path d={`M50 -40 Q56 ${-34 + (dj > 12 ? 6 : 0)} 62 -40`} stroke="#6A1F2B" strokeWidth={3} fill={dj > 12 ? '#E58A7C' : 'none'} />
              <g transform={`rotate(${ear - 20} 30 -70)`}>
                <ellipse cx={26} cy={-66} rx={8} ry={16} fill="#9C6338" />
              </g>
            </g>
          </g>
        ) : null}
      </svg>
    </div>
  );
};
