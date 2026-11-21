import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import {
  PiAddressBook, PiAppWindow, PiBrain, PiBrowsers, PiBuildings, PiCar, PiChartLineUp, PiChatCircleDots, PiCheckCircle, PiCode, PiCoins,
  PiCreditCard, PiCube, PiCursorClick, PiDeviceMobile, PiFlowArrow, PiGameController, PiHeart, PiIdentificationCard, PiLightbulb, PiLink,
  PiMegaphone, PiPaintBrush, PiPalette, PiPlant, PiShieldCheck, PiShoppingCart, PiSparkle, PiStorefront, PiTarget, PiUsersThree, PiWallet,
  PiWhatsappLogo,
} from 'react-icons/pi';
import { SiGoogleads, SiMeta } from 'react-icons/si';
import { ensureFonts } from '../brand/fonts';
import { EY_FOX, OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import PAL from './kl-palabras.json';

// Key Lab · video institucional horizontal 1920x1080 · historia + todos los servicios con clips reales de plataformas.
ensureFonts();
export const KL_DUR = 184.0;
const FPS = 30;
const M = 'media/kl/';
const W = 1920, H = 1080;
const INK = '#FFFFFF', MUTED = '#9AA3B8', SOFT = '#8CA0FF', ACCENT = '#2D52FF', GOLD = '#F2C14E', GREEN = '#3DDC84', PANEL = '#0E1220';
const DISPLAY = 'Anton', BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const inout = Easing.bezier(0.65, 0, 0.35, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.5) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const fade = (t: number, a: number, b: number, d = 0.3) => Math.min(interpolate(t, [a, a + d], [0, 1], clamp), interpolate(t, [b - d, b], [1, 0], clamp));
const vis = (t: number, a: number, b: number) => t >= a && t < b;
const pop = (t: number, a: number) => interpolate(t, [a, a + 0.22, a + 0.35], [0, 1.1, 1], { ...clamp, easing: Easing.out(Easing.quad) });
const slam = (t: number, a: number, k = 1.5) => interpolate(t, [a, a + 0.18], [k, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
const EY = 3.38, EY_END = 4.38;
type Ic = React.ComponentType<{ size?: number; color?: string }>;

/* ---------- subtítulos ---------- */
const CHUNKS = (() => {
  const W2 = PAL as [string, number, number][];
  const res: { a: number; b: number; w: [string, number, number][] }[] = [];
  let cur: [string, number, number][] = [];
  W2.forEach((w, i) => {
    cur.push(w);
    if (/[.,?!:]$/.test(w[0]) || cur.length >= 6 || i === W2.length - 1) { res.push({ a: cur[0][1], b: cur[cur.length - 1][2], w: cur }); cur = []; }
  });
  return res.map((c, i) => ({ ...c, b: Math.min(res[i + 1]?.a ?? c.b + 0.5, c.b + 0.4) }));
})();
const fix = (s: string) => s.replace(/toquen/gi, (m) => (m[0] === 'T' ? 'Token' : 'token')).replace('sentosa', 'sentó a').replace('KeyLab', 'Key Lab').replace(/^meta$/, 'Meta').replace('Yates', 'yates').replace('Blockchain.', 'blockchain.').replace('vídeo', 'video');
const Captions: React.FC = () => {
  const t = useT();
  if (t < EY_END || t > 175.6) return null;
  const c = CHUNKS.find((k) => t >= k.a - 0.05 && t < k.b);
  if (!c) return null;
  return (
    <div style={{ position: 'absolute', left: 160, top: 968, width: 1600, textAlign: 'center' }}>
      <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, lineHeight: 1.2, background: 'rgba(5,7,13,0.62)', padding: '6px 18px', borderRadius: 12 }}>
        {c.w.map(([w, s], i) => {
          const on = t >= s - 0.03;
          return <span key={i} style={{ color: on && t < (c.w[i + 1]?.[1] ?? c.b) ? GOLD : INK, opacity: on ? 1 : 0.5 }}>{i ? ' ' : ''}{fix(w)}</span>;
        })}
      </span>
    </div>
  );
};

/* ---------- fondo ---------- */
const Fondo: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: '#05070D' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.3px, transparent 1.4px)', backgroundSize: '44px 44px', backgroundPosition: `${(t * 10) % 44}px ${(t * 6) % 44}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 55% at ${50 + Math.sin(t * 0.2) * 18}% ${45 + Math.cos(t * 0.15) * 10}%, rgba(45,82,255,0.22) 0%, rgba(5,7,13,0) 70%)` }} />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 260px rgba(0,0,0,0.9)' }} />
    </AbsoluteFill>
  );
};

