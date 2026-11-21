import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { PiHourglassMedium, PiLockSimple, PiTrendUp } from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';
import { EY_FOX, OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import PAL from './corto-palabras.json';
import { Monto, T } from './Frutos';
import { Ahorro, Fecha } from './Oferta';

// Key Lab · anuncio corto "¿Pagar US$30.000 por una tokenizadora? 🤡" · vertical 1080x1920 · 21.5 s.
ensureFonts();
export const CORTO_DUR = 21.5;
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
const EY = 2.65, EY_END = 3.55;

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
const fix = (s: string) => s.replace(/toquen/gi, (m) => (m[0] === 'T' ? 'Token' : 'token'));
const Captions: React.FC = () => {
  const t = useT();
  if (t < EY_END || t > 15.6) return null;
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

const Fondo: React.FC = () => {
  const t = useT();
  const tint = t < EY ? 'rgba(255,77,94,0.2)' : t < 10.7 ? 'rgba(45,82,255,0.24)' : t < 15.5 ? 'rgba(255,77,94,0.2)' : 'rgba(242,193,78,0.18)';
  return (
    <AbsoluteFill style={{ background: '#05070D' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.3px, transparent 1.4px)', backgroundSize: '46px 46px', backgroundPosition: `0px ${(t * 16) % 46}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 55% at 50% 50%, ${tint} 0%, rgba(5,7,13,0) 70%)` }} />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 220px rgba(0,0,0,0.9)' }} />
    </AbsoluteFill>
  );
};

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

/* Payaso del hook */
const Payaso: React.FC = () => {
  const t = useT();
  if (!vis(t, 1.7, EY)) return null;
  return <div style={{ position: 'absolute', top: 1110, width: 1080, textAlign: 'center', fontSize: 330, lineHeight: 1, transform: `scale(${slam(t, 1.72, 2.2)}) rotate(${Math.sin(t * 14) * 10}deg)` }}>🤡</div>;
};

/* Urgencia: después de 2026 ya es tarde, arranca en 10.000 */
const Tarde: React.FC = () => {
  const t = useT();
  if (!vis(t, 12.45, 15.55)) return null;
  return (
    <div style={{ position: 'absolute', top: 560, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: out(t, 15.55) }}>
      <div style={{ transform: `scale(${pop(t, 12.49)}) rotate(${t < 14.37 ? Math.sin(t * 4) * 10 : 180}deg)` }}><PiHourglassMedium size={240} color={RED} /></div>
      <div style={{ fontFamily: DISPLAY, fontSize: 150, color: RED, transform: `scale(${slam(t, 12.49, 1.6)})` }}>YA ES TARDE</div>
    </div>
  );
};

export const Corto: React.FC = () => {
  const t = useT();
  const flash = [4.41, 14.37].reduce((m, a) => m + interpolate(t, [a, a + 0.03, a + 0.45], [0, 0.5, 0], clamp), 0);
  const shake = (at: number, k = 1) => (t > at && t < at + 0.3 ? Math.sin(t * 110) * 14 * k * (1 - (t - at) / 0.3) : 0);
  const sx = shake(0.4, 0.5) + shake(4.41) + shake(14.37, 0.8) + shake(1.72, 0.6);
  return (
    <AbsoluteFill style={{ background: '#05070D', overflow: 'hidden' }}>
      <Audio src={staticFile('media/corto/voz-musica.mp3')} />
      <Sequence from={Math.round(1.72 * FPS)} durationInFrames={40}><Audio src={staticFile('sfx/trombon.mp3')} volume={0.35} /></Sequence>
      <Sequence from={Math.round(EY * FPS)} durationInFrames={60}><Audio src={staticFile('sfx/boom.mp3')} volume={0.55} /></Sequence>
      <Sequence from={Math.round(17.4 * FPS)} durationInFrames={95}><Audio src={staticFile('sfx/muejeje-corto.mp3')} volume={0.6} /></Sequence>
      <AbsoluteFill style={{ transform: `translateX(${sx}px)` }}>
        <Fondo />

        {/* HOOK */}
        <T a={0.0} b={EY} text="¿Pagar" size={170} y={260} />
        <T a={1.29} b={EY} text="por una tokenizadora?" size={96} y={840} />
        <Monto a={0.4} b={EY} from={0} to={30000} dur={0.3} y={520} color={RED} size={230} />
        <Payaso />
        <Ey />

        {/* NOSOTROS: 5.000 */}
        <T a={3.56} b={5.25} text="Nosotros" size={150} y={280} />
        <Monto a={4.41} b={5.25} from={30000} to={5000} dur={0.35} y={640} color={GOLD} size={250} />

        {/* ANTES DEL 30 */}
        <Fecha a={5.3} b={8.85} />
        <T a={5.4} b={7.5} text="Antes del 30 de noviembre" size={80} y={620} font="b" />
        <Monto a={7.56} b={8.85} from={5000} to={4500} dur={0.35} y={620} color={GOLD} size={230} />

        {/* DE CONTADO */}
        <T a={8.9} b={10.65} kicker="EN UN SOLO PAGO" kc={GREEN} text="De contado" size={120} y={260} />
        <Monto a={9.83} b={10.65} from={5000} to={4000} dur={0.3} y={620} color={GREEN} size={240} />
        <Ahorro a={10.0} b={10.65} />

        {/* DESPUÉS DE 2026 */}
        <T a={10.73} b={12.4} kicker="DESPUÉS DEL" kc={MUTED} text="2026" size={260} y={560} />
        <Tarde />
        {vis(t, 13.4, 15.55) ? (
          <div style={{ position: 'absolute', top: 1180, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: out(t, 15.55) }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 48, letterSpacing: 6, color: MUTED, opacity: pin(t, 13.43, 0.3) }}>EL PRECIO ARRANCA EN</div>
            {t >= 14.37 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, transform: `scale(${slam(t, 14.37, 1.8)})` }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 190, color: RED }}>US$10.000</span><PiTrendUp size={140} color={RED} />
              </div>
            ) : null}
            {t >= 14.9 ? <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, transform: `scale(${pop(t, 14.94)})` }}><PiLockSimple size={64} color={INK} /><span style={{ fontFamily: DISPLAY, fontSize: 70, color: INK }}>Y NO VUELVE A BAJAR</span></div> : null}
          </div>
        ) : null}

        {/* CTA */}
        {t >= 15.3 && t < 20.4 ? <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: out(t, 20.4, 0.5) }}><Sequence from={Math.round(15.3 * FPS)}><OffthreadVideo src={staticFile('media/frutos/logo-particulas.mp4')} muted /></Sequence></AbsoluteFill> : null}
        {t >= 15.6 ? (
          <div style={{ position: 'absolute', top: 1040, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: pin(t, 15.6, 0.3) }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 160, color: INK, lineHeight: 1, transform: `scale(${slam(t, 15.66, 1.5)})` }}>ESCRÍBENOS YA</div>
            <div style={{ marginTop: 40, background: ACCENT, borderRadius: 999, padding: '28px 70px', fontFamily: BODY, fontWeight: 900, fontSize: 54, color: INK, transform: `scale(${pop(t, 16.3)})`, boxShadow: '0 20px 60px rgba(45,82,255,0.55)' }}>Enviar mensaje 👉</div>
            <div style={{ marginTop: 34, fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 2, color: SOFT, opacity: pin(t, 16.7, 0.4) }}>keylab.tech/tokenizacion</div>
          </div>
        ) : null}
        {t >= 18.5 ? <div style={{ position: 'absolute', top: 360, width: 1080, display: 'flex', justifyContent: 'center', opacity: pin(t, 18.5, 0.5) }}><Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 360 }} /></div> : null}
        <OneGag g={{ ...OUTRO_MUEJEJE, at: 17.4, dur: 4.1 }} />

        <Captions />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(t, [CORTO_DUR - 0.5, CORTO_DUR], [0, 1], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
