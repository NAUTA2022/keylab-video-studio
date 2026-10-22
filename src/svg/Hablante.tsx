import React from 'react';
import { blink } from '../motion/primitives';

/*
 * Hablante: personaje original de medio cuerpo (busto), estilo plano sin
 * contornos, para las voces de las noticias (colombiana, porteño, cordobés…).
 *  - boca que se abre con `talk` 0..1 (curva de la voz, sincronía labial)
 *  - parpadeo natural, cejas que suben con `surprise` 0..1, guiño con `wink` 0..1
 *  - cabeza que se ladea y asiente al hablar
 *  - `prop`: objeto en la mano (mate)
 * Coordenadas locales 0..400 × 0..480; la base del busto queda en y=480.
 */
export type Look = 'paisa' | 'porteno' | 'cordobes';

const LOOKS: Record<Look, { skin: string; skinD: string; hair: string; top: string; topD: string; lips?: string; brow: string }> = {
  paisa: { skin: '#E3A981', skinD: '#C98A63', hair: '#2B1A14', top: '#F5C518', topD: '#D9A90C', lips: '#C2304A', brow: '#2B1A14' },
  porteno: { skin: '#EBC09C', skinD: '#D2A07B', hair: '#1E1B1A', top: '#8EC5F0', topD: '#6FA9D6', brow: '#1E1B1A' },
  cordobes: { skin: '#D9A57E', skinD: '#BF8862', hair: '#6B4126', top: '#C8372D', topD: '#A82A22', brow: '#4E2E1A' },
};

