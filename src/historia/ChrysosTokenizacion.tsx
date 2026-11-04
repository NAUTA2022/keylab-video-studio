import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import {
  PiArrowRight, PiCalendarCheck, PiCoins, PiEye, PiFilePdf, PiHammer, PiInfinity, PiStorefront, PiUser, PiUserCircle, PiUserPlus,
} from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';
import { EY_FOX, OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import { Backdrop, BigLogo, INK, MUTED, SOFT } from './Historia';
import { Moneda3D } from './Moneda3D';

// Key Lab × Chrysós Joyería · piloto de tokenización de oro laminado (US$ 3.000) con la comunidad.
// Vertical 1080x1920. Tiempos = segundos de public/media/chrysos-video/voz.mp3 (Martin Osborne, con hueco de 1 s para el Ey).
// El logo de Chrysós en partículas (12.5–16.8 s) se superpone después con ffmpeg (clip ProRes con alfa).

ensureFonts();
export const CHRYSOS_DUR = 67.5;
const FPS = 30;
const GOLD = '#E9B949';
const ACCENT = '#2D52FF';
const DISPLAY = 'Anton';
const BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
// Sin Ey: el video real es 1 s más corto después de 5.85 s; los tiempos del guion siguen en la escala original.
const SHIFT_AT = 5.85, SHIFT = 1.0;
const useT = () => { const t = useCurrentFrame() / FPS; return t < SHIFT_AT ? t : t + SHIFT; };
const pin = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const vis = (t: number, a: number, b: number, f = 0.4) => Math.min(interpolate(t, [a, a + 0.01], [0, 1], clamp), interpolate(t, [b - f, b], [1, 0], clamp));
const TW = 920;

/* Texto centrado de verdad: palabras separadas por espacios reales (sin margen colgando al final de la línea) */
const Words: React.FC<{ text: string; at: number; until: number; size: number; font?: 'display' | 'body'; weight?: number; color?: string; y: number; width?: number; tracking?: number; x?: number }> = ({ text, at, until, size, font = 'body', weight = 700, color = INK, y, width = TW, tracking = 0 }) => {
  const t = useT();
  size = size * 1.2;
  if (t < at - 0.05 || t > until + 0.05) return null;
  const out = interpolate(t, [until - 0.4, until], [1, 0], clamp);
  const words = text.split(' ');
  return (
    <div style={{ position: 'absolute', left: (1080 - width) / 2, top: y, width, textAlign: 'center', opacity: out, filter: `blur(${(1 - out) * 8}px)` }}>
      <div style={{ fontFamily: font === 'display' ? DISPLAY : BODY, fontWeight: font === 'display' ? 400 : weight, fontSize: size, lineHeight: 1.08, color, letterSpacing: tracking, textTransform: font === 'display' ? 'uppercase' : undefined, paddingLeft: tracking }}>
        {words.map((w, i) => {
          const p = interpolate(t, [at + i * 0.07, at + i * 0.07 + 0.7], [0, 1], { ...clamp, easing: ease });
          return (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: size * 0.08 }}>
                <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`, filter: `blur(${(1 - p) * 6}px)` }}>{w}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* Píldora centrada */
const Chip: React.FC<{ text: string; at: number; until: number; y: number; x?: number; accent?: boolean }> = ({ text, at, until, y }) => {
  const t = useT();
  const o = vis(t, at, until) * pin(t, at, 0.5);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', top: y, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ background: ACCENT, borderRadius: 999, padding: '14px 34px', fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: INK, textTransform: 'uppercase', transform: `scale(${0.9 + 0.1 * o})` }}>{text}</div>
    </div>
  );
};

/* Ícono que aparece con rebote */
const Pop: React.FC<{ at: number; until: number; x: number; y: number; size?: number; color?: string; Icon: React.ComponentType<{ size?: number; color?: string }>; label?: string; fall?: number }> = ({ at, until, x, y, size = 150, color = INK, Icon, label, fall }) => {
  const t = useT();
  const o = vis(t, at, until, 0.3);
  if (o <= 0) return null;
  const s = interpolate(t, [at, at + 0.35], [0.3, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
  const f = fall !== undefined && t > fall ? (t - fall) : 0;
  const dy = f * f * 2600, rot = f * 260 * (x > 540 ? 1 : -1);
  const bob = Math.sin((t - at) * 3 + x) * 6;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2 + bob + dy, width: size, opacity: o, transform: `scale(${s}) rotate(${rot}deg)`, textAlign: 'center' }}>
      <Icon size={size} color={color} />
      {label ? <div style={{ position: 'absolute', top: size + 10, left: -150, width: size + 300, textAlign: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 3, color, textTransform: 'uppercase' }}>{label}</div> : null}
    </div>
  );
};

/* Foto real de producto en tarjeta con zoom lento */
const Foto: React.FC<{ src: string; at: number; until: number; x: number; y: number; w: number; h: number; rot?: number; from?: 'left' | 'right' | 'bottom' }> = ({ src, at, until, x, y, w, h, rot = 0, from = 'bottom' }) => {
  const t = useT();
  const o = vis(t, at, until, 0.4);
  if (o <= 0) return null;
  const p = pin(t, at, 0.8);
  const dx = from === 'left' ? -400 * (1 - p) : from === 'right' ? 400 * (1 - p) : 0;
  const dy = from === 'bottom' ? 300 * (1 - p) : 0;
  const z = 1.05 + (t - at) * 0.02;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, opacity: o * p, transform: `translate(${dx}px, ${dy}px) rotate(${rot * p}deg)`, borderRadius: 34, overflow: 'hidden', border: `3px solid ${GOLD}`, boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(233,185,73,0.25)' }}>
      <Img src={staticFile(`media/chrysos/${src}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})` }} />
    </div>
  );
};

/* Número que cuenta */
const Cifra: React.FC<{ at: number; until: number; to: number; pre?: string; post?: string; y: number; size?: number; color?: string; sub?: string; dur?: number }> = ({ at, until, to, pre = '', post = '', y, size = 190, color = GOLD, sub, dur = 0.9 }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const v = interpolate(t, [at, at + dur], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = interpolate(t, [at + dur - 0.05, at + dur + 0.15, at + dur + 0.4], [1, 1.08, 1], clamp);
  return (
    <div style={{ position: 'absolute', top: y, left: 0, width: 1080, textAlign: 'center', opacity: o }}>
      <div style={{ fontFamily: DISPLAY, fontSize: size, color, lineHeight: 1, transform: `scale(${s})` }}>{pre}{Math.round(v).toLocaleString('es-CO')}{post}</div>
      {sub ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: INK, marginTop: 14, textTransform: 'uppercase' }}>{sub}</div> : null}
    </div>
  );
};

/* Paso del proceso */
const Paso: React.FC<{ n: number; at: number; until: number; y: number; Icon: React.ComponentType<{ size?: number; color?: string }>; title: string; sub: string }> = ({ n, at, until, y, Icon, title, sub }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const p = pin(t, at, 0.7);
  return (
    <div style={{ position: 'absolute', left: 90, top: y, width: 900, opacity: o * p, transform: `translateX(${(1 - p) * -80}px)`, display: 'flex', alignItems: 'center', gap: 34 }}>
      <div style={{ width: 150, height: 150, borderRadius: 75, border: `3px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(233,185,73,0.10)', boxShadow: `0 0 ${30 * p}px rgba(233,185,73,0.45)`, flexShrink: 0 }}>
        <Icon size={80} color={GOLD} />
      </div>
      <div>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, letterSpacing: 6, color: SOFT }}>PASO {n}</div>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 50, color: INK, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 32, color: MUTED, marginTop: 6 }}>{sub}</div>
      </div>
    </div>
  );
};

