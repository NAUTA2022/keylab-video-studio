import React from 'react';
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import {
  PiAddressBook, PiArrowDown, PiBrain, PiBuildings, PiCalendarCheck, PiCertificate, PiChatCircleDots, PiCheckCircle, PiCode,
  PiCoins, PiCpu, PiCube, PiDeviceMobile, PiHouseLine, PiMapPin, PiMegaphone, PiPaintBrush, PiPenNib, PiTrendUp, PiUsersThree, PiWhatsappLogo,
} from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';

// Altius · VSL horizontal 1920x1080 · 30 fps. Estilo VSL: sujeto ↔ pantalla gráfica, subtítulos solo de frases clave,
// tarjetas karaoke, UI estilo Apple, íconos en cuadrados tipo iOS, transformaciones cara → tarjeta → portátil.
ensureFonts();
export const ALTIUS_DUR = 116.6;
const FPS = 30;
const M = 'media/altius/';
const W = 1920, H = 1080;
const NAVY = '#0A1020', PANEL = '#121A2E', IVORY = '#F4F1EB', INK = '#111318', WHITE = '#FFFFFF', GREY = '#8A93A6', LIGHTGREY = '#C9C5BD',
  GOLD = '#D2A85A', RED = '#E5484D', GREEN = '#2FBF71', BLUE = '#3B6BFF';
const F = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const inout = Easing.bezier(0.65, 0, 0.35, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.4) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const fadeOut = (t: number, b: number, d = 0.25) => interpolate(t, [b - d, b], [1, 0], clamp);
const vis = (t: number, a: number, b: number) => t >= a && t <= b;
// rebote 0 → 1.1 → 1 en 0,35 s
const pop = (t: number, a: number) => interpolate(t, [a, a + 0.22, a + 0.35], [0, 1.1, 1], { ...clamp, easing: Easing.out(Easing.quad) });
const spring = (t: number, a: number, d = 0.45) => {
  const x = Math.max(0, Math.min(1, (t - a) / d));
  return 1 - Math.exp(-6 * x) * Math.cos(x * 7.5) * (1 - x * 0.2);
};

/* ---------------- Sujeto: zoom por frase, deriva 100→103 %, transformación a tarjeta ---------------- */
const SHOTS: [number, number][] = [
  [0, 1.0], [7.9, 1.0], [12.4, 1.18], [17.0, 1.0], [23.5, 1.06], [26.9, 1.2], [34.5, 1.22], [37.3, 1.0], [40.0, 1.0], [55.6, 1.12],
  [61.5, 1.0], [63.5, 1.22], [72.0, 1.0], [80.6, 1.0], [85.0, 1.14], [92.9, 1.25], [97.3, 1.15], [100.6, 1.25], [103.4, 1.0], [108.0, 1.12], [110.0, 1.22], [113.0, 1.22],
];
const zoomAt = (t: number) => {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1][0] <= t) i++;
  const [s, z] = SHOTS[i];
  const prev = i ? SHOTS[i - 1][1] : z;
  const next = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : ALTIUS_DUR;
  const zz = interpolate(t, [s, s + 0.4], [prev, z], { ...clamp, easing: ease });
  const drift = 1 + 0.03 * Math.min(1, (t - s) / Math.max(0.5, next - s));
  return zz * drift;
};
type Rect = { x: number; y: number; w: number; h: number; r: number };
const FULL: Rect = { x: 0, y: 0, w: W, h: H, r: 0 };
const CARD_L: Rect = { x: 96, y: 170, w: 740, h: 740, r: 32 };
const CARD_C: Rect = { x: 560, y: 215, w: 800, h: 450, r: 32 };
const SCREEN: Rect = { x: 452, y: 170, w: 1016, h: 572, r: 14 };
const lerpR = (a: Rect, b: Rect, p: number): Rect => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p, r: a.r + (b.r - a.r) * p });
const subjRect = (t: number): Rect => {
  if (t < 40.0) return FULL;
  if (t < 51.9) return lerpR(FULL, CARD_L, spring(t, 40.0, 0.5));
  if (t < 52.3) return lerpR(CARD_L, FULL, interpolate(t, [51.9, 52.3], [0, 1], { ...clamp, easing: inout }));
  if (t < 56.5) return FULL;
  if (t < 56.9) return lerpR(FULL, CARD_C, interpolate(t, [56.5, 56.9], [0, 1], { ...clamp, easing: inout }));
  if (t < 57.4) return lerpR(CARD_C, SCREEN, interpolate(t, [56.9, 57.35], [0, 1], { ...clamp, easing: inout }));
  if (t < 61.2) return SCREEN;
  return lerpR(SCREEN, FULL, interpolate(t, [61.2, 61.6], [0, 1], { ...clamp, easing: inout }));
};
const SUBJ_HIDDEN: [number, number][] = [[0.45, 7.75], [29.95, 34.35], [52.45, 55.45], [66.55, 71.75], [75.35, 80.45], [88.95, 92.75], [94.25, 97.05], [113.6, 200]];
const Sujeto: React.FC = () => {
  const t = useT();
  if (SUBJ_HIDDEN.some(([a, b]) => t > a && t < b)) return null;
  const r = subjRect(t);
  const z = zoomAt(t);
  const inScreen = vis(t, 57.0, 61.3);
  return (
    <div style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.r, overflow: 'hidden', boxShadow: r.r > 1 ? '0 40px 120px rgba(0,0,0,0.55)' : undefined }}>
      <div style={{ position: 'absolute', left: (r.w - Math.max(r.w, (r.h * 16) / 9)) / 2, top: 0, width: Math.max(r.w, (r.h * 16) / 9), height: Math.max(r.h, (r.w * 9) / 16), transform: `scale(${z})`, transformOrigin: '46% 38%' }}>
        {vis(t, 57.75, 61.15) ? null : <OffthreadVideo src={staticFile(`${M}sujeto.mp4`)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      {inScreen ? <AbsoluteFill style={{ opacity: interpolate(t, [57.2, 57.6], [0, 1], clamp) }}><Webs t={t} a={57.4} /></AbsoluteFill> : null}
    </div>
  );
};

