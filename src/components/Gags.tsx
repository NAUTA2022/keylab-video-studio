import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../brand/brand';
import { optionalAsset } from '../brand/assets';
import type { VideoProps } from '../schema';

// Memes del zorro de plata (mascota de Key Lab) que aparecen "cada tanto".
// sticker: foto con borde blanco tipo sticker, inclinada, con rebote.
// cutout: PNG sin fondo que entra desde un borde.
export type Gag = NonNullable<VideoProps['gags']>[number];

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Caption: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <div
    style={{
      fontFamily: FONT.display,
      fontSize: size,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      textAlign: 'center',
      lineHeight: 1,
      WebkitTextStroke: `${Math.max(3, size * 0.07)}px #000000`,
      paintOrder: 'stroke fill',
      marginTop: 10,
    }}
  >
    {text}
  </div>
);

export const OneGag: React.FC<{ g: Gag }> = ({ g }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const start = Math.round(g.at * fps);
  const end = Math.round((g.at + g.dur) * fps);
  if (frame < start || frame >= end) return null;
  const src = optionalAsset(g.image);
  if (!src) return null;
  const local = frame - start;
  const inS = spring({ frame: local, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
  const out = interpolate(frame, [end - 5, end], [1, 0], clamp);
  const wobble = Math.sin(local * 0.9) * 2.5 * Math.exp(-local / 14);
  const size = g.size * width;
  const x = g.x * width;
  const y = g.y * height;

  if (g.style === 'cutout') {
    const from = g.from ?? 'bottom';
    const slide = 1 - interpolate(local, [0, 9], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
    const dx = from === 'right' ? slide * width * 0.6 : from === 'left' ? -slide * width * 0.6 : 0;
    const dy = from === 'bottom' ? slide * height * 0.4 : 0;
    // "ceja": pequeño salto rápido estilo meme
    const bob = g.bounce ? Math.abs(Math.sin(local * 0.55)) * -18 * Math.exp(-local / 30) : 0;
    return (
      <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, transform: `translate(${dx}px, ${dy + bob}px) rotate(${(g.rotate ?? 0) + wobble}deg)`, opacity: out }}>
        <Img src={src} style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.45))' }} />
        {g.caption ? <Caption text={g.caption} size={size * 0.14} /> : null}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        transform: `scale(${inS * out}) rotate(${(g.rotate ?? -6) + wobble}deg)`,
      }}
    >
      <div style={{ background: '#FFFFFF', padding: size * 0.025, borderRadius: size * 0.06, boxShadow: '0 30px 60px rgba(0,0,0,0.35)' }}>
        <Img src={src} style={{ width: '100%', display: 'block', borderRadius: size * 0.04 }} />
      </div>
      {g.caption ? <Caption text={g.caption} size={size * 0.13} /> : null}
    </div>
  );
};

export const Gags: React.FC<{ gags: VideoProps['gags'] }> = ({ gags }) => {
  if (!gags?.length) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {gags.map((g, i) => (
        <OneGag key={i} g={g} />
      ))}
    </AbsoluteFill>
  );
};

/* ---------- MOMENTOS FIJOS (asset reutilizable: van igual en todos los videos) ---------- */

/** "Ey.": zorro de la ceja levantada sin fondo, entra desde abajo con salto. Sonido: vine boom. */
export const EY_FOX: Gag = {
  at: 0,
  dur: 99,
  image: 'memes/zorro-ceja.png',
  style: 'cutout',
  x: 0.74,
  y: 0.8,
  size: 0.56,
  from: 'bottom',
  bounce: true,
};

/** Cierre: sticker del zorro "muejeje" debajo del CTA, con la risa muejeje. */
export const OUTRO_MUEJEJE: Gag = {
  at: 0,
  dur: 99,
  image: 'memes/zorro-muejeje.jpg',
  style: 'sticker',
  x: 0.5,
  y: 0.86,
  size: 0.3,
  rotate: -5,
  caption: 'Muejeje',
};
// Segundos antes del final del cierre en que aparece el muejeje
export const OUTRO_MUEJEJE_LEAD = 2.05;