/* Barra que se llena con fragmentos dorados */
const Fragmentos: React.FC<{ at: number; fill: [number, number]; until: number; y: number }> = ({ at, fill, until, y }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const N = 30;
  const k = interpolate(t, fill, [0, N], clamp);
  return (
    <div style={{ position: 'absolute', left: 90, top: y, width: 900, opacity: o * pin(t, at, 0.5) }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: N }, (_, i) => {
          const p = Math.max(0, Math.min(1, k - i));
          return <div key={i} style={{ flex: 1, height: 46, borderRadius: 8, background: p > 0 ? GOLD : 'rgba(255,255,255,0.08)', opacity: 0.35 + 0.65 * p, transform: `scaleY(${0.6 + 0.4 * p})`, boxShadow: p > 0.9 ? '0 0 14px rgba(233,185,73,0.6)' : 'none' }} />;
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: BODY, fontWeight: 800, fontSize: 28, color: MUTED }}>
        <span>US$ 0</span><span style={{ color: GOLD }}>US$ {Math.round((k / N) * 3000).toLocaleString('es-CO')}</span><span>US$ 3.000</span>
      </div>
    </div>
  );
};

/* Tarjeta de cifra (meta / para ti) */
const Tarjeta: React.FC<{ at: number; until: number; y: number; kicker: string; to: number; numAt: number; sub: string; subAt: number; color?: string }> = ({ at, until, y, kicker, to, numAt, sub, subAt, color = GOLD }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const p = pin(t, at, 0.7);
  const v = interpolate(t, [numAt, numAt + 0.7], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sp = pin(t, subAt, 0.6);
  return (
    <div style={{ position: 'absolute', left: 90, top: y, width: 900, height: 340, opacity: o * p, transform: `translateY(${(1 - p) * 60}px)`, borderRadius: 40, border: `2px solid ${color === GOLD ? 'rgba(233,185,73,0.55)' : 'rgba(255,255,255,0.25)'}`, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', padding: '0 56px', gap: 44 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 200, color, lineHeight: 1, width: 400, whiteSpace: 'nowrap', flexShrink: 0 }}>{Math.round(v)}<span style={{ fontSize: 110 }}> %</span></div>
      <div>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 6, color: SOFT }}>{kicker}</div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: INK, lineHeight: 1.15, marginTop: 8, opacity: sp }}>{sub}</div>
      </div>
    </div>
  );
};

