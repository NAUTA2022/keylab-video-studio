import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { PiBank, PiBuildings, PiCheckCircleFill, PiCpu, PiGraph, PiPlant, PiRoadHorizon, PiStrategy, PiTreeStructure, PiUserFocus } from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';
import { OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import { Chip, Ey, MarcaBlanca, Monto, T } from './Frutos';
import PAL from './momento-palabras.json';

// Key Lab · "El momento de entrar a la tokenización es ahora" · vertical 1080x1920 · 67.6 s.
// Psicológico (FOMO): edificios que se construyen, puestos que se ocupan y uno libre para ti, Bitcoin en partículas,
// activos reales, la curva de adopción con "tú, ahora", la tokenizadora real en marca blanca, US$15.000 y el CTA.
ensureFonts();
export const MOMENTO_DUR = 67.6;
const FPS = 30;
const M = 'media/momento/';
const INK = '#FFFFFF', MUTED = '#9AA3B8', SOFT = '#8CA0FF', ACCENT = '#2D52FF', GOLD = '#F2C14E', RED = '#FF4D5E', GREEN = '#3DDC84', BTC = '#F7931A';
const DISPLAY = 'Anton', BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const out = (t: number, b: number, d = 0.35) => interpolate(t, [b - d, b], [1, 0], clamp);
const vis = (t: number, a: number, b: number) => t >= a && t <= b;
const EY = 7.15, EY_END = 8.16;

/* Subtítulos con palabra activa */
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
const fix = (s: string) => s.replace(/^toquen/i, (m) => (m[0] === 'T' ? 'Token' : 'token')).replace(/^introducerte/, 'introducirte');
const Captions: React.FC = () => {
  const t = useT();
  if (t < EY_END || t > 64.4) return null;
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

/* Ciudad financiera que se construye (barras que suben, grúas, ventanas que se encienden) */
const Ciudad: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const B = [[60, 520], [180, 760], [300, 620], [420, 980], [560, 700], [680, 880], [800, 560], [920, 740]];
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1520, opacity: out(t, b) }}>
      {B.map(([x, h], i) => {
        const p = interpolate(t, [a + i * 0.18, a + i * 0.18 + 2.2], [0, 1], { ...clamp, easing: ease });
        const hh = h * p;
        return (
          <div key={i} style={{ position: 'absolute', left: x, bottom: 0, width: 100, height: hh, background: 'linear-gradient(180deg,#1B2440,#0D1222)', border: '2px solid rgba(140,160,255,0.35)', borderBottom: 'none', overflow: 'hidden' }}>
            {Array.from({ length: 24 }, (_, k) => {
              const on = Math.sin(i * 7 + k * 3.3 + Math.floor(t * 2)) > 0.2 && t > a + 1.5;
              return <div key={k} style={{ position: 'absolute', left: 14 + (k % 3) * 26, top: 18 + Math.floor(k / 3) * 46, width: 16, height: 22, background: on ? GOLD : 'rgba(255,255,255,0.08)', opacity: on ? 0.9 : 1 }} />;
            })}
            {p < 0.98 ? <div style={{ position: 'absolute', left: 46, top: 0, width: 4, height: 60, background: GOLD }} /> : null}
          </div>
        );
      })}
    </div>
  );
};

