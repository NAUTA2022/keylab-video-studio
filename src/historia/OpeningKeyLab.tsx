import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, Loop, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { ensureFonts } from '../brand/fonts';

// Opening tipo serie de streaming para Key Lab · 1920x1080 · 10 s. Sin 3D en vivo:
// partículas pre-renderizadas (Ulises → Sebastián → isotipo → explota), personas pintadas horneadas,
// palabras en golpes, impacto con el isotipo cromado y la marca.
ensureFonts();
export const OPENING_DUR = 10;
const FPS = 30;
const INK = '#FFFFFF', SOFT = '#8CA0FF', ACCENT = '#2D52FF';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const HIT = 5.8, BRAND = 7.0;

const Pintado: React.FC<{ src: string; x: number; o: number; h?: number }> = ({ src, x, o, h = 760 }) => (
  <div style={{ position: 'absolute', left: x - h / 2, top: 1080 - h + 40, width: h, height: h, opacity: o, mixBlendMode: 'screen', WebkitMaskImage: 'linear-gradient(180deg,#000 55%,transparent 80%)', maskImage: 'linear-gradient(180deg,#000 55%,transparent 80%)' }}>
    <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)', maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)', filter: 'contrast(1.15) brightness(0.93)' }}>
      <Loop durationInFrames={348}><OffthreadVideo src={staticFile(`personajes/loops/${src}.mp4`)} muted style={{ width: '100%', height: '100%' }} /></Loop>
    </div>
  </div>
);

/* Palabra de golpe: entra grande, tracking que se abre, sale con desenfoque */
const Golpe: React.FC<{ t: number; at: number; until: number; text: string; color?: string }> = ({ t, at, until, text, color = INK }) => {
  if (t < at || t > until) return null;
  const p = interpolate(t, [at, at + 0.18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(t, [until - 0.15, until], [1, 0], clamp);
  const ls = interpolate(t, [at, until], [8, 40], clamp);
  return (
    <div style={{ position: 'absolute', top: 860, left: 0, width: 1920, textAlign: 'center', opacity: p * out, transform: `scale(${1.25 - 0.25 * p})`, filter: `blur(${(1 - out) * 10}px)` }}>
      <span style={{ fontFamily: 'Anton', fontSize: 120, letterSpacing: ls, color, paddingLeft: ls, textShadow: '0 0 40px rgba(140,160,255,0.35)' }}>{text}</span>
    </div>
  );
};

export const OpeningKeyLab: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // destello anamórfico que abre el video
  const line = interpolate(t, [0.1, 0.9], [0, 1], { ...clamp, easing: ease });
  const lineO = interpolate(t, [0.1, 0.3, 1.0, 1.4], [0, 1, 1, 0], clamp);
  const flash = interpolate(t, [HIT - 0.02, HIT, HIT + 0.5], [0, 0.9, 0], clamp);
  const logoP = interpolate(t, [HIT, HIT + 0.9], [0, 1], { ...clamp, easing: ease });
  const push = 1.18 - 0.18 * logoP + interpolate(t, [HIT + 0.9, 10], [0, 0.04], clamp);
  const sweep = interpolate(t, [HIT + 0.5, HIT + 1.7], [-30, 130], clamp);
  const word = interpolate(t, [BRAND, BRAND + 0.9], [0, 1], { ...clamp, easing: ease });
  const tag = interpolate(t, [BRAND + 0.7, BRAND + 1.4], [0, 1], clamp);
  const endFade = interpolate(t, [9.3, 10], [1, 0], clamp);
  const figs = interpolate(t, [0.9, 1.6, 4.6, 5.4], [0, 0.55, 0.55, 0], clamp);
  const parts = interpolate(t, [HIT + 0.6, HIT + 1.3], [1, 0], clamp);
  const shake = t > HIT && t < HIT + 0.35 ? Math.sin(t * 120) * 10 * (1 - (t - HIT) / 0.35) : 0;
  return (
    <AbsoluteFill style={{ background: '#050507', overflow: 'hidden' }}>
      <Audio src={staticFile('media/opening/opening.mp3')} />
      <AbsoluteFill style={{ opacity: endFade, transform: `translateX(${shake}px)` }}>
        {/* rejilla de puntos que deriva */}
        <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1.2px, transparent 1.3px)', backgroundSize: '48px 48px', backgroundPosition: `${(t * 6) % 48}px ${(t * 3) % 48}px`, opacity: 0.5 }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 55% at 50% 55%, rgba(45,82,255,${0.08 + 0.25 * logoP}) 0%, rgba(5,5,7,0) 70%)` }} />
        {/* destello inicial */}
        <div style={{ position: 'absolute', top: 538, left: 960 - 960 * line, width: 1920 * line, height: 4, background: SOFT, opacity: lineO, boxShadow: `0 0 40px 8px ${SOFT}` }} />
        {/* personas pintadas a los lados */}
        {/* partículas: Ulises → Sebastián → isotipo → explota en el impacto */}
        <Sequence from={Math.round(0.8 * FPS)}>
          <AbsoluteFill style={{ opacity: parts, mixBlendMode: 'screen' }}>
            <OffthreadVideo src={staticFile('media/opening/particulas.mp4')} muted />
          </AbsoluteFill>
        </Sequence>
        <Golpe t={t} at={1.2} until={2.1} text="Diseño" />
        <Golpe t={t} at={2.2} until={2.95} text="Tecnología" />
        <Golpe t={t} at={3.0} until={4.3} text="Blockchain" color={SOFT} />
        {/* isotipo cromado */}
        {t >= HIT ? (
          <div style={{ position: 'absolute', left: 960 - 170, top: 250, width: 340, height: 394, opacity: logoP, transform: `scale(${push})` }}>
            <Img src={staticFile('brand/isotipo-cromo.png')} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 50px rgba(140,160,255,0.45))' }} />
            <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `url(${staticFile('brand/isotipo-cromo.png')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', background: `linear-gradient(110deg, transparent ${sweep - 18}%, rgba(255,255,255,0.85) ${sweep}%, transparent ${sweep + 18}%)` }} />
          </div>
        ) : null}
        {/* anillos del impacto */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {[0, 0.18, 0.36].map((d, i) => {
            const a = t - HIT - d; if (a < 0 || a > 1.6) return null;
            return <circle key={i} cx={960} cy={447} r={120 + a * 700} fill="none" stroke={i === 1 ? ACCENT : SOFT} strokeWidth={3} opacity={0.7 * (1 - a / 1.6)} />;
          })}
        </svg>
        {/* marca */}
        <div style={{ position: 'absolute', top: 700, left: 0, width: 1920, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          <div style={{ opacity: word, clipPath: `inset(0 ${(1 - word) * 50}% 0 ${(1 - word) * 50}%)` }}>
            <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 420, display: 'block' }} />
          </div>
          <div style={{ fontFamily: 'Figtree', fontWeight: 800, fontSize: 26, letterSpacing: interpolate(tag, [0, 1], [24, 10]), color: SOFT, opacity: tag, textTransform: 'uppercase' }}>Software factory · Medellín</div>
        </div>
        <AbsoluteFill style={{ background: '#FFFFFF', opacity: flash }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
