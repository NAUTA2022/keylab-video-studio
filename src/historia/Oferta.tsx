import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { PiBuildings, PiCalendarX, PiClock, PiCoins, PiCreditCard, PiFire, PiHandPalm, PiHandshake, PiHourglassMedium, PiLockSimple, PiQuestion, PiSiren, PiSpinnerGap, PiTrendUp } from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';
import { EY_FOX, OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import PAL from './oferta-palabras.json';
import { Chip, MarcaBlanca, Monto, T } from './Frutos';

// Key Lab · Anuncio "Esto no lo vas a volver a ver" · tokenizadora US$5.000 · vertical 1080x1920 · 46.5 s.
// Hook de alarma → Ey → precio de la competencia → marca blanca → US$5.000 → ofertas de noviembre → urgencia → contraste → CTA.
ensureFonts();
export const OFERTA_DUR = 46.5;
const FPS = 30;
const INK = '#FFFFFF', MUTED = '#9AA3B8', SOFT = '#8CA0FF', ACCENT = '#2D52FF', GOLD = '#F2C14E', RED = '#FF4D5E', GREEN = '#3DDC84';
const DISPLAY = 'Anton', BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.5) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const out = (t: number, b: number, d = 0.3) => interpolate(t, [b - d, b], [1, 0], clamp);
const vis = (t: number, a: number, b: number) => t >= a && t <= b;
const slam = (t: number, a: number, k = 1.6) => interpolate(t, [a, a + 0.18], [k, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
const pop = (t: number, a: number) => interpolate(t, [a, a + 0.22, a + 0.35], [0, 1.12, 1], { ...clamp, easing: Easing.out(Easing.quad) });
const EY = 2.0, EY_END = 2.95;

/* Subtítulos por palabra */
const CHUNKS = (() => {
  const W: [string, number, number][] = [];
  (PAL as [string, number, number][]).forEach((w) => {
    const last = W[W.length - 1];
    if (last && /\d$/.test(last[0]) && /^[.,]\d{3}/.test(w[0])) { last[0] = last[0] + '.' + w[0].slice(1); last[2] = w[2]; }
    else W.push([w[0], w[1], w[2]]);
  });
  const res: { a: number; b: number; w: [string, number, number][] }[] = [];
  let cur: [string, number, number][] = [];
  W.forEach((w, i) => {
    cur.push(w);
    if (/[.,?!:]$/.test(w[0]) || cur.length >= 4 || i === W.length - 1) { res.push({ a: cur[0][1], b: cur[cur.length - 1][2], w: cur }); cur = []; }
  });
  return res.map((c, i) => ({ ...c, b: Math.min(res[i + 1]?.a ?? c.b + 0.5, c.b + 0.35) }));
})();
const fix = (s: string) => s.replace(/toquen/gi, (m) => (m[0] === 'T' ? 'Token' : 'token')).replace(/^\$(\d)/, 'US$$$1');
const Captions: React.FC = () => {
  const t = useT();
  if (t < EY_END || t > 40.9) return null;
  const c = CHUNKS.find((k) => t >= k.a - 0.05 && t < k.b);
  if (!c) return null;
  return (
    <div style={{ position: 'absolute', left: 60, top: 1650, width: 960, textAlign: 'center' }}>
      <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 50, lineHeight: 1.2, textShadow: '0 3px 14px rgba(0,0,0,0.95), 0 0 2px #000' }}>
        {c.w.map(([w, s], i) => {
          const on = t >= s - 0.03;
          return <span key={i} style={{ color: on && t < (c.w[i + 1]?.[1] ?? c.b) ? GOLD : INK, opacity: on ? 1 : 0.45 }}>{i ? ' ' : ''}{fix(w)}</span>;
        })}
      </span>
    </div>
  );
};

/* Ey. */
const Ey: React.FC = () => {
  const t = useT();
  if (t < EY || t >= EY_END) return null;
  return (
    <AbsoluteFill style={{ background: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 300, color: INK, transform: `scale(${slam(t, EY)})`, lineHeight: 1, marginTop: -300 }}>Ey.</div>
      <OneGag g={{ ...EY_FOX, at: EY, dur: EY_END - EY, x: 0.66, y: 0.74, size: 0.62 }} />
    </AbsoluteFill>
  );
};

