import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, Img } from 'remotion';
import {
  PiArmchair, PiBank, PiBookOpen, PiBuildingsBold, PiCoins, PiCube, PiGearSix, PiHardDrives, PiHourglassHigh, PiLightbulb, PiPlant,
  PiRocketLaunch, PiStamp, PiTreeStructure, PiTrophy, PiUsersThree,
} from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';
import { OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import { Chip, Ey, MarcaBlanca, Monto, T } from './Frutos';
import PAL from './posicion-palabras.json';

// Key Lab · "No llegues tarde a la próxima transformación financiera" · vertical 1080x1920 · 73 s.
// Psicológico: dos tipos de empresarios (espera vs construye), Internet → Bitcoin → tokenización en partículas,
// tu compañía y su ecosistema, la idea que no basta, la tokenizadora real por US$30.000 y la pregunta de la posición.
ensureFonts();
export const POSICION_DUR = 73.0;
const FPS = 30;
const M = 'media/posicion/';
const INK = '#FFFFFF', MUTED = '#9AA3B8', SOFT = '#8CA0FF', ACCENT = '#2D52FF', GOLD = '#F2C14E', RED = '#FF4D5E', GREEN = '#3DDC84', BTC = '#F7931A';
const DISPLAY = 'Anton', BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const out = (t: number, b: number, d = 0.35) => interpolate(t, [b - d, b], [1, 0], clamp);
const vis = (t: number, a: number, b: number) => t >= a && t <= b;
const EY = 6.46, EY_END = 7.46;

const CHUNKS = (() => {
  const W: [string, number, number][] = [];
  (PAL as [string, number, number][]).forEach((w) => {
    const last = W[W.length - 1];
    if (last && /^\d+$/.test(last[0]) && /^(\.000|%)/.test(w[0])) { last[0] += w[0]; last[2] = w[2]; } else W.push([w[0], w[1], w[2]]);
  });
  const o: { a: number; b: number; w: [string, number, number][] }[] = [];
  let cur: [string, number, number][] = [];
  W.forEach((w, i) => { cur.push(w); if (/[.,?:]$/.test(w[0]) || cur.length >= 4 || i === W.length - 1) { o.push({ a: cur[0][1], b: cur[cur.length - 1][2], w: cur }); cur = []; } });
  return o.map((c, i) => ({ ...c, b: Math.min(o[i + 1]?.a ?? c.b + 0.5, c.b + 0.35) }));
})();
const fix = (s: string) => s.replace(/^toquen/i, (m) => (m[0] === 'T' ? 'Token' : 'token'));
const Captions: React.FC = () => {
  const t = useT();
  if (t < EY_END || t > 69.6) return null;
  const c = CHUNKS.find((k) => t >= k.a - 0.05 && t < k.b);
  if (!c) return null;
  return (
    <div style={{ position: 'absolute', left: 60, top: 1650, width: 960, textAlign: 'center' }}>
      <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 50, lineHeight: 1.2, textShadow: '0 3px 14px rgba(0,0,0,0.95), 0 0 2px #000' }}>
        {c.w.map(([w, s], i) => { const on = t >= s - 0.03; return <span key={i} style={{ color: on && t < (c.w[i + 1]?.[1] ?? c.b) ? GOLD : INK, opacity: on ? 1 : 0.45 }}>{i ? ' ' : ''}{fix(w)}</span>; })}
      </span>
    </div>
  );
};