/* Puestos del mercado que se ocupan: queda uno libre */
const Puestos: React.FC<{ a: number; fillUntil: number; b: number; claim?: number }> = ({ a, fillUntil, b, claim }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const N = 20, free = 13;
  return (
    <div style={{ position: 'absolute', left: 120, top: 640, width: 840, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18, opacity: out(t, b) * pin(t, a, 0.4) }}>
      {Array.from({ length: N }, (_, i) => {
        const at = a + 0.2 + ((i * 7) % N) / N * (fillUntil - a - 0.3);
        const taken = i !== free && t >= at;
        const isFree = i === free;
        const claimed = isFree && claim !== undefined && t >= claim;
        const pulse = isFree && !claimed ? 0.6 + 0.4 * Math.abs(Math.sin(t * 4)) : 1;
        return (
          <div key={i} style={{ height: 130, borderRadius: 20, background: claimed ? GREEN : taken ? 'rgba(255,77,94,0.18)' : isFree ? 'rgba(242,193,78,0.12)' : 'rgba(255,255,255,0.05)', border: `3px solid ${claimed ? GREEN : taken ? RED : isFree ? GOLD : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pulse, transform: `scale(${taken ? interpolate(t, [at, at + 0.15], [1.2, 1], clamp) : claimed ? interpolate(t, [claim!, claim! + 0.2], [1.4, 1], clamp) : 1})` }}>
            <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: isFree ? 30 : 22, color: claimed ? '#05110A' : taken ? RED : isFree ? GOLD : MUTED }}>{claimed ? 'TÚ' : taken ? 'OCUPADO' : isFree ? 'LIBRE' : ''}</span>
          </div>
        );
      })}
    </div>
  );
};

/* Activos del mundo real que aparecen al nombrarlos */
const Activos: React.FC<{ a: number; b: number; at: number[] }> = ({ a, b, at }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const items = [
    { k: 'Inmuebles', img: 'casa1', I: PiBuildings },
    { k: 'Agroindustria', img: 'campo1', I: PiPlant },
    { k: 'Infraestructura', img: 'local1', I: PiRoadHorizon },
    { k: 'Deuda', img: '', I: PiBank },
    { k: 'Nuevos modelos de financiamiento', img: '', I: PiGraph },
  ];
  return (
    <div style={{ position: 'absolute', left: 70, top: 560, width: 940, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, opacity: out(t, b) }}>
      {items.map((it, i) => {
        const p = pin(t, at[i], 0.5);
        const wide = i === 4;
        return (
          <div key={it.k} style={{ gridColumn: wide ? 'span 2' : undefined, height: wide ? 170 : 270, borderRadius: 26, overflow: 'hidden', position: 'relative', background: '#121726', border: '2px solid rgba(140,160,255,0.35)', opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})` }}>
            {it.img ? <Img src={staticFile(`media/historia-keylab/market/${it.img}.jpg`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transform: `scale(${1.1 - 0.05 * p})` }} /> : null}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,7,13,0) 30%, rgba(5,7,13,0.85) 100%)' }} />
            <div style={{ position: 'absolute', left: 24, bottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}><it.I size={52} color={GOLD} /><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: wide ? 38 : 36, color: INK }}>{it.k}</span></div>
          </div>
        );
      })}
    </div>
  );
};

/* Curva de adopción: la mayoría llega tarde, tú entras ahora */
const Curva: React.FC<{ a: number; b: number; marker: number }> = ({ a, b, marker }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const p = interpolate(t, [a, a + 2.4], [0, 1], { ...clamp, easing: ease });
  const W = 900, H = 520;
  const pts = Array.from({ length: 60 }, (_, i) => { const x = i / 59; return [x * W, H - H / (1 + Math.exp(-11 * (x - 0.62)))]; });
  const k = Math.max(2, Math.floor(p * pts.length));
  const d = pts.slice(0, k).map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  const mp = pin(t, marker, 0.6);
  const mx = pts[16][0], my = pts[16][1];
  return (
    <div style={{ position: 'absolute', left: 90, top: 700, width: W, height: H + 120, opacity: out(t, b) }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
        <path d={d} fill="none" stroke={SOFT} strokeWidth={10} strokeLinecap="round" />
        <circle cx={mx} cy={my} r={22 * mp} fill={GREEN} style={{ filter: `drop-shadow(0 0 20px ${GREEN})` }} />
        <circle cx={mx} cy={my} r={22 + 40 * ((t * 1.2) % 1) * mp} fill="none" stroke={GREEN} strokeWidth={3} opacity={(1 - ((t * 1.2) % 1)) * mp} />
      </svg>
      <div style={{ position: 'absolute', left: mx - 120, top: my - 150, width: 240, textAlign: 'center', fontFamily: DISPLAY, fontSize: 64, color: GREEN, opacity: mp }}>TÚ, AHORA</div>
      <div style={{ position: 'absolute', right: 0, top: 10, fontFamily: BODY, fontWeight: 900, fontSize: 30, color: MUTED, opacity: pin(t, a + 1.6, 0.5) }}>Industria consolidada</div>
      <div style={{ position: 'absolute', right: 0, top: 54, fontFamily: BODY, fontWeight: 800, fontSize: 26, color: RED, opacity: pin(t, a + 1.9, 0.5) }}>(el mercado ya ocupado)</div>
    </div>
  );
};

/* Tres pilares */
const Pilares: React.FC<{ a: number; b: number; at: number[] }> = ({ a, b, at }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const items = [{ k: 'Infraestructura tecnológica', I: PiCpu }, { k: 'Modelo de negocio', I: PiTreeStructure }, { k: 'Estrategia de entrada', I: PiStrategy }];
  return (
    <div style={{ position: 'absolute', left: 90, top: 640, width: 900, opacity: out(t, b) }}>
      {items.map((it, i) => {
        const p = pin(t, at[i], 0.5);
        return (
          <div key={it.k} style={{ display: 'flex', alignItems: 'center', gap: 30, marginBottom: 40, opacity: p, transform: `translateX(${(1 - p) * -80}px)` }}>
            <div style={{ width: 170, height: 170, borderRadius: 40, background: 'rgba(45,82,255,0.15)', border: `3px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${40 * p}px rgba(45,82,255,0.5)` }}><it.I size={96} color={SOFT} /></div>
            <div><div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, letterSpacing: 6, color: GOLD }}>0{i + 1}</div><div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 52, color: INK, lineHeight: 1.05 }}>{it.k}</div></div>
          </div>
        );
      })}
    </div>
  );
};