/* ---------- clip de video: a pantalla completa o dentro de un navegador limpio ---------- */
type Cut = { a: number; b: number; src: string; from: number; rate?: number; crop?: number; z0?: number; z1?: number; ox?: string };
const ClipLayer: React.FC<{ c: Cut; framed?: boolean; box?: { x: number; y: number; w: number; h: number }; url?: string }> = ({ c, framed, box, url }) => {
  const t = useT();
  if (!vis(t, c.a - 0.01, c.b + 0.01)) return null;
  const z = interpolate(t, [c.a, c.b], [c.z0 ?? 1.0, c.z1 ?? 1.06], clamp);
  const crop = c.crop ?? 0; // px recortados arriba (barra de pestañas del navegador)
  const video = (
    <Sequence from={Math.round(c.a * FPS)} layout="none">
      <OffthreadVideo src={staticFile(`${M}${c.src}.mp4`)} startFrom={Math.round(c.from * FPS)} playbackRate={c.rate ?? 1} muted style={{ position: 'absolute', left: 0, top: -crop, width: '100%', height: `calc(100% + ${crop}px)`, objectFit: 'cover' }} />
    </Sequence>
  );
  if (!framed) return <AbsoluteFill style={{ overflow: 'hidden' }}><AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: c.ox ?? '50% 50%' }}>{video}</AbsoluteFill></AbsoluteFill>;
  const b = box ?? { x: 230, y: 120, w: 1460, h: 820 };
  return (
    <div style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 26, overflow: 'hidden', background: '#000', boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.08)' }}>
      <div style={{ height: 44, background: '#151A2A', display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((x) => <div key={x} style={{ width: 13, height: 13, borderRadius: 7, background: x }} />)}
        <div style={{ marginLeft: 18, flex: 1, maxWidth: 560, height: 26, borderRadius: 8, background: '#0B0F1C', color: MUTED, fontFamily: BODY, fontSize: 15, display: 'flex', alignItems: 'center', paddingLeft: 14 }}>{url ?? 'keylab.tech'}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 44, right: 0, bottom: 0, overflow: 'hidden' }}>
        <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: c.ox ?? '50% 40%' }}>{video}</AbsoluteFill>
      </div>
    </div>
  );
};
const Clips: React.FC<{ cuts: Cut[]; framed?: boolean; box?: { x: number; y: number; w: number; h: number }; url?: string; a: number; b: number }> = ({ cuts, framed, box, url, a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const s = interpolate(t, [a, a + 0.45], [0.94, 1], { ...clamp, easing: ease }) * interpolate(t, [b - 0.35, b], [1, 0.96], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade(t, a, b, 0.3), transform: `scale(${s})` }}>
      {cuts.map((c, i) => <ClipLayer key={i} c={c} framed={framed} box={box} url={url} />)}
    </AbsoluteFill>
  );
};

/* ---------- textos ---------- */
const Title: React.FC<{ a: number; b: number; n?: string; text: string; sub?: string; x?: number; y?: number; size?: number; align?: 'left' | 'center' }> = ({ a, b, n, text, sub, x = 120, y = 90, size = 92, align = 'left' }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const p = pin(t, a, 0.5);
  return (
    <div style={{ position: 'absolute', left: align === 'center' ? 0 : x, width: align === 'center' ? W : 1700, top: y, textAlign: align, opacity: fade(t, a, b, 0.25) }}>
      {n ? <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 8, color: SOFT, transform: `translateY(${(1 - p) * 16}px)` }}>{n}</div> : null}
      <div style={{ fontFamily: DISPLAY, fontSize: size, color: INK, lineHeight: 1.02, textTransform: 'uppercase', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>{text}</div>
      {sub ? <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: MUTED, marginTop: 8, opacity: pin(t, a + 0.25, 0.4) }}>{sub}</div> : null}
    </div>
  );
};
const AppIcon: React.FC<{ I: Ic; size?: number; bg?: string; color?: string }> = ({ I, size = 110, bg = '#1A2140', color = INK }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.26, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}><I size={size * 0.52} color={color} /></div>
);
// Etiqueta que entra con rebote junto al clip
const Tag: React.FC<{ a: number; b: number; I: Ic; text: string; x: number; y: number; c?: string }> = ({ a, b, I, text, x, y, c = ACCENT }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y + Math.sin((t - a) * 2.4) * 4, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.96)', borderRadius: 22, padding: '12px 26px 12px 12px', transform: `scale(${pop(t, a)})`, opacity: fade(t, a, b, 0.2), boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
      <AppIcon I={I} size={64} bg={c} />
      <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, color: '#0B0F1C' }}>{text}</span>
    </div>
  );
};