/* Dos tipos de empresarios: el que espera (arriba, gris) y el que construye (abajo, dorado) */
const DosTipos: React.FC<{ a1: number; a2: number; glow: number; b: number }> = ({ a1, a2, glow, b }) => {
  const t = useT();
  if (!vis(t, a1, b)) return null;
  const p1 = pin(t, a1, 0.6), p2 = pin(t, a2, 0.6);
  const blocks = 9;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out(t, b) }}>
      <div style={{ position: 'absolute', left: 60, top: 420, width: 960, height: 520, borderRadius: 36, background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.12)', opacity: p1, filter: t > a2 ? 'grayscale(1) brightness(0.6)' : undefined }}>
        <div style={{ position: 'absolute', left: 50, top: 40, fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: MUTED }}>LOS QUE ESPERAN</div>
        <div style={{ position: 'absolute', left: 120, top: 150 }}><PiArmchair size={280} color={MUTED} /></div>
        <div style={{ position: 'absolute', left: 620, top: 160, transform: `rotate(${(t - a1) * 90}deg)` }}><PiHourglassHigh size={220} color={MUTED} /></div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 990, width: 960, height: 560, borderRadius: 36, background: 'rgba(242,193,78,0.07)', border: `3px solid ${t > glow ? GOLD : 'rgba(242,193,78,0.4)'}`, opacity: p2, boxShadow: t > glow ? '0 0 80px rgba(242,193,78,0.35)' : 'none' }}>
        <div style={{ position: 'absolute', left: 50, top: 40, fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: GOLD }}>LOS QUE CONSTRUYEN</div>
        {Array.from({ length: blocks }, (_, i) => {
          const at = a2 + 0.15 + i * 0.22;
          const p = interpolate(t, [at, at + 0.25], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
          const row = Math.floor(i / 3), col = i % 3;
          return <div key={i} style={{ position: 'absolute', left: 300 + col * 130, top: 400 - row * 110 - (1 - p) * 200, width: 116, height: 96, borderRadius: 14, background: GOLD, opacity: p, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PiCube size={60} color="#3A2A05" /></div>;
        })}
      </div>
    </div>
  );
};

/* Línea de tiempo Internet → Bitcoin → Tokenización */
const Linea: React.FC<{ at: number[]; b: number }> = ({ at, b }) => {
  const t = useT();
  if (!vis(t, at[0], b)) return null;
  const labels = [['INTERNET', '#5AA0FF'], ['BITCOIN', BTC], ['TOKENIZACIÓN', GOLD]];
  const prog = interpolate(t, [at[0], at[2]], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 90, top: 1440, width: 900, height: 120, opacity: out(t, b) }}>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 30, height: 6, background: 'rgba(255,255,255,0.15)' }} />
      <div style={{ position: 'absolute', left: 60, top: 30, height: 6, width: `${prog * 780}px`, background: GOLD }} />
      {labels.map(([k, c], i) => {
        const p = pin(t, at[i], 0.4);
        return (
          <div key={k} style={{ position: 'absolute', left: 60 + i * 390 - 90, top: 0, width: 180, textAlign: 'center', opacity: 0.35 + 0.65 * p }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, margin: '0 auto', background: p > 0.5 ? c : '#1A1F2E', border: `4px solid ${c}`, transform: `scale(${0.8 + 0.2 * p})` }} />
            <div style={{ marginTop: 10, fontFamily: BODY, fontWeight: 900, fontSize: 26, color: c }}>{k}</div>
          </div>
        );
      })}
    </div>
  );
};

/* Tarjetas que se apilan */
const Pila: React.FC<{ items: string[]; at: number[]; b: number; y?: number }> = ({ items, at, b, y = 600 }) => {
  const t = useT();
  if (!vis(t, at[0], b)) return null;
  return (
    <div style={{ position: 'absolute', left: 90, top: y, width: 900, opacity: out(t, b) }}>
      {items.map((k, i) => {
        const p = pin(t, at[i], 0.5);
        return <div key={k} style={{ marginBottom: 28, padding: '34px 40px', borderRadius: 30, background: i === items.length - 1 ? 'rgba(242,193,78,0.12)' : 'rgba(45,82,255,0.12)', border: `3px solid ${i === items.length - 1 ? GOLD : ACCENT}`, fontFamily: BODY, fontWeight: 900, fontSize: 48, color: INK, opacity: p, transform: `translateX(${(1 - p) * 120}px)` }}>{k}</div>;
      })}
    </div>
  );
};