/* Lista de chequeo: ¿tienes esto? */
const Check: React.FC<{ a: number; b: number; at: number[] }> = ({ a, b, at }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const items = ['Activos', 'Un modelo de negocio', 'Un proyecto de financiamiento'];
  return (
    <div style={{ position: 'absolute', left: 120, top: 640, width: 840, opacity: out(t, b) }}>
      {items.map((k, i) => {
        const p = pin(t, at[i], 0.4);
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 34, padding: '26px 30px', borderRadius: 28, background: 'rgba(255,255,255,0.05)', border: `2px solid ${p > 0.5 ? GREEN : 'rgba(255,255,255,0.15)'}`, opacity: 0.3 + 0.7 * p }}>
            <PiCheckCircleFill size={70} color={p > 0.5 ? GREEN : MUTED} style={{ transform: `scale(${interpolate(t, [at[i], at[i] + 0.2, at[i] + 0.4], [0.6, 1.25, 1], clamp)})` }} />
            <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 46, color: INK }}>{k}</span>
          </div>
        );
      })}
    </div>
  );
};

/* Fondo vivo */
const Fondo: React.FC = () => {
  const t = useT();
  const tint = t < EY ? 'rgba(255,77,94,0.14)' : t < 24.7 ? 'rgba(247,147,26,0.14)' : t < 50 ? 'rgba(45,82,255,0.22)' : 'rgba(242,193,78,0.16)';
  return (
    <AbsoluteFill style={{ background: '#05070D' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.3px, transparent 1.4px)', backgroundSize: '46px 46px', backgroundPosition: `0px ${(t * 14) % 46}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 55% at 50% 50%, ${tint} 0%, rgba(5,7,13,0) 70%)` }} />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 220px rgba(0,0,0,0.9)' }} />
    </AbsoluteFill>
  );
};