/* ---------------- Subtítulos de frase clave (palabra por palabra) ---------------- */
type Wd = { w: string; t: number; big?: boolean; c?: string };
const Caption: React.FC<{ a: number; b: number; lines: Wd[][]; y?: number; size?: number; dark?: boolean; x?: number; align?: 'left' | 'center' }> = ({ a, b, lines, y = 800, size = 92, dark, x = 0, align = 'center' }) => {
  const t = useT();
  if (!vis(t, a - 0.05, b)) return null;
  const o = fadeOut(t, b, 0.2);
  return (
    <div style={{ position: 'absolute', left: x, width: align === 'left' ? 900 : W, top: y, textAlign: align, opacity: o }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ lineHeight: 1.02, marginTop: i ? 4 : 0 }}>
          {ln.map((w, k) => {
            const p = interpolate(t, [w.t, w.t + 0.15], [0, 1], clamp);
            return (
              <span key={k} style={{
                display: 'inline-block', margin: align === 'left' ? '0 0.36em 0 0' : '0 0.18em', fontFamily: F, fontWeight: w.big ? 900 : 600, fontSize: w.big ? size : size * 0.5,
                letterSpacing: w.big ? -1 : 0, textTransform: w.big ? 'uppercase' : 'none', color: w.c ?? (dark ? INK : WHITE),
                opacity: p, filter: `blur(${(1 - p) * 8}px)`, transform: `translateY(${(1 - p) * 8}px)`,
                textShadow: dark ? undefined : '0 4px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)', verticalAlign: 'baseline',
              }}>{w.w}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ---------------- Panel a pantalla completa con entrada/salida transformada ---------------- */
const Panel: React.FC<{ a: number; b: number; bg?: string; light?: boolean; children: React.ReactNode }> = ({ a, b, bg, light, children }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const pi = spring(t, a, 0.45), po = interpolate(t, [b - 0.35, b], [0, 1], { ...clamp, easing: inout });
  const s = (0.9 + 0.1 * pi) * (1 - 0.06 * po);
  const back = bg ?? (light ? `radial-gradient(ellipse at 50% 35%, #FFFFFF 0%, ${IVORY} 55%, #E9E4DA 100%)` : `radial-gradient(ellipse at 50% 30%, #18213A 0%, ${NAVY} 70%)`);
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, (t - a) / 0.2) * (1 - po), transform: `scale(${s})`, borderRadius: (1 - pi) * 60 + po * 60, overflow: 'hidden', filter: `blur(${po * 10}px)` }}>
      <AbsoluteFill style={{ background: back }} />
      {children}
    </AbsoluteFill>
  );
};

/* ---------------- Tarjeta karaoke (fondo claro, palabra gris → negro) ---------------- */
const Karaoke: React.FC<{ words: Wd[]; y?: number; size?: number; maxW?: number }> = ({ words, y = 360, size = 104, maxW = 1500 }) => {
  const t = useT();
  return (
    <div style={{ position: 'absolute', left: (W - maxW) / 2, width: maxW, top: y, textAlign: 'center', fontFamily: F, fontWeight: 800, fontSize: size, lineHeight: 1.12, letterSpacing: -1.5 }}>
      {words.map((w, i) => {
        const on = interpolate(t, [w.t - 0.03, w.t + 0.12], [0, 1], clamp);
        return <span key={i} style={{ display: 'inline-block', margin: '0 0.14em', color: on > 0.5 ? (w.c ?? INK) : LIGHTGREY, textTransform: w.big ? 'uppercase' : 'none', transform: `translateY(${(1 - on) * 4}px)` }}>{w.w}</span>;
      })}
    </div>
  );
};

/* ---------------- Ícono tipo app iOS ---------------- */
const AppIcon: React.FC<{ I: React.ComponentType<{ size?: number; color?: string }>; size?: number; bg?: string; color?: string }> = ({ I, size = 120, bg = '#1B2438', color = WHITE }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.26, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 18px 40px rgba(0,0,0,0.35)' }}>
    <I size={size * 0.52} color={color} />
  </div>
);

/* ---------------- Tarjeta lateral (historia personal) con rebote, flote y cambio de texto ---------------- */
type Face = { t: number; I: React.ComponentType<{ size?: number; color?: string }>; top: string; big: string; c?: string };
const SideCard: React.FC<{ x: number; y: number; faces: Face[]; out: number; rot?: number }> = ({ x, y, faces, out, rot = -6 }) => {
  const t = useT();
  const a = faces[0].t;
  if (!vis(t, a, out + 0.3)) return null;
  let fi = 0;
  faces.forEach((f, i) => { if (t >= f.t) fi = i; });
  const f = faces[fi];
  const flip = fi > 0 ? interpolate(t, [f.t, f.t + 0.3], [90, 0], { ...clamp, easing: ease }) : 0;
  const s = pop(t, a) * interpolate(t, [out, out + 0.25], [1, 0.9], clamp);
  const o = interpolate(t, [out, out + 0.25], [1, 0], clamp);
  const r = interpolate(t, [a, a + 0.35], [rot, 0], { ...clamp, easing: ease });
  const fl = Math.sin((t - a) * 2.2 + x) * 4;
  return (
    <div style={{ position: 'absolute', left: x, top: y + fl, width: 330, opacity: o, transform: `scale(${s}) rotate(${r}deg) perspective(900px) rotateY(${flip}deg)`, transformOrigin: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: 30, padding: '30px 30px 32px', boxShadow: '0 30px 80px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <AppIcon I={f.I} size={92} bg={f.c ?? NAVY} />
        <div style={{ fontFamily: F, fontWeight: 600, fontSize: 26, color: GREY }}>{f.top}</div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 46, color: INK, lineHeight: 1.0, letterSpacing: -0.5 }}>{f.big}</div>
      </div>
    </div>
  );
};

/* ---------------- Edificio isométrico que se construye piso por piso ---------------- */
const Edificio: React.FC<{ t: number; floors: number[]; wire: number; cx?: number; base?: number; s?: number }> = ({ t, floors, wire, cx = 960, base = 860, s = 1 }) => {
  const fw = 260 * s, fd = 200 * s, fh = 58 * s;
  const iso = (x: number, y: number, z: number) => [cx + (x - y) * 0.87, base - z - (x + y) * 0.5] as const;
  const poly = (pts: (readonly [number, number])[]) => pts.map((p) => p.join(',')).join(' ');
  const N = 9;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
      {Array.from({ length: N }).map((_, i) => {
        const z0 = i * fh, z1 = z0 + fh * 0.94;
        const wireP = interpolate(t, [wire + i * 0.08, wire + i * 0.08 + 0.25], [0, 1], clamp);
        const solid = floors[i] !== undefined ? interpolate(t, [floors[i], floors[i] + 0.25], [0, 1], { ...clamp, easing: ease }) : 0;
        if (wireP <= 0) return null;
        const lift = (1 - solid) * 0;
        const top = [iso(0, 0, z1 + lift), iso(fw, 0, z1 + lift), iso(fw, fd, z1 + lift), iso(0, fd, z1 + lift)];
        const left = [iso(0, fd, z0), iso(fw, fd, z0), iso(fw, fd, z1), iso(0, fd, z1)];
        const right = [iso(fw, 0, z0), iso(fw, fd, z0), iso(fw, fd, z1), iso(fw, 0, z1)];
        return (
          <g key={i} opacity={wireP}>
            <polygon points={poly(left)} fill={`rgba(210,168,90,${0.06 + solid * 0.84})`} stroke={GOLD} strokeWidth={2} strokeDasharray={solid > 0.5 ? undefined : '8 6'} />
            <polygon points={poly(right)} fill={`rgba(150,118,62,${0.04 + solid * 0.86})`} stroke={GOLD} strokeWidth={2} strokeDasharray={solid > 0.5 ? undefined : '8 6'} />
            <polygon points={poly(top)} fill={`rgba(255,236,196,${0.03 + solid * 0.6})`} stroke={GOLD} strokeWidth={2} />
            {solid > 0.6 ? Array.from({ length: 5 }).map((__, k) => {
              const x0 = fw * (0.08 + k * 0.185), x1 = x0 + fw * 0.12;
              const w0 = fd * (0.1 + k * 0.17), w1 = w0 + fd * 0.11;
              return <g key={k}>
                <polygon points={poly([iso(x0, fd, z0 + fh * 0.22), iso(x1, fd, z0 + fh * 0.22), iso(x1, fd, z0 + fh * 0.72), iso(x0, fd, z0 + fh * 0.72)])} fill="rgba(255,250,236,0.9)" />
                {k < 5 ? <polygon points={poly([iso(fw, w0, z0 + fh * 0.22), iso(fw, w1, z0 + fh * 0.22), iso(fw, w1, z0 + fh * 0.72), iso(fw, w0, z0 + fh * 0.72)])} fill="rgba(255,240,205,0.55)" /> : null}
              </g>;
            }) : null}
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------- Webs de ejemplo (marcas ficticias) ---------------- */
const Browser: React.FC<{ children: React.ReactNode; url: string }> = ({ children, url }) => (
  <div style={{ position: 'absolute', inset: 0, background: WHITE, display: 'flex', flexDirection: 'column' }}>
    <div style={{ height: 34, background: '#ECEAE6', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px' }}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />)}
      <div style={{ marginLeft: 16, flex: 1, height: 20, borderRadius: 6, background: WHITE, fontFamily: F, fontSize: 12, color: GREY, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>{url}</div>
    </div>
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
  </div>
);
const WebInmo: React.FC<{ brand?: string }> = ({ brand = 'AURUM RESIDENCES' }) => (
  <Browser url="aurumresidences.ae">
    <div style={{ position: 'absolute', inset: 0, background: '#F7F5F1' }}>
      <div style={{ height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px', fontFamily: F }}>
        <div style={{ fontWeight: 900, letterSpacing: 4, fontSize: 18, color: INK }}>{brand}</div>
        <div style={{ display: 'flex', gap: 22, fontSize: 13, color: GREY, fontWeight: 600 }}><span>Units</span><span>Location</span><span>Invest</span><span style={{ color: WHITE, background: INK, padding: '6px 14px', borderRadius: 18 }}>Book a visit</span></div>
      </div>
      <div style={{ margin: '6px 34px', height: 210, borderRadius: 22, background: 'linear-gradient(180deg,#C9D8EA 0%,#F2E3CC 100%)', position: 'relative', overflow: 'hidden' }}>
        {[[120, 46], [200, 60], [150, 40], [262, 70], [176, 52], [110, 44]].map(([h, w], i) => <div key={i} style={{ position: 'absolute', bottom: 0, left: 360 + [0, 54, 122, 170, 248, 308][i], width: w, height: h, background: i === 3 ? '#1E2A44' : '#3A4A6A', borderRadius: '4px 4px 0 0', backgroundImage: 'radial-gradient(circle, rgba(255,236,190,0.75) 1.6px, transparent 1.8px)', backgroundSize: '12px 16px' }} />)}
        <div style={{ position: 'absolute', left: 30, top: 44, fontFamily: F, fontWeight: 900, fontSize: 38, color: INK, lineHeight: 1.05 }}>Live above<br />the skyline.</div>
        <div style={{ position: 'absolute', left: 30, top: 140, fontFamily: F, fontSize: 15, color: '#4A5266' }}>Dubai Marina · Handover 2027</div>
      </div>
      <div style={{ display: 'flex', gap: 16, margin: '16px 34px' }}>
        {[['1 BR', '1,450,000'], ['2 BR', '2,180,000'], ['Penthouse', '6,900,000']].map(([u, p]) => (
          <div key={u} style={{ flex: 1, background: WHITE, borderRadius: 18, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.06)', fontFamily: F }}>
            <div style={{ height: 70, borderRadius: 12, background: '#E8EDF4', marginBottom: 10 }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: INK }}>{u}</div>
            <div style={{ fontSize: 13, color: GREY }}>AED {p}</div>
          </div>
        ))}
      </div>
    </div>
  </Browser>
);
const WebMarca: React.FC = () => (
  <Browser url="noor.studio">
    <div style={{ position: 'absolute', inset: 0, background: '#111318', fontFamily: F }}>
      <div style={{ position: 'absolute', left: 40, top: 40, fontWeight: 900, fontSize: 20, color: WHITE, letterSpacing: 6 }}>NOOR</div>
      <div style={{ position: 'absolute', left: 40, top: 120, fontWeight: 900, fontSize: 64, color: WHITE, lineHeight: 0.98, letterSpacing: -2 }}>Light, made<br />for living.</div>
      <div style={{ position: 'absolute', left: 40, top: 290, fontSize: 16, color: '#A7AEBF', width: 380 }}>A brand system crafted for a new hospitality group in Doha.</div>
      <div style={{ position: 'absolute', right: 40, top: 90, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {['#E8C27A', '#F4F1EB', '#3B6BFF', '#2A3044'].map((c) => <div key={c} style={{ width: 150, height: 150, borderRadius: 26, background: c }} />)}
      </div>
    </div>
  </Browser>
);
const WebIA: React.FC = () => (
  <Browser url="app.aurumresidences.ae/agent">
    <div style={{ position: 'absolute', inset: 0, background: '#F6F7F9', fontFamily: F, display: 'flex' }}>
      <div style={{ width: 210, background: WHITE, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, color: GREY, fontWeight: 600 }}>
        <div style={{ fontWeight: 900, color: INK, letterSpacing: 2 }}>AURUM · CRM</div>
        {['Leads', 'Units', 'AI agent', 'Reports'].map((x, i) => <div key={x} style={{ padding: '8px 10px', borderRadius: 10, background: i === 2 ? '#EEF2FF' : undefined, color: i === 2 ? BLUE : GREY }}>{x}</div>)}
      </div>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ alignSelf: 'flex-start', background: WHITE, borderRadius: 18, padding: '12px 16px', fontSize: 15, color: INK, boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>Hi! Is the 2 BR with sea view still available?</div>
        <div style={{ alignSelf: 'flex-end', background: '#25D366', borderRadius: 18, padding: '12px 16px', fontSize: 15, color: WHITE }}>Yes! Unit 12B, 1,180 sq ft. Want to see it in 3D?</div>
        <div style={{ alignSelf: 'flex-start', background: WHITE, borderRadius: 18, padding: '12px 16px', fontSize: 15, color: INK }}>Please 🙌</div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
          {[['New leads', '128'], ['Answered', '24/7'], ['Visits booked', '31']].map(([a, b]) => <div key={a} style={{ flex: 1, background: WHITE, borderRadius: 14, padding: 14 }}><div style={{ fontSize: 12, color: GREY }}>{a}</div><div style={{ fontSize: 26, fontWeight: 900, color: INK }}>{b}</div></div>)}
        </div>
      </div>
    </div>
  </Browser>
);
const Webs: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const list = [<WebInmo key="i" />, <WebMarca key="m" />, <WebIA key="a" />];
  return (
    <AbsoluteFill>
      {list.map((el, i) => {
        const s = a + i * 1.5;
        const o = i === 0 ? 1 : interpolate(t, [s - 0.25, s + 0.1], [0, 1], clamp);
        return <AbsoluteFill key={i} style={{ opacity: o }}>{el}</AbsoluteFill>;
      })}
    </AbsoluteFill>
  );
};

/* ---------------- Cursor ---------------- */
const Cursor: React.FC<{ path: [number, number, number][]; clicks: number[] }> = ({ path, clicks }) => {
  const t = useT();
  if (t < path[0][0] || t > path[path.length - 1][0] + 0.6) return null;
  const x = interpolate(t, path.map((p) => p[0]), path.map((p) => p[1]), { ...clamp, easing: inout });
  const y = interpolate(t, path.map((p) => p[0]), path.map((p) => p[2]), { ...clamp, easing: inout });
  const c = clicks.reduce((m, k) => Math.max(m, interpolate(t, [k, k + 0.08, k + 0.2], [0, 1, 0], clamp)), 0);
  return (
    <svg width={60} height={60} style={{ position: 'absolute', left: x - 8, top: y - 4, transform: `scale(${1 - c * 0.15})`, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))' }}>
      <path d="M8 4 L8 44 L19 33 L27 51 L34 48 L26 30 L42 30 Z" fill={WHITE} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  );
};

/* ================= ESCENAS ================= */

// 0 · GANCHO karaoke
const S_Gancho: React.FC = () => (
  <Panel a={0} b={4.2} light>
    <Karaoke y={330} size={112} maxW={1560} words={[
      { w: 'What', t: 0.0 }, { w: 'if', t: 0.44 }, { w: 'your', t: 0.84 }, { w: 'buyers', t: 1.14 }, { w: 'could', t: 1.62 },
      { w: 'WALK', t: 2.32, big: true, c: GOLD }, { w: 'THROUGH', t: 2.68, big: true, c: GOLD }, { w: 'your', t: 3.22 }, { w: 'building', t: 3.7 },
    ]} />
  </Panel>
);
// 1 · edificio que se construye piso por piso
const S_Edificio: React.FC = () => {
  const t = useT();
  return (
    <Panel a={4.1} b={7.95}>
      <Edificio t={t} wire={4.2} floors={[6.3, 6.42, 6.84, 6.96, 7.2, 7.32, 7.44, 7.56, 7.68]} cx={1290} base={990} s={1} />
      <Caption a={4.2} b={7.95} y={380} x={150} align="left" size={104} lines={[[{ w: 'before it', t: 4.18 }], [{ w: 'EVEN EXISTS', t: 5.14, big: true }], [{ w: 'FLOOR', t: 6.3, big: true, c: GOLD }, { w: 'by', t: 6.84 }, { w: 'FLOOR', t: 7.2, big: true, c: GOLD }]]} />
    </Panel>
  );
};
// 2 · teléfono + ciudades
const PhoneCard: React.FC = () => {
  const t = useT();
  const a = 8.3;
  if (!vis(t, a, 12.1)) return null;
  const s = pop(t, a) * interpolate(t, [11.85, 12.1], [1, 0.9], clamp);
  const o = interpolate(t, [11.85, 12.1], [1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: 120, top: 190 + Math.sin(t * 2.2) * 4, width: 300, height: 600, borderRadius: 52, background: '#0E0F12', padding: 14, boxShadow: '0 40px 100px rgba(0,0,0,0.5)', transform: `scale(${s}) rotate(${interpolate(t, [a, a + 0.35], [-6, 0], clamp)}deg)`, opacity: o }}>
      <div style={{ position: 'absolute', inset: 14, borderRadius: 40, overflow: 'hidden', background: `radial-gradient(ellipse at 50% 30%, #1E2946 0%, ${NAVY} 80%)` }}>
        <div style={{ position: 'absolute', left: -826, top: -300, transform: 'scale(0.36)', transformOrigin: '960px 540px', width: W, height: H }}>
          <Edificio t={t + 10} wire={0} floors={[0, 0, 0, 0, 0, 0, 0, 0, 0]} base={980} s={1.0} />
        </div>
        <div style={{ position: 'absolute', bottom: 22, left: 18, right: 18, background: 'rgba(255,255,255,0.95)', borderRadius: 18, padding: '12px 14px', fontFamily: F }}>
          <div style={{ fontSize: 13, color: GREY, fontWeight: 600 }}>Floor 12 · Unit B</div>
          <div style={{ fontSize: 20, color: INK, fontWeight: 900 }}>3D tour</div>
        </div>
      </div>
    </div>
  );
};
// 3 · AUTORIDAD: nombre
const NameCard: React.FC = () => {
  const t = useT();
  if (!vis(t, 13.9, 16.9)) return null;
  const p = pin(t, 13.95, 0.45), q = pin(t, 15.3, 0.4), o = fadeOut(t, 16.9, 0.3);
  return (
    <div style={{ position: 'absolute', left: 1210, top: 470, opacity: o, fontFamily: F }}>
      <div style={{ width: 6, height: 150 * p, background: GOLD, position: 'absolute', left: 0, top: 0, borderRadius: 3 }} />
      <div style={{ marginLeft: 30, overflow: 'hidden' }}>
        <div style={{ fontWeight: 900, fontSize: 74, color: WHITE, letterSpacing: -1, transform: `translateY(${(1 - p) * 100}%)`, textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>DIANA RONDÓN</div>
      </div>
      <div style={{ marginLeft: 30, marginTop: 6, opacity: q, transform: `translateY(${(1 - q) * 10}px)`, fontWeight: 600, fontSize: 34, color: WHITE, textShadow: '0 4px 18px rgba(0,0,0,0.5)' }}>Co-founder · <span style={{ fontWeight: 900, color: GOLD, letterSpacing: 3 }}>ALTIUS</span></div>
    </div>
  );
};
// 4 · DOLOR: dos opciones
const S_Dolor: React.FC = () => {
  const t = useT();
  const count = Math.round(interpolate(t, [30.55, 31.4], [0, 85000], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const broken = interpolate(t, [33.1, 33.6], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const dimL = interpolate(t, [31.9, 32.3], [1, 0.45], clamp);
  return (
    <Panel a={29.6} b={34.6}>
      <div style={{ position: 'absolute', left: 0, top: 80, width: W, textAlign: 'center', fontFamily: F, fontWeight: 600, fontSize: 40, color: GREY }}>Two options</div>
      {/* opción 1 */}
      <div style={{ position: 'absolute', left: 190, top: 210, width: 700, height: 640, borderRadius: 32, background: WHITE, padding: 44, boxShadow: '0 40px 120px rgba(0,0,0,0.45)', transform: `scale(${pop(t, 29.75)})`, opacity: dimL, fontFamily: F }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 30, color: INK }}>Local agency</div>
          <div style={{ fontSize: 20, color: GREY, fontWeight: 600 }}>Invoice #0457</div>
        </div>
        {[['Discovery', 30.2], ['Design', 30.4], ['Development', 30.6], ['Project management', 30.8]].map(([l, a], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, opacity: pin(t, a as number, 0.3), fontSize: 24, color: '#4A5266' }}>
            <span>{l}</span><span style={{ width: 120, height: 14, borderRadius: 7, background: '#E7E9EE', marginTop: 8 }} />
          </div>
        ))}
        <div style={{ position: 'absolute', left: 44, right: 44, bottom: 44, borderTop: '2px solid #EEE', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 24, color: GREY, fontWeight: 600 }}>Total</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <PiTrendUp size={54} color={RED} style={{ opacity: pin(t, 30.9, 0.3) }} />
            <div style={{ fontWeight: 900, fontSize: 76, color: RED, letterSpacing: -2 }}>${count.toLocaleString('en-US')}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 44, top: -30, background: RED, color: WHITE, borderRadius: 20, padding: '8px 20px', fontWeight: 900, fontSize: 26, transform: `scale(${pop(t, 30.6)})` }}>SKY-HIGH PRICES</div>
      </div>
      {/* opción 2 */}
      <div style={{ position: 'absolute', left: 1030, top: 210, width: 700, height: 640, transform: `scale(${pop(t, 31.9)})`, fontFamily: F }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 32, background: '#F2F2F2', overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.45)' }}>
          <div style={{ height: 50, background: '#DADADA', display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: 18, color: '#777', fontFamily: 'serif' }}>My Website — Template 03</div>
          {[[40, 90, 600, 70, '#C8C8C8', -9], [40, 190, 300, 200, '#D9D9D9', 14], [360, 190, 300, 200, '#D0D0D0', -18], [40, 420, 620, 40, '#CFCFCF', 7], [40, 480, 420, 40, '#D6D6D6', -11], [40, 540, 250, 50, '#3B82F6', 22]].map(([x, y, w, h, c, r], i) => (
            <div key={i} style={{ position: 'absolute', left: (x as number) + broken * (i % 2 ? 30 : -24), top: (y as number) + broken * (40 + i * 26), width: w as number, height: h as number, background: c as string, borderRadius: 4, transform: `rotate(${broken * (r as number)}deg)` }} />
          ))}
          <div style={{ position: 'absolute', left: 60, top: 110 + broken * 30, fontSize: 30, color: '#555', fontFamily: 'Times New Roman, serif', transform: `rotate(${broken * -6}deg)` }}>Welcome to our website!!</div>
        </div>
        <div style={{ position: 'absolute', right: 44, top: -30, background: WHITE, color: INK, borderRadius: 20, padding: '8px 20px', fontWeight: 900, fontSize: 26, transform: `scale(${pop(t, 33.1)})` }}>CHEAP THAT LOOKS CHEAP</div>
      </div>
    </Panel>
  );
};
// 5 · AGENCIA: una sola cuadrícula de servicios junto al sujeto en tarjeta
const SERVICES: { I: React.ComponentType<{ size?: number; color?: string }>; l: string; t: number; c: string }[] = [
  { I: PiPenNib, l: 'Product design', t: 41.92, c: '#1F2A44' },
  { I: PiPaintBrush, l: 'Branding', t: 42.82, c: '#2B2240' },
  { I: PiMegaphone, l: 'Marketing', t: 43.5, c: '#3A2330' },
  { I: PiCode, l: 'Custom platforms', t: 44.74, c: '#16313A' },
  { I: PiHouseLine, l: 'Built in-house', t: 47.16, c: '#2E2A1C' },
  { I: PiBrain, l: 'Artificial intelligence', t: 48.48, c: '#1C2C4A' },
  { I: PiCoins, l: 'Tokenization', t: 51.26, c: '#3A2E14' },
];
const AgenciaBg: React.FC = () => {
  const t = useT();
  if (!vis(t, 39.9, 52.4)) return null;
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse at 70% 40%, #18213A 0%, ${NAVY} 75%)`, opacity: pin(t, 40.0, 0.4) * fadeOut(t, 52.4, 0.4) }} />;
};
const S_Agencia: React.FC = () => {
  const t = useT();
  if (!vis(t, 39.9, 52.2)) return null;
  const o = fadeOut(t, 52.1, 0.3);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: 'absolute', left: 920, top: 150, fontFamily: F, opacity: pin(t, 40.4, 0.4) }}>
        <div style={{ fontWeight: 600, fontSize: 34, color: GREY }}>We do it all with</div>
        <div style={{ fontWeight: 900, fontSize: 92, color: WHITE, letterSpacing: -2, lineHeight: 1 }}>ONE TEAM</div>
      </div>
      <div style={{ position: 'absolute', left: 900, top: 380, display: 'grid', gridTemplateColumns: 'repeat(4, 235px)', columnGap: 10, rowGap: 44 }}>
        {SERVICES.map((s, i) => {
          const p = pop(t, s.t);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transform: `scale(${p})`, opacity: Math.min(1, p * 2) }}>
              <AppIcon I={s.I} size={156} bg={s.c} color={i === 6 ? GOLD : WHITE} />
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: 27, color: WHITE, textAlign: 'center' }}>{s.l}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
// 6 · Latinoamérica → Doha / Dubái
const S_Equipo: React.FC = () => {
  const t = useT();
  const p = interpolate(t, [53.6, 54.8], [0, 1], { ...clamp, easing: inout });
  const A = [520, 700], B = [1420, 420];
  const ctrl = [970, 180];
  const q = (u: number) => [(1 - u) ** 2 * A[0] + 2 * (1 - u) * u * ctrl[0] + u * u * B[0], (1 - u) ** 2 * A[1] + 2 * (1 - u) * u * ctrl[1] + u * u * B[1]];
  const pts = Array.from({ length: 40 }, (_, i) => q((i / 39) * p));
  const sig = q(((t * 0.55) % 1) * p);
  return (
    <Panel a={52.1} b={55.75}>
      {/* rejilla de puntos */}
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        {Array.from({ length: 24 * 13 }).map((_, i) => <circle key={i} cx={80 + (i % 24) * 76} cy={80 + Math.floor(i / 24) * 76} r={2} fill="rgba(255,255,255,0.08)" />)}
        <polyline points={pts.map((x) => x.join(',')).join(' ')} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" />
        {p > 0.9 ? <rect x={sig[0] - 7} y={sig[1] - 7} width={14} height={14} fill={GOLD} /> : null}
        {[A, B].map((c, i) => <g key={i} opacity={i ? pin(t, 54.6, 0.3) : pin(t, 52.4, 0.3)}><circle cx={c[0]} cy={c[1]} r={34} fill="rgba(210,168,90,0.18)" /><circle cx={c[0]} cy={c[1]} r={14} fill={GOLD} /></g>)}
      </svg>
      <div style={{ position: 'absolute', left: 300, top: 760, fontFamily: F, opacity: pin(t, 53.74, 0.35) }}>
        <div style={{ fontWeight: 600, fontSize: 30, color: GREY }}>Production team</div>
        <div style={{ fontWeight: 900, fontSize: 64, color: WHITE, letterSpacing: -1 }}>LATIN AMERICA</div>
      </div>
      <div style={{ position: 'absolute', left: 1260, top: 230, fontFamily: F, opacity: pin(t, 54.6, 0.35), textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: 30, color: GREY }}>Clients in</div>
        <div style={{ fontWeight: 900, fontSize: 64, color: WHITE, letterSpacing: -1 }}>DOHA · DUBAI</div>
      </div>
      <div style={{ position: 'absolute', left: 820, top: 520, background: WHITE, borderRadius: 24, padding: '16px 26px', display: 'flex', alignItems: 'center', gap: 16, transform: `scale(${pop(t, 55.6 - 0.2)})`, fontFamily: F }}>
        <AppIcon I={PiUsersThree} size={64} bg={NAVY} color={GOLD} />
        <div style={{ fontWeight: 900, fontSize: 36, color: INK }}>Senior talent</div>
      </div>
    </Panel>
  );
};
// 7 · AUTORIDAD: portátil con webs + frase
const Laptop: React.FC = () => {
  const t = useT();
  if (!vis(t, 56.85, 61.6)) return null;
  const p = pin(t, 56.9, 0.45), o = fadeOut(t, 61.55, 0.4);
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, #1B2440 0%, ${NAVY} 75%)`, opacity: p * o }} />
      <div style={{ position: 'absolute', left: SCREEN.x - 26, top: SCREEN.y - 26, width: SCREEN.w + 52, height: SCREEN.h + 52, borderRadius: 34, background: '#1A1C22', opacity: p * o, boxShadow: '0 50px 140px rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'absolute', left: SCREEN.x - 150, top: SCREEN.y + SCREEN.h + 26, width: SCREEN.w + 300, height: 34, borderRadius: '0 0 30px 30px', background: 'linear-gradient(180deg,#C8CBD2,#8E929B)', opacity: p * o }} />
    </>
  );
};
// 8 · PRODUCTO real estate
const S_Plataforma: React.FC = () => {
  const t = useT();
  const z = interpolate(t, [66.2, 71.9], [1, 1.1], clamp);
  const mods: [string, React.ComponentType<{ size?: number; color?: string }>, number][] = [['CRM', PiAddressBook, 70.02], ['AI agent', PiChatCircleDots, 70.3], ['3D', PiCube, 70.96]];
  return (
    <Panel a={66.2} b={71.95}>
      <div style={{ position: 'absolute', left: 0, top: 70, width: W, textAlign: 'center', fontFamily: F }}>
        <span style={{ fontWeight: 600, fontSize: 44, color: GREY }}>your </span>
        <span style={{ fontWeight: 900, fontSize: 80, color: WHITE, letterSpacing: -1 }}>SALES PLATFORM</span>
      </div>
      <div style={{ position: 'absolute', left: 300, top: 200, width: 1320, height: 740, transform: `scale(${z})`, transformOrigin: '50% 40%', borderRadius: 28, overflow: 'hidden', boxShadow: '0 50px 140px rgba(0,0,0,0.55)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1016, height: 572, transform: 'scale(1.299)', transformOrigin: '0 0' }}>
          <WebInmo brand={t > 69.12 ? 'YOUR BRAND' : 'AURUM RESIDENCES'} />
        </div>
        {/* marca: resalte */}
        <div style={{ position: 'absolute', left: 30, top: 50, width: 330, height: 66, borderRadius: 16, border: `4px solid ${GOLD}`, opacity: interpolate(t, [69.1, 69.3, 70.2, 70.5], [0, 1, 1, 0], clamp) }} />
        {/* módulos */}
        <div style={{ position: 'absolute', right: 30, top: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mods.map(([l, I, a], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: WHITE, borderRadius: 22, padding: '12px 20px 12px 12px', boxShadow: '0 20px 40px rgba(0,0,0,0.18)', transform: `scale(${pop(t, a)})`, fontFamily: F }}>
              <AppIcon I={I} size={62} bg={NAVY} color={GOLD} />
              <div style={{ fontWeight: 900, fontSize: 28, color: INK }}>{l}</div>
              <PiCheckCircle size={30} color={GREEN} />
            </div>
          ))}
        </div>
      </div>
      <Cursor path={[[66.6, 1500, 900], [69.0, 470, 290], [69.9, 1500, 520], [70.8, 1500, 690], [71.5, 1300, 760]]} clicks={[69.12, 70.02, 70.96]} />
    </Panel>
  );
};
// 9 · título tokenización + edificio que se divide en tokens
const S_Token: React.FC = () => {
  const t = useT();
  const split = interpolate(t, [77.6, 78.4], [0, 1], { ...clamp, easing: ease });
  const tok = interpolate(t, [79.6, 80.1], [0, 1], clamp);
  const cols = 6, rows = 7, cw = 96, ch = 74;
  return (
    <>
      <Panel a={75.0} b={76.6}>
        <div style={{ position: 'absolute', left: 0, top: 360, width: W, textAlign: 'center', fontFamily: F }}>
          <div style={{ fontWeight: 600, fontSize: 44, color: GREY, opacity: pin(t, 75.0, 0.3) }}>One step further</div>
          <div style={{ fontWeight: 900, fontSize: 120, color: WHITE, letterSpacing: -3, lineHeight: 1.02, transform: `scale(${interpolate(t, [75.0, 75.4], [1.12, 1], { ...clamp, easing: ease })})` }}>REAL-WORLD ASSET<br /><span style={{ color: GOLD }}>TOKENIZATION</span></div>
        </div>
      </Panel>
      <Panel a={76.5} b={80.55}>
        <div style={{ position: 'absolute', left: 0, top: 90, width: W, textAlign: 'center', fontFamily: F }}>
          <span style={{ fontWeight: 600, fontSize: 44, color: GREY }}>split a property into </span>
          <span style={{ fontWeight: 900, fontSize: 84, color: GOLD }}>TOKENS</span>
        </div>
        {Array.from({ length: cols * rows }).map((_, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          const x0 = 960 - (cols * cw) / 2 + c * cw, y0 = 250 + r * ch;
          const gx = (c - (cols - 1) / 2) * 30 * split, gy = (r - (rows - 1) / 2) * 12 * split;
          const fl = Math.sin(t * 2 + i) * 6 * split;
          const delay = (i % 7) * 0.04;
          const tk = interpolate(t, [79.6 + delay, 79.9 + delay], [0, 1], clamp);
          return (
            <div key={i} style={{ position: 'absolute', left: x0 + gx, top: y0 + gy + fl, width: cw - 4 - split * 8, height: ch - 4 - split * 8, borderRadius: 4 + tk * 30, background: tk > 0.5 ? GOLD : r === 0 ? '#2A3656' : '#22304F', border: `2px solid ${tk > 0.5 ? '#F2D59A' : 'rgba(210,168,90,0.5)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotateY(${tk * 180}deg)` }}>
              {tk > 0.5 ? <PiCoins size={38} color={NAVY} style={{ transform: 'rotateY(180deg)' }} /> : <div style={{ width: 18, height: 22, background: 'rgba(255,240,210,0.7)', borderRadius: 2 }} />}
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 0, top: 900, width: W, textAlign: 'center', fontFamily: F, fontWeight: 800, fontSize: 44, color: WHITE, opacity: tok }}>1 property → {cols * rows} tokens</div>
      </Panel>
    </>
  );
};
// 10 · PROMESA: el mercado (tarjeta clara) y el precio
const S_Mercado: React.FC = () => {
  const t = useT();
  const strike = interpolate(t, [92.0, 92.35], [0, 1], { ...clamp, easing: ease });
  return (
    <Panel a={88.6} b={92.95} light>
      <Karaoke y={250} size={96} words={[{ w: 'The', t: 88.82 }, { w: 'market', t: 88.9 }, { w: 'charges', t: 89.28 }]} />
      <div style={{ position: 'absolute', left: 0, top: 440, width: W, textAlign: 'center', fontFamily: F, fontWeight: 900, fontSize: 150, color: INK, letterSpacing: -4 }}>
        <span style={{ opacity: pin(t, 89.98, 0.25) }}>USD 50K</span>
        <span style={{ opacity: pin(t, 90.54, 0.25), color: GREY }}> – </span>
        <span style={{ opacity: pin(t, 90.94, 0.25) }}>100K</span>
        <div style={{ position: 'absolute', left: 520, top: 95, width: 880 * strike, height: 14, background: RED, borderRadius: 7, transform: 'rotate(-4deg)' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, top: 660, width: W, textAlign: 'center', fontFamily: F, fontWeight: 600, fontSize: 36, color: GREY, opacity: pin(t, 91.4, 0.3) }}>for a tokenization platform</div>
    </Panel>
  );
};
const S_Precio: React.FC = () => {
  const t = useT();
  const n = Math.round(interpolate(t, [94.2, 95.0, 96.1, 96.4], [0, 39000, 39000, 39900], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const hit = interpolate(t, [94.2, 94.3, 94.7], [1.25, 0.96, 1], clamp);
  return (
    <Panel a={93.9} b={97.25}>
      <div style={{ position: 'absolute', left: 0, top: 250, width: W, textAlign: 'center', fontFamily: F }}>
        <div style={{ fontWeight: 600, fontSize: 52, color: GREY, opacity: pin(t, 93.88, 0.25) }}>With us, from</div>
        <div style={{ fontWeight: 900, fontSize: 230, color: GOLD, letterSpacing: -6, lineHeight: 1.05, transform: `scale(${t > 94.2 ? hit : 0.9})`, opacity: t > 94.15 ? 1 : 0 }}>USD {n.toLocaleString('en-US')}</div>
        <div style={{ fontWeight: 700, fontSize: 36, color: WHITE, marginTop: 10, opacity: pin(t, 96.3, 0.3) }}>Your own tokenization platform · under your brand</div>
      </div>
    </Panel>
  );
};
// 11 · CTA
const Cta: React.FC = () => {
  const t = useT();
  if (!vis(t, 104.0, 108.2)) return null;
  const o = fadeOut(t, 108.2, 0.3);
  const btn = (a: number, I: React.ComponentType<{ size?: number; color?: string }>, l: string, bg: string, fg: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: bg, color: fg, borderRadius: 999, padding: '20px 36px 20px 24px', fontFamily: F, fontWeight: 800, fontSize: 36, transform: `scale(${pop(t, a)})`, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
      <I size={46} color={fg} />{l}
    </div>
  );
  const arrow = interpolate(t, [106.94, 107.2], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 0, width: W, top: 840, display: 'flex', justifyContent: 'center', gap: 34, opacity: o }}>
      {btn(104.16, PiCalendarCheck, 'Book a meeting', WHITE, INK)}
      {btn(106.42, PiWhatsappLogo, 'Chat on WhatsApp', '#25D366', WHITE)}
      <div style={{ position: 'absolute', left: W / 2 - 30, top: 120 + Math.abs(Math.sin(t * 5)) * 16, opacity: arrow }}><PiArrowDown size={60} color={WHITE} /></div>
    </div>
  );
};
// 12 · tarjeta final
const S_Final: React.FC = () => {
  const t = useT();
  return (
    <Panel a={113.0} b={ALTIUS_DUR + 1}>
      <div style={{ position: 'absolute', left: 0, top: 330, width: W, textAlign: 'center', fontFamily: F }}>
        <div style={{ fontWeight: 900, fontSize: 170, color: WHITE, letterSpacing: interpolate(t, [113.0, 115.0], [40, 28], { ...clamp, easing: ease }), lineHeight: 1 }}>ALTIUS</div>
        <div style={{ width: 120 * pin(t, 113.4, 0.6), height: 4, background: GOLD, margin: '28px auto' }} />
        <div style={{ fontWeight: 700, fontSize: 40, color: GOLD, letterSpacing: 10, opacity: pin(t, 113.6, 0.5) }}>DUBAI · QATAR</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 70, opacity: pin(t, 114.0, 0.5) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: WHITE, color: INK, borderRadius: 999, padding: '14px 28px', fontWeight: 800, fontSize: 28 }}><PiCalendarCheck size={34} />Book a meeting</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#25D366', color: WHITE, borderRadius: 999, padding: '14px 28px', fontWeight: 800, fontSize: 28 }}><PiWhatsappLogo size={34} />Chat on WhatsApp</div>
        </div>
      </div>
    </Panel>
  );
};

/* ---------------- Subtítulos de lectura (todo lo que dice, donde no hay subtítulo estilizado) ---------------- */
const SUBS: [number, number, string][] = [
  [7.95, 9.3, 'From their phone,'], [9.3, 11.95, 'in London, Riyadh or Mumbai.'],
  [12.45, 14.95, 'Hello everyone, my name is Diana Rondón,'], [14.95, 16.75, "I'm co-founder of Altius."],
  [17.05, 19.3, "I'm Colombian, but at this moment"], [19.3, 23.3, "I'm living between Doha, Qatar and Dubai."],
  [23.5, 24.4, 'Here,'],
  [29.65, 31.7, 'The first: sky-high prices.'], [31.7, 34.5, 'Or cheap, but looks so cheap.'], [34.5, 35.3, "It's incredible."],
  [40.0, 44.6, 'With one team: product design, branding, marketing,'], [44.6, 48.4, 'custom platforms, built in-house,'], [48.4, 51.95, 'artificial intelligence and tokenization.'],
  [52.05, 54.9, 'Our production team works from Latin America,'], [54.9, 56.5, 'with senior talent.'], [56.5, 57.6, "That's how we deliver"],
  [61.45, 63.4, 'And if you are in'],
  [66.25, 68.8, 'We build your sales platform,'], [68.8, 72.0, 'your brand, your CRM and 3D.'], [72.0, 75.0, 'Your client picks their unit without visiting the site.'],
  [76.0, 80.7, 'Your own platform to split a property into tokens'], [80.7, 83.5, 'and open it to more investors,'],
  [83.5, 86.6, 'under your brand. And you bring the license.'], [86.6, 88.55, 'We bring the technology.'],
  [103.4, 104.9, 'Book a meeting with me'], [104.9, 107.7, 'or message us on WhatsApp, right below,'],
];
const Subs: React.FC = () => {
  const t = useT();
  const c = SUBS.find(([a, b]) => t >= a && t < b);
  if (!c) return null;
  const [a, b, txt] = c;
  const o = Math.min(interpolate(t, [a, a + 0.12], [0, 1], clamp), interpolate(t, [b - 0.12, b], [1, 0], clamp));
  const y = vis(t, 103.4, 108.2) ? 735 : 975;
  return (
    <div style={{ position: 'absolute', left: 0, width: W, top: y, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ maxWidth: 1500, padding: '10px 26px 12px', borderRadius: 16, background: 'rgba(8,10,16,0.62)', fontFamily: F, fontWeight: 600, fontSize: 44, lineHeight: 1.2, color: WHITE, textAlign: 'center' }}>{txt}</div>
    </div>
  );
};

export const AltiusVSL: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: NAVY, overflow: 'hidden' }}>
      <AgenciaBg />
      <Laptop />
      <Sujeto />
      <S_Agencia />

      {/* GANCHO */}
      <S_Gancho />
      <S_Edificio />
      <PhoneCard />
      <SideCard x={1430} y={300} out={11.85} faces={[
        { t: 9.4, I: PiMapPin, top: 'From anywhere', big: 'London', c: '#1C2C4A' },
        { t: 10.3, I: PiMapPin, top: 'From anywhere', big: 'Riyadh', c: '#1C2C4A' },
        { t: 11.38, I: PiMapPin, top: 'From anywhere', big: 'Mumbai', c: '#1C2C4A' },
      ]} />

      {/* AUTORIDAD + HISTORIA */}
      <NameCard />
      <SideCard x={130} y={300} out={23.2} faces={[{ t: 17.28, I: PiMapPin, top: 'Born in', big: 'Colombia', c: '#2E2A1C' }]} />
      <SideCard x={1430} y={300} out={23.2} rot={6} faces={[
        { t: 19.84, I: PiBuildings, top: 'Living between', big: 'Doha', c: NAVY },
        { t: 22.6, I: PiBuildings, top: 'Living between', big: 'Dubai', c: NAVY },
      ]} />

      {/* PROBLEMA */}
      <Caption a={24.4} b={27.3} lines={[[{ w: 'anyone launching', t: 24.44 }], [{ w: 'a', t: 25.8 }, { w: 'DIGITAL PROJECT', t: 26.38, big: true }]]} />
      <Caption a={27.9} b={29.65} lines={[[{ w: 'only', t: 28.04 }, { w: 'TWO', t: 28.54, big: true, c: GOLD }, { w: 'OPTIONS', t: 29.04, big: true }]]} />
      <S_Dolor />
      <Caption a={35.3} b={37.4} size={110} lines={[[{ w: 'we built a', t: 35.34 }], [{ w: 'THIRD WAY', t: 36.54, big: true, c: GOLD }]]} />

      {/* AGENCIA */}
      <Caption a={37.3} b={40.0} lines={[[{ w: 'at', t: 37.36 }, { w: 'ALTIUS', t: 37.98, big: true, c: GOLD }], [{ w: 'we do it', t: 38.74 }, { w: 'ALL', t: 39.7, big: true }]]} />
      <S_Equipo />
      <Caption a={57.6} b={61.2} y={850} lines={[[{ w: 'TOP-TIER', t: 58.76, big: true }, { w: 'quality', t: 59.34 }], [{ w: 'at', t: 59.82 }, { w: 'COMPETITIVE', t: 60.3, big: true, c: GOLD }, { w: 'prices', t: 60.86 }]]} size={84} />

      {/* REAL ESTATE */}
      <Caption a={63.4} b={66.2} lines={[[{ w: 'REAL ESTATE', t: 63.6, big: true, c: GOLD }], [{ w: 'this is', t: 64.6 }, { w: 'FOR YOU', t: 65.32, big: true }]]} />
      <S_Plataforma />
      <SideCard x={130} y={280} out={75.0} faces={[{ t: 72.4, I: PiCheckCircle, top: 'Your client picks', big: 'Unit 12B', c: '#14361F' }]} />
      <SideCard x={1430} y={280} out={75.0} rot={6} faces={[{ t: 74.12, I: PiDeviceMobile, top: 'Without visiting', big: 'the site', c: NAVY }]} />

      {/* TOKENIZACIÓN */}
      <S_Token />
      <SideCard x={130} y={280} out={88.4} faces={[
        { t: 81.34, I: PiUsersThree, top: 'Open it to', big: 'More investors', c: NAVY },
        { t: 85.14, I: PiCertificate, top: 'You bring', big: 'The license', c: '#2E2A1C' },
      ]} />
      <SideCard x={1430} y={280} out={88.4} rot={6} faces={[
        { t: 83.66, I: PiBuildings, top: 'Under', big: 'Your brand', c: '#1C2C4A' },
        { t: 86.76, I: PiCpu, top: 'We bring', big: 'The technology', c: '#3A2E14' },
      ]} />

      {/* PROMESA */}
      <S_Mercado />
      <S_Precio />

      {/* CIERRE */}
      <Caption a={97.3} b={98.65} size={120} lines={[[{ w: 'YOUR', t: 97.34, big: true }, { w: 'IDEA', t: 97.58, big: true, c: GOLD }]]} />
      <Caption a={98.65} b={99.65} size={120} lines={[[{ w: 'YOUR', t: 98.7, big: true }, { w: 'BRAND', t: 98.86, big: true, c: GOLD }]]} />
      <Caption a={99.65} b={100.65} size={120} lines={[[{ w: 'YOUR', t: 99.7, big: true }, { w: 'PLATFORM', t: 99.82, big: true, c: GOLD }]]} />
      <Caption a={100.7} b={103.35} size={104} lines={[[{ w: 'built to the', t: 100.7 }], [{ w: 'HIGHEST STANDARD', t: 102.4, big: true }]]} />
      <Cta />
      <Caption a={108.2} b={110.2} lines={[[{ w: "LET'S BUILD", t: 108.24, big: true, c: GOLD }], [{ w: 'your plan', t: 108.9 }]]} />
      <Caption a={110.4} b={113.1} lines={[[{ w: "I'm", t: 110.22 }, { w: 'DIANA', t: 110.54, big: true }], [{ w: 'and this is', t: 110.84 }, { w: 'ALTIUS', t: 111.48, big: true, c: GOLD }]]} />
      <S_Final />
      <Subs />
      {t < 0 ? null : null}
    </AbsoluteFill>
  );
};