/* Fondo vivo */
const Fondo: React.FC = () => {
  const t = useT();
  const tint = t < 9.3 ? 'rgba(255,77,94,0.2)' : t < 26.9 ? 'rgba(45,82,255,0.24)' : t < 34.2 ? 'rgba(255,77,94,0.18)' : 'rgba(242,193,78,0.18)';
  return (
    <AbsoluteFill style={{ background: '#05070D' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.3px, transparent 1.4px)', backgroundSize: '46px 46px', backgroundPosition: `0px ${(t * 16) % 46}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 55% at 50% 50%, ${tint} 0%, rgba(5,7,13,0) 70%)` }} />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 220px rgba(0,0,0,0.9)' }} />
    </AbsoluteFill>
  );
};

/* 1 · Alarma del hook */
const Alarma: React.FC = () => {
  const t = useT();
  if (t >= EY) return null;
  const strobe = Math.pow(Math.max(0, Math.sin(t * Math.PI * 4)), 6) * interpolate(t, [0, 1.5], [0.15, 0.4], clamp);
  const sweep = (t * 360) % 360;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `conic-gradient(from ${sweep}deg at 50% 46%, rgba(255,40,60,0.35) 0deg, rgba(255,40,60,0) 50deg, rgba(255,40,60,0) 180deg, rgba(255,40,60,0.35) 230deg, rgba(255,40,60,0) 280deg)` }} />
      <AbsoluteFill style={{ background: RED, opacity: strobe }} />
      <div style={{ position: 'absolute', left: 390, top: 720, width: 300, height: 300, borderRadius: 150, background: 'rgba(255,77,94,0.18)', border: `6px solid ${RED}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(t, 0.05) * (1 + Math.sin(t * 18) * 0.04)})`, boxShadow: `0 0 ${80 + strobe * 200}px ${RED}` }}>
        <PiSiren size={190} color={INK} />
      </div>
    </AbsoluteFill>
  );
};
const Nunca: React.FC = () => {
  const t = useT();
  if (!vis(t, 1.5, EY)) return null;
  return <div style={{ position: 'absolute', top: 1110, width: 1080, textAlign: 'center', fontFamily: DISPLAY, fontSize: 280, color: RED, transform: `scale(${slam(t, 1.547, 2)})`, textShadow: '0 0 70px rgba(255,77,94,0.6)', lineHeight: 1 }}>NUNCA.</div>;
};

/* 2 · Panel confuso de la competencia */
const PanelConfuso: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const p = pin(t, a, 0.4);
  const wob = Math.sin(t * 7) * 2.5;
  const r = (k: number) => { const x = Math.sin(k * 91.7) * 4375.85; return x - Math.floor(x); };
  return (
    <div style={{ position: 'absolute', left: 90, top: 640, width: 900, height: 760, opacity: out(t, b) * p, transform: `rotate(${-4 + wob}deg) scale(${0.9 + 0.1 * p})` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 24, background: '#E9E6DF', overflow: 'hidden', border: '3px solid #B9B4A8' }}>
        <div style={{ height: 50, background: '#7A7F8C', display: 'flex', gap: 6, padding: '10px 14px' }}>{Array.from({ length: 14 }, (_, i) => <div key={i} style={{ width: 52, height: 30, background: '#9AA0AC', borderRadius: 3 }} />)}</div>
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: 20 + r(i) * 760, top: 70 + r(i + 40) * 620, width: 60 + r(i + 7) * 150, height: 30 + r(i + 9) * 110, background: ['#C9CED8', '#D8C9C9', '#C9D8CC', '#D6D1C2', '#BFC6D6'][i % 5], border: '2px solid #A9AFBA', borderRadius: 4, transform: `rotate(${(r(i + 3) - 0.5) * 8}deg)` }}>
            <div style={{ margin: 6, height: 6, width: '70%', background: '#8E95A3' }} />
            <div style={{ margin: 6, height: 6, width: '45%', background: '#A3A9B5' }} />
          </div>
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: 'absolute', left: [80, 640, 360, 720][i], top: [120, 200, 470, 600][i], transform: `scale(${pop(t, a + 0.5 + i * 0.35)})`, width: 110, height: 110, borderRadius: 55, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}><PiQuestion size={78} color={INK} /></div>
      ))}
    </div>
  );
};

/* 3 · ¡Cinco! */
const Cinco: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <div style={{ position: 'absolute', top: 560, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: out(t, b) }}>
      <div style={{ transform: `scale(${pop(t, a - 0.6)}) rotate(${Math.sin(t * 6) * 6}deg)` }}><PiHandPalm size={260} color={GOLD} /></div>
      {t >= a ? <div style={{ fontFamily: DISPLAY, fontSize: 460, color: GOLD, lineHeight: 0.95, transform: `scale(${slam(t, a, 2)})`, textShadow: '0 0 80px rgba(242,193,78,0.55)' }}>5</div> : null}
    </div>
  );
};

