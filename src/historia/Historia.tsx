import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ensureFonts } from '../brand/fonts';
import { EY_FOX, OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import { RetratoVivo, SEBASTIAN, ULISES, idle } from './Retrato';
import { Persona3D, type Layer } from './Persona3D';
import { MarketplacePhone } from './Marketplace';

// Historia de Key Lab · 1920x1080 · motion graphics minimalista sobre negro.
// Personas = siluetas blancas. Todo el texto en color sólido (sin degradados).
// Tiempos en segundos absolutos, sincronizados con la voz de Arconte (public/media/historia-keylab).

ensureFonts();
const FPS = 30;
export const HISTORIA_DUR = 210;
const BG = '#050507';
const INK = '#FFFFFF';
const MUTED = '#8A8D99';
const ACCENT = '#2D52FF';
const SOFT = '#8CA0FF';
const DISPLAY = 'Anton';
const BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

const useT = () => useCurrentFrame() / FPS;
const vis = (t: number, a: number, b: number, fade = 0.45) =>
  Math.min(interpolate(t, [a, a + 0.01], [0, 1], clamp), interpolate(t, [b - fade, b], [1, 0], clamp));

/* ---------- Texto que entra palabra por palabra con máscara ---------- */
const Words: React.FC<{
  text: string; at: number; until: number; size: number; font?: 'display' | 'body'; weight?: number;
  color?: string; x?: number; y: number; align?: 'left' | 'center' | 'right'; width?: number; tracking?: number; stagger?: number;
}> = ({ text, at, until, size, font = 'body', weight = 700, color = INK, x, y, align = 'center', width = 1600, tracking = 0, stagger = 0.07 }) => {
  const t = useT();
  size = size * 1.2;
  if (t < at - 0.05 || t > until + 0.05) return null;
  const out = interpolate(t, [until - 0.4, until], [1, 0], clamp);
  const blurOut = interpolate(t, [until - 0.4, until], [0, 8], clamp);
  const words = text.split(' ');
  const left = x ?? (align === 'center' ? (1920 - width) / 2 : 160);
  return (
    <div style={{ position: 'absolute', left, top: y, width, textAlign: align, opacity: out, filter: `blur(${blurOut}px)` }}>
      <div style={{ fontFamily: font === 'display' ? DISPLAY : BODY, fontWeight: font === 'display' ? 400 : weight, fontSize: size, lineHeight: 1.08, color, letterSpacing: tracking, textTransform: font === 'display' ? 'uppercase' : undefined }}>
        {words.map((w, i) => {
          const p = interpolate(t, [at + i * stagger, at + i * stagger + 0.7], [0, 1], { ...clamp, easing: ease });
          return (
            <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: size * 0.08, marginRight: size * 0.26 }}>
              <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`, filter: `blur(${(1 - p) * 6}px)` }}>{w}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* Etiqueta pequeña con tracking (nombres, áreas) */
const Label: React.FC<{ text: string; at: number; until: number; x: number; y: number; color?: string; size?: number; align?: 'left' | 'center' }> = ({ text, at, until, x, y, color = MUTED, size = 22, align = 'center' }) => {
  const t = useT();
  const o = vis(t, at, until) * interpolate(t, [at, at + 0.6], [0, 1], clamp);
  const ls = interpolate(t, [at, at + 1.2], [14, 6], { ...clamp, easing: ease });
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: align === 'center' ? x - 400 : x, top: y, width: 800, textAlign: align, fontFamily: BODY, fontWeight: 700, fontSize: size, letterSpacing: ls, color, textTransform: 'uppercase', opacity: o }}>
      {text}
    </div>
  );
};

/* Capítulo arriba a la izquierda */
const Chapter: React.FC<{ n: string; name: string; at: number; until: number }> = ({ n, name, at, until }) => {
  if (n) return null; // guía de capítulos desactivada
  const t = useT();
  const o = vis(t, at, until, 0.6) * interpolate(t, [at, at + 0.8], [0, 1], clamp);
  if (o <= 0) return null;
  const w = interpolate(t, [at, at + 1.2], [0, 56], { ...clamp, easing: ease });
  return (
    <div style={{ position: 'absolute', left: 110, top: 84, display: 'flex', alignItems: 'center', gap: 18, opacity: o }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 20, color: SOFT, letterSpacing: 4 }}>{n}</div>
      <div style={{ width: w, height: 2, background: SOFT }} />
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 20, color: MUTED, letterSpacing: 6, textTransform: 'uppercase' }}>{name}</div>
    </div>
  );
};

/* ---------- Siluetas ---------- */
type Kind = 'ulises' | 'sebas' | 'race' | 'matias' | 'a' | 'b' | 'c';
const HAIR: Record<Kind, string> = {
  ulises: 'M61 86 C54 54 70 30 96 27 C108 20 124 24 132 34 C146 42 150 62 140 88 C136 70 128 62 118 60 C114 68 100 70 90 64 C80 70 68 74 61 86 Z M70 46 C66 36 72 28 82 30 C78 36 76 40 70 46 Z M124 30 C134 26 142 32 142 42 C136 38 132 34 124 30 Z',
  sebas: 'M63 80 C60 50 80 34 102 34 C126 34 142 52 137 82 C128 64 112 57 100 57 C86 57 71 63 63 80 Z',
  race: 'M62 86 C58 52 76 36 100 36 C126 36 144 52 138 86 C132 60 118 52 96 54 C80 55 68 68 62 86 Z M68 104 C72 134 128 134 132 104 C126 118 74 118 68 104 Z',
  matias: 'M60 84 C54 54 74 32 100 32 C128 32 148 54 140 84 C136 66 126 58 112 56 C104 60 92 60 84 56 C74 60 64 68 60 84 Z M66 52 A12 12 0 1 1 82 38 Z M88 38 A13 13 0 1 1 112 36 Z M118 38 A12 12 0 1 1 136 52 Z',
  a: 'M64 80 C62 52 82 38 100 38 C120 38 138 52 136 80 C126 62 112 58 100 58 C88 58 74 62 64 80 Z',
  b: 'M62 92 C56 52 80 34 100 34 C120 34 144 52 138 92 C138 120 136 140 132 150 C130 120 128 90 120 70 C106 74 94 74 80 70 C72 90 70 120 68 150 C64 140 62 120 62 92 Z',
  c: 'M64 78 C64 50 84 40 100 40 C118 40 136 50 136 78 C128 60 110 58 100 60 C88 58 72 62 64 78 Z',
};
const Bust: React.FC<{ kind: Kind; color: string }> = ({ kind, color }) => (
  <svg viewBox="0 0 200 240" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
    <g fill={color}>
      <path d="M12 240 C14 196 44 168 82 160 L118 160 C156 168 186 196 188 240 Z" />
      <path d="M84 116 L116 116 L119 166 L81 166 Z" />
      <ellipse cx="100" cy="86" rx="36" ry="44" />
      <ellipse cx="64" cy="90" rx="7" ry="11" />
      <ellipse cx="136" cy="90" rx="7" ry="11" />
      <path d={HAIR[kind]} />
    </g>
  </svg>
);

const Person: React.FC<{
  kind: Kind; at: number; until: number; x: number; y?: number; h?: number; dim?: [number, number][]; glow?: boolean; dx?: [number, number, number];
}> = ({ kind, at, until, x, y = 820, h = 420, dim, glow, dx }) => {
  const t = useT();
  if (t < at || t > until) return null;
  if (kind === 'ulises' || kind === 'sebas') return <Portrait kind={kind} at={at} until={until} x={x} y={y} h={h} dim={dim} dx={dx} />;
  return <Figure kind={kind} at={at} until={until} x={x} y={y} h={h} dim={dim} dx={dx} glow={glow} />;
};

/* Ulises y Sebastián: retratos pintados "vivos" en vez de silueta.
   Se encuadran como busto (la cabeza arriba donde iría la silueta) y el cuerpo se funde hacia abajo. */
const Portrait: React.FC<{ kind: 'ulises' | 'sebas'; at: number; until: number; x: number; y: number; h: number; dim?: [number, number][]; dx?: [number, number, number] }> = ({ kind, at, until, x, y, h, dim, dx }) => {
  const t = useT();
  const rig = kind === 'ulises' ? ULISES : SEBASTIAN;
  const Hp = h * 2.0;
  const p = interpolate(t, [at, at + 1.2], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(t, [until - 0.5, until], [1, 0], clamp);
  let o = 1;
  for (const [a, b] of dim ?? []) if (t >= a && t < b) o = interpolate(t, [a, a + 0.4], [1, 0.3], clamp);
  if (dim) for (const [, b] of dim) if (t >= b && t < b + 0.4) o = interpolate(t, [b, b + 0.4], [0.3, 1], clamp);
  const shift = dx ? interpolate(t, [dx[0], dx[1]], [0, dx[2]], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const top = y - h;
  const fadeA = ((y + h * 0.02) / 1080) * 100, fadeB = ((y + h * 0.35) / 1080) * 100;
  const mask = `linear-gradient(180deg, #000 ${fadeA}%, transparent ${fadeB}%)`;
  return (
    <AbsoluteFill style={{ opacity: p * out * o, transform: `translate(${shift}px, ${(1 - p) * 30}px)`, WebkitMaskImage: mask, maskImage: mask }}>
      <RetratoVivo rig={rig} motion={idle(t, kind === 'ulises' ? 0 : 2.3)} x={x} y={top + Hp / 2} height={Hp} />
    </AbsoluteFill>
  );
};

/* Las demás personas: cuerpo humano real con captura de movimiento, pintado a pincel con aura que hierve */
const SEEDS: Record<string, number> = { race: 0.3, matias: 1.7, a: 2.9, b: 4.1, c: 5.3 };
const Figure: React.FC<{ kind: Kind; at: number; until: number; x: number; y: number; h: number; dim?: [number, number][]; dx?: [number, number, number]; glow?: boolean }> = ({ kind, at, until, x, y, h, dim, dx, glow }) => {
  const t = useT();
  const H = Math.round(h * 2.05);
  const W = Math.round(H * 0.85);
  const p = interpolate(t, [at, at + 1.2], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(t, [until - 0.5, until], [1, 0], clamp);
  let o = 1;
  for (const [a, b] of dim ?? []) if (t >= a && t < b) o = interpolate(t, [a, a + 0.4], [1, 0.3], clamp);
  if (dim) for (const [, b] of dim) if (t >= b && t < b + 0.4) o = interpolate(t, [b, b + 0.4], [0.3, 1], clamp);
  const shift = dx ? interpolate(t, [dx[0], dx[1]], [0, dx[2]], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const walking = dx ? interpolate(t, [dx[0] - 0.3, dx[0] + 0.2, dx[1] - 0.2, dx[1] + 0.3], [0, 1, 1, 0], clamp) : 0;
  const ph = SEEDS[kind] ?? 0;
  const nod = kind === 'matias' ? interpolate(t, [at + 1.5, at + 1.9, at + 3.2, at + 3.6], [0, 1, 1, 0], clamp) : 0;
  const layers: Layer[] = [
    { clip: 'idle', weight: 1 - walking, offset: ph },
    ...(walking > 0 ? [{ clip: 'walk', weight: walking, offset: ph } as Layer] : []),
    ...(nod > 0 ? [{ clip: 'agree', weight: nod, additive: true, offset: -(at + 1.5) } as Layer] : []),
  ];
  // de espaldas en tres cuartos; los de Vulcano se dan la espalda al separarse
  let yaw = Math.PI + (kind === 'race' ? 0.1 : 0.35 * (x < 960 ? 1 : -1));
  if (dx) yaw += interpolate(walking, [0, 1], [0, dx[2] < 0 ? -0.9 : 0.9]);
  const top = y - h * 1.08;
  const fadeA = ((y - top - h * 0.14) / H) * 100, fadeB = ((y - top + h * 0.08) / H) * 100;
  const mask = `linear-gradient(180deg, #000 ${fadeA}%, transparent ${fadeB}%)`;
  return (
    <div style={{ position: 'absolute', left: x - W / 2 + shift, top: top + (1 - p) * 24, width: W, height: H, opacity: p * out * o, WebkitMaskImage: mask, maskImage: mask }}>
      <Persona3D id={`p-${kind}-${Math.round(at * 10)}`} width={W} height={H} yaw={yaw} aura={glow ? 1.6 : 1} cam={{ y: 1.3, z: 2.05, fov: 35, lookY: 1.25 }} layers={layers} />
    </div>
  );
};

/* Línea de piso bajo las siluetas */
const Floor: React.FC<{ at: number; until: number; y?: number; w?: number }> = ({ at, until, y = 820, w = 1200 }) => {
  const t = useT();
  const p = interpolate(t, [at, at + 1.4], [0, 1], { ...clamp, easing: ease });
  const o = vis(t, at, until);
  if (o <= 0) return null;
  return <div style={{ position: 'absolute', left: 960 - (w * p) / 2, top: y, width: w * p, height: 1, background: 'rgba(255,255,255,0.28)', opacity: o }} />;
};

/* Línea fina que se dibuja entre dos puntos */
const Stroke: React.FC<{ d: string; at: number; until: number; len?: number; color?: string; width?: number; dur?: number }> = ({ d, at, until, len = 1200, color = SOFT, width = 2, dur = 1.2 }) => {
  const t = useT();
  const p = interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: ease });
  const o = vis(t, at, until);
  if (o <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: o }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
    </svg>
  );
};

/* Cubo isométrico de vóxel (The Sandbox) dibujado a línea */
const Voxel: React.FC<{ at: number; until: number; cx: number; cy: number; s: number }> = ({ at, until, cx, cy, s }) => {
  const top = `M${cx} ${cy - s} L${cx + s * 0.87} ${cy - s / 2} L${cx} ${cy} L${cx - s * 0.87} ${cy - s / 2} Z`;
  const left = `M${cx - s * 0.87} ${cy - s / 2} L${cx - s * 0.87} ${cy + s / 2} L${cx} ${cy + s} L${cx} ${cy}`;
  const right = `M${cx + s * 0.87} ${cy - s / 2} L${cx + s * 0.87} ${cy + s / 2} L${cx} ${cy + s}`;
  return (
    <>
      <Stroke d={top} at={at} until={until} len={s * 4} color={INK} />
      <Stroke d={left} at={at + 0.3} until={until} len={s * 3} color={INK} />
      <Stroke d={right} at={at + 0.5} until={until} len={s * 2} color={INK} />
    </>
  );
};

/* Chip tipo etiqueta (conceptos) */
const Chip: React.FC<{ text: string; at: number; until: number; x: number; y: number; accent?: boolean }> = ({ text, at, until, x, y, accent }) => {
  const t = useT();
  const p = interpolate(t, [at, at + 0.6], [0, 1], { ...clamp, easing: ease });
  const o = vis(t, at, until) * p;
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y + (1 - p) * 24, opacity: o, border: `1.5px solid ${accent ? ACCENT : 'rgba(255,255,255,0.4)'}`, background: accent ? ACCENT : 'transparent', borderRadius: 999, padding: '14px 30px', fontFamily: BODY, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: INK, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {text}
    </div>
  );
};

/* Barras de crecimiento minimalistas */
const Growth: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const hs = [90, 150, 220, 310, 420];
  return (
    <div style={{ position: 'absolute', left: 1180, bottom: 220, display: 'flex', alignItems: 'flex-end', gap: 34, opacity: o }}>
      {hs.map((h, i) => {
        const p = interpolate(t, [at + 0.4 + i * 0.5, at + 1.4 + i * 0.5], [0, 1], { ...clamp, easing: ease });
        return <div key={i} style={{ width: 46, height: h * p, background: i === hs.length - 1 ? ACCENT : 'rgba(255,255,255,0.85)' }} />;
      })}
    </div>
  );
};

/* Fondo: negro con rejilla de puntos que deriva muy lento y viñeta */
const Backdrop: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: BG }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1.2px, transparent 1.3px)', backgroundSize: '48px 48px', backgroundPosition: `${(t * 3) % 48}px ${(t * 1.5) % 48}px`, opacity: 0.55 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(5,5,7,0) 30%, rgba(5,5,7,0.92) 100%)' }} />
    </AbsoluteFill>
  );
};