export const Momento: React.FC = () => {
  const t = useT();
  const flash = interpolate(t, [14.05, 14.08, 14.5], [0, 0.4, 0], clamp) + interpolate(t, [48.83, 48.86, 49.4], [0, 0.6, 0], clamp) + interpolate(t, [59.36, 59.39, 59.9], [0, 0.5, 0], clamp);
  const shake = (at: number) => (t > at && t < at + 0.3 ? Math.sin(t * 110) * 14 * (1 - (t - at) / 0.3) : 0);
  const sx = shake(48.86) + shake(59.39) + shake(6.7) * 0.6;
  return (
    <AbsoluteFill style={{ background: '#05070D', overflow: 'hidden' }}>
      <Audio src={staticFile(`${M}voz-musica.mp3`)} />
      <Sequence from={Math.round(EY * FPS)} durationInFrames={60}><Audio src={staticFile('sfx/boom.mp3')} volume={0.55} /></Sequence>
      <Sequence from={Math.round(64.5 * FPS)} durationInFrames={95}><Audio src={staticFile('sfx/muejeje-corto.mp3')} volume={0.6} /></Sequence>
      <AbsoluteFill style={{ transform: `translateX(${sx}px)` }}>
        <Fondo />

        {/* 1 · HOOK */}
        <Ciudad a={0.3} b={3.8} />
        <T a={0.0} b={3.8} text="Las próximas grandes empresas financieras" size={86} y={170} />
        <T a={2.4} b={3.8} text="se construyen ahora mismo" size={64} y={420} color={GOLD} font="b" />
        <T a={3.83} b={EY} text="¿Vas a ser parte de ellas?" size={90} y={230} />
        <Puestos a={4.0} fillUntil={6.7} b={EY} />
        <T a={4.86} b={EY} text="o vas a llegar cuando el mercado ya esté ocupado" size={52} y={1330} font="b" color={RED} />
        <Ey at={EY} until={EY_END} />

        {/* 2 · CONTEXTO */}
        {t >= EY_END && t < 12.3 ? <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: out(t, 12.3, 0.5) }}><Sequence from={Math.round(EY_END * FPS)}><OffthreadVideo src={staticFile(`${M}bitcoin-particulas.mp4`)} muted /></Sequence></AbsoluteFill> : null}
        <T a={8.16} b={11.8} text="Bitcoin" size={150} y={200} color={BTC} />
        <T a={9.3} b={11.8} text="cambió cómo el mundo entendía el dinero" size={56} y={1360} font="b" />
        <T a={11.83} b={16.6} kicker="HOY: OTRA TRANSFORMACIÓN" text="Tokenización de activos del mundo real" size={110} y={560} />
        {t >= 14.08 && t < 16.6 ? <div style={{ position: 'absolute', top: 1010, width: 1080, textAlign: 'center', fontFamily: DISPLAY, fontSize: 200, color: GOLD, opacity: out(t, 16.6), transform: `scale(${interpolate(t, [14.08, 14.3], [1.5, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) })})` }}>RWA</div> : null}
        <T a={16.7} b={24.6} kicker="YA ESTÁN ENCONTRANDO NUEVAS POSIBILIDADES" text="Activos reales" size={100} y={240} />
        <Activos a={16.7} b={24.6} at={[16.77, 17.27, 18.12, 19.32, 19.99]} />

        {/* 3 · OPORTUNIDAD */}
        <T a={24.74} b={27.6} kicker="LO QUE MUCHOS NO ESTÁN ENTENDIENDO" text="No necesitas esperar" size={120} y={560} />
        {t >= 24.74 && t < 27.6 ? <div style={{ position: 'absolute', left: 440, top: 880, opacity: pin(t, 25.4, 0.5) * out(t, 27.6) }}><PiUserFocus size={200} color={SOFT} /></div> : null}
        <T a={27.73} b={32.5} text="para construir tu posición" size={92} y={240} />
        <Curva a={27.73} b={32.5} marker={31.11} />
        <T a={32.59} b={37.9} kicker="LO QUE SÍ NECESITAS" text="Tres piezas" size={110} y={300} />
        <Pilares a={32.59} b={37.9} at={[33.16, 34.8, 36.0]} />

        {/* 4 · PROPUESTA */}
        <T a={38.05} b={47.2} kicker="NUESTRA PLATAFORMA DE TOKENIZACIÓN" text="Marca blanca" size={150} y={300} />
        <MarcaBlanca a={39.0} b={47.2} />
        <Chip a={41.21} b={42.3} text="Tu propia infraestructura" y={1450} />
        <Chip a={42.32} b={43.9} text="Bajo tu marca" y={1450} />
        <Chip a={43.93} b={45.4} text="Desarrolla tu ecosistema" y={1450} />
        <Chip a={45.43} b={47.2} text="Compite en la nueva economía" y={1450} color="#1F8F5A" />
        <T a={47.32} b={50.1} kicker="IMPLEMENTACIÓN TECNOLÓGICA" text="por" size={64} y={560} font="b" />
        <Monto a={48.86} b={50.1} from={0} to={15000} dur={0.45} y={720} color={GOLD} size={250} />

        {/* 5 · CIERRE */}
        <T a={50.2} b={53.1} text="Las oportunidades no esperan" size={110} y={300} />
        <Puestos a={50.3} fillUntil={52.4} b={53.1} />
        <T a={53.19} b={57.5} kicker="SI TIENES" text="¿Te identificas?" size={90} y={300} />
        <Check a={53.19} b={57.5} at={[53.51, 54.11, 55.29]} />
        <T a={57.57} b={59.3} text="Este puede ser" size={90} y={560} />
        {t >= 58.57 && t < 59.35 ? <div style={{ position: 'absolute', top: 720, width: 1080, textAlign: 'center', fontFamily: DISPLAY, fontSize: 210, color: GOLD, transform: `scale(${interpolate(t, [58.57, 58.8], [1.5, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) })})` }}>TU MOMENTO</div> : null}
        <T a={59.39} b={62.3} text="Construye antes de que otros ocupen tu espacio" size={96} y={220} />
        <Puestos a={59.39} fillUntil={60.6} b={62.3} claim={60.4} />
        {t >= 62.3 ? <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: interpolate(t, [62.3, 62.6], [0, 1], clamp) }}><Sequence from={Math.round(62.0 * FPS)}><OffthreadVideo src={staticFile('media/frutos/logo-particulas.mp4')} muted /></Sequence></AbsoluteFill> : null}

        {/* 6 · CTA */}
        {t >= 62.38 ? (
          <div style={{ position: 'absolute', top: 1040, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: pin(t, 62.38, 0.6) }}>
            <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 320 }} />
            <div style={{ marginTop: 50, background: ACCENT, borderRadius: 999, padding: '30px 56px', fontFamily: BODY, fontWeight: 900, fontSize: 44, color: INK, textAlign: 'center', boxShadow: '0 20px 60px rgba(45,82,255,0.5)', transform: `scale(${0.9 + 0.1 * pin(t, 62.7, 0.5)})` }}>Solicita una evaluación<br />estratégica de tu proyecto</div>
            <div style={{ marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: SOFT }}>keylab.tech</div>
          </div>
        ) : null}
        <OneGag g={{ ...OUTRO_MUEJEJE, at: 64.5, dur: 3.1 }} />

        <Captions />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(t, [MOMENTO_DUR - 0.5, MOMENTO_DUR], [0, 1], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