/* 4 · Oferta 1: antes del 30 de noviembre, 4.500 en 4 cuotas sin interés */
const Cuotas: React.FC<{ a: number; at: number; stamp: number; b: number }> = ({ a, at, stamp, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <div style={{ position: 'absolute', left: 90, top: 1080, width: 900, opacity: out(t, b) }}>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
        {[0, 1, 2, 3].map((i) => {
          const p = pop(t, at + i * 0.12);
          return <div key={i} style={{ width: 200, height: 170, borderRadius: 28, background: i === 0 ? ACCENT : 'rgba(45,82,255,0.22)', border: `3px solid ${ACCENT}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})` }}><PiCreditCard size={58} color={INK} /><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, color: MUTED }}>Cuota {i + 1}</span><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, color: INK }}>US$1.125</span></div>;
        })}
      </div>
      {t >= stamp ? <div style={{ margin: '40px auto 0', width: 560, textAlign: 'center', border: `8px solid ${GREEN}`, borderRadius: 26, padding: '6px 0', fontFamily: DISPLAY, fontSize: 100, color: GREEN, transform: `rotate(-6deg) scale(${slam(t, stamp, 2.2)})`, background: 'rgba(4,6,12,0.85)' }}>SIN INTERÉS</div> : null}
    </div>
  );
};
const Fecha: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const p = pop(t, a);
  return (
    <div style={{ position: 'absolute', left: 340, top: 200, width: 400, height: 330, borderRadius: 34, background: '#10131F', border: '3px solid rgba(255,255,255,0.18)', overflow: 'hidden', transform: `scale(${p}) rotate(${interpolate(t, [a, a + 0.35], [-6, 0], clamp)}deg)`, opacity: out(t, b) }}>
      <div style={{ height: 84, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontWeight: 900, fontSize: 38, letterSpacing: 8, color: INK }}>NOVIEMBRE</div>
      <div style={{ textAlign: 'center', fontFamily: DISPLAY, fontSize: 200, color: INK, lineHeight: 1.18 }}>30</div>
    </div>
  );
};

/* 5 · Oferta 2: pago único 4.000, ahorras mil */
const Ahorro: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  return (
    <div style={{ position: 'absolute', top: 1080, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: out(t, b) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, background: GREEN, borderRadius: 999, padding: '22px 46px', transform: `scale(${pop(t, a)})`, boxShadow: '0 20px 60px rgba(61,220,132,0.45)' }}>
        <PiCoins size={70} color="#04140A" /><span style={{ fontFamily: DISPLAY, fontSize: 92, color: '#04140A' }}>AHORRAS US$1.000</span>
      </div>
      <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 900, fontSize: 44, color: MUTED, opacity: pin(t, a + 1.0, 0.4) }}>por pagar de contado</div>
    </div>
  );
};

/* 6 · Urgencia: el precio dura hasta fin de 2026, en enero sube y no vuelve */
const Urgencia: React.FC<{ a: number; fin: number; sube: number; noVuelve: number; b: number }> = ({ a, fin, sube, noVuelve, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const sand = interpolate(t, [a, sube], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out(t, b) }}>
      <div style={{ position: 'absolute', top: 640, width: 1080, display: 'flex', justifyContent: 'center', transform: `scale(${pop(t, a)})` }}>
        <div style={{ transform: `rotate(${t < sube ? Math.sin(t * 3) * 8 : interpolate(t, [sube, sube + 0.4], [0, 180], clamp)}deg)` }}><PiHourglassMedium size={300} color={sand > 0.8 ? RED : GOLD} /></div>
      </div>
      {t >= fin ? <div style={{ position: 'absolute', top: 990, width: 1080, textAlign: 'center', fontFamily: DISPLAY, fontSize: 120, color: INK, transform: `scale(${slam(t, fin, 1.4)})`, opacity: t < sube ? 1 : 0.35 }}>HASTA FIN DE 2026</div> : null}
      {t >= sube ? (
        <div style={{ position: 'absolute', top: 1150, width: 1080, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, transform: `scale(${slam(t, sube, 1.8)})` }}>
          <PiCalendarX size={110} color={RED} /><span style={{ fontFamily: DISPLAY, fontSize: 140, color: RED }}>ENERO SUBE</span><PiTrendUp size={110} color={RED} />
        </div>
      ) : null}
      {t >= noVuelve ? (
        <div style={{ position: 'absolute', top: 1340, width: 1080, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, transform: `scale(${slam(t, noVuelve, 1.6)})` }}>
          <PiLockSimple size={90} color={INK} /><span style={{ fontFamily: DISPLAY, fontSize: 110, color: INK }}>Y NO VUELVE</span>
        </div>
      ) : null}
    </div>
  );
};

