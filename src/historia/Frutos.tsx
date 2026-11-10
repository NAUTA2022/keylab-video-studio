import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { PiBuildings, PiCreditCard, PiGlobeHemisphereWest, PiMegaphone, PiMoney, PiPlant, PiScales, PiTrendUp } from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';
import { EY_FOX, OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import PAL from './frutos-palabras.json';

// Key Lab · "Así tu idea de tokenizar da frutos" · vertical 1080x1920 · 61.8 s.
// Psicológico: semilla→árbol en partículas, Ey, latido y muro del problema, impacto del 5.000, el capital que se libera,
// urgencia de 7 días, el isotipo que se arma en partículas y el CTA con el muejeje.
ensureFonts();
export const FRUTOS_DUR = 61.8;
const FPS = 30;
const M = 'media/frutos/';
const INK = '#FFFFFF', MUTED = '#9AA3B8', SOFT = '#8CA0FF', ACCENT = '#2D52FF', GOLD = '#F2C14E', RED = '#FF4D5E', GREEN = '#3DDC84';
const DISPLAY = 'Anton', BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const out = (t: number, b: number, d = 0.35) => interpolate(t, [b - d, b], [1, 0], clamp);
const vis = (t: number, a: number, b: number) => t >= a && t <= b;
const EY = 4.35, EY_END = 5.2;

/* Texto que entra por palabras con máscara */
export const T: React.FC<{ a: number; b: number; text: string; size: number; y: number; color?: string; font?: 'd' | 'b'; kicker?: string; kc?: string }> = ({ a, b, text, size, y, color = INK, font = 'd', kicker, kc = GOLD }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const o = out(t, b);
  return (
    <div style={{ position: 'absolute', left: 60, top: y, width: 960, textAlign: 'center', opacity: o, filter: `blur(${(1 - o) * 8}px)` }}>
      {kicker ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 7, color: kc, marginBottom: 12, opacity: pin(t, a, 0.4) }}>{kicker}</div> : null}
      <div style={{ fontFamily: font === 'd' ? DISPLAY : BODY, fontWeight: font === 'd' ? 400 : 800, fontSize: size, lineHeight: 1.04, color, textTransform: font === 'd' ? 'uppercase' : undefined }}>
        {text.split(' ').map((w, i) => {
          const p = pin(t, a + i * 0.07, 0.6);
          return <React.Fragment key={i}>{i ? ' ' : null}<span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: size * 0.06 }}><span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)` }}>{w}</span></span></React.Fragment>;
        })}
      </div>
    </div>
  );
};

/* Subtítulos por palabra (bloques de hasta 4 palabras), palabra activa en dorado */
const CHUNKS = (() => {
  const W0 = PAL as [string, number, number][];
  const W: [string, number, number][] = [];
  W0.forEach((w) => {   // une "15" + ".000" y "10" + "%" en una sola palabra
    const last = W[W.length - 1];
    if (last && /^\d+$/.test(last[0]) && /^(\.000|%)/.test(w[0])) { last[0] = last[0] + (w[0] === '%' ? ' %' : w[0]); last[2] = w[2]; }
    else W.push([w[0], w[1], w[2]]);
  });
  const out: { a: number; b: number; w: [string, number, number][] }[] = [];
  let cur: [string, number, number][] = [];
  W.forEach((w, i) => {
    cur.push(w);
    const end = /[.,?:]$/.test(w[0]) || cur.length >= 4 || i === W.length - 1;
    if (end) { out.push({ a: cur[0][1], b: cur[cur.length - 1][2], w: cur }); cur = []; }
  });
  return out.map((c, i) => ({ ...c, b: Math.min(out[i + 1]?.a ?? c.b + 0.5, c.b + 0.35) }));
})();
const fix = (s: string) => s.replace(/^toquen/i, (m) => (m[0] === 'T' ? 'Token' : 'token')).replace(/^\.000/, '.000');
const Captions: React.FC<{ hideFrom?: number; hideTo?: number }> = ({ hideFrom = EY - 0.05, hideTo = EY_END }) => {
  const t = useT();
  if ((t >= hideFrom && t < hideTo) || t < hideTo || t > 58.4) return null;
  const c = CHUNKS.find((k) => t >= k.a - 0.05 && t < k.b);
  if (!c) return null;
  const txt: React.ReactNode[] = [];
  c.w.forEach(([w, s], i) => {
    const prevNum = false;
    const on = t >= s - 0.03;
    txt.push(<span key={i} style={{ color: on && t < (c.w[i + 1]?.[1] ?? c.b) ? GOLD : INK, opacity: on ? 1 : 0.45 }}>{prevNum ? '' : i ? ' ' : ''}{fix(w)}</span>);
  });
  return (
    <div style={{ position: 'absolute', left: 60, top: 1650, width: 960, textAlign: 'center' }}>
      <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 50, lineHeight: 1.2, textShadow: '0 3px 14px rgba(0,0,0,0.95), 0 0 2px #000' }}>{txt}</span>
    </div>
  );
};

/* Contador de dinero */
export const Monto: React.FC<{ a: number; b: number; from: number; to: number; dur?: number; y: number; color: string; size?: number; strikeAt?: number }> = ({ a, b, from, to, dur = 0.6, y, color, size = 230, strikeAt }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const v = interpolate(t, [a, a + dur], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = interpolate(t, [a + dur - 0.05, a + dur + 0.12, a + dur + 0.35], [1, 1.08, 1], clamp);
  const st = strikeAt !== undefined ? pin(t, strikeAt, 0.35) : 0;
  return (
    <div style={{ position: 'absolute', left: 0, top: y, width: 1080, textAlign: 'center', opacity: out(t, b) }}>
      <span style={{ position: 'relative', display: 'inline-block', fontFamily: DISPLAY, fontSize: size, color, lineHeight: 1, transform: `scale(${s})`, textShadow: `0 0 50px ${color}55` }}>
        US${Math.round(v).toLocaleString('es-CO')}
        <span style={{ position: 'absolute', left: -10, right: -10, top: '52%', height: 14, background: RED, transform: `scaleX(${st}) rotate(-6deg)`, transformOrigin: 'left' }} />
      </span>
    </div>
  );
};

/* Billetes que caen (el dinero se va) */
const Fuga: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <AbsoluteFill style={{ opacity: out(t, b, 0.5), pointerEvents: 'none' }}>
      {Array.from({ length: 22 }, (_, i) => {
        const r = (k: number) => { const x = Math.sin(i * 91.7 + k * 13.3) * 4375.85; return x - Math.floor(x); };
        const st = a + r(1) * (b - a - 1);
        const p = Math.max(0, t - st);
        if (p <= 0) return null;
        const y = 700 + p * p * 520 + p * 120;
        return <div key={i} style={{ position: 'absolute', left: 80 + r(2) * 900, top: y, transform: `rotate(${(r(3) - 0.5) * 120 + p * 90 * (r(4) - 0.5)}deg)`, opacity: Math.max(0, 1 - p / 2.2) }}><PiMoney size={70 + r(5) * 40} color={GREEN} /></div>;
      })}
    </AbsoluteFill>
  );
};

/* Muro del obstáculo: ladrillos que caen y bloquean */
const Muro: React.FC<{ a: number; slam: number; b: number }> = ({ a, slam, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const rows = 6, cols = 5, bw = 150, bh = 70;
  const shake = t > slam && t < slam + 0.35 ? Math.sin(t * 90) * 12 * (1 - (t - slam) / 0.35) : 0;
  return (
    <div style={{ position: 'absolute', left: 540 - (cols * bw) / 2, top: 760, width: cols * bw, height: rows * bh, opacity: out(t, b), transform: `translateX(${shake}px)` }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const row = Math.floor(i / cols), col = i % cols;
        const at = a + (rows - 1 - row) * 0.32 + col * 0.05;
        const p = interpolate(t, [at, at + 0.3], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        const off = row % 2 ? bw / 2 : 0;
        return <div key={i} style={{ position: 'absolute', left: col * bw - off + (row % 2 ? 0 : 0), top: (rows - 1 - row) * bh - (1 - p) * 900, width: bw - 8, height: bh - 8, borderRadius: 8, background: t >= slam ? '#5A2330' : '#2A2F40', border: `2px solid ${t >= slam ? RED : '#454C63'}`, opacity: p }} />;
      })}
      {t >= slam ? <div style={{ position: 'absolute', top: rows * bh / 2 - 60, width: '100%', textAlign: 'center', fontFamily: DISPLAY, fontSize: 110, color: RED, transform: `scale(${interpolate(t, [slam, slam + 0.2], [1.6, 1], clamp)})` }}>OBSTÁCULO</div> : null}
    </div>
  );
};

/* Marco de navegador con la captura real de la tokenizadora */
export const Navegador: React.FC<{ children: React.ReactNode; o: number; s: number; url?: string }> = ({ children, o, s, url = 'tu-tokenizadora.com' }) => (
  <div style={{ position: 'absolute', left: 50, top: 640, width: 980, height: 760, opacity: o, transform: `scale(${s})` }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden', background: '#F6F7FA', border: '2px solid rgba(140,160,255,0.55)', boxShadow: '0 40px 120px rgba(45,82,255,0.45)' }}>
      <div style={{ position: 'relative', zIndex: 2, height: 46, background: '#151A2A', display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 22 }}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}<div style={{ marginLeft: 20, fontFamily: BODY, fontWeight: 700, fontSize: 20, color: MUTED }}>{url}</div></div>
      <div style={{ position: 'absolute', left: 0, top: 46, width: 980, height: 714, overflow: 'hidden' }}>{children}</div>
    </div>
  </div>
);
const IMG_W = 1600, IMG_H = 926, VW = 980, VH = 714;
/* Cámara sobre la captura: foco (x,y) en píxeles de la imagen y zoom */
export const Captura: React.FC<{ fx: number; fy: number; z: number; brand?: string; brandK?: number }> = ({ fx, fy, z, brand, brandK = 0 }) => {
  const tx = VW / 2 - fx * z, ty = VH / 2 - fy * z;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: IMG_W, height: IMG_H, transform: `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: '0 0' }}>
      <Img src={staticFile(`${M}plataforma.png`)} style={{ width: IMG_W, height: IMG_H, display: 'block' }} />
      {brand ? (
        <div style={{ position: 'absolute', left: 8, top: 12, width: 175, height: 48, background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: brandK % 2 ? GOLD : '#111', color: '#fff', fontFamily: BODY, fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{brand[0]}</div>
          <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 19, color: '#111', whiteSpace: 'nowrap' }}>{brand}</span>
        </div>
      ) : null}
    </div>
  );
};