/* Comunidad alrededor de un token */
const Comunidad: React.FC<{ at: number; until: number; cy: number; lines: number; eye: number }> = ({ at, until, cy, lines, eye }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const R = 330;
  const lp = pin(t, lines, 1.0);
  const rot = (t - at) * 8;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = ((rot + i * 45) * Math.PI) / 180;
          return <line key={i} x1={540} y1={cy} x2={540 + (R - 70) * Math.cos(a) * lp} y2={cy + (R - 70) * Math.sin(a) * lp} stroke={GOLD} strokeWidth={3} strokeDasharray="10 10" strokeDashoffset={-t * 40} opacity={0.7} />;
        })}
        <circle cx={540} cy={cy} r={R} fill="none" stroke="rgba(233,185,73,0.25)" strokeWidth={2} />
      </svg>
      {Array.from({ length: 8 }, (_, i) => {
        const a = ((rot + i * 45) * Math.PI) / 180;
        const p = pin(t, at + i * 0.12, 0.5);
        return <div key={i} style={{ position: 'absolute', left: 540 + R * Math.cos(a) - 50, top: cy + R * Math.sin(a) - 50, width: 100, height: 100, borderRadius: 50, background: '#121318', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})` }}><PiUser size={60} color={INK} /></div>;
      })}
      <div style={{ position: 'absolute', left: 540 - 110, top: cy - 110, width: 220, height: 220, borderRadius: 110, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(233,185,73,0.6)', transform: `scale(${pin(t, at, 0.6)})` }}>
        {t >= eye ? <PiEye size={130} color="#050507" /> : <PiCoins size={120} color="#050507" />}
      </div>
    </div>
  );
};

/* Token: moneda de oro 3D */
const Token: React.FC<{ at: number; until: number; cy: number }> = ({ at, until, cy }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const p = pin(t, at, 0.8);
  const S = 680;
  return (
    <div style={{ position: 'absolute', left: 540 - S / 2, top: cy - S / 2, width: S, height: S, opacity: o * p, transform: `scale(${0.7 + 0.3 * p})`, filter: 'drop-shadow(0 0 60px rgba(233,185,73,0.45))' }}>
      <Moneda3D at={at - SHIFT} size={S} />
    </div>
  );
};

/* Ey. (asset fijo) */
const Ey: React.FC<{ at: number; until: number }> = ({ at, until }) => {
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

/* Cierre Key Lab */
const Close: React.FC<{ at: number }> = ({ at }) => {
  const t = useT();
  if (t < at) return null;
  const p = pin(t, at, 1.2);
  const b = pin(t, at + 0.5, 0.6);
  return (
    <div style={{ position: 'absolute', top: 700, left: 0, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: p }}>
      <Img src={staticFile('brand/isotipo-cromo.png')} style={{ width: 220, filter: 'drop-shadow(0 0 40px rgba(140,160,255,0.35))', transform: `translateY(${(1 - p) * 30}px)` }} />
      <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 300, marginTop: 30 }} />
      <div style={{ marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: GOLD }}>× CHRYSÓS JOYERÍA</div>
      <div style={{ marginTop: 44, opacity: b, transform: `scale(${0.9 + 0.1 * b})`, background: ACCENT, borderRadius: 999, padding: '24px 64px', fontFamily: BODY, fontWeight: 900, fontSize: 42, color: INK }}>Escríbenos</div>
      <div style={{ marginTop: 22, fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: SOFT, opacity: b }}>keylab.tech</div>
    </div>
  );
};

/* Marca del piloto (aclaración siempre visible) */
const Aviso: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  const o = vis(t, at, until) * pin(t, at, 0.6);
  if (o <= 0) return null;
  return <div style={{ position: 'absolute', top: 1810, left: 60, width: 960, textAlign: 'center', fontFamily: BODY, fontWeight: 600, fontSize: 24, color: MUTED, opacity: o * 0.9 }}>Piloto de validación con la comunidad · no es una promesa de ganancias</div>;
};

export const ChrysosTokenizacion: React.FC = () => {
  const t = useT();
  const glow = interpolate(t, [6.9, 12.3, 12.5, 16.8, 17, 37.8, 38, 61.7, 62], [0.1, 0.18, 0.28, 0.28, 0.12, 0.14, 0.2, 0.26, 0.12], clamp);
  return (
    <AbsoluteFill style={{ background: '#050507', overflow: 'hidden' }}>
      <Backdrop />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 45% at 50% 55%, rgba(233,185,73,${glow}) 0%, rgba(5,5,7,0) 70%)` }} />
      <Audio src={staticFile('media/chrysos-video/voz-musica.mp3')} />
      <Sequence from={Math.round(3.24 * FPS)} durationInFrames={30}><Audio src={staticFile('sfx/boing.mp3')} volume={0.35} /></Sequence>
      <Sequence from={Math.round(64.0 * FPS)} durationInFrames={105}><Audio src={staticFile('sfx/muejeje-corto.mp3')} volume={0.6} /></Sequence>

      {/* 1 · HOOK 0–5.85 */}
      <Words text="¿Te explicaron la tokenización con 3 PDF y una flecha?" at={0.05} until={5.8} size={62} y={260} width={TW} weight={900} />
      <Pop at={1.99} until={5.8} x={250} y={900} Icon={PiFilePdf} size={170} color="#FF5A4E" fall={4.3} />
      <Pop at={2.25} until={5.8} x={540} y={860} Icon={PiFilePdf} size={170} color="#FF5A4E" fall={4.38} />
      <Pop at={2.53} until={5.8} x={830} y={900} Icon={PiFilePdf} size={170} color="#FF5A4E" fall={4.46} />
      <Pop at={3.24} until={5.8} x={540} y={1130} Icon={PiArrowRight} size={190} color={INK} fall={4.55} />
      <Words text="Mejor…" at={4.28} until={5.8} size={70} y={1250} width={TW} weight={800} color={MUTED} />
      <Words text="vívela." at={5.0} until={5.8} font="display" size={190} y={1360} width={TW} color={GOLD} />


      {/* 3 · Key Lab tokeniza US$ 3.000 para stock de oro laminado 6.94–12.4 */}
      <BigLogo at={5.94} until={11.4} x={210} y={230} />
      <Words text="va a tokenizar" at={7.5} until={12.4} size={52} y={420} width={TW} weight={800} color={SOFT} />
      <Cifra at={8.47} until={12.4} to={3000} pre="US$ " y={520} size={200} dur={0.9} />
      <Words text="para un stock de oro laminado" at={9.8} until={12.4} size={50} y={790} width={TW} weight={800} />
      <Foto src="cubana" at={10.35} until={12.4} x={70} y={980} w={300} h={420} rot={-5} from="left" />
      <Foto src="lazo" at={10.6} until={12.4} x={390} y={940} w={300} h={460} />
      <Foto src="tresxuno" at={10.85} until={12.4} x={710} y={980} w={300} h={420} rot={5} from="right" />
      <Chip text="Se vende en nuestra tienda" at={11.53} until={12.4} x={250} y={1500} accent />

      {/* 4 · Chrysós en partículas (overlay) 12.5–16.84 */}
      <Words text="CHRYSÓS" at={14.47} until={16.8} font="display" size={120} y={1180} width={TW} color={GOLD} tracking={22} />
      <Words text="JOYERÍA · ORO LAMINADO · MEDELLÍN" at={15.08} until={16.8} size={24} y={1370} width={TW} weight={800} color={INK} tracking={5} />
      <Words text="chrysosjoyeria.com" at={15.3} until={16.8} size={30} y={1440} width={TW} weight={700} color={MUTED} />

      {/* 5 · No es promesa · piloto con la comunidad 16.84–25.9 */}
      <Words text="No es una promesa de ganancias." at={16.84} until={25.9} size={58} y={230} width={TW} weight={900} />
      <Words text="Es un piloto" at={18.59} until={25.9} font="display" size={150} y={380} width={TW} color={GOLD} />
      <Chip text="Validar el sistema con la comunidad" at={20.2} until={25.9} x={190} y={620} accent />
      <Comunidad at={19.0} until={25.9} cy={1130} lines={21.99} eye={23.0} />
      <Words text="Ves desde adentro cómo funciona" at={23.0} until={25.9} size={50} y={1560} width={TW} weight={800} color={SOFT} />

      {/* 6 · Así va a funcionar 26.0–37.65 */}
      <Words text="Así va a funcionar" at={26.0} until={37.65} font="display" size={82} y={200} width={TW} />
      <Paso n={1} at={27.95} until={37.65} y={470} Icon={PiCalendarCheck} title="Hasta el 31 de diciembre" sub="Se reúnen US$ 3.000 en fragmentos" />
      <Fragmentos at={29.6} fill={[29.84, 32.3]} until={37.65} y={680} />
      <Paso n={2} at={32.65} until={37.65} y={880} Icon={PiHammer} title="Compra del oro" sub="y preparación de las piezas" />
      <Paso n={3} at={35.37} until={37.65} y={1110} Icon={PiStorefront} title="Desde enero, a la venta" sub="en Chrysós Joyería" />
      <Foto src="veneciana" at={36.0} until={37.65} x={350} y={1340} w={380} h={380} />

      {/* 7 · Cifras 37.85–49.73 */}
      <Tarjeta at={37.85} until={49.73} y={300} kicker="META DEL PILOTO" to={30} numAt={38.9} sub="de ganancia en las ventas" subAt={39.2} color={INK} />
      <Tarjeta at={40.78} until={49.73} y={700} kicker="TE CORRESPONDE" to={20} numAt={43.7} sub="según tu porcentaje de tokens" subAt={45.18} />
      <Pop at={47.3} until={49.73} x={540} y={1250} Icon={PiInfinity} size={200} color={GOLD} />
      <Words text="Sin fecha de vencimiento" at={47.6} until={49.73} size={56} y={1420} width={TW} weight={900} />

      {/* 8 · Referido 49.92–56.55 */}
      <Words text="¿Traes un cliente?" at={49.92} until={56.55} font="display" size={120} y={220} width={TW} />
      <Pop at={49.92} until={56.55} x={190} y={620} Icon={PiUserCircle} size={160} color={INK} label="Tú" />
      <Pop at={50.3} until={56.55} x={540} y={620} Icon={PiUserPlus} size={160} color={SOFT} label="Cliente" />
      <Pop at={50.3} until={56.55} x={365} y={620} Icon={PiArrowRight} size={90} color={MUTED} />
      <Pop at={51.06} until={56.55} x={715} y={620} Icon={PiArrowRight} size={90} color={MUTED} />
      <Foto src="franco" at={51.06} until={56.55} x={790} y={510} w={240} h={240} from="right" />
      <Words text="compra una pieza que tú ayudaste a financiar" at={51.3} until={56.55} size={46} y={860} width={TW} weight={800} color={MUTED} />
      <Cifra at={53.77} until={56.55} to={5} pre="+" post=" %" y={1100} size={260} dur={0.55} sub="extra por esa pieza" />

      {/* 9 · Clímax 56.75–61.64 */}
      <Words text="Tu token." at={56.75} until={58.0} font="display" size={150} y={300} width={TW} />
      <Words text="Tu parte del oro." at={58.03} until={59.4} font="display" size={130} y={300} width={TW} color={GOLD} />
      <Words text="Cada paso, a la vista." at={59.42} until={61.64} font="display" size={120} y={300} width={TW} />
      <Token at={56.75} until={61.64} cy={1050} />

      {/* 10 · CTA 61.78–68.5 */}
      <Words text="¿Quieres ser parte del piloto?" at={61.78} until={68.5} size={64} y={330} width={TW} weight={900} />
      <Close at={62.6} />
      <OneGag g={{ ...OUTRO_MUEJEJE, at: 64.0, dur: 3.5, y: 0.9, size: 0.26 }} />

      <Aviso at={6.94} until={61.7} />
    </AbsoluteFill>
  );
};
