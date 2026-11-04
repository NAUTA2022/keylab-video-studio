import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';

// Opening Key Lab · 1920x1080 · 10 s. Solo la marca: TU (0.9) · DUM (1.35) → PLAMMM majestuoso
// mientras las partículas arman el isotipo (llega a 3.0), luego el isotipo cromado y KEYLAB.
export const OPENING_DUR = 10;
const FPS = 30;
const SOFT = '#8CA0FF', ACCENT = '#2D52FF';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const TU = 0.9, DUM = 1.35, FORM = 3.0, WORD = 4.4;
const LY = -40; // el logo sube un poco para dejar espacio a KEYLAB

export const OpeningKeyLab: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const pulse = (at: number, k: number) => (t >= at ? Math.exp(-(t - at) * 5) * k : 0);
  const glow = pulse(TU, 0.35) + pulse(DUM, 0.6);
  const parts = interpolate(t, [FORM - 0.1, FORM + 0.7], [1, 0], clamp);
  const logo = interpolate(t, [FORM - 0.3, FORM + 0.5], [0, 1], { ...clamp, easing: ease });
  const push = interpolate(t, [DUM, 10], [1.0, 1.1], clamp);
  const sweep = interpolate(t, [FORM + 0.2, FORM + 1.4], [-30, 130], clamp);
  const word = interpolate(t, [WORD, WORD + 1.1], [0, 1], { ...clamp, easing: ease });
  const end = interpolate(t, [9.1, 10], [1, 0], clamp);
  const flash = interpolate(t, [FORM - 0.05, FORM, FORM + 0.6], [0, 0.35, 0], clamp);
  const bloom = interpolate(t, [DUM, FORM, 10], [0.04, 0.3, 0.22], clamp);
  return (
    <AbsoluteFill style={{ background: '#030305', overflow: 'hidden' }}>
      <Audio src={staticFile('media/opening/opening.mp3')} />
      <AbsoluteFill style={{ opacity: end }}>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 60% at 50% 46%, rgba(45,82,255,${bloom + glow * 0.4}) 0%, rgba(3,3,5,0) 70%)` }} />
        {/* rayos de luz detrás del logo */}
        <AbsoluteFill style={{ opacity: logo * 0.5, transform: `rotate(${t * 4}deg) scale(1.6)`, background: 'repeating-conic-gradient(from 0deg at 50% 46%, rgba(140,160,255,0.10) 0deg 3deg, transparent 3deg 14deg)', WebkitMaskImage: 'radial-gradient(circle at 50% 46%, #000 0%, transparent 45%)', maskImage: 'radial-gradient(circle at 50% 46%, #000 0%, transparent 45%)' }} />
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          {/* partículas que arman el isotipo con el PLAMMM */}
          <Sequence from={Math.round(1.0 * FPS)}>
            <AbsoluteFill style={{ opacity: parts, mixBlendMode: 'screen', transform: `translateY(${LY}px)` }}>
              <OffthreadVideo src={staticFile('media/opening/particulas-logo.mp4')} muted />
            </AbsoluteFill>
          </Sequence>
          {/* isotipo cromado */}
          <div style={{ position: 'absolute', left: 960 - 233, top: 540 - 270 + LY, width: 466, height: 540, opacity: logo }}>
            <Img src={staticFile('brand/isotipo-cromo.png')} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 60px rgba(140,160,255,0.5))' }} />
            <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `url(${staticFile('brand/isotipo-cromo.png')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', background: `linear-gradient(110deg, transparent ${sweep - 18}%, rgba(255,255,255,0.9) ${sweep}%, transparent ${sweep + 18}%)` }} />
          </div>
          {/* KEYLAB */}
          <div style={{ position: 'absolute', top: 840, left: 0, width: 1920, display: 'flex', justifyContent: 'center', opacity: word, clipPath: `inset(0 ${(1 - word) * 50}% 0 ${(1 - word) * 50}%)` }}>
            <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 380, display: 'block' }} />
          </div>
        </AbsoluteFill>
        {/* ondas en TU, DUM y al armarse el logo */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {[TU, DUM, FORM].map((at, i) => {
            const a = t - at; if (a < 0 || a > 1.8) return null;
            return <circle key={i} cx={960} cy={540 + LY} r={60 + a * (i === 1 ? 900 : 600)} fill="none" stroke={i === 1 ? ACCENT : SOFT} strokeWidth={i === 1 ? 4 : 2} opacity={0.65 * (1 - a / 1.8)} />;
          })}
        </svg>
        <AbsoluteFill style={{ background: '#DDE3FF', opacity: flash }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