/* Marca blanca: la misma tokenizadora con el nombre de cada cliente */
export const MarcaBlanca: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const names = ['KEYLAB', 'TU MARCA', 'AGROTOKEN', 'INMO+', 'TU MARCA'];
  const k = Math.min(names.length - 1, Math.floor((t - a) / 0.75));
  const p = pin(t, a, 0.7);
  const z = interpolate(t, [a, a + 0.8, b], [0.8, 1.55, 1.7], { ...clamp, easing: ease });
  const fx = interpolate(t, [a, a + 0.8], [800, 230], { ...clamp, easing: ease });
  const fy = interpolate(t, [a, a + 0.8], [463, 230], { ...clamp, easing: ease });
  const pop = pin(t, a + k * 0.75, 0.25);
  return (
    <Navegador o={out(t, b) * p} s={0.92 + 0.08 * p} url={`${names[k].toLowerCase().replace(/[^a-z]/g, '') || 'tumarca'}.com`}>
      <Captura fx={fx} fy={fy} z={z} brand={names[k]} brandK={k} />
      <div style={{ position: 'absolute', right: 30, bottom: 30, padding: '10px 22px', borderRadius: 999, background: ACCENT, fontFamily: BODY, fontWeight: 900, fontSize: 26, color: INK, transform: `scale(${0.85 + 0.15 * pop})` }}>Tu nombre aquí</div>
    </Navegador>
  );
};

