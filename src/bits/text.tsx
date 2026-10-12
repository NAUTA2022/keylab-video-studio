import React from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// Efectos de texto adaptados de React Bits (reactbits.dev, MIT + Commons Clause, © David Haz).
// Todos dependen solo de useCurrentFrame(): cero relojes del navegador.
// Regla de marca: el texto siempre en color sólido (sin degradados).

type Base = {
  text: string;
  delay?: number; // en cuadros
  style?: React.CSSProperties;
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* SplitText: letras o palabras que suben con stagger */
export const SplitText: React.FC<Base & { by?: 'chars' | 'words'; stagger?: number; dur?: number; distance?: number }> = ({
  text,
  delay = 0,
  style,
  by = 'chars',
  stagger = 1.5,
  dur = 14,
  distance = 60,
}) => {
  const f = useCurrentFrame() - delay;
  const seg = new Intl.Segmenter('es', { granularity: 'grapheme' });
  const words = text.split(/\s+/).filter(Boolean);
  let i = 0;
  const unit = (p: string, k: React.Key) => {
    const idx = i++;
    const t = interpolate(f - idx * stagger, [0, dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <span key={k} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: t, transform: `translateY(${(1 - t) * distance}px)` }}>
        {p}
      </span>
    );
  };
  return (
    <span style={{ display: 'inline-block', ...style }}>
      {words.map((w, wi) => (
        <React.Fragment key={wi}>
          {/* cada palabra es un bloque que no se parte; las letras animan dentro */}
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {by === 'chars' ? [...seg.segment(w)].map((g, gi) => unit(g.segment, gi)) : unit(w, 0)}
          </span>
          {wi < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};

/* BlurText: palabras que pasan de desenfocadas a nítidas */
export const BlurText: React.FC<Base & { stagger?: number; dur?: number; direction?: 'top' | 'bottom' }> = ({
  text,
  delay = 0,
  style,
  stagger = 4,
  dur = 16,
  direction = 'top',
}) => {
  const f = useCurrentFrame() - delay;
  const words = text.split(' ');
  return (
    <span style={{ display: 'inline-block', ...style }}>
      {words.map((w, i) => {
        const t = interpolate(f - i * stagger, [0, dur], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
        const y = (direction === 'top' ? -40 : 40) * (1 - t);
        return (
          <span key={i} style={{ display: 'inline-block', filter: `blur(${(1 - t) * 12}px)`, opacity: t, transform: `translateY(${y}px)` }}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
};

/* DecryptedText: caracteres aleatorios que se resuelven al texto real */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>/';
export const DecryptedText: React.FC<Base & { stagger?: number; scramble?: number; scrambleColor?: string }> = ({
  text,
  delay = 0,
  style,
  stagger = 1.2,
  scramble = 10,
  scrambleColor,
}) => {
  const f = useCurrentFrame() - delay;
  return (
    <span style={{ display: 'inline-block', ...style }}>
      {Array.from(text).map((ch, i) => {
        if (ch === ' ') return <span key={i}> </span>;
        const resolveAt = i * stagger + scramble;
        if (f < 0) return <span key={i} style={{ opacity: 0 }}>{ch}</span>;
        if (f >= resolveAt) return <span key={i}>{ch}</span>;
        const g = GLYPHS[Math.floor(random(`d${i}-${Math.floor(f / 2)}`) * GLYPHS.length)];
        return (
          <span key={i} style={{ color: scrambleColor }}>
            {g}
          </span>
        );
      })}
    </span>
  );
};

/* CountUp: número que cuenta hasta el valor final con easing */
export const CountUp: React.FC<{
  to: number;
  from?: number;
  delay?: number;
  dur?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  style?: React.CSSProperties;
}> = ({ to, from = 0, delay = 0, dur = 40, decimals = 0, prefix = '', suffix = '', separator = '.', style }) => {
  const f = useCurrentFrame() - delay;
  const v = interpolate(f, [0, dur], [from, to], { ...clamp, easing: Easing.out(Easing.exp) });
  const fixed = v.toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      {withSep}
      {dec ? `,${dec}` : ''}
      {suffix}
    </span>
  );
};

/* RotatingText: palabra que rota dentro de una pastilla, letra por letra */
export const RotatingText: React.FC<{
  words: string[];
  every?: number; // cuadros por palabra
  delay?: number;
  style?: React.CSSProperties;
  pillColor?: string;
  textColor?: string;
  times?: number[]; // cuadro exacto en que entra cada palabra (sincronía con la voz)
}> = ({ words, every = 30, delay = 0, style, pillColor = '#2D52FF', textColor = '#FFFFFF', times }) => {
  const raw = useCurrentFrame();
  if (times && raw < times[0]) return null;
  const f = Math.max(0, raw - delay);
  const idx = times ? Math.max(0, times.filter((t) => raw >= t).length - 1) : Math.min(words.length - 1, Math.floor(f / every));
  const local = times ? raw - times[idx] : f - idx * every;
  if (times) every = idx < times.length - 1 ? times[idx + 1] - times[idx] : 9999;
  const word = words[idx];
  const isLast = idx === words.length - 1;
  return (
    <span
      style={{
        display: 'inline-flex',
        background: pillColor,
        color: textColor,
        padding: '0.05em 0.3em',
        borderRadius: '0.18em',
        overflow: 'hidden',
        ...style,
      }}
    >
      {Array.from(word).map((ch, i) => {
        const tin = interpolate(local - i * 1.2, [0, 9], [1, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
        const tout = isLast ? 0 : interpolate(local - (every - 8) - i * 0.8, [0, 7], [0, 1], clamp);
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${(tin - tout) * 110}%)` }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/* TextType: máquina de escribir con cursor */
export const TextType: React.FC<Base & { cps?: number; cursorColor?: string }> = ({ text, delay = 0, style, cps = 22, cursorColor }) => {
  const f = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor((f / fps) * cps));
  const blink = Math.floor(f / (fps / 2)) % 2 === 0;
  return (
    <span style={style}>
      {text.slice(0, n)}
      <span style={{ color: cursorColor, opacity: blink ? 1 : 0 }}>|</span>
    </span>
  );
};

/* Pop: entrada con resorte (scale) para stamps y chips */
export const usePop = (delay = 0, damping = 12) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, stiffness: 180, mass: 0.7 } });
};
