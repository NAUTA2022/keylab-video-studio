import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, BRAND_FILES, layout } from '../brand/brand';
import { optionalAsset } from '../brand/assets';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const useLayout = () => {
  const { width, height } = useVideoConfig();
  return layout(width, height);
};

/* Logo horizontal oficial. Si el archivo no está, deja el espacio vacío. */
export const Logo: React.FC<{ variant: 'ink' | 'white'; height: number; style?: React.CSSProperties }> = ({ variant, height, style }) => {
  const src = optionalAsset(variant === 'ink' ? BRAND_FILES.logoInk : BRAND_FILES.logoWhite);
  if (!src) return <div style={{ height, ...style }} />;
  return <Img src={src} style={{ height, width: 'auto', display: 'block', ...style }} />;
};

/* Solo el wordmark (recorte del logo horizontal blanco), para el cierre */
export const Wordmark: React.FC<{ width: number }> = ({ width }) => {
  const src = optionalAsset(BRAND_FILES.logoWhite);
  const { sx, sw, total } = BRAND_FILES.wordmarkCrop;
  if (!src) return <div style={{ width, height: width * 0.2 }} />;
  const full = (width / sw) * total;
  return (
    <div style={{ width, overflow: 'hidden' }}>
      <Img src={src} style={{ width: full, marginLeft: -(sx / total) * full, display: 'block' }} />
    </div>
  );
};

export const Isotipo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => {
  const src = optionalAsset(BRAND_FILES.isotipo3d);
  if (!src) return <div style={{ width: size, height: size, ...style }} />;
  return <Img src={src} style={{ width: size, height: size, objectFit: 'contain', ...style }} />;
};

/* Marco fijo: logo arriba izq, etiqueta de sección arriba der, barra de progreso */
export const Chrome: React.FC<{ tag?: string; index: number; dark?: boolean; progress: number }> = ({ tag, index, dark, progress }) => {
  const L = useLayout();
  const ink = dark ? C.white : C.ink;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: L.colLeft, top: L.logoY - L.logoH / 2 }}>
        <Logo variant={dark ? 'white' : 'ink'} height={L.logoH} />
      </div>
      {tag ? (
        <div
          style={{
            position: 'absolute',
            right: L.width - L.colRight,
            top: L.logoY - 14,
            fontFamily: FONT.body,
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 3,
            color: ink,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: dark ? C.soft : C.cobalt }}>{String(index).padStart(2, '0')}</span>&nbsp;&nbsp;{tag}
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: L.colLeft, width: L.colWidth, top: L.progressY, height: 6, background: dark ? '#2A2C33' : C.line, borderRadius: 3 }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: dark ? C.soft : C.cobalt, borderRadius: 3 }} />
      </div>
    </AbsoluteFill>
  );
};

/* Subtítulos centrados encima de la barra de progreso */
export const Subtitles: React.FC<{ items: { from: number; to: number; text: string }[]; dark?: boolean }> = ({ items, dark }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const t = f / fps;
  const cur = items.find((s) => t >= s.from && t < s.to);
  if (!cur) return null;
  const local = (t - cur.from) * fps;
  const k = interpolate(local, [0, 5], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: L.colLeft,
        width: L.colWidth,
        top: L.subtitleY - 40,
        textAlign: 'center',
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: L.vertical ? 38 : 34,
        lineHeight: 1.2,
        color: dark ? C.white : C.ink,
        opacity: k,
        transform: `translateY(${(1 - k) * 10}px)`,
      }}
    >
      {cur.text}
    </div>
  );
};

/* Reveal con máscara: el contenido sube desde detrás de una línea */
export const MaskReveal: React.FC<{ delay?: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay = 0,
  dur = 14,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f - delay, [0, dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (f < delay) return <div style={{ visibility: 'hidden', ...style }}>{children}</div>;
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <div style={{ transform: `translateY(${(1 - t) * 105}%)` }}>{children}</div>
    </div>
  );
};

/* Stamp: sello rotado que cae con golpe */
export const Stamp: React.FC<{ text: string; delay?: number; color?: string; rotate?: number; size?: number }> = ({
  text,
  delay = 0,
  color = C.cobalt,
  rotate = -8,
  size = 40,
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f - delay, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
  if (f < delay) return null;
  return (
    <div
      style={{
        display: 'inline-block',
        border: `5px solid ${color}`,
        color,
        fontFamily: FONT.body,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 2,
        padding: '8px 22px',
        borderRadius: 10,
        textTransform: 'uppercase',
        transform: `rotate(${rotate}deg) scale(${2.2 - 1.2 * t})`,
        opacity: t,
      }}
    >
      {text}
    </div>
  );
};

/* Flash blanco + zoom-punch en el corte de entrada de cada escena */
export const CutFlash: React.FC<{ color?: string }> = ({ color = '#FFFFFF' }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 4], [0.85, 0], clamp);
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: 'none' }} />;
};

export const usePunch = () => {
  const f = useCurrentFrame();
  return interpolate(f, [0, 7], [1.08, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
};

/* Ventana de navegador con URL visible, para capturas reales de webs */
export const BrowserWindow: React.FC<{ url: string; shot?: string; width: number; height: number; children?: React.ReactNode }> = ({
  url,
  shot,
  width,
  height,
  children,
}) => {
  const src = shot ? optionalAsset(shot) : null;
  return (
    <div style={{ width, height, borderRadius: 18, overflow: 'hidden', background: C.white, border: `2px solid ${C.line}`, boxShadow: '0 30px 60px rgba(20,21,25,0.18)' }}>
      <div style={{ height: 54, background: '#E9E6DF', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: C.line }} />
        ))}
        <div style={{ marginLeft: 12, flex: 1, height: 32, borderRadius: 16, background: C.white, display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: FONT.body, fontWeight: 600, fontSize: 20, color: C.gray }}>
          {url}
        </div>
      </div>
      <div style={{ position: 'relative', height: height - 54, background: C.bone }}>
        {src ? <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : children}
      </div>
    </div>
  );
};

/* Iconos geométricos planos (sin logos de terceros) */
export const GeoIcon: React.FC<{ kind: 'block' | 'coin' | 'chart' | 'shield' | 'bolt'; size: number; color?: string }> = ({ kind, size, color = C.cobalt }) => {
  const s = size;
  const sw = s * 0.08;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      {kind === 'block' && <path d="M50 8 L90 30 L90 70 L50 92 L10 70 L10 30 Z M10 30 L50 52 L90 30 M50 52 L50 92" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />}
      {kind === 'coin' && (
        <>
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth={sw} />
          <circle cx="50" cy="50" r="22" fill={color} />
        </>
      )}
      {kind === 'chart' && <path d="M12 85 L12 15 M12 85 L88 85 M24 70 L44 48 L58 60 L84 26" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
      {kind === 'shield' && <path d="M50 8 L86 22 L86 50 C86 72 68 86 50 92 C32 86 14 72 14 50 L14 22 Z M34 50 L46 62 L68 38" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />}
      {kind === 'bolt' && <path d="M58 6 L18 56 L46 56 L40 94 L82 40 L54 40 Z" fill={color} />}
    </svg>
  );
};

export { staticFile };