/* Resplandor de horizonte (esperanza) */
const Horizon: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  const p = interpolate(t, [at, at + 6], [0, 1], { ...clamp, easing: ease });
  const o = vis(t, at, until, 1);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% ${30 + p * 25}% at 50% 110%, rgba(45,82,255,${0.35 * p}) 0%, rgba(45,82,255,0) 70%)`, opacity: o }} />;
};

/* Ey. con el zorro de la ceja (asset fijo) */
const EyMoment: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  if (t < at || t >= until) return null;
  const s = interpolate(t, [at, at + 0.2], [1.6, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <AbsoluteFill style={{ background: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 340, color: INK, transform: `scale(${s})`, lineHeight: 1 }}>Ey.</div>
      <OneGag g={{ ...EY_FOX, at: at, dur: until - at, x: 0.78, y: 0.66, size: 0.3 }} />
    </AbsoluteFill>
  );
};

/* Cierre: isotipo cromado + wordmark oficial (archivos de marca) */
const Outro: React.FC<{ at: number }> = ({ at }) => {
  const t = useT();
  if (t < at) return null;
  const iso = interpolate(t, [at, at + 1.4], [0, 1], { ...clamp, easing: ease });
  const sweep = interpolate(t, [at + 0.6, at + 2.0], [-30, 130], clamp);
  const word = interpolate(t, [at + 0.7, at + 1.7], [0, 1], { ...clamp, easing: ease });
  const url = interpolate(t, [at + 1.3, at + 2.1], [0, 1], clamp);
  const float = Math.sin((t - at) * 1.3) * 4;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 30% 40% at 50% 40%, rgba(140,160,255,${0.14 * iso}) 0%, rgba(5,5,7,0) 70%)` }} />
      <div style={{ position: 'relative', width: 300, height: 348, marginTop: -110, opacity: iso, transform: `translateY(${(1 - iso) * 30 + float}px) scale(${0.9 + iso * 0.1})` }}>
        <Img src={staticFile('brand/isotipo-cromo.png')} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(140,160,255,0.35))' }} />
        <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `url(${staticFile('brand/isotipo-cromo.png')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', background: `linear-gradient(110deg, transparent ${sweep - 18}%, rgba(255,255,255,0.75) ${sweep}%, transparent ${sweep + 18}%)` }} />
      </div>
      <div style={{ marginTop: 46, opacity: word, clipPath: `inset(0 ${(1 - word) * 100}% 0 0)` }}>
        <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 300, display: 'block' }} />
      </div>
      <div style={{ marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: SOFT, opacity: url }}>keylab.tech</div>
    </AbsoluteFill>
  );
};

export const Historia: React.FC = () => {
  const { width } = useVideoConfig();
  void width;
  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <Backdrop />
      <Audio src={staticFile('media/historia-keylab/historia-keylab-voz-musica.mp3')} />
      
      {/* 01 · ORIGEN 0–19.0 */}
      <Chapter n="01" name="El origen" at={0.3} until={18.9} />
      <Voxel at={0.4} until={5.1} cx={960} cy={470} s={120} />
      <Words text="Todo empezó en un videojuego" at={0.3} until={5.1} size={64} y={690} />
      <Label text="The Sandbox" at={2.7} until={5.1} x={960} y={790} color={SOFT} size={26} />
      <Floor at={5.4} until={18.9} y={820} w={1300} />
      <Person kind="ulises" at={5.6} until={18.9} x={610} dim={[[14.6, 18.9]]} />
      <Person kind="sebas" at={5.9} until={18.9} x={1310} dim={[[11.3, 14.6]]} />
      <Stroke d="M960 420 L960 820" at={9.3} until={18.9} len={400} color="rgba(255,255,255,0.35)" width={1.5} />
      <Words text="Dos personas." at={5.5} until={9.2} size={56} y={150} />
      <Words text="Cada uno en su área." at={9.3} until={11.2} size={56} y={150} />
      <Label text="Ulises" at={11.4} until={18.9} x={610} y={850} color={INK} size={30} />
      <Label text="Diseño · Creatividad" at={11.9} until={18.9} x={610} y={898} color={SOFT} size={20} />
      <Label text="Sebastián" at={14.7} until={18.9} x={1310} y={850} color={INK} size={30} />
      <Label text="Tecnología · Desarrollo" at={15.7} until={18.9} x={1310} y={898} color={SOFT} size={20} />

      {/* 02 · CRECIMIENTO 19.0–36.4 */}
      <Chapter n="02" name="Crecer" at={19.1} until={36.3} />
      <Words text="Pronto, los dos empezaron a crecer." at={19.2} until={25.7} size={64} y={300} width={900} align="left" x={160} />
      <Words text="Proyectos más grandes." at={22.1} until={25.7} size={40} y={520} width={900} align="left" x={160} color={MUTED} weight={600} />
      <Words text="Más responsabilidad." at={23.8} until={25.7} size={40} y={580} width={900} align="left" x={160} color={MUTED} weight={600} />
      <Growth at={19.2} until={25.7} />
      <Floor at={25.9} until={36.3} y={840} w={1200} />
      <Person kind="ulises" at={25.9} until={36.3} x={560} y={840} h={300} />
      <Stroke d="M960 500 C800 470 640 500 560 560" at={33.8} until={36.3} len={500} />
      <Stroke d="M960 500 C1120 470 1280 500 1360 560" at={33.8} until={36.3} len={500} />
      <Person kind="race" at={26.9} until={36.3} x={960} y={840} h={460} glow />
      <Person kind="sebas" at={26.1} until={36.3} x={1360} y={840} h={300} />
      <Label text="Race" at={27.0} until={36.3} x={960} y={870} color={INK} size={32} />
      <Words text="La primera oportunidad real de surgir." at={28.6} until={32.0} size={50} y={130} />
      <Words text="El mentor de ambos." at={33.7} until={36.3} size={58} y={130} font="body" weight={800} />

      {/* 03 · PRIMER CONTACTO 36.4–52.54 */}
      <Chapter n="03" name="El primer contacto" at={36.5} until={52.44} />
      <Words text="Llegaron colaboraciones con otras empresas." at={36.6} until={41.34} size={56} y={480} />
      <Words text="Crypto Depto" at={41.55} until={52.44} font="display" size={150} y={160} />
      <Floor at={43.24} until={52.44} y={800} w={600} />
      <Person kind="matias" at={43.44} until={52.44} x={960} y={800} h={360} />
      <Label text="Matías" at={43.84} until={52.44} x={960} y={830} color={INK} size={28} />
      <Words text="Tokenización de activos reales" at={45.94} until={52.44} size={44} y={890} color={SOFT} weight={700} />
      <Words text="El primer contacto." at={49.54} until={52.44} size={36} y={960} color={MUTED} weight={600} />

      {/* 04 · APRENDER 52.54–90.04 */}
      <Chapter n="04" name="Aprender en serio" at={52.64} until={89.94} />
      <Floor at={52.64} until={77.14} y={900} w={700} />
      <Person kind="ulises" at={52.74} until={77.14} x={480} y={900} h={520} />
      <Words text="Ulises se metió de lleno en la teoría." at={52.84} until={70.84} size={54} y={190} width={1000} align="left" x={820} />
      <Chip text="RWA" at={55.74} until={70.84} x={820} y={400} />
      <Chip text="DEX / CEX" at={58.64} until={70.84} x={1010} y={400} />
      <Chip text="Tokenomics" at={63.94} until={70.84} x={820} y={500} />
      <Chip text="Vesting" at={66.14} until={70.84} x={1140} y={500} />
      <Chip text="ICO" at={68.14} until={70.84} x={1380} y={500} accent />
      <Words text="Y en la práctica:" at={71.04} until={77.14} size={44} y={330} width={1000} align="left" x={820} color={MUTED} weight={600} />
      <Words text="codo a codo con desarrolladores blockchain." at={72.54} until={77.14} size={58} y={410} width={980} align="left" x={820} weight={800} />
      <Floor at={77.24} until={89.94} y={900} w={700} />
      <Person kind="sebas" at={77.34} until={89.94} x={1440} y={900} h={520} />
      <Words text="Sebastián dominó las integraciones y el desarrollo blockchain." at={77.44} until={89.94} size={52} y={190} width={1000} align="left" x={160} />
      <Chip text="Integraciones" at={79.24} until={89.94} x={160} y={460} />
      <Chip text="ERC-3643" at={84.84} until={89.94} x={160} y={560} accent />
      <Chip text="Polygon" at={87.94} until={89.94} x={470} y={560} />
      <Chip text="BNB Chain" at={89.04} until={89.94} x={760} y={560} />
      <Stroke d="M1240 650 L1150 650 L1110 690 L1040 690" at={79.74} until={89.94} len={400} />
      <Stroke d="M1240 720 L1150 720 L1110 760 L1040 760" at={80.54} until={89.94} len={420} />

      {/* 05 · VULCANO 90.04–107.24 */}
      <Chapter n="05" name="Vulcano" at={90.24} until={107.04} />
      <Words text="Vulcano" at={92.04} until={107.04} font="display" size={150} y={140} />
      <Floor at={92.24} until={107.04} y={860} w={900} />
      <Person kind="a" at={92.34} until={107.14} x={860} y={860} h={380} dx={[102.04, 104.84, -330]} />
      <Person kind="b" at={92.64} until={107.14} x={1060} y={860} h={380} dx={[102.04, 104.84, 330]} />
      <Label text="Dos amigos · tokenización y plataformas a medida" at={94.14} until={101.84} x={960} y={900} color={SOFT} size={20} />
      <Words text="Proyectos juntos." at={100.24} until={101.94} size={44} y={950} color={MUTED} weight={600} />
      <Words text="Caminos distintos." at={102.24} until={107.04} size={52} y={950} weight={700} />


      {/* 06 · ALGO PROPIO 107.51–124.91 */}
      <Chapter n="06" name="Algo propio" at={107.61} until={124.81} />
      <Horizon at={107.51} until={124.91} />
      <Floor at={107.61} until={124.81} y={900} w={800} />
      <Person kind="ulises" at={107.81} until={124.81} x={760} y={900} h={420} />
      <Person kind="sebas" at={108.01} until={124.81} x={1160} y={900} h={420} />
      <Words text="Y empezaron algo propio." at={110.81} until={117.51} size={72} y={170} weight={800} />
      <Words text="Construir el futuro junto a sus clientes." at={113.61} until={117.51} size={40} y={290} color={SOFT} weight={700} />
      <Words text="Valores accesibles. La puerta del mercado abierta a más gente." at={117.91} until={124.81} size={46} y={170} />
      <Words text="Y evolucionar todos los días." at={122.61} until={124.81} size={40} y={340} color={SOFT} weight={700} />

      {/* 07 · LA DECISIÓN 124.91–153.51 */}
      <Chapter n="07" name="La decisión" at={125.01} until={153.41} />
      <Words text="Blockenfy" at={127.93} until={140.00} font="display" size={140} y={200} />
      <Person kind="c" at={128.25} until={137.03} x={330} y={900} h={400} />
      <Label text="Blockenfy" at={128.73} until={137.03} x={330} y={930} color={SOFT} size={20} />
      <Words text="Mejoras en diseño y funciones." at={134.10} until={140.00} size={44} y={420} color={MUTED} weight={600} />
      <Stroke d="M760 700 C900 700 940 700 960 700 C1040 700 1100 620 1260 580" at={137.10} until={140.00} len={600} color={INK} />
      <Stroke d="M960 700 C1040 700 1100 780 1260 820" at={137.10} until={140.00} len={400} color={SOFT} />
      <Label text="Visiones distintas" at={137.30} until={140.00} x={960} y={880} color={INK} size={24} />
      <Words text="Ellos querían algo más." at={140.20} until={153.41} size={66} y={220} weight={800} />
      {[['Calidad visual', 142.30], ['Calidad funcional', 143.60], ['Tokenización abierta', 145.10]].map(([txt, at], i) => (
        <Pillar key={i} text={txt as string} at={at as number} until={153.41} x={420 + i * 540} accent={i === 2} />
      ))}
      <Words text="Para que el mercado crezca." at={147.00} until={149.40} size={40} y={880} color={SOFT} weight={700} />
      <Words text="En esa empresa no iban a conseguirlo." at={149.50} until={153.41} size={46} y={870} weight={800} />

      {/* 08 · KEY LAB 153.51–179.21 */}
      <Chapter n="08" name="Key Lab" at={153.61} until={179.11} />
      <Words text="Por eso hicieron evolucionar su empresa." at={153.61} until={157.71} size={56} y={480} />
      <BigLogo at={157.81} until={166.31} />
      {(['a', 'b', 'c', 'matias'] as Kind[]).map((k, i) => (
        <Person key={i} kind={k} at={158.91 + i * 0.25} until={179.11} x={230 + i * 215} y={900} h={230} />
      ))}
      
      {[['Diseño', 160.21], ['UX / UI', 161.41], ['Producto', 164.21], ['Blockchain', 165.91]].map(([txt, at], i) => (
        <Label key={i} text={txt as string} at={at as number} until={179.11} x={230 + i * 215} y={925} color={i === 3 ? SOFT : INK} size={20} />
      ))}
      <Words text="Una plataforma tokenizadora white label." at={166.51} until={179.11} size={54} y={200} weight={800} align="left" x={150} width={1000} />
      <Chip text="Calidad AAA" at={172.61} until={179.11} x={150} y={420} accent />
      <Chip text="Valor alcanzable" at={174.41} until={179.11} x={480} y={420} />
      <MarketplacePhone at={161.3} until={179.11} x={1480} y={540} switches={[166.5, 170.0, 173.2]} tapAt={175.0} />

      {/* 09 · HOY 179.21–189.91 */}
      <Chapter n="09" name="Hoy" at={179.31} until={189.81} />
      <Words text="Hoy" at={179.41} until={189.81} font="display" size={180} y={120} />
      <Network at={179.91} until={189.81} />
      <Words text="Alianzas con firmas legales y del sector." at={180.21} until={184.51} size={46} y={860} />
      <Words text="Negocios que crecen." at={184.61} until={188.21} size={46} y={860} />
      <Words text="Plataformas que de verdad valen la pena." at={188.31} until={189.81} size={46} y={860} weight={800} />

      {/* 10 · CIERRE 189.91–208 */}
      <Words text="Key Lab no es el primero." at={191.21} until={198.51} size={78} y={360} weight={800} />
      <Words text="Es el que se sentó a entender lo que el mercado necesita." at={193.91} until={198.51} size={44} y={500} color={SOFT} weight={700} />
      <Floor at={198.91} until={202.41} y={840} w={1500} />
      {(['ulises', 'a', 'race', 'b', 'c', 'matias', 'sebas'] as Kind[]).map((k, i) => (
        <Person key={i} kind={k} at={198.91 + i * 0.12} until={202.41} x={360 + i * 200} y={840} h={240} />
      ))}
      <Words text="Codo a codo con sus clientes." at={199.81} until={202.41} size={60} y={250} weight={800} />
      <Words text="Key Lab es el futuro." at={202.61} until={204.62} font="display" size={150} y={420} />
      <Outro at={204.62} />
    </AbsoluteFill>
  );
};

/* Columna con texto (pilares de la decisión) */
const Pillar: React.FC<{ text: string; at: number; until: number; x: number; accent?: boolean }> = ({ text, at, until, x, accent }) => {
  const t = useT();
  const p = interpolate(t, [at, at + 0.9], [0, 1], { ...clamp, easing: ease });
  const o = vis(t, at, until);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - 260, top: 420, width: 520, height: 380, opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
      <div style={{ width: 2, height: 260 * p, background: accent ? ACCENT : INK, boxShadow: accent ? `0 0 24px ${ACCENT}` : undefined }} />
      <div style={{ marginTop: 22, fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 3, color: accent ? SOFT : INK, textTransform: 'uppercase', opacity: p, whiteSpace: 'nowrap', textAlign: 'center' }}>{text}</div>
    </div>
  );
};

/* Logo grande con barrido */
const BigLogo: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  const p = interpolate(t, [at, at + 1.2], [0, 1], { ...clamp, easing: ease });
  const o = vis(t, at, until, 0.6);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 150, top: 250, opacity: o, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
      <Img src={staticFile('brand/wordmark-blanco.png')} style={{ width: 660, display: 'block' }} />
    </div>
  );
};

/* Red de nodos: Key Lab al centro conectada con aliados y clientes */
const Network: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const nodes = [[560, 560], [720, 420], [1200, 420], [1360, 560], [700, 720], [1220, 720], [960, 380]];
  const c = [960, 580];
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: o }}>
      {nodes.map(([x, y], i) => {
        const p = interpolate(t, [at + 0.3 + i * 0.5, at + 1.3 + i * 0.5], [0, 1], { ...clamp, easing: ease });
        return (
          <g key={i}>
            <line x1={c[0]} y1={c[1]} x2={c[0] + (x - c[0]) * p} y2={c[1] + (y - c[1]) * p} stroke="rgba(140,160,255,0.6)" strokeWidth={1.5} />
            <circle cx={x} cy={y} r={10 * p} fill={INK} />
          </g>
        );
      })}
      <circle cx={c[0]} cy={c[1]} r={interpolate(t, [at, at + 0.8], [0, 26], clamp)} fill={ACCENT} />
      <circle cx={c[0]} cy={c[1]} r={26 + ((t - at) * 30) % 60} fill="none" stroke={ACCENT} strokeWidth={2} opacity={1 - (((t - at) * 30) % 60) / 60} />
    </svg>
  );
};