/* Tu compañía: especialidades y ecosistema alrededor */
const Compania: React.FC<{ a: number; esp: number[]; eco: number[]; b: number }> = ({ a, esp, eco, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const E = [{ k: 'Inmobiliaria', I: PiBuildingsBold }, { k: 'Agroindustrial', I: PiPlant }, { k: 'Financiera', I: PiBank }];
  const sel = esp.filter((x) => t >= x).length - 1;
  const C = [{ k: 'Tu marca', I: PiStamp }, { k: 'Emisores', I: PiUsersThree }, { k: 'Proyectos', I: PiCoins }, { k: 'Ecosistema', I: PiTreeStructure }];
  const cx = 540, cy = 1060, R = 330;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out(t, b) }}>
      <div style={{ position: 'absolute', left: 90, top: 560, width: 900, display: 'flex', gap: 20, justifyContent: 'center' }}>
        {E.map((e, i) => {
          const p = pin(t, esp[i], 0.4);
          return <div key={e.k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px', borderRadius: 999, background: sel === i ? GOLD : 'rgba(255,255,255,0.06)', border: `2px solid ${sel >= i ? GOLD : 'rgba(255,255,255,0.2)'}`, opacity: 0.4 + 0.6 * p, transform: `scale(${0.9 + 0.1 * p})` }}><e.I size={40} color={sel === i ? '#2A1E03' : GOLD} /><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, color: sel === i ? '#2A1E03' : INK }}>{e.k}</span></div>;
        })}
      </div>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {C.map((c, i) => {
          const ang = (-90 + i * 90) * Math.PI / 180;
          const p = pin(t, eco[i], 0.6);
          return <line key={c.k} x1={cx} y1={cy} x2={cx + Math.cos(ang) * R * p} y2={cy + Math.sin(ang) * R * p} stroke={GOLD} strokeWidth={4} strokeDasharray="12 10" strokeDashoffset={-t * 40} opacity={0.8} />;
        })}
      </svg>
      <div style={{ position: 'absolute', left: cx - 150, top: cy - 150, width: 300, height: 300, borderRadius: 150, background: 'radial-gradient(circle, #2D52FF 0%, #16264F 100%)', border: `4px solid ${SOFT}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${pin(t, a, 0.6)})`, boxShadow: '0 0 80px rgba(45,82,255,0.55)' }}>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 4, color: SOFT }}>TU</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 64, color: INK, lineHeight: 1 }}>COMPAÑÍA</div>
      </div>
      {C.map((c, i) => {
        const ang = (-90 + i * 90) * Math.PI / 180;
        const p = pin(t, eco[i], 0.5);
        return <div key={c.k} style={{ position: 'absolute', left: cx + Math.cos(ang) * R - 110, top: cy + Math.sin(ang) * R - 80, width: 220, textAlign: 'center', opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}><div style={{ width: 120, height: 120, borderRadius: 60, margin: '0 auto', background: '#121726', border: `3px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><c.I size={64} color={GOLD} /></div><div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 900, fontSize: 30, color: INK }}>{c.k}</div></div>;
      })}
    </div>
  );
};

/* La idea no basta: el foco se apaga y la infraestructura se enciende */
const Idea: React.FC<{ a: number; on: number; b: number }> = ({ a, on, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const dim = interpolate(t, [a + 0.8, a + 1.6], [1, 0.25], clamp);
  const pOn = pin(t, on, 0.6);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out(t, b) }}>
      <div style={{ position: 'absolute', left: 140, top: 700, opacity: dim, filter: `drop-shadow(0 0 ${40 * dim}px ${GOLD})` }}><PiLightbulb size={300} color={GOLD} /></div>
      <div style={{ position: 'absolute', left: 140, top: 1010, width: 300, textAlign: 'center', fontFamily: BODY, fontWeight: 900, fontSize: 36, color: MUTED }}>Una idea</div>
      <div style={{ position: 'absolute', left: 620, top: 700, opacity: 0.25 + 0.75 * pOn, filter: `drop-shadow(0 0 ${50 * pOn}px ${SOFT})` }}><PiHardDrives size={300} color={SOFT} /></div>
      <div style={{ position: 'absolute', left: 700, top: 650, transform: `rotate(${t * 120}deg)`, opacity: pOn }}><PiGearSix size={130} color={GOLD} /></div>
      <div style={{ position: 'absolute', left: 600, top: 1010, width: 340, textAlign: 'center', fontFamily: BODY, fontWeight: 900, fontSize: 36, color: pOn > 0.5 ? INK : MUTED }}>Infraestructura</div>
    </div>
  );
};

/* Algunos estudian, otros ya construyen */
const DosCarriles: React.FC<{ a1: number; a2: number; b: number }> = ({ a1, a2, b }) => {
  const t = useT();
  if (!vis(t, a1, b)) return null;
  const p1 = pin(t, a1, 0.5), p2 = pin(t, a2, 0.5);
  const rise = interpolate(t, [a2, b], [0, 380], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out(t, b) }}>
      <div style={{ position: 'absolute', left: 100, top: 700, width: 400, height: 760, borderRadius: 36, background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.12)', opacity: p1 }}>
        <div style={{ textAlign: 'center', marginTop: 40, fontFamily: BODY, fontWeight: 900, fontSize: 32, color: MUTED }}>Algunos estudian</div>
        <div style={{ position: 'absolute', left: 90, top: 400, transform: `rotate(${Math.sin(t * 2) * 4}deg)` }}><PiBookOpen size={220} color={MUTED} /></div>
      </div>
      <div style={{ position: 'absolute', left: 580, top: 700, width: 400, height: 760, borderRadius: 36, background: 'rgba(61,220,132,0.07)', border: `3px solid ${GREEN}`, opacity: p2, overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginTop: 40, fontFamily: BODY, fontWeight: 900, fontSize: 32, color: GREEN }}>Otros ya construyen</div>
        <div style={{ position: 'absolute', left: 90, top: 440 - rise }}><PiRocketLaunch size={220} color={GREEN} /></div>
      </div>
    </div>
  );
};

/* Podio: ¿qué posición quieres ocupar? */
const Podio: React.FC<{ a: number; hit: number; b: number }> = ({ a, hit, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const P = [{ n: 2, h: 300, x: 140 }, { n: 1, h: 440, x: 400 }, { n: 3, h: 220, x: 660 }];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out(t, b) }}>
      {P.map((q, i) => {
        const p = pin(t, a + i * 0.15, 0.6);
        const win = q.n === 1 && t >= hit;
        return (
          <div key={q.n} style={{ position: 'absolute', left: q.x, top: 1500 - q.h * p, width: 260, height: q.h * p, borderRadius: '24px 24px 0 0', background: win ? GOLD : 'rgba(255,255,255,0.08)', border: `3px solid ${win ? GOLD : 'rgba(255,255,255,0.2)'}`, boxShadow: win ? '0 0 90px rgba(242,193,78,0.6)' : 'none', display: 'flex', justifyContent: 'center' }}>
            <span style={{ marginTop: 20, fontFamily: DISPLAY, fontSize: 110, color: win ? '#2A1E03' : MUTED }}>{q.n}</span>
          </div>
        );
      })}
      {t >= hit ? <div style={{ position: 'absolute', left: 470, top: 860, transform: `scale(${interpolate(t, [hit, hit + 0.25], [1.6, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) })}) translateY(${Math.sin(t * 3) * 8}px)` }}><PiTrophy size={140} color={GOLD} /></div> : null}
    </div>
  );
};

const Fondo: React.FC = () => {
  const t = useT();
  const tint = t < EY ? 'rgba(242,193,78,0.12)' : t < 17.6 ? 'rgba(90,160,255,0.16)' : t < 42 ? 'rgba(45,82,255,0.2)' : t < 53 ? 'rgba(242,193,78,0.16)' : 'rgba(45,82,255,0.18)';
  return (
    <AbsoluteFill style={{ background: '#05070D' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.3px, transparent 1.4px)', backgroundSize: '46px 46px', backgroundPosition: `0px ${(t * 14) % 46}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 55% at 50% 50%, ${tint} 0%, rgba(5,7,13,0) 70%)` }} />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 220px rgba(0,0,0,0.9)' }} />
    </AbsoluteFill>
  );
};

export const Posicion: React.FC = () => {
  const t = useT();
  const flash = interpolate(t, [13.12, 13.15, 13.6], [0, 0.35, 0], clamp) + interpolate(t, [45.51, 45.54, 46.1], [0, 0.6, 0], clamp) + interpolate(t, [64.6, 64.63, 65.2], [0, 0.55, 0], clamp);
  const shake = (at: number) => (t > at && t < at + 0.3 ? Math.sin(t * 110) * 14 * (1 - (t - at) / 0.3) : 0);
  const sx = shake(45.54) + shake(64.63);
  return (
    <AbsoluteFill style={{ background: '#05070D', overflow: 'hidden' }}>
      <Audio src={staticFile(`${M}voz-musica.mp3`)} />
      <Sequence from={Math.round(EY * FPS)} durationInFrames={60}><Audio src={staticFile('sfx/boom.mp3')} volume={0.55} /></Sequence>
      <Sequence from={Math.round(69.9 * FPS)} durationInFrames={95}><Audio src={staticFile('sfx/muejeje-corto.mp3')} volume={0.6} /></Sequence>
      <AbsoluteFill style={{ transform: `translateX(${sx}px)` }}>
        <Fondo />

        {/* 1 · HOOK */}
        <T a={0.0} b={EY} text="Hay dos tipos de empresarios" size={96} y={170} />
        <DosTipos a1={1.35} a2={3.62} glow={5.92} b={EY} />
        <Ey at={EY} until={EY_END} />

        {/* 2 · CONTEXTO: Internet → Bitcoin → tokenización (partículas) */}
        {t >= EY_END && t < 17.0 ? <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: out(t, 17.0, 0.5) }}><Sequence from={Math.round(EY_END * FPS)}><OffthreadVideo src={staticFile(`${M}evolucion-particulas.mp4`)} muted /></Sequence></AbsoluteFill> : null}
        <T a={7.46} b={9.5} kicker="1990s" text="Internet creó industrias enteras" size={86} y={200} color="#5AA0FF" />
        <T a={9.62} b={12.3} kicker="2009" text="Bitcoin abrió una nueva etapa" size={86} y={200} color={BTC} />
        <T a={12.45} b={17.0} kicker="AHORA" text="Tokenización de activos reales" size={92} y={200} color={GOLD} />
        <Linea at={[7.46, 9.62, 12.45]} b={17.0} />

        {/* 3 · No solo tecnología */}
        <T a={17.73} b={19.7} text="No es solo tecnología" size={130} y={560} color={MUTED} />
        <T a={19.8} b={25.2} kicker="ESTAMOS HABLANDO DE" text="Nuevas oportunidades" size={100} y={240} />
        <Pila items={['Nuevos modelos empresariales', 'Nuevas formas de financiamiento', 'Nuevas oportunidades de negocio']} at={[20.66, 22.19, 24.36]} b={25.2} />

        {/* 4 · Imagina tu compañía */}
        <T a={25.76} b={37.5} kicker="IMAGINA" text="Tu compañía de tokenización" size={90} y={230} />
        <Compania a={26.7} esp={[28.36, 29.33, 30.06]} eco={[31.38, 32.47, 33.62, 35.05]} b={37.5} />

        {/* 5 · La idea no basta */}
        <T a={37.59} b={42.1} text="Una idea no es suficiente" size={110} y={300} />
        <Idea a={37.59} on={40.38} b={42.1} />
        <T a={39.92} b={42.1} text="Necesitas infraestructura para ejecutar" size={54} y={1240} font="b" color={SOFT} />

        {/* 6 · PROPUESTA */}
        <T a={42.21} b={45.4} kicker="PONEMOS A TU DISPOSICIÓN" text="Marca blanca" size={150} y={300} />
        <MarcaBlanca a={42.6} b={45.4} />
        <T a={45.29} b={52.6} kicker="TU PLATAFORMA DE TOKENIZACIÓN" text="por" size={64} y={220} font="b" />
        <Monto a={45.54} b={52.6} from={0} to={30000} dur={0.5} y={340} color={GOLD} size={250} />
        {t >= 46.77 && t < 52.6 ? <div style={{ position: 'absolute', left: 50, top: 700, width: 980, height: 600, borderRadius: 26, overflow: 'hidden', border: '2px solid rgba(140,160,255,0.55)', boxShadow: '0 40px 120px rgba(45,82,255,0.45)', opacity: pin(t, 46.77, 0.6) * out(t, 52.6) }}><Img src={staticFile('media/frutos/plataforma.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transform: `scale(${1.02 + (t - 46.77) * 0.02})`, transformOrigin: 'top center' }} /></div> : null}
        <Chip a={46.93} b={48.6} text="Solución tecnológica completa" y={1360} />
        <Chip a={48.7} b={50.6} text="Tu propio modelo de negocio" y={1360} />
        <Chip a={50.67} b={52.6} text="Infraestructura profesional" y={1360} color="#1F8F5A" />

        {/* 7 · CIERRE */}
        <T a={53.29} b={56.4} text="Las posiciones no se construyen de un día para otro" size={92} y={300} />
        <T a={56.54} b={61.1} text="Mientras tanto…" size={100} y={300} color={MUTED} />
        <DosCarriles a1={56.54} a2={58.75} b={61.1} />
        <T a={61.19} b={63.15} text="La pregunta no es si quieres conocer la tokenización" size={78} y={600} color={MUTED} />
        <T a={63.19} b={67.1} kicker="LA PREGUNTA ES" text="¿Qué posición quieres ocupar?" size={120} y={260} color={INK} />
        <Podio a={63.4} hit={64.63} b={67.1} />
        {t >= 66.9 ? <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: interpolate(t, [66.9, 67.2], [0, 1], clamp) }}><Sequence from={Math.round(66.6 * FPS)}><OffthreadVideo src={staticFile('media/frutos/logo-particulas.mp4')} muted /></Sequence></AbsoluteFill> : null}

        {/* 8 · CTA */}
        {t >= 67.17 ? (
          <div style={{ position: 'absolute', top: 1040, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: pin(t, 67.17, 0.6) }}>
            <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 320 }} />
            <div style={{ marginTop: 50, background: ACCENT, borderRadius: 999, padding: '30px 56px', fontFamily: BODY, fontWeight: 900, fontSize: 44, color: INK, textAlign: 'center', boxShadow: '0 20px 60px rgba(45,82,255,0.5)', transform: `scale(${0.9 + 0.1 * pin(t, 67.5, 0.5)})` }}>Postula tu proyecto para una<br />implementación de marca blanca</div>
            <div style={{ marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: SOFT }}>keylab.tech</div>
          </div>
        ) : null}
        <OneGag g={{ ...OUTRO_MUEJEJE, at: 69.9, dur: 3.1 }} />

        <Captions />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(t, [POSICION_DUR - 0.5, POSICION_DUR], [0, 1], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