/* Recorrido por la tokenizadora (captura real) */
const Plataforma: React.FC<{ a: number; b: number; keys: number[] }> = ({ a, b, keys }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const p = pin(t, a, 0.7);
  const F = { fx: 800, fy: 463, z: 0.62 }, H = { fx: 920, fy: 230, z: 1.15 }, C = { fx: 920, fy: 700, z: 1.0 }, F2 = { fx: 800, fy: 463, z: 0.66 };
  const KF = [
    { t: a, ...F }, { t: keys[1] - 0.3, ...F },
    { t: keys[1] + 0.5, ...H }, { t: keys[2] - 0.3, ...H },
    { t: keys[2] + 0.5, ...C }, { t: keys[3] - 0.3, ...C },
    { t: keys[3] + 0.5, ...F2 },
  ];
  const at = (k: 'fx' | 'fy' | 'z') => interpolate(t, KF.map((q, i) => (i === 0 ? q.t : q.t)), KF.map((q) => q[k]), { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const drift = (t - a) * 6;
  return (
    <Navegador o={out(t, b) * p} s={0.92 + 0.08 * p}>
      <Captura fx={at('fx') + drift} fy={at('fy')} z={at('z')} />
    </Navegador>
  );
};

/* Chip que aparece */
export const Chip: React.FC<{ a: number; b: number; text: string; y: number; color?: string }> = ({ a, b, text, y, color = ACCENT }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const p = pin(t, a, 0.45);
  return (
    <div style={{ position: 'absolute', top: y, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: out(t, b) * p }}>
      <div style={{ background: color, borderRadius: 999, padding: '16px 38px', fontFamily: BODY, fontWeight: 900, fontSize: 34, color: INK, transform: `scale(${0.8 + 0.2 * p})`, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>{text}</div>
    </div>
  );
};

/* Barra del capital: la tecnología se encoge y el resto se libera en destinos */
const Capital: React.FC<{ a: number; shrink: number; b: number; dest: number[] }> = ({ a, shrink, b, dest }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const tech = interpolate(t, [shrink, shrink + 1.0], [1, 0.17], { ...clamp, easing: ease });
  const items = [
    { k: 'Regulación legal', c: SOFT, I: PiScales },
    { k: 'Marketing', c: GOLD, I: PiMegaphone },
    { k: 'Activos', c: GREEN, I: PiBuildings },
    { k: 'Expansión', c: '#C38CFF', I: PiGlobeHemisphereWest },
  ];
  const rest = 1 - 0.17;
  return (
    <div style={{ position: 'absolute', left: 70, top: 720, width: 940, opacity: out(t, b) * pin(t, a, 0.5) }}>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, letterSpacing: 6, color: MUTED, marginBottom: 16 }}>TU CAPITAL</div>
      <div style={{ position: 'relative', height: 120, borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.18)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${tech * 100}%`, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontWeight: 900, fontSize: 30, color: INK, overflow: 'hidden', whiteSpace: 'nowrap' }}>{tech > 0.4 ? 'TODO EN TECNOLOGÍA' : 'TECH'}</div>
        {items.map((it, i) => {
          const p = pin(t, dest[i], 0.5);
          return <div key={it.k} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(0.17 + (rest / 4) * i) * 100}%`, width: `${(rest / 4) * 100 * p}%`, background: it.c, borderLeft: '3px solid #04060C' }} />;
        })}
      </div>
      <div style={{ marginTop: 50, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
        {items.map((it, i) => {
          const p = pin(t, dest[i], 0.5);
          return (
            <div key={it.k} style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`, background: 'rgba(255,255,255,0.05)', border: `2px solid ${it.c}`, borderRadius: 24, padding: '20px 22px' }}>
              <it.I size={60} color={it.c} /><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 36, color: INK }}>{it.k}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* Gráfico que crece */
const Crece: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const p = interpolate(t, [a, a + 2.4], [0, 1], { ...clamp, easing: ease });
  const pts = [[0, 420], [140, 380], [280, 395], [420, 300], [560, 250], [700, 150], [860, 40]];
  const n = pts.length - 1, f = p * n, k = Math.floor(f);
  const vis2 = pts.slice(0, k + 1).concat(k < n ? [[pts[k][0] + (pts[k + 1][0] - pts[k][0]) * (f - k), pts[k][1] + (pts[k + 1][1] - pts[k][1]) * (f - k)]] : []);
  const d = vis2.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' ');
  const last = vis2[vis2.length - 1];
  return (
    <div style={{ position: 'absolute', left: 110, top: 800, width: 860, height: 460, opacity: out(t, b) }}>
      <svg width={860} height={460} style={{ overflow: 'visible' }}>
        <path d={d} fill="none" stroke={GREEN} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 18px ${GREEN})` }} />
        <circle cx={last[0]} cy={last[1]} r={18} fill={GREEN} />
      </svg>
      <div style={{ position: 'absolute', left: last[0] - 40, top: last[1] - 120, opacity: pin(t, a + 1.6, 0.5) }}><PiTrendUp size={90} color={GREEN} /></div>
    </div>
  );
};

/* Urgencia: 7 días que caen, sello -10 %, 4 pagos */
const Urgencia: React.FC<{ a: number; d7: number; d10: number; d4: number; b: number }> = ({ a, d7, d10, d4, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const day = Math.max(1, 7 - Math.floor(Math.max(0, t - d7) / 0.55));
  const flip = ((t - d7) % 0.55) / 0.55;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out(t, b) }}>
      <div style={{ position: 'absolute', left: 290, top: 600, width: 500, height: 420, borderRadius: 34, background: '#10131F', border: '3px solid rgba(255,255,255,0.18)', opacity: pin(t, a, 0.5), overflow: 'hidden' }}>
        <div style={{ height: 90, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontWeight: 900, fontSize: 36, letterSpacing: 6, color: INK }}>FORMALIZA EN</div>
        <div style={{ textAlign: 'center', fontFamily: DISPLAY, fontSize: 230, color: INK, lineHeight: 1.25, transform: t > d7 ? `rotateX(${flip < 0.15 ? (1 - flip / 0.15) * 70 : 0}deg)` : undefined }}>{t >= d7 ? day : 7}</div>
        <div style={{ position: 'absolute', bottom: 18, width: '100%', textAlign: 'center', fontFamily: BODY, fontWeight: 900, fontSize: 32, color: MUTED }}>DÍAS</div>
      </div>
      {t >= d10 ? (
        <div style={{ position: 'absolute', left: 640, top: 520, transform: `rotate(-14deg) scale(${interpolate(t, [d10, d10 + 0.18], [2.2, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) })})`, border: `8px solid ${GOLD}`, borderRadius: 28, padding: '10px 26px', fontFamily: DISPLAY, fontSize: 120, color: GOLD, background: 'rgba(4,6,12,0.85)' }}>-10%</div>
      ) : null}
      {t >= d4 ? (
        <div style={{ position: 'absolute', left: 90, top: 1120, width: 900 }}>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
            {[0, 1, 2, 3].map((i) => {
              const p = pin(t, d4 + i * 0.12, 0.35);
              return <div key={i} style={{ width: 190, height: 150, borderRadius: 26, background: i === 0 ? ACCENT : 'rgba(45,82,255,0.25)', border: `3px solid ${ACCENT}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})` }}><PiCreditCard size={60} color={INK} /><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: INK }}>Pago {i + 1}</span></div>;
            })}
          </div>
          <div style={{ marginTop: 24, textAlign: 'center', fontFamily: DISPLAY, fontSize: 80, color: INK, opacity: pin(t, d4 + 0.5, 0.4) }}>HASTA 4 PAGOS FLEXIBLES</div>
        </div>
      ) : null}
    </div>
  );
};