export const Hablante: React.FC<{
  look: Look;
  height: number;
  frame: number;
  fps: number;
  talk?: number;
  surprise?: number;
  wink?: number;
  sweat?: boolean;
  prop?: 'mate';
  seed?: number;
}> = ({ look, height, frame, fps, talk = 0, surprise = 0, wink = 0, sweat = false, prop, seed = 5 }) => {
  const P = LOOKS[look];
  const k = height / 480;
  const t = frame / fps;
  const lid = blink(frame, fps, seed);
  const mo = Math.max(0, Math.min(1, talk));
  const nod = Math.sin(t * 7.5) * 3 * mo + Math.sin(t * 1.3 + seed) * 1.2;
  const tilt = Math.sin(t * 0.9 + seed) * 3 + (look === 'paisa' ? -surprise * 4 : 0);
  const br = surprise * 14;
  const hx = 200;
  const hy = 190;
  const eye = (x: number, closed: number, right: boolean) => {
    const c = Math.max(closed, lid);
    return (
      <g>
        <ellipse cx={x} cy={hy - 6} rx={17} ry={14 + surprise * 4} fill="#FFFFFF" />
        <circle cx={x + (right ? -2 : 2)} cy={hy - 5} r={9} fill={look === 'cordobes' ? '#5A3A22' : '#3A2416'} />
        <circle cx={x + (right ? -2 : 2)} cy={hy - 5} r={4.5} fill="#120C10" />
        <circle cx={x + (right ? 1 : 5)} cy={hy - 9} r={3} fill="#FFFFFF" />
        {c > 0.02 ? <rect x={x - 19} y={hy - 22 - surprise * 4} width={38} height={(30 + surprise * 8) * c} fill={P.skin} /> : null}
        {c > 0.6 ? <path d={`M${x - 15} ${hy - 4} Q${x} ${hy + 4} ${x + 15} ${hy - 4}`} stroke="#3A2416" strokeWidth={4} fill="none" strokeLinecap="round" /> : null}
        {look === 'paisa' && c < 0.6 ? (
          <path d={`M${x - 18} ${hy - 16 - surprise * 4} l-7 -6 M${x - 12} ${hy - 19 - surprise * 4} l-4 -8 M${x + 18} ${hy - 16 - surprise * 4} l7 -6 M${x + 12} ${hy - 19 - surprise * 4} l4 -8`} stroke="#1A1012" strokeWidth={3} strokeLinecap="round" />
        ) : null}
      </g>
    );
  };
  const mouthY = hy + 58;
  const lips = P.lips;
  return (
    <svg width={400 * k} height={height} viewBox="0 0 400 480" style={{ overflow: 'visible', display: 'block' }}>
      {/* pelo largo por detrás (colombiana) */}
      {look === 'paisa' ? (
        <path
          d={`M${hx - 112} ${hy - 30} Q${hx - 130} ${hy + 120} ${hx - 96 + Math.sin(t * 1.4) * 4} ${hy + 220} Q${hx} ${hy + 250} ${hx + 96 + Math.sin(t * 1.4 + 1) * 4} ${hy + 220} Q${hx + 130} ${hy + 120} ${hx + 112} ${hy - 30} Q${hx} ${hy - 150} ${hx - 112} ${hy - 30} Z`}
          fill={P.hair}
        />
      ) : null}
      {/* torso */}
      <path d="M40 480 Q46 370 130 345 L270 345 Q354 370 360 480 Z" fill={P.top} />
      {look === 'porteno' ? <path d="M175 345 L200 395 L225 345 Z" fill="#FFFFFF" /> : null}
      {look === 'porteno' ? [80, 120, 280, 320].map((x) => <rect key={x} x={x} y={370} width={8} height={110} fill={P.topD} opacity={0.6} />) : null}
      {look === 'cordobes' ? [0, 1, 2, 3].map((i) => <rect key={i} x={40} y={380 + i * 26} width={320} height={9} fill={P.topD} />) : null}
      {look === 'paisa' ? <path d="M150 345 Q200 395 250 345" fill={P.skin} /> : null}
      {/* cuello */}
      <rect x={172} y={hy + 70} width={56} height={95} rx={18} fill={P.skinD} />
      {/* cabeza */}
      <g transform={`rotate(${tilt} ${hx} ${hy + 110}) translate(0 ${nod})`}>
        {/* orejas */}
        <ellipse cx={hx - 92} cy={hy + 6} rx={14} ry={22} fill={P.skinD} />
        <ellipse cx={hx + 92} cy={hy + 6} rx={14} ry={22} fill={P.skinD} />
        {look === 'paisa' ? (
          <g>
            <circle cx={hx - 94} cy={hy + 40} r={13} fill="none" stroke="#F2C230" strokeWidth={5} />
            <circle cx={hx + 94} cy={hy + 40} r={13} fill="none" stroke="#F2C230" strokeWidth={5} />
          </g>
        ) : null}
        <ellipse cx={hx} cy={hy} rx={92} ry={104} fill={P.skin} />
        {/* barba de tres días / bigote */}
        {look === 'porteno' ? <path d={`M${hx - 80} ${hy + 30} Q${hx} ${hy + 140} ${hx + 80} ${hy + 30} Q${hx} ${hy + 110} ${hx - 80} ${hy + 30} Z`} fill="#3A2E28" opacity={0.28} /> : null}
        {/* pelo */}
        {look === 'paisa' ? (
          <path d={`M${hx - 96} ${hy - 10} Q${hx - 100} ${hy - 118} ${hx} ${hy - 112} Q${hx + 104} ${hy - 112} ${hx + 96} ${hy - 6} Q${hx + 60} ${hy - 70} ${hx - 20} ${hy - 78} Q${hx - 70} ${hy - 60} ${hx - 96} ${hy - 10} Z`} fill={P.hair} />
        ) : null}
        {look === 'porteno' ? (
          <path d={`M${hx - 92} ${hy - 20} Q${hx - 96} ${hy - 120} ${hx + 6} ${hy - 116} Q${hx + 100} ${hy - 112} ${hx + 92} ${hy - 20} Q${hx + 80} ${hy - 76} ${hx} ${hy - 82} Q${hx - 80} ${hy - 76} ${hx - 92} ${hy - 20} Z`} fill={P.hair} />
        ) : null}
        {look === 'cordobes'
          ? [-78, -50, -20, 12, 44, 74, -64, 60, -36, 28].map((o, i) => (
              <circle key={i} cx={hx + o} cy={hy - 92 + (i > 5 ? 22 : 0) + Math.abs(o) * 0.25} r={i > 5 ? 20 : 26} fill={P.hair} />
            ))
          : null}
        {/* cejas */}
        {[-1, 1].map((s) => (
          <path
            key={s}
            d={`M${hx + s * 22} ${hy - 34 - br} Q${hx + s * 38} ${hy - 44 - br - surprise * 4} ${hx + s * 58} ${hy - 36 - br}`}
            stroke={P.brow}
            strokeWidth={look === 'paisa' ? 6 : 9}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {eye(hx - 38, 0, false)}
        {eye(hx + 38, wink, true)}
        {/* nariz y cachetes */}
        <path d={`M${hx - 4} ${hy + 10} Q${hx - 12} ${hy + 32} ${hx + 6} ${hy + 34}`} stroke={P.skinD} strokeWidth={5} fill="none" strokeLinecap="round" />
        <circle cx={hx - 58} cy={hy + 34} r={15} fill="#E8796B" opacity={look === 'paisa' ? 0.45 : 0.22} />
        <circle cx={hx + 58} cy={hy + 34} r={15} fill="#E8796B" opacity={look === 'paisa' ? 0.45 : 0.22} />
        {look === 'cordobes' ? <path d={`M${hx - 34} ${hy + 46} Q${hx} ${hy + 34} ${hx + 34} ${hy + 46} Q${hx} ${hy + 56} ${hx - 34} ${hy + 46} Z`} fill={P.hair} /> : null}
        {/* boca */}
        {mo > 0.06 || surprise > 0.5 ? (
          <g>
            <ellipse cx={hx} cy={mouthY + 4 + mo * 6} rx={18 + mo * 8 - surprise * 4} ry={5 + mo * 15 + surprise * 8} fill="#5E1F2A" />
            <ellipse cx={hx} cy={mouthY + 10 + mo * 12 + surprise * 4} rx={9 + mo * 4} ry={3 + mo * 4} fill="#E0707A" />
            {lips ? <ellipse cx={hx} cy={mouthY + 4 + mo * 6} rx={22 + mo * 8 - surprise * 4} ry={8 + mo * 15 + surprise * 8} fill="none" stroke={lips} strokeWidth={6} /> : null}
          </g>
        ) : (
          <path d={`M${hx - 24} ${mouthY} Q${hx} ${mouthY + 18} ${hx + 24} ${mouthY}`} stroke={lips ?? '#7A2E34'} strokeWidth={lips ? 9 : 6} fill="none" strokeLinecap="round" />
        )}
      </g>
      {/* sudor */}
      {sweat
        ? [0, 1].map((i) => {
            const p = ((frame + i * 13) % 26) / 26;
            return <path key={i} transform={`translate(${290 + i * 26} ${100 + p * 70})`} opacity={1 - p} d="M10 0 C3 12, 0 17, 0 20 A10 9 0 0 0 20 20 C20 17, 17 12, 10 0 Z" fill="#8FD3FF" />;
          })
        : null}
      {/* mate en la mano */}
      {prop === 'mate' ? (
        <g transform={`translate(300 ${400 + Math.sin(t * 2) * 4}) rotate(${-8 + Math.sin(t * 2) * 3})`}>
          <rect x={30} y={-108} width={7} height={70} rx={3} fill="#C9CCD2" transform="rotate(14 33 -73)" />
          <path d="M-6 -60 Q-14 -10 20 4 Q54 -10 46 -60 Z" fill="#7A4A26" />
          <rect x={-8} y={-66} width={56} height={10} rx={5} fill="#C9CCD2" />
          <ellipse cx={20} cy={20} rx={40} ry={26} fill={P.skinD} />
        </g>
      ) : null}
    </svg>
  );
};