/* 7 · Contraste: otros evaluando vs. tú tokenizando */
const Carriles: React.FC<{ a: number; tu: number; act: number; vende: number; b: number }> = ({ a, tu, act, vende, b }) => {
  const t = useT();
  if (!vis(t, a, b)) return null;
  const card = (top: number, on: number, children: React.ReactNode, color: string, dim = false) => (
    <div style={{ position: 'absolute', left: 70, top, width: 940, borderRadius: 34, padding: '34px 40px', background: dim ? 'rgba(255,255,255,0.04)' : 'rgba(61,220,132,0.1)', border: `3px solid ${color}`, opacity: pin(t, on, 0.4) * (dim && t > tu ? 0.45 : 1), transform: `translateY(${(1 - pin(t, on, 0.5)) * 40}px)` }}>{children}</div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out(t, b) }}>
      {card(560, a, (
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <div style={{ transform: `rotate(${t * 220}deg)` }}><PiSpinnerGap size={110} color={MUTED} /></div>
          <div><div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: MUTED }}>OTROS</div><div style={{ fontFamily: DISPLAY, fontSize: 80, color: MUTED }}>"EVALUANDO OPCIONES"</div></div>
        </div>
      ), 'rgba(255,255,255,0.18)', true)}
      {card(900, tu, (
        <div>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: GREEN }}>TÚ, YA</div>
          {[[act, PiBuildings, 'Tokenizando tus activos'], [vende, PiHandshake, 'Vendiendo tokenización a otras empresas']].map(([at, I, txt], i) => {
            const Ic = I as React.ComponentType<{ size?: number; color?: string }>;
            return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 22, transform: `scale(${pop(t, at as number)})`, transformOrigin: 'left center' }}><Ic size={74} color={GREEN} /><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 48, color: INK, lineHeight: 1.1 }}>{txt as string}</span></div>;
          })}
        </div>
      ), GREEN)}
    </div>
  );
};