/* Ey. */
export const Ey: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  if (t < at || t >= until) return null;
  const s = interpolate(t, [at, at + 0.2], [1.6, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <AbsoluteFill style={{ background: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 300, color: INK, transform: `scale(${s})`, lineHeight: 1, marginTop: -300 }}>Ey.</div>
      <OneGag g={{ ...EY_FOX, at, dur: until - at, x: 0.66, y: 0.74, size: 0.62 }} />
    </AbsoluteFill>
  );
};

/* Fondo vivo: rejilla de puntos + resplandor + latido */
const Fondo: React.FC = () => {
  const t = useT();
  const beat = t > 5.2 && t < 17.6 ? Math.pow(Math.max(0, Math.sin(((t - 5.2) / 0.8) * Math.PI)), 12) : 0;
  const tint = t < 17.6 && t > 5.2 ? `rgba(255,77,94,${0.1 + beat * 0.22})` : t >= 17.6 && t < 43.5 ? 'rgba(45,82,255,0.22)' : 'rgba(242,193,78,0.16)';
  return (
    <AbsoluteFill style={{ background: '#05070D' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.3px, transparent 1.4px)', backgroundSize: '46px 46px', backgroundPosition: `0px ${(t * 14) % 46}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 55% at 50% 50%, ${tint} 0%, rgba(5,7,13,0) 70%)` }} />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${200 + beat * 160}px rgba(0,0,0,0.9)` }} />
    </AbsoluteFill>
  );
};

export const Frutos: React.FC = () => {
  const t = useT();
  const flash = interpolate(t, [21.78, 21.81, 22.3], [0, 0.6, 0], clamp) + interpolate(t, [52.15, 52.18, 52.7], [0, 0.5, 0], clamp);
  const shake = (at: number) => (t > at && t < at + 0.3 ? Math.sin(t * 110) * 14 * (1 - (t - at) / 0.3) : 0);
  const sx = shake(21.81) + shake(52.18) + shake(6.75) * 0.5;
  return (
    <AbsoluteFill style={{ background: '#05070D', overflow: 'hidden' }}>
      <Audio src={staticFile(`${M}voz-musica.mp3`)} />
      <Sequence from={Math.round(EY * FPS)} durationInFrames={60}><Audio src={staticFile('sfx/boom.mp3')} volume={0.55} /></Sequence>
      <Sequence from={Math.round(8.0 * FPS)} durationInFrames={45}><Audio src={staticFile('sfx/bruh.mp3')} volume={0.45} /></Sequence>
      <Sequence from={Math.round(58.6 * FPS)} durationInFrames={95}><Audio src={staticFile('sfx/muejeje-corto.mp3')} volume={0.6} /></Sequence>
      <AbsoluteFill style={{ transform: `translateX(${sx}px)` }}>
        <Fondo />

        {/* 1 · HOOK: semilla → árbol en partículas */}
        {t < EY + 0.1 ? <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: out(t, EY + 0.1, 0.2) }}><OffthreadVideo src={staticFile(`${M}naranjo-particulas.mp4`)} muted /></AbsoluteFill> : null}
        <T a={0.0} b={EY} text="Así tu idea de tokenizar" size={92} y={170} />
        <T a={1.55} b={EY} text="da frutos" size={170} y={300} color={GOLD} />
        <T a={1.95} b={EY} text="sin gastar una fortuna para comenzar" size={56} y={1500} font="b" color={INK} />
        <Ey at={EY} until={EY_END} />

        {/* 2 · PROBLEMA */}
        <T a={5.2} b={12.6} kicker="LO QUE COBRAN MUCHAS EMPRESAS" kc={RED} text="Por una plataforma de tokenización" size={74} y={220} />
        <Monto a={6.72} b={7.4} from={0} to={15000} dur={0.35} y={640} color={RED} />
        <Monto a={7.4} b={12.6} from={15000} to={30000} dur={0.4} y={640} color={RED} />
        <Fuga a={7.9} b={12.6} />
        <OneGag g={{ image: 'memes/zorro/zorro-asustado.png', style: 'cutout', at: 8.0, dur: 2.6, x: 0.76, y: 0.83, size: 0.42, from: 'bottom', bounce: true } as never} />
        <T a={12.7} b={17.5} text="¿Por qué la tecnología tiene que ser el mayor" size={78} y={240} />
        <Muro a={13.0} slam={14.88} b={17.5} />
        <T a={15.6} b={17.5} text="para hacer crecer tu negocio?" size={54} y={1300} font="b" color={MUTED} />

        {/* 3 · PROPUESTA */}
        <T a={17.65} b={21.75} kicker="SOLUCIÓN DE" text="Marca blanca" size={150} y={300} color={INK} />
        <MarcaBlanca a={17.9} b={21.75} />
        <T a={21.81} b={29.7} kicker="TU PROPIA TOKENIZADORA" text="por solo" size={64} y={200} font="b" />
        <Monto a={21.81} b={23.5} from={30000} to={5000} dur={0.45} y={330} color={GOLD} size={250} />
        {t >= 23.5 && t < 29.7 ? <div style={{ position: 'absolute', top: 300, width: 1080, textAlign: 'center', fontFamily: DISPLAY, fontSize: 170, color: GOLD, opacity: out(t, 29.7) }}>US$5.000</div> : null}
        <Plataforma a={23.4} b={29.7} keys={[23.4, 25.35, 26.8, 28.25]} />
        <Chip a={23.6} b={25.3} text="Plataforma completa" y={1450} />
        <Chip a={25.35} b={26.75} text="Experiencia visual premium" y={1450} />
        <Chip a={26.8} b={28.2} text="Funcionalidades competitivas" y={1450} />
        <Chip a={28.25} b={29.7} text="Adaptada a tu modelo de negocio" y={1450} color="#1F8F5A" />

        {/* 4 · DIFERENCIADOR */}
        <T a={29.9} b={38.0} kicker="Y AQUÍ ESTÁ LO IMPORTANTE" text="Tu capital no se va en tecnología" size={84} y={230} />
        <Capital a={30.6} shrink={31.4} b={38.0} dest={[34.13, 35.18, 35.84, 36.89]} />
        <T a={38.2} b={43.4} text="No gastes todo en la herramienta" size={84} y={230} color={MUTED} />
        <T a={40.9} b={43.4} text="Recursos para crecer" size={110} y={560} color={GREEN} />
        <Crece a={40.4} b={43.4} />

        {/* 5 · CIERRE con urgencia */}
        <T a={43.7} b={50.9} kicker="ADEMÁS" text="Primeros 7 días" size={110} y={200} />
        <Urgencia a={44.2} d7={46.3} d10={47.5} d4={49.5} b={50.9} />
        {t >= 50.6 && t < 56.5 ? <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: out(t, 56.5, 0.4) }}><Sequence from={Math.round(50.6 * FPS)}><OffthreadVideo src={staticFile(`${M}logo-particulas.mp4`)} muted /></Sequence></AbsoluteFill> : null}
        <T a={50.96} b={56.5} text="Tu tokenizadora" size={120} y={1080} />
        {t >= 52.18 && t < 56.5 ? <div style={{ position: 'absolute', top: 1230, width: 1080, textAlign: 'center', fontFamily: DISPLAY, fontSize: 200, color: GOLD, opacity: out(t, 56.5), transform: `scale(${interpolate(t, [52.18, 52.4], [1.5, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) })})`, textShadow: '0 0 60px rgba(242,193,78,0.5)' }}>US$5.000</div> : null}

        {/* 6 · CTA */}
        {t >= 56.55 ? (
          <div style={{ position: 'absolute', top: 360, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: pin(t, 56.55, 0.6) }}>
            <Img src={staticFile('brand/isotipo-cromo.png')} style={{ width: 230, filter: 'drop-shadow(0 0 40px rgba(140,160,255,0.4))' }} />
            <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 320, marginTop: 30 }} />
            <div style={{ marginTop: 70, background: ACCENT, borderRadius: 999, padding: '30px 60px', fontFamily: BODY, fontWeight: 900, fontSize: 46, color: INK, textAlign: 'center', transform: `scale(${0.9 + 0.1 * pin(t, 56.9, 0.5)})`, boxShadow: '0 20px 60px rgba(45,82,255,0.5)' }}>Solicita una evaluación<br />de tu proyecto</div>
            <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: SOFT }}>keylab.tech</div>
          </div>
        ) : null}
        <OneGag g={{ ...OUTRO_MUEJEJE, at: 58.6, dur: 3.2 }} />

        <Captions />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(t, [FRUTOS_DUR - 0.5, FRUTOS_DUR], [0, 1], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