/* ---------- 0 · gancho ---------- */
const Gancho: React.FC = () => {
  const t = useT();
  if (t >= EY) return null;
  const bulb = interpolate(t, [1.25, 1.6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${pop(t, 0.05)})`, filter: `drop-shadow(0 0 ${20 + bulb * 80}px rgba(242,193,78,${0.2 + bulb * 0.6}))` }}><PiLightbulb size={220} color={bulb > 0.5 ? GOLD : INK} /></div>
      <div style={{ fontFamily: DISPLAY, fontSize: 120, color: INK, marginTop: 10, transform: `scale(${slam(t, 0.0, 1.3)})` }}>¿TIENES UNA IDEA?</div>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 56, color: GOLD, opacity: pin(t, 1.25, 0.4), transform: `translateY(${(1 - pin(t, 1.25, 0.4)) * 20}px)` }}>Nosotros la convertimos en algo real.</div>
    </AbsoluteFill>
  );
};
const Ey: React.FC = () => {
  const t = useT();
  if (t < EY || t >= EY_END) return null;
  return (
    <AbsoluteFill style={{ background: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 300, color: INK, transform: `scale(${slam(t, EY, 1.6)})`, lineHeight: 1, marginLeft: -420 }}>Ey.</div>
      <OneGag g={{ ...EY_FOX, at: EY, dur: EY_END - EY, x: 0.68, y: 0.6, size: 0.55 }} />
    </AbsoluteFill>
  );
};

/* ---------- puente: muro de servicios ---------- */
const WALL: [Ic, string][] = [
  [PiMegaphone, 'Marketing'], [PiTarget, 'Paid media'], [PiPalette, 'Branding'], [PiPaintBrush, 'UX / UI'], [PiAppWindow, 'Landing pages'], [PiBrowsers, 'Webs'],
  [PiCube, 'Webs 3D'], [PiSparkle, 'Animaciones'], [PiStorefront, 'Ecommerce'], [PiCreditCard, 'Pasarelas de pago'], [PiDeviceMobile, 'Apps'], [PiWallet, 'Apps de pago'],
  [PiUsersThree, 'Apps sociales'], [PiLink, 'dApps'], [PiCoins, 'Tokenizadoras RWA'], [PiShieldCheck, 'Smart contracts'], [PiBrain, 'Agentes de IA'], [PiGameController, 'Videojuegos'],
];
const Muro: React.FC<{ a: number; at: number; b: number }> = ({ a, at, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <AbsoluteFill style={{ opacity: fade(t, a, b, 0.3) }}>
      <Title a={at - 0.15} b={b} text="Mucho más que tokenización" align="center" y={90} size={104} />
      <div style={{ position: 'absolute', left: 150, top: 300, width: 1620, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', rowGap: 34 }}>
        {WALL.map(([I, l], i) => {
          const p = pop(t, at + (i % 6) * 0.045 + Math.floor(i / 6) * 0.08);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transform: `scale(${p})` }}>
              <AppIcon I={I} size={118} bg={i === 14 ? GOLD : '#1A2140'} color={i === 14 ? '#1A1200' : INK} />
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 24, color: INK }}>{l}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- marketing: tablero de pauta ---------- */
const Pauta: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const k = interpolate(t, [a + 0.4, a + 3.4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pts = Array.from({ length: 24 }, (_, i) => [i * 40, 230 - (Math.pow(i / 23, 1.6) * 170 + Math.sin(i * 1.3) * 12)]);
  const shown = Math.max(2, Math.round(k * pts.length));
  return (
    <div style={{ position: 'absolute', left: 300, top: 200, width: 1320, height: 700, borderRadius: 30, background: PANEL, border: '2px solid rgba(255,255,255,0.08)', padding: 44, opacity: fade(t, a, b), transform: `scale(${0.95 + pin(t, a, 0.5) * 0.05})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ transform: `scale(${pop(t, a + 1.8)})` }}><AppIcon I={SiMeta as Ic} size={74} bg="#0866FF" /></div>
        <div style={{ transform: `scale(${pop(t, a + 2.5)})` }}><AppIcon I={SiGoogleads as Ic} size={74} bg="#FFFFFF" color="#1A73E8" /></div>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, color: INK, marginLeft: 10 }}>Campañas activas</div>
      </div>
      <div style={{ display: 'flex', gap: 22, marginTop: 34 }}>
        {[['Alcance', Math.round(k * 284000).toLocaleString('es-CO')], ['Clics', Math.round(k * 12480).toLocaleString('es-CO')], ['Mensajes', Math.round(k * 936).toLocaleString('es-CO')], ['Retorno', (k * 4.8).toFixed(1) + 'x']].map(([l, v], i) => (
          <div key={i} style={{ flex: 1, background: '#151B30', borderRadius: 22, padding: '20px 24px' }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, color: MUTED }}>{l}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 64, color: i === 3 ? GREEN : INK }}>{v}</div>
          </div>
        ))}
      </div>
      <svg width={960} height={260} style={{ marginTop: 26 }}>
        <polyline points={pts.slice(0, shown).map((p) => p.join(',')).join(' ')} fill="none" stroke={ACCENT} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[shown - 1][0]} cy={pts[shown - 1][1]} r={11} fill={GOLD} />
      </svg>
      <div style={{ position: 'absolute', right: 44, bottom: 48, transform: `scale(${pop(t, a + 3.0)})` }}><PiChartLineUp size={150} color={GREEN} /></div>
    </div>
  );
};
/* ---------- marketing: marca ---------- */
const Marca: React.FC<{ a: number; b: number; logos: number; ident: number; manual: number }> = ({ a, b, logos, ident, manual }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const cols = ['#2D52FF', '#F2C14E', '#0B0F1C', '#F4F1EB', '#3DDC84'];
  return (
    <AbsoluteFill style={{ opacity: fade(t, a, b) }}>
      <div style={{ position: 'absolute', left: 180, top: 230, width: 460, height: 460, borderRadius: 40, background: PANEL, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(t, logos)}) rotate(${interpolate(t, [logos, logos + 0.4], [-6, 0], clamp)}deg)` }}>
        <Img src={staticFile('brand/isotipo-cromo.png')} style={{ width: 300 }} />
      </div>
      <div style={{ position: 'absolute', left: 720, top: 230, display: 'flex', gap: 18 }}>
        {cols.map((c, i) => <div key={c} style={{ width: 190, height: 230, borderRadius: 26, background: c, transform: `scale(${pop(t, ident + i * 0.08)})`, boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }} />)}
      </div>
      <div style={{ position: 'absolute', left: 720, top: 500, display: 'flex', gap: 40, alignItems: 'baseline', opacity: pin(t, ident + 0.4, 0.4) }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 150, color: INK }}>Aa</span>
        <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 150, color: INK }}>Aa</span>
        <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: MUTED }}>Identidad visual</span>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: 1390 + i * 40, top: 520 + i * 20, width: 300, height: 200, borderRadius: 18, background: i === 2 ? '#F4F1EB' : '#1A2140', border: '2px solid rgba(255,255,255,0.15)', transform: `scale(${pop(t, manual + i * 0.12)}) rotate(${(i - 1) * 6}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontWeight: 900, fontSize: 28, color: i === 2 ? '#0B0F1C' : INK }}>{i === 2 ? 'Manual de marca' : ''}</div>
      ))}
    </AbsoluteFill>
  );
};
/* ---------- UX/UI: wireframe que se vuelve interfaz ---------- */
const UX: React.FC<{ a: number; b: number; click: number }> = ({ a, b, click }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const ui = interpolate(t, [a + 1.2, a + 2.6], [0, 1], { ...clamp, easing: inout });
  const blocks: [number, number, number, number, string][] = [[40, 40, 860, 70, ACCENT], [40, 140, 520, 260, '#F2C14E'], [590, 140, 310, 120, '#3DDC84'], [590, 280, 310, 120, '#E8389E'], [40, 430, 860, 60, '#1A2140'], [40, 510, 400, 60, '#1A2140']];
  const bx = 900, by = 230;
  const cx = interpolate(t, [a + 2.8, click - 0.1], [1500, bx + 640], { ...clamp, easing: inout }), cy = interpolate(t, [a + 2.8, click - 0.1], [900, by + 340], { ...clamp, easing: inout });
  return (
    <AbsoluteFill style={{ opacity: fade(t, a, b) }}>
      <div style={{ position: 'absolute', left: bx - 40, top: by - 40, width: 940, height: 620, borderRadius: 28, background: ui > 0.5 ? '#F4F1EB' : '#0B0F1C', border: '2px dashed rgba(140,160,255,0.5)' }}>
        {blocks.map(([x, y, w, h, c], i) => (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 14, background: ui > 0 ? c : 'transparent', opacity: ui > 0 ? 0.25 + 0.75 * ui : 1, border: ui < 1 ? '2px dashed rgba(140,160,255,0.7)' : 'none' }} />
        ))}
        {t > click ? <div style={{ position: 'absolute', left: 520, top: 260, width: 160, height: 160, borderRadius: 80, border: `6px solid ${GOLD}`, transform: `scale(${interpolate(t, [click, click + 0.5], [0.3, 1.4], clamp)})`, opacity: interpolate(t, [click, click + 0.5], [1, 0], clamp) }} /> : null}
      </div>
      <div style={{ position: 'absolute', left: 140, top: 300, width: 640 }}>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 6, color: SOFT }}>UX / UI</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 96, color: INK, lineHeight: 1.02 }}>QUE SE ENTIENDA DESDE EL PRIMER CLIC</div>
      </div>
      <div style={{ position: 'absolute', left: cx, top: cy }}><PiCursorClick size={80} color={INK} /></div>
    </AbsoluteFill>
  );
};
/* ---------- escalera de webs ---------- */
const Niveles: React.FC<{ a: number; b: number; ts: number[] }> = ({ a, b, ts }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const L: [Ic, string][] = [[PiAppWindow, 'Landing page'], [PiBrowsers, 'Web simple'], [PiBuildings, 'Web compleja'], [PiFlowArrow, 'Web avanzada']];
  let cur = 0; ts.forEach((x, i) => { if (t >= x) cur = i; });
  return (
    <div style={{ position: 'absolute', left: 70, top: 220, width: 330, opacity: fade(t, a, b) }}>
      {L.map(([I, l], i) => {
        const on = t >= ts[i];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 18px', borderRadius: 22, background: i === cur ? ACCENT : 'rgba(255,255,255,0.05)', opacity: on ? 1 : 0.35, transform: `scale(${on ? pop(t, ts[i]) : 1})`, transformOrigin: 'left center' }}>
            <I size={46} color={INK} /><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: INK }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
};
/* ---------- teléfono con recorte de la app KeyPay ---------- */
const Telefono: React.FC<{ a: number; b: number; cuts: Cut[] }> = ({ a, b, cuts }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <div style={{ position: 'absolute', left: 1130, top: 90, width: 470, height: 900, borderRadius: 64, background: '#0A0B0F', padding: 16, boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 0 3px rgba(255,255,255,0.12)', opacity: fade(t, a, b), transform: `translateY(${(1 - pin(t, a, 0.6)) * 80}px) rotate(${Math.sin(t * 0.8) * 1.2}deg)` }}>
      <div style={{ position: 'absolute', inset: 16, borderRadius: 50, overflow: 'hidden', background: '#000' }}>
        {cuts.map((c, i) => (vis(t, c.a, c.b) ? (
          <Sequence key={i} from={Math.round(c.a * FPS)} layout="none">
            <OffthreadVideo src={staticFile(`${M}${c.src}.mp4`)} startFrom={Math.round(c.from * FPS)} muted style={{ position: 'absolute', width: 1920 * 0.99, height: 1080 * 0.99, left: -742 * 0.99 + 4, top: -92 * 0.99 }} />
          </Sequence>
        ) : null))}
      </div>
    </div>
  );
};
/* ---------- app social (maqueta) ---------- */
const Social: React.FC<{ a: number; b: number; perf: number; pubs: number; com: number }> = ({ a, b, perf, pubs, com }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <div style={{ position: 'absolute', left: 1130, top: 90, width: 470, height: 900, borderRadius: 64, background: '#0A0B0F', padding: 16, boxShadow: '0 50px 140px rgba(0,0,0,0.6), 0 0 0 3px rgba(255,255,255,0.12)', opacity: fade(t, a, b) }}>
      <div style={{ position: 'absolute', inset: 16, borderRadius: 50, overflow: 'hidden', background: '#F4F1EB', fontFamily: BODY }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '40px 24px 16px', transform: `scale(${pop(t, perf)})`, transformOrigin: 'left center' }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: ACCENT }} />
          <div><div style={{ fontWeight: 900, fontSize: 24, color: '#0B0F1C' }}>@tu.comunidad</div><div style={{ fontSize: 17, color: '#6B7080' }}>12,4 mil seguidores</div></div>
        </div>
        {[0, 1].map((i) => (
          <div key={i} style={{ margin: '10px 18px', background: WHITE_CARD, borderRadius: 22, padding: 14, transform: `translateY(${(1 - pin(t, pubs + i * 0.3, 0.4)) * 60}px)`, opacity: pin(t, pubs + i * 0.3, 0.4) }}>
            <div style={{ height: 200, borderRadius: 16, background: i ? '#F2C14E' : '#8CA0FF' }} />
            <div style={{ display: 'flex', gap: 18, marginTop: 12, alignItems: 'center' }}>
              <PiHeart size={30} color="#E5484D" /><span style={{ fontWeight: 800, color: '#0B0F1C' }}>{Math.round(interpolate(t, [com, com + 1.2], [120, 948 + i * 300], clamp))}</span>
              <PiChatCircleDots size={30} color="#0B0F1C" /><span style={{ fontWeight: 800, color: '#0B0F1C' }}>{Math.round(interpolate(t, [com, com + 1.2], [8, 64 + i * 20], clamp))}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const WHITE_CARD = '#FFFFFF';
/* ---------- bloques de blockchain ---------- */
const Cadena: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <div style={{ position: 'absolute', left: 0, top: 420, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: fade(t, a, b) }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <React.Fragment key={i}>
          {i ? <div style={{ width: 70 * pin(t, a + 0.3 + i * 0.22, 0.25), height: 6, background: ACCENT }} /> : null}
          <div style={{ width: 170, height: 170, borderRadius: 26, background: i === 5 ? GOLD : PANEL, border: `3px solid ${i === 5 ? GOLD : ACCENT}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(t, a + 0.2 + i * 0.22)})`, fontFamily: BODY }}>
            <PiCube size={62} color={i === 5 ? '#1A1200' : INK} />
            <div style={{ fontWeight: 800, fontSize: 18, color: i === 5 ? '#1A1200' : MUTED, marginTop: 6 }}>#{(48210 + i).toString()}</div>
            <div style={{ fontSize: 14, color: i === 5 ? '#1A1200' : SOFT, fontFamily: 'monospace' }}>0x{(0x9f3a1 * (i + 7)).toString(16).slice(0, 6)}…</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
const Fragmentar: React.FC<{ a: number; b: number; ts: number[] }> = ({ a, b, ts }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const items: [Ic, string][] = [[PiBuildings, 'Inmuebles'], [PiPlant, 'Campos'], [PiCar, 'Autos']];
  return (
    <AbsoluteFill style={{ opacity: fade(t, a, b) }}>
      <Title a={a} b={b} n="PRODUCTO ESTRELLA" text="Tokenizadoras de marca blanca" y={90} size={90} />
      <div style={{ position: 'absolute', left: 120, top: 330, width: 1680, display: 'flex', justifyContent: 'space-between' }}>
        {items.map(([I, l], i) => {
          const s = interpolate(t, [ts[i] + 0.3, ts[i] + 0.9], [0, 1], { ...clamp, easing: ease });
          return (
            <div key={i} style={{ width: 500, height: 500, position: 'relative', transform: `scale(${pop(t, ts[i])})` }}>
              {Array.from({ length: 16 }).map((_, k) => {
                const c = k % 4, r = Math.floor(k / 4);
                return <div key={k} style={{ position: 'absolute', left: 60 + c * 95 + (c - 1.5) * 26 * s, top: 20 + r * 95 + (r - 1.5) * 26 * s, width: 90, height: 90, borderRadius: 10 + s * 35, background: s > 0.5 ? GOLD : '#1A2140', border: `2px solid ${s > 0.5 ? '#F7DC8E' : ACCENT}` }} />;
              })}
              <div style={{ position: 'absolute', left: 0, top: 0, width: 500, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - s }}><I size={240} color={INK} /></div>
              <div style={{ position: 'absolute', left: 0, top: 440, width: 500, textAlign: 'center', fontFamily: DISPLAY, fontSize: 64, color: INK }}>{l}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
const Contrato: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const code = `contract TuTokenizadora {\n  string public marca = "Tu Marca";\n  mapping(address => uint) public fragmentos;\n\n  function comprar(uint cantidad) external {\n    require(cantidad > 0, "monto invalido");\n    fragmentos[msg.sender] += cantidad;\n    emit Compra(msg.sender, cantidad);\n  }\n}`;
  const n = Math.round(interpolate(t, [a + 0.2, b - 1.2], [0, code.length], clamp));
  return (
    <AbsoluteFill style={{ opacity: fade(t, a, b) }}>
      <Title a={a} b={b} n="SMART CONTRACTS" text="Seguro y transparente" y={90} size={90} />
      <div style={{ position: 'absolute', left: 140, top: 290, width: 1160, height: 600, borderRadius: 26, background: '#0B0F1C', border: '2px solid rgba(255,255,255,0.1)', padding: '36px 44px', fontFamily: 'monospace', fontSize: 34, color: '#C9D3FF', whiteSpace: 'pre', lineHeight: 1.45 }}>
        {code.slice(0, n)}<span style={{ opacity: Math.sin(t * 10) > 0 ? 1 : 0, color: GOLD }}>▍</span>
      </div>
      <div style={{ position: 'absolute', left: 1390, top: 380, transform: `scale(${pop(t, b - 1.6)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <PiShieldCheck size={260} color={GREEN} />
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 36, color: INK }}>Contrato verificado</div>
      </div>
    </AbsoluteFill>
  );
};
/* ---------- "y además" ---------- */
const Ademas: React.FC<{ a: number; b: number; ts: number[] }> = ({ a, b, ts }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const items: [Ic, string, string][] = [[PiBrain, 'Agentes de IA', 'Atienden a tus clientes 24/7'], [PiFlowArrow, 'Automatizaciones', 'Procesos que corren solos'], [PiGameController, 'Videojuegos', 'Experiencias interactivas'], [PiSparkle, 'Contenido', 'Videos como este']];
  return (
    <AbsoluteFill style={{ opacity: fade(t, a, b) }}>
      <Title a={a} b={b} text="Y además…" y={90} size={110} />
      <div style={{ position: 'absolute', left: 120, top: 330, width: 1680, display: 'flex', gap: 30 }}>
        {items.map(([I, l, s], i) => (
          <div key={i} style={{ flex: 1, height: 460, borderRadius: 34, background: PANEL, border: `2px solid ${t >= ts[i] ? ACCENT : 'rgba(255,255,255,0.08)'}`, padding: 34, transform: `scale(${pop(t, ts[i])})` }}>
            <AppIcon I={I} size={120} bg={i === 0 ? ACCENT : '#1A2140'} />
            <div style={{ fontFamily: DISPLAY, fontSize: 64, color: INK, marginTop: 34, lineHeight: 1.02 }}>{l.toUpperCase()}</div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: MUTED, marginTop: 14 }}>{s}</div>
            {i === 0 && t >= ts[0] + 0.4 ? (
              <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12, background: '#25D366', borderRadius: 18, padding: '10px 16px', opacity: pin(t, ts[0] + 0.4, 0.3) }}>
                <PiWhatsappLogo size={34} color={INK} /><span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 22, color: INK }}>¡Hola! ¿En qué te ayudo?</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
/* ---------- mapa de países ---------- */
const Paises: React.FC<{ a: number; b: number; ts: number[] }> = ({ a, b, ts }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const P: [string, number, number][] = [['Panamá', 760, 360], ['Colombia', 860, 470], ['Argentina', 960, 820]];
  const order = [2, 1, 0];
  return (
    <AbsoluteFill style={{ opacity: fade(t, a, b) }}>
      <Title a={a} b={b} n="TOKENIZADORAS CONSTRUIDAS EN" text="Tres países y contando" x={1080} y={300} size={86} />
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        <path d="M720 300 L820 330 L900 420 L960 470 L1000 560 L1040 640 L1010 760 L980 880 L940 980 L900 940 L910 800 L860 700 L820 560 L780 470 L740 400 Z" fill="rgba(45,82,255,0.12)" stroke="rgba(140,160,255,0.45)" strokeWidth={3} />
      </svg>
      {order.map((idx, k) => {
        const [l, x, y] = P[idx];
        const p = pop(t, ts[k]);
        return (
          <div key={l} style={{ position: 'absolute', left: x - 22, top: y - 22, transform: `scale(${p})` }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: GOLD, boxShadow: `0 0 ${30 + Math.sin(t * 4) * 10}px ${GOLD}` }} />
            <div style={{ position: 'absolute', left: 60, top: 0, fontFamily: BODY, fontWeight: 900, fontSize: 38, color: INK, whiteSpace: 'nowrap' }}>{l}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
/* ---------- cierre ---------- */
const Cierre: React.FC = () => {
  const t = useT();
  if (t < 171.9) return null;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 40, fontFamily: DISPLAY, fontSize: 120, color: INK, position: 'absolute', top: 170 }}>
        <span style={{ opacity: pin(t, 172.06, 0.3), transform: `scale(${slam(t, 172.06, 1.3)})` }}>TU IDEA.</span>
        <span style={{ opacity: pin(t, 172.95, 0.3), color: GOLD, transform: `scale(${slam(t, 172.95, 1.3)})` }}>NUESTRA TECNOLOGÍA.</span>
      </div>
      <div style={{ position: 'absolute', top: 400, transform: `scale(${pop(t, 174.55)})` }}><Img src={staticFile('brand/logo-horizontal.png')} style={{ width: 820 }} /></div>
      <div style={{ position: 'absolute', top: 700, fontFamily: BODY, fontWeight: 800, fontSize: 46, letterSpacing: 4, color: SOFT, opacity: pin(t, 175.4, 0.5) }}>keylab.tech</div>
      <div style={{ position: 'absolute', top: 790, fontFamily: BODY, fontWeight: 700, fontSize: 28, color: MUTED, opacity: pin(t, 176.0, 0.5) }}>Marketing · Diseño · Webs · 3D · Ecommerce · Apps · Blockchain · Tokenización · IA</div>
    </AbsoluteFill>
  );
};

const H_ = (a: number, b: number, from: number, z1 = 1.05): Cut => ({ a, b, src: 'historia', from, z0: 1.0, z1 });

export const KeyLabServicios: React.FC = () => {
  const t = useT();
  const flash = [36.1, 125.71].reduce((m, a) => m + interpolate(t, [a, a + 0.03, a + 0.4], [0, 0.35, 0], clamp), 0);
  return (
    <AbsoluteFill style={{ background: '#05070D', overflow: 'hidden' }}>
      <Audio src={staticFile(`${M}voz-musica.mp3`)} />
      <Sequence from={Math.round(EY * FPS)} durationInFrames={60}><Audio src={staticFile('sfx/boom.mp3')} volume={0.5} /></Sequence>
      <Sequence from={Math.round(177.0 * FPS)} durationInFrames={95}><Audio src={staticFile('sfx/muejeje-corto.mp3')} volume={0.55} /></Sequence>
      <Fondo />

      {/* 0 · GANCHO */}
      <Gancho />
      <Ey />

      {/* 1 · HISTORIA (clips de la historia de Key Lab) */}
      <Clips a={4.38} b={33.05} cuts={[
        H_(4.38, 8.4, 9.5), H_(8.4, 11.45, 84.0), H_(11.45, 14.3, 3.0), H_(14.3, 17.75, 44.5), H_(17.75, 20.4, 37.5),
        H_(20.4, 23.0, 111.0), H_(23.0, 27.3, 158.0), H_(27.3, 31.1, 194.5), H_(31.1, 33.05, 200.0),
      ]} />

      {/* 2 · PUENTE */}
      <Muro a={33.05} at={35.95} b={36.75} />
      <Title a={33.05} b={35.9} text="Hoy hacemos" align="center" y={420} size={150} />

      {/* 3 · MARKETING Y DISEÑO */}
      <Title a={36.75} b={55.8} n="01 · MARKETING Y DISEÑO" text="Cómo te ven" y={60} size={84} />
      <Pauta a={38.5} b={44.5} />
      <Marca a={44.5} b={49.8} logos={44.6} ident={47.1} manual={48.47} />
      <UX a={49.8} b={55.8} click={55.16} />

      {/* 4 · WEBS */}
      <Title a={55.8} b={76.75} n="02 · WEBS" text="Tu casa en internet" y={60} size={84} />
      <Niveles a={58.3} b={76.75} ts={[58.48, 61.3, 63.9, 67.28]} />
      <Clips a={57.2} b={76.75} framed box={{ x: 450, y: 210, w: 1400, h: 740 }} url="aliadosconpropiedad.com" cuts={[
        { a: 57.2, b: 61.3, src: 'fl-propiedad', from: 2.0, crop: 0 }, { a: 61.3, b: 63.9, src: 'fl-propiedad', from: 25.0, crop: 80 },
        { a: 63.9, b: 67.28, src: 'fl-propiedad', from: 42.0, crop: 80 }, { a: 67.28, b: 69.6, src: 'fl-propiedad', from: 76.0, crop: 80 },
        { a: 69.6, b: 71.2, src: 'fl-propiedad', from: 145.0, crop: 80 }, { a: 71.2, b: 73.45, src: 'fl-propiedad', from: 196.0, crop: 80 },
        { a: 73.45, b: 74.2, src: 'fl-propiedad', from: 180.0, crop: 80 }, { a: 74.2, b: 76.75, src: 'fl-propiedad', from: 162.0, crop: 80 },
      ]} />
      <Tag a={68.65} b={69.6} I={PiAddressBook} text="Formularios" x={1500} y={250} />
      <Tag a={69.63} b={71.2} I={PiAppWindow} text="Panel de administración" x={1300} y={250} />
      <Tag a={71.22} b={73.4} I={PiIdentificationCard} text="Cuentas de usuario" x={1380} y={250} />
      <Tag a={73.5} b={76.6} I={PiWhatsappLogo} text="WhatsApp" x={1520} y={250} c="#25D366" />

      {/* 5 · 3D */}
      <Title a={76.75} b={80.4} n="03 · EXPERIENCIAS 3D" text="Que te recuerden" y={60} size={84} />
      <Clips a={78.4} b={99.95} cuts={[
        { a: 78.4, b: 82.6, src: 'residencial3d', from: 34.0, crop: 80, z1: 1.1 }, { a: 82.6, b: 84.7, src: 'edificio3d', from: 14.0, crop: 80, z1: 1.12 },
        { a: 84.7, b: 87.2, src: 'edificio3d', from: 62.0, crop: 80 }, { a: 87.2, b: 90.5, src: 'edificio3d', from: 88.0, crop: 80 },
        { a: 90.5, b: 93.2, src: 'mapa3d', from: 2.0, crop: 70, z1: 1.12 }, { a: 93.2, b: 94.45, src: 'yate', from: 1.0, crop: 60 },
        { a: 94.45, b: 96.95, src: 'yate', from: 30.0, crop: 60 }, { a: 96.95, b: 99.95, src: 'unity', from: 8.0, crop: 0, z0: 1.35, z1: 1.45, ox: '42% 45%' },
      ]} />
      {vis(t, 95.6, 96.95) ? <AbsoluteFill style={{ opacity: fade(t, 95.6, 96.95, 0.25) }}><Img src={staticFile(`${M}casa-render.png`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(t, [95.6, 96.95], [1.0, 1.06], clamp)})` }} /></AbsoluteFill> : null}
      <Tag a={82.66} b={84.6} I={PiSparkle} text="Efectos y animaciones" x={120} y={860} />
      <Tag a={86.47} b={90.4} I={PiBuildings} text="Piso por piso" x={120} y={860} />
      <Tag a={90.53} b={93.1} I={PiCube} text="Mapas 3D" x={120} y={860} />
      <Tag a={93.23} b={96.9} I={PiSparkle} text="Renders de cine" x={120} y={860} />
      <Tag a={97.2} b={99.9} I={PiGameController} text="Videojuegos" x={120} y={860} />

      {/* 6 · ECOMMERCE */}
      <Title a={100.0} b={109.6} n="04 · ECOMMERCE" text="Tiendas online completas" y={60} size={84} />
      <Clips a={101.0} b={109.6} framed box={{ x: 330, y: 200, w: 1260, h: 720 }} url="tutienda.com" cuts={[
        { a: 101.0, b: 103.17, src: 'ecommerce', from: 2.0, crop: 80 }, { a: 103.17, b: 104.04, src: 'ecommerce', from: 69.0, crop: 80 },
        { a: 104.04, b: 104.91, src: 'ecommerce', from: 45.0, crop: 80 }, { a: 104.91, b: 106.0, src: 'ecommerce', from: 77.0, crop: 80 },
        { a: 106.0, b: 107.1, src: 'ecommerce', from: 86.0, crop: 80 }, { a: 107.1, b: 109.6, src: 'ecommerce', from: 53.0, crop: 80 },
      ]} />
      <Tag a={103.17} b={104.0} I={PiStorefront} text="Catálogo" x={1460} y={260} />
      <Tag a={104.04} b={104.9} I={PiSparkle} text="Colecciones" x={1460} y={260} />
      <Tag a={104.91} b={106.0} I={PiAppWindow} text="Ficha de producto" x={1400} y={260} />
      <Tag a={106.01} b={107.1} I={PiShoppingCart} text="Carrito y pago" x={1420} y={260} c={GREEN} />

      {/* 7 · APPS Y PAGOS */}
      <Title a={109.6} b={123.6} n="05 · PLATAFORMAS Y APPS" text="Apps que se usan" y={110} size={92} />
      <Telefono a={110.4} b={119.9} cuts={[
        { a: 110.4, b: 114.04, src: 'keypay', from: 1.0 }, { a: 114.04, b: 115.3, src: 'keypay', from: 6.0 }, { a: 115.3, b: 116.25, src: 'keypay', from: 30.0 },
        { a: 116.25, b: 117.95, src: 'keypay', from: 36.0 }, { a: 117.95, b: 119.9, src: 'keypay', from: 10.0 },
      ]} />
      <Social a={119.9} b={123.6} perf={120.0} pubs={120.4} com={121.5} />
      {[[PiWallet, 'Billetera', 114.04], [PiChartLineUp, 'Saldo e historial', 114.78], [PiIdentificationCard, 'Verificación de identidad', 116.28], [PiCreditCard, 'Pasarelas de pago', 117.99], [PiUsersThree, 'Apps sociales', 120.25]].map(([I, l, a], i) => (
        <Tag key={i} a={a as number} b={123.6} I={I as Ic} text={l as string} x={140} y={360 + i * 112} c={i === 3 ? GREEN : ACCENT} />
      ))}

      {/* 8 · BLOCKCHAIN */}
      <Title a={123.7} b={128.8} n="06 · BLOCKCHAIN" text="Donde nos sentimos en casa" y={110} size={92} />
      <Cadena a={124.9} b={132.4} />
      <Tag a={126.74} b={128.8} I={PiLink} text="Aplicaciones descentralizadas" x={560} y={760} />
      <Tag a={128.86} b={132.4} I={PiCheckCircle} text="Trazabilidad en blockchain" x={600} y={760} c={GREEN} />
      <Clips a={132.4} b={135.55} framed box={{ x: 260, y: 150, w: 1400, h: 790 }} url="colombiainvierte.co" cuts={[{ a: 132.4, b: 135.55, src: 'colombia-invierte', from: 1.0, crop: 80, z1: 1.08 }]} />
      <Clips a={135.55} b={140.3} cuts={[{ a: 135.55, b: 140.3, src: 'historia', from: 168.5, z1: 1.08 }]} />
      <Fragmentar a={140.3} b={145.6} ts={[142.71, 143.43, 143.99]} />
      <Contrato a={145.6} b={151.2} />

      {/* 9 · Y ADEMÁS */}
      <Ademas a={151.2} b={160.4} ts={[151.75, 156.3, 157.32, 158.25]} />

      {/* 10 · CIERRE */}
      <Paises a={160.4} b={165.8} ts={[162.12, 162.84, 163.42]} />
      <Clips a={165.8} b={171.9} cuts={[{ a: 165.8, b: 171.9, src: 'historia', from: 182.0, z1: 1.08 }]} />
      <Cierre />
      <OneGag g={{ ...OUTRO_MUEJEJE, at: 177.0, dur: 7.0 }} />

      <Captions />
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(t, [KL_DUR - 0.6, KL_DUR], [0, 1], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