export const Oferta: React.FC = () => {
  const t = useT();
  const flash = [12.22, 14.86, 32.28].reduce((m, a) => m + interpolate(t, [a, a + 0.03, a + 0.45], [0, 0.55, 0], clamp), 0);
  const shake = (at: number, k = 1) => (t > at && t < at + 0.3 ? Math.sin(t * 110) * 14 * k * (1 - (t - at) / 0.3) : 0);
  const sx = shake(1.547) + shake(12.22) + shake(14.86, 0.7) + shake(32.28, 0.8) + shake(4.39, 0.5);
  return (
    <AbsoluteFill style={{ background: '#05070D', overflow: 'hidden' }}>
      <Audio src={staticFile('media/oferta/voz-musica.mp3')} />
      <Sequence from={Math.round(EY * FPS)} durationInFrames={60}><Audio src={staticFile('sfx/boom.mp3')} volume={0.55} /></Sequence>
      <Sequence from={Math.round(8.3 * FPS)} durationInFrames={45}><Audio src={staticFile('sfx/bruh.mp3')} volume={0.45} /></Sequence>
      <Sequence from={Math.round(43.3 * FPS)} durationInFrames={95}><Audio src={staticFile('sfx/muejeje-corto.mp3')} volume={0.6} /></Sequence>
      <AbsoluteFill style={{ transform: `translateX(${sx}px)` }}>
        <Fondo />

        {/* 1 · HOOK */}
        <Alarma />
        <T a={0.0} b={EY} text="Esto no lo vas a volver a ver" size={112} y={200} />
        <Nunca />
        <Ey />

        {/* 2 · PROBLEMA */}
        <T a={3.0} b={7.15} kicker="HAY EMPRESAS COBRANDO" kc={RED} text="Por una plataforma de tokenización" size={74} y={220} />
        <Monto a={3.75} b={4.39} from={0} to={15000} dur={0.3} y={680} color={RED} />
        <Monto a={4.39} b={7.15} from={15000} to={30000} dur={0.35} y={680} color={RED} />
        <T a={7.2} b={9.3} text="Paneles confusos" size={120} y={260} color={RED} />
        <T a={8.1} b={9.3} text="que ni ellos entienden" size={64} y={450} font="b" color={MUTED} />
        <PanelConfuso a={7.2} b={9.3} />
        <OneGag g={{ image: 'memes/zorro/zorro-pensando.png', style: 'cutout', at: 8.3, dur: 1.0, x: 0.8, y: 0.84, size: 0.38, from: 'bottom', bounce: true } as never} />

        {/* 3 · PROPUESTA */}
        <T a={9.36} b={11.9} kicker="NOSOTROS TE LA DAMOS" text="Con tu marca" size={140} y={300} />
        <MarcaBlanca a={9.5} b={11.9} />
        <Chip a={11.1} b={11.9} text="Lista para operar" y={1450} color="#1F8F5A" />
        <T a={11.9} b={13.35} kicker="POR" text="" size={10} y={300} />
        <Monto a={12.22} b={13.35} from={30000} to={5000} dur={0.35} y={640} color={GOLD} size={250} />
        <T a={13.4} b={15.1} text="Sí, escuchaste bien" size={96} y={260} />
        <Cinco a={14.86} b={15.15} />

        {/* 4 · OFERTAS */}
        <T a={15.16} b={16.7} text="Y se pone mejor" size={130} y={700} color={GOLD} />
        {vis(t, 15.16, 16.7) ? <div style={{ position: 'absolute', top: 960, width: 1080, display: 'flex', justifyContent: 'center', transform: `scale(${pop(t, 15.3)}) translateY(${Math.sin(t * 9) * 6}px)`, opacity: out(t, 16.7) }}><PiFire size={200} color={RED} /></div> : null}
        <Fecha a={16.76} b={22.1} />
        <T a={16.9} b={18.7} text="Si cierras antes del 30" size={74} y={600} font="b" />
        <Monto a={18.78} b={22.1} from={5000} to={4500} dur={0.35} y={600} color={GOLD} size={220} />
        <Cuotas a={20.3} at={20.78} stamp={21.42} b={22.1} />
        <T a={22.27} b={26.4} kicker="EN UN SOLO PAGO" kc={GREEN} text="De contado" size={110} y={260} />
        <Monto a={23.55} b={26.4} from={5000} to={4000} dur={0.35} y={620} color={GREEN} size={240} strikeAt={undefined} />
        <Ahorro a={24.86} b={26.4} />

        {/* 5 · URGENCIA */}
        <T a={26.99} b={33.9} kicker="EL PRECIO DE US$5.000" kc={GOLD} text="Solo dura" size={110} y={240} />
        <Urgencia a={27.1} fin={30.6} sube={32.28} noVuelve={33.55} b={33.95} />

        {/* 6 · CONTRASTE */}
        <T a={34.3} b={40.6} text="Mientras otros siguen evaluando…" size={80} y={250} color={MUTED} />
        <Carriles a={34.5} tu={36.17} act={36.9} vende={38.47} b={40.6} />

        {/* 7 · CTA */}
        {t >= 40.4 && t < 45.2 ? <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: out(t, 45.2, 0.5) }}><Sequence from={Math.round(40.4 * FPS)}><OffthreadVideo src={staticFile('media/frutos/logo-particulas.mp4')} muted /></Sequence></AbsoluteFill> : null}
        {t >= 41.0 ? (
          <div style={{ position: 'absolute', top: 1040, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: pin(t, 41.0, 0.4) }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 150, color: INK, lineHeight: 1, transform: `scale(${slam(t, 41.02, 1.4)})` }}>ESCRÍBENOS HOY</div>
            <div style={{ marginTop: 40, background: ACCENT, borderRadius: 999, padding: '28px 70px', fontFamily: BODY, fontWeight: 900, fontSize: 54, color: INK, transform: `scale(${pop(t, 42.0)})`, boxShadow: '0 20px 60px rgba(45,82,255,0.55)' }}>Aparta tu cupo 👉</div>
            <div style={{ marginTop: 34, fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 2, color: SOFT, opacity: pin(t, 42.5, 0.4) }}>keylab.tech/tokenizacion</div>
          </div>
        ) : null}
        {t >= 44.0 ? (
          <div style={{ position: 'absolute', top: 360, width: 1080, display: 'flex', justifyContent: 'center', opacity: pin(t, 44.0, 0.5) }}>
            <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 360 }} />
          </div>
        ) : null}
        <OneGag g={{ ...OUTRO_MUEJEJE, at: 43.3, dur: 3.2 }} />

        <Captions />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(t, [OFERTA_DUR - 0.5, OFERTA_DUR], [0, 1], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
