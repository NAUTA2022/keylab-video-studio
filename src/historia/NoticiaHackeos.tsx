import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  PiChartLineDown, PiCheckCircleFill, PiCloud, PiCoins, PiCurrencyBtc, PiDeviceMobile, PiFileCode, PiHardDrives, PiLaptop,
  PiLockKey, PiPlugs, PiRobot, PiScan, PiShieldCheck, PiSnowflake, PiVault, PiWallet, PiWarningOctagon, PiCube,
} from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';
import { EY_FOX, OUTRO_MUEJEJE, OneGag } from '../components/Gags';
import { Backdrop, BigLogo, Chip, Label, Words, INK, MUTED, SOFT } from './Historia';
import { Persona3D, type Layer } from './Persona3D';

// Noticia del día · hackeo a Binance + fallas de PHP → por qué la tokenización RWA con autocustodia es distinta.
// Vertical 1080x1920. Negro minimalista, personajes pintados (captura de movimiento) y animaciones simples.
// Tiempos = segundos de la voz (public/media/noticia-hackeos/voz.mp3, Martin Osborne).

ensureFonts();
export const HACKEOS_DUR = 104;
const FPS = 30;
const RED = '#FF3B3B';
const ACCENT = '#2D52FF';
const GREEN = '#2BD47D';
const DISPLAY = 'Anton';
const BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const vis = (t: number, a: number, b: number, f = 0.4) => Math.min(interpolate(t, [a, a + 0.01], [0, 1], clamp), interpolate(t, [b - f, b], [1, 0], clamp));

/* Persona pintada con aura de color (rojo = atacante) */
const Fig: React.FC<{ id: string; at: number; until: number; x: number; y: number; h: number; rgb?: string; yaw?: number; clip?: string; ink?: string }> = ({ id, at, until, x, y, h, rgb = '150,170,255', yaw = Math.PI, clip = 'idle', ink }) => {
  const t = useT();
  if (t < at - 0.05 || t > until + 0.05) return null;
  const H = Math.round(h * 2.05), W = Math.round(H * 0.85);
  const p = pin(t, at, 1.0);
  const o = vis(t, at, until, 0.5);
  const top = y - h * 1.08;
  const fa = ((y - top - h * 0.14) / H) * 100, fb = ((y - top + h * 0.08) / H) * 100;
  const mask = `linear-gradient(180deg, #000 ${fa}%, transparent ${fb}%)`;
  const layers: Layer[] = [{ clip, weight: 1, offset: x / 300 }];
  return (
    <div style={{ position: 'absolute', left: x - W / 2, top: top + (1 - p) * 30, width: W, height: H, opacity: p * o, WebkitMaskImage: mask, maskImage: mask }}>
      <Persona3D id={id} width={W} height={H} yaw={yaw} aura={1.5} auraRGB={rgb} ink={ink} cam={{ y: 1.3, z: 2.05, fov: 35, lookY: 1.25 }} layers={layers} />
    </div>
  );
};

/* Ícono redondo con etiqueta */
const Node: React.FC<{ at: number; until: number; x: number; y: number; Icon: React.ComponentType<{ size?: number; color?: string }>; label?: string; color?: string; size?: number; danger?: number; ok?: number }> = ({ at, until, x, y, Icon, label, color = INK, size = 120, danger, ok }) => {
  const t = useT();
  const p = pin(t, at, 0.5);
  const o = vis(t, at, until);
  if (o <= 0 || p <= 0) return null;
  const d = danger ? pin(t, danger, 0.3) : 0;
  const g = ok ? pin(t, ok, 0.3) : 0;
  const c = d > 0 ? RED : g > 0 ? GREEN : color;
  const pulse = d > 0 ? 1 + Math.sin((t - (danger ?? 0)) * 18) * 0.04 : 1;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, opacity: o, transform: `scale(${(0.6 + 0.4 * p) * pulse})` }}>
      <div style={{ width: size, height: size, borderRadius: '50%', border: `2.5px solid ${c}`, background: d > 0 ? 'rgba(255,59,59,0.14)' : g > 0 ? 'rgba(43,212,125,0.12)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: d > 0 ? `0 0 40px ${RED}` : g > 0 ? `0 0 30px ${GREEN}` : 'none' }}>
        <Icon size={size * 0.5} color={c} />
      </div>
      {label ? <div style={{ position: 'absolute', top: size + 14, left: -150, width: size + 300, textAlign: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: c, textTransform: 'uppercase' }}>{label}</div> : null}
    </div>
  );
};

/* Línea recta entre dos puntos, con puntos que viajan (flujo) */
const Flow: React.FC<{ at: number; until: number; a: [number, number]; b: [number, number]; color?: string; dots?: boolean; speed?: number; dash?: boolean }> = ({ at, until, a, b, color = SOFT, dots = true, speed = 0.8, dash }) => {
  const t = useT();
  const { width, height } = useVideoConfig();
  const p = pin(t, at, 0.8);
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const x2 = a[0] + (b[0] - a[0]) * p, y2 = a[1] + (b[1] - a[1]) * p;
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0, opacity: o }}>
      <line x1={a[0]} y1={a[1]} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeDasharray={dash ? '10 12' : undefined} opacity={0.7} />
      {dots && p >= 1 ? [0, 0.33, 0.66].map((k) => {
        const q = ((t - at) * speed + k) % 1;
        return <circle key={k} cx={a[0] + (b[0] - a[0]) * q} cy={a[1] + (b[1] - a[1]) * q} r={9} fill={color} />;
      }) : null}
    </svg>
  );
};

/* Contador de dinero que sube rápido */
const Counter: React.FC<{ at: number; until: number; to: number; y: number; color?: string }> = ({ at, until, to, y, color = RED }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const v = interpolate(t, [at, at + 1.6], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  const shake = t < at + 1.8 ? Math.sin(t * 90) * 4 : 0;
  return (
    <div style={{ position: 'absolute', top: y, left: 0, width: 1080, textAlign: 'center', opacity: o, transform: `translateX(${shake}px)` }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 150, color, lineHeight: 1 }}>US$ {Math.round(v).toLocaleString('es-CO')}</div>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: INK, marginTop: 10 }}>MILLONES</div>
    </div>
  );
};

/* Fila de dato en rojo con ícono (caídas) */
const DropRow: React.FC<{ at: number; until: number; y: number; Icon: React.ComponentType<{ size?: number; color?: string }>; text: string; value?: string }> = ({ at, until, y, Icon, text, value }) => {
  const t = useT();
  const p = pin(t, at, 0.5);
  const o = vis(t, at, until) * p;
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 110, top: y, width: 860, height: 110, opacity: o, transform: `translateX(${(1 - p) * -60}px)`, display: 'flex', alignItems: 'center', gap: 28, borderBottom: '1.5px solid rgba(255,59,59,0.35)' }}>
      <Icon size={56} color={RED} />
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: INK, flex: 1 }}>{text}</div>
      {value ? <div style={{ fontFamily: DISPLAY, fontSize: 64, color: RED }}>{value}</div> : null}
    </div>
  );
};

/* Gráfica que se desploma */
const Crash: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  const o = vis(t, at, until) * 0.55;
  if (o <= 0) return null;
  const p = interpolate(t, [at, at + 3.5], [0, 1], clamp);
  const pts = Array.from({ length: 40 }, (_, i) => {
    const x = 60 + i * 24;
    const base = 1560 - i * 6 + Math.sin(i * 1.7) * 18;
    const fall = i > 26 ? (i - 26) ** 1.6 * 14 : 0;
    return [x, base + fall];
  }).slice(0, Math.max(2, Math.round(40 * p)));
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: o }}>
      <polyline points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={RED} strokeWidth={5} strokeLinejoin="round" />
    </svg>
  );
};

/* Fuente de la noticia (pequeña, abajo) */
const Source: React.FC<{ at: number; until: number; text: string; y?: number }> = ({ at, until, text, y = 1800 }) => {
  const t = useT();
  const o = vis(t, at, until) * pin(t, at, 0.6);
  if (o <= 0) return null;
  return <div style={{ position: 'absolute', top: y, left: 60, width: 960, textAlign: 'center', fontFamily: BODY, fontWeight: 600, fontSize: 22, color: MUTED, opacity: o }}>{text}</div>;
};

/* Banda "NOTICIA DEL DÍA" con alerta roja */
const Kicker: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT();
  const o = vis(t, at, until) * pin(t, at, 0.4);
  if (o <= 0) return null;
  const blink = Math.floor(t * 2.5) % 2 === 0 ? 1 : 0.35;
  return (
    <div style={{ position: 'absolute', top: 170, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: RED, padding: '14px 30px', borderRadius: 8 }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: INK, opacity: blink }} />
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: INK }}>NOTICIA DEL DÍA</div>
      </div>
    </div>
  );
};

/* Titular gigante con glitch */
const Glitch: React.FC<{ text: string; at: number; until: number; y: number; size: number; color?: string }> = ({ text, at, until, y, size, color = INK }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0 || t < at) return null;
  const s = interpolate(t, [at, at + 0.25], [1.5, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
  const g = Math.floor(t * 30) % 9 === 0 ? 1 : 0;
  const style: React.CSSProperties = { position: 'absolute', top: y, left: 40, width: 1000, textAlign: 'center', fontFamily: DISPLAY, fontSize: size, lineHeight: 0.95, textTransform: 'uppercase' };
  return (
    <div style={{ opacity: o, transform: `scale(${s})`, transformOrigin: `540px ${y + size / 2}px` }}>
      <div style={{ ...style, color: RED, transform: `translate(${g * 10}px, ${g * -4}px)`, opacity: 0.8 }}>{text}</div>
      <div style={{ ...style, color: '#3BD6FF', transform: `translate(${g * -10}px, ${g * 4}px)`, opacity: 0.6 }}>{text}</div>
      <div style={{ ...style, color }}>{text}</div>
    </div>
  );
};

/* Rejilla de sitios web (70 % en PHP) que se apaga */
const WebGrid: React.FC<{ at: number; until: number; off: number; attack: number }> = ({ at, until, off, attack }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const cols = 10, size = 64, gap = 18, x0 = (1080 - (cols * size + (cols - 1) * gap)) / 2, y0 = 760;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      {Array.from({ length: 100 }, (_, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const php = ((i * 37) % 100) < 70;
        const p = pin(t, at + 0.3 + i * 0.012, 0.3);
        const lit = php ? interpolate(t, [at + 1.5, at + 2.3], [0, 1], clamp) : 0;
        const rnd = Math.sin(i * 12.9898) * 43758.5453; const fr = rnd - Math.floor(rnd);
        const dark = php ? interpolate(t, [off + fr * 1.6, off + fr * 1.6 + 0.08], [0, 1], clamp) : 0;
        const flick = php && t > off + fr * 1.6 - 0.25 && t < off + fr * 1.6 ? (Math.floor(t * 40 + i) % 2) : 0;
        const hit = php && t > attack && Math.floor((t - attack) * 6 + fr * 6) % 7 === 0;
        const bg = hit ? RED : dark > 0.5 ? 'rgba(255,255,255,0.05)' : php ? `rgba(140,160,255,${0.25 + 0.6 * lit})` : 'rgba(255,255,255,0.16)';
        return <div key={i} style={{ position: 'absolute', left: x0 + c * (size + gap), top: y0 + r * (size + gap), width: size, height: size, borderRadius: 10, background: bg, opacity: p * (flick ? 0.3 : 1), transform: `scale(${0.7 + 0.3 * p})` }} />;
      })}
    </div>
  );
};

/* Cadena de bloques intacta en el centro, anillo de servicios alrededor */
const ChainCore: React.FC<{ at: number; until: number; cx: number; cy: number; ring: number; breach: number }> = ({ at, until, cx, cy, ring, breach }) => {
  const t = useT();
  const o = vis(t, at, until);
  if (o <= 0) return null;
  const rp = pin(t, ring, 1.2);
  const br = pin(t, breach, 0.8);
  const R = 330;
  const target: [number, number] = [cx + R * Math.cos(-Math.PI / 2 + 2.2), cy + R * Math.sin(-Math.PI / 2 + 2.2)];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(140,160,255,0.45)" strokeWidth={2} strokeDasharray={`${2 * Math.PI * R * rp} 9999`} transform={`rotate(-90 ${cx} ${cy})`} />
        {br > 0 ? <line x1={target[0] + (target[0] - cx) * 0.6} y1={target[1] + (target[1] - cy) * 0.6} x2={target[0] + (cx - target[0]) * br * 0.75} y2={target[1] + (cy - target[1]) * br * 0.75} stroke={RED} strokeWidth={5} /> : null}
      </svg>
      {[0, 1, 2].map((i) => {
        const p = pin(t, at + i * 0.3, 0.5);
        return (
          <div key={i} style={{ position: 'absolute', left: cx - 70, top: cy - 230 + i * 160, width: 140, height: 120, borderRadius: 18, border: `2.5px solid ${INK}`, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p, transform: `scale(${0.7 + 0.3 * p})`, boxShadow: '0 0 30px rgba(140,160,255,0.35)' }}>
            <PiLockKey size={56} color={INK} />
          </div>
        );
      })}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {[0, 1].map((i) => <line key={i} x1={cx} y1={cy - 110 + i * 160} x2={cx} y2={cy - 70 + i * 160} stroke={INK} strokeWidth={4} opacity={pin(t, at + 0.5 + i * 0.3)} />)}
      </svg>
    </div>
  );
};

/* Bóveda única que se tacha */
const Vault: React.FC<{ at: number; until: number; cross: number }> = ({ at, until, cross }) => {
  const t = useT();
  const o = vis(t, at, until) * pin(t, at, 0.5);
  if (o <= 0) return null;
  const c = pin(t, cross, 0.5);
  return (
    <div style={{ position: 'absolute', left: 340, top: 640, width: 400, height: 400, opacity: o * (1 - 0.5 * c), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <PiVault size={300} color={MUTED} />
      <svg width={400} height={400} style={{ position: 'absolute', inset: 0 }}>
        <line x1={40} y1={40} x2={40 + 320 * c} y2={40 + 320 * c} stroke={RED} strokeWidth={14} strokeLinecap="round" />
      </svg>
    </div>
  );
};

/* Moneda/token que viaja */
const Coin: React.FC<{ at: number; from: [number, number]; to: [number, number]; dur?: number; until: number; label?: string; color?: string }> = ({ at, from, to, dur = 1.2, until, label, color = '#F5C84B' }) => {
  const t = useT();
  if (t < at || t > until) return null;
  const p = interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const x = from[0] + (to[0] - from[0]) * p, y = from[1] + (to[1] - from[1]) * p - Math.sin(p * Math.PI) * 120;
  const o = vis(t, at, until, 0.3);
  return (
    <div style={{ position: 'absolute', left: x - 44, top: y - 44, width: 88, height: 88, borderRadius: 44, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o, boxShadow: `0 0 30px ${color}` }}>
      {label ? <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 22, color: '#050507' }}>{label}</span> : <PiCoins size={46} color="#050507" />}
    </div>
  );
};

/* Celular con escaneo facial y código de 2 pasos */
const Phone: React.FC<{ at: number; until: number; warn: number; scan: number; code: number }> = ({ at, until, warn, scan, code }) => {
  const t = useT();
  const o = vis(t, at, until) * pin(t, at, 0.6);
  if (o <= 0) return null;
  const w = t >= warn && t < scan ? 1 : 0;
  const s = pin(t, scan, 0.4);
  const sl = ((t - scan) * 0.9) % 1;
  const okF = pin(t, scan + 1.2, 0.3);
  const cd = pin(t, code, 0.3);
  const digits = Math.min(6, Math.floor(Math.max(0, t - code) * 6));
  const okC = pin(t, code + 1.3, 0.3);
  const W = 420, H = 820, X = 540 - W / 2, Y = 620;
  return (
    <div style={{ position: 'absolute', left: X, top: Y, width: W, height: H, opacity: o }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 60, border: `3px solid ${w ? RED : 'rgba(255,255,255,0.5)'}`, background: '#0B0C10', boxShadow: w ? `0 0 60px ${RED}` : '0 0 60px rgba(45,82,255,0.3)' }} />
      <div style={{ position: 'absolute', left: W / 2 - 50, top: 24, width: 100, height: 26, borderRadius: 13, background: '#000' }} />
      {w ? <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PiWarningOctagon size={180} color={RED} /></div> : null}
      {s > 0 && t < code ? (
        <div style={{ position: 'absolute', left: 60, top: 160, width: W - 120, height: W - 120, opacity: s }}>
          <PiScan size={W - 120} color={okF > 0 ? GREEN : SOFT} />
          {okF <= 0 ? <div style={{ position: 'absolute', left: 30, right: 30, top: 30 + sl * (W - 180), height: 4, background: SOFT, boxShadow: `0 0 20px ${SOFT}` }} /> : null}
          <div style={{ position: 'absolute', top: W - 80, left: -40, right: -40, textAlign: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 30, color: okF > 0 ? GREEN : INK }}>{okF > 0 ? 'Rostro verificado' : 'Escaneo facial'}</div>
        </div>
      ) : null}
      {cd > 0 ? (
        <div style={{ position: 'absolute', left: 40, right: 40, top: 220, opacity: cd, textAlign: 'center' }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: INK, marginBottom: 30 }}>Verificación en 2 pasos</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ width: 48, height: 64, borderRadius: 10, border: `2px solid ${okC > 0 ? GREEN : 'rgba(255,255,255,0.4)'}`, fontFamily: BODY, fontWeight: 900, fontSize: 36, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i < digits ? '•' : ''}</div>)}
          </div>
          {okC > 0 ? <div style={{ marginTop: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: okC }}><PiCheckCircleFill size={70} color={GREEN} /><span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, color: GREEN }}>Movimiento aprobado</span></div> : null}
        </div>
      ) : null}
    </div>
  );
};

/* Ciclo cerrado dueño ↔ inversionista con escudo que gira */
const ClosedLoop: React.FC<{ at: number; until: number; cy: number }> = ({ at, until, cy }) => {
  const t = useT();
  const o = vis(t, at, until) * pin(t, at, 0.8);
  if (o <= 0) return null;
  const R = 300;
  const p = pin(t, at, 1.6);
  const rot = (t - at) * 40;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={540} cy={cy} r={R} fill="none" stroke={ACCENT} strokeWidth={6} strokeDasharray={`${2 * Math.PI * R * p} 9999`} transform={`rotate(-90 540 ${cy})`} style={{ filter: `drop-shadow(0 0 16px ${ACCENT})` }} />
        {[0, 1, 2, 3].map((k) => { const a = ((rot + k * 90) * Math.PI) / 180; return <circle key={k} cx={540 + R * Math.cos(a)} cy={cy + R * Math.sin(a)} r={10} fill={SOFT} />; })}
      </svg>
      <div style={{ position: 'absolute', left: 540 - 110, top: cy - 110, width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PiShieldCheck size={200} color={INK} /></div>
    </div>
  );
};

/* Ey. (asset fijo: fondo azul, palabra gigante y el zorro de la ceja) */
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

/* Cierre: isotipo + wordmark + botón */
const Close: React.FC<{ at: number }> = ({ at }) => {
  const t = useT();
  if (t < at) return null;
  const p = pin(t, at, 1.2);
  const b = pin(t, at + 0.6, 0.6);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 820, left: 0, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: p }}>
        <Img src={staticFile('brand/isotipo-cromo.png')} style={{ width: 230, filter: 'drop-shadow(0 0 40px rgba(140,160,255,0.35))', transform: `translateY(${(1 - p) * 30}px)` }} />
        <Img src={staticFile('brand/wordmark-texto.png')} style={{ width: 300, marginTop: 34 }} />
        <div style={{ marginTop: 50, opacity: b, transform: `scale(${0.9 + 0.1 * b})`, background: ACCENT, borderRadius: 999, padding: '24px 56px', fontFamily: BODY, fontWeight: 900, fontSize: 40, color: INK, letterSpacing: 1 }}>Agenda una reunión</div>
        <div style={{ marginTop: 24, fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: SOFT, opacity: b }}>keylab.tech</div>
      </div>
    </AbsoluteFill>
  );
};

const TW = 920, TX = 80;

export const NoticiaHackeos: React.FC = () => (
  <AbsoluteFill style={{ background: '#050507', overflow: 'hidden' }}>
    <Backdrop />
    <Audio src={staticFile('media/noticia-hackeos/voz-musica.mp3')} />
    <Sequence from={Math.round(48.27 * FPS)} durationInFrames={60}><Audio src={staticFile('sfx/boom.mp3')} volume={0.55} /></Sequence>
    <Sequence from={Math.round(99.6 * FPS)} durationInFrames={120}><Audio src={staticFile('sfx/muejeje-corto.mp3')} volume={0.6} /></Sequence>

    {/* 1 · HOOK amarillista 0–12 */}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,59,59,0.22) 0%, rgba(5,5,7,0) 70%)` }} />
    <Kicker at={0.0} until={12.0} />
    <Glitch text="Hackearon Binance" at={1.39} until={8.0} y={300} size={170} />
    <Counter at={3.25} until={8.0} to={6300} y={720} />
    <Words text="El robo cripto más grande de la historia." at={5.29} until={8.0} size={46} y={1000} width={TW} color={INK} weight={800} />
    <Fig id="hacker1" at={0.4} until={8.0} x={540} y={1700} h={360} rgb="255,59,59" ink="#C9C9D2" />
    <Words text="El mercado en rojo" at={8.03} until={12.0} font="display" size={110} y={330} width={TW} color={RED} />
    <DropRow at={8.03} until={12.0} y={640} Icon={PiSnowflake} text="Retiros congelados" />
    <DropRow at={9.29} until={12.0} y={780} Icon={PiCurrencyBtc} text="Bitcoin" value="−4,5 %" />
    <DropRow at={10.53} until={12.0} y={920} Icon={PiChartLineDown} text="Coinbase" value="−4,8 %" />
    <Crash at={8.03} until={12.0} />
    <Source at={1.4} until={12.0} text="Fuentes: Forbes, CNBC y Chainalysis · 29–30 de octubre de 2026 · cifras preliminares" />

    {/* 2 · PHP 12.1–31.7 */}
    <Words text="Y no es lo único." at={12.16} until={13.9} size={70} y={860} width={TW} weight={800} />
    <Glitch text="PHP" at={13.97} until={31.7} y={200} size={240} />
    <Chip text="Una IA encontró 2 fallas" at={15.3} until={24.5} x={250} y={470} />
    <Words text="≈70 % de la web" at={20.0} until={24.5} font="display" size={96} y={570} width={TW} color={SOFT} />
    <WebGrid at={14.6} until={31.7} off={24.73} attack={29.34} />
    <Words text="Gobiernos apagaron sus sitios" at={24.73} until={31.7} size={50} y={500} width={TW} weight={800} color={RED} />
    <Chip text="Wikipedia fuera de línea" at={26.81} until={31.7} x={235} y={1640} />
    <Words text="Millones de intentos de ataque" at={29.34} until={31.7} size={46} y={1560} width={TW} color={RED} weight={800} />
    <Source at={14.0} until={31.7} text="Fuentes: PHP Foundation, Wiz, Cloudflare · 21–23 de octubre de 2026" />

    {/* 3 · No es la blockchain 32–48 */}
    <Words text="¿Se rompió la blockchain?" at={32.06} until={37.2} size={64} y={220} width={TW} weight={800} />
    <Glitch text="No." at={33.73} until={37.2} y={1420} size={220} color={GREEN} />
    <ChainCore at={32.5} until={47.95} cx={540} cy={960} ring={38.8} breach={45.56} />
    <Node at={34.38} until={47.95} x={260} y={1420} Icon={PiLaptop} label="Laptop de un ingeniero" danger={34.9} size={130} />
    <Words text="El problema no está en la blockchain, sino en lo que la rodea." at={38.8} until={47.95} size={52} y={220} width={TW} weight={800} />
    <Node at={42.52} until={47.95} x={540 + 330 * Math.cos(-Math.PI / 2 - 2.2)} y={960 + 330 * Math.sin(-Math.PI / 2 - 2.2)} Icon={PiPlugs} label="Proveedores" />
    <Node at={43.32} until={47.95} x={540} y={960 - 330} Icon={PiHardDrives} label="Servidores" />
    <Node at={44.01} until={47.95} x={540 + 330 * Math.cos(-Math.PI / 2 + 2.2)} y={960 + 330 * Math.sin(-Math.PI / 2 + 2.2)} Icon={PiCloud} label="Servicios externos" danger={45.56} />
    <Words text="Basta con vulnerar uno solo." at={45.56} until={47.95} size={58} y={1600} width={640} x={60} align="left" color={RED} weight={800} />
    <Fig id="hacker2" at={45.6} until={47.95} x={880} y={1900} h={280} rgb="255,59,59" ink="#C9C9D2" yaw={Math.PI + 0.5} />

    {/* 4 · EY */}
    <Ey at={48.27} until={49.0} />

    {/* 5 · Tokenización RWA 49–71.4 */}
    <Words text="La tokenización RWA funciona distinto." at={49.02} until={55.2} size={62} y={260} width={TW} weight={800} />
    <Vault at={52.52} until={55.2} cross={53.15} />
    <Words text="No hay una gran bóveda con el dinero de todos." at={52.52} until={55.2} size={44} y={1120} width={TW} color={MUTED} weight={700} />
    <Fig id="dueno" at={55.31} until={71.4} x={260} y={1180} h={330} yaw={Math.PI + 0.45} />
    <Fig id="inversor" at={55.6} until={71.4} x={820} y={1180} h={330} yaw={Math.PI - 0.45} />
    <Node at={56.66} until={71.4} x={260} y={1300} Icon={PiWallet} size={96} label="Autocustodia" />
    <Node at={56.9} until={71.4} x={820} y={1300} Icon={PiWallet} size={96} label="Autocustodia" />
    <Words text="Cada usuario con su propia billetera." at={55.31} until={62.3} size={52} y={260} width={TW} weight={800} />
    <Label text="Dueño del activo" at={60.17} until={71.4} x={260} y={1450} color={INK} size={24} />
    <Label text="Inversionista" at={61.18} until={71.4} x={820} y={1450} color={INK} size={24} />
    <Flow at={58.35} until={64.9} a={[340, 1300]} b={[740, 1300]} />
    <Words text="Directo, entre dueño e inversionista." at={58.35} until={62.3} size={40} y={1560} width={TW} color={SOFT} />
    <Words text="El token representa tu parte." at={62.33} until={64.9} size={56} y={260} width={TW} weight={800} />
    <Coin at={62.6} until={64.9} from={[260, 1060]} to={[820, 1060]} label="TU %" color={SOFT} />
    <Words text="El activo genera ingresos" at={64.99} until={71.4} size={52} y={240} width={TW} weight={800} />
    <Node at={67.2} until={71.4} x={540} y={760} Icon={PiFileCode} size={150} label="Contrato inteligente" ok={69.43} />
    <Coin at={66.65} until={68.3} from={[260, 1060]} to={[540, 760]} />
    <Coin at={69.43} until={71.3} from={[540, 760]} to={[820, 1060]} dur={1.0} />
    <Coin at={69.6} until={71.3} from={[540, 760]} to={[960, 640]} dur={1.0} />
    <Coin at={69.8} until={71.3} from={[540, 760]} to={[120, 640]} dur={1.0} />
    <Words text="…y reparte a cada uno lo suyo." at={69.43} until={71.4} size={44} y={1560} width={TW} color={GREEN} weight={800} />

    {/* 6 · Celular hackeado → verificación 71.6–80.4 */}
    <Words text="¿Y si te hackean el celular?" at={71.68} until={73.9} size={64} y={300} width={TW} weight={800} color={RED} />
    <Phone at={71.68} until={80.45} warn={71.9} scan={77.0} code={78.75} />
    <Words text="Cada compra y cada movimiento se confirma." at={73.92} until={80.45} size={50} y={300} width={TW} weight={800} />
    <Node at={74.9} until={80.45} x={160} y={1000} Icon={PiDeviceMobile} size={100} label="Dueño" />
    <Node at={75.6} until={80.45} x={920} y={1000} Icon={PiDeviceMobile} size={100} label="Inversionista" />

    {/* 7 · Key Lab ciclo cerrado 80.6–92 */}
    <BigLogo at={80.62} until={87.3} x={210} y={200} />
    <ClosedLoop at={81.88} until={87.3} cy={940} />
    <Words text="Ciclo cerrado entre dueño e inversionista" at={82.09} until={87.3} size={46} y={1340} width={TW} weight={800} />
    <Chip text="Solo con verificaciones estrictas" at={84.67} until={87.3} x={170} y={1500} accent />
    <Words text="La revolución de internet ya llegó" at={87.42} until={92.0} font="display" size={120} y={420} width={TW} />
    <Words text="O te actualizas," at={89.73} until={92.0} size={70} y={1050} width={TW} weight={900} color={SOFT} />
    <Words text="o te hackean." at={90.83} until={92.0} size={90} y={1170} width={TW} weight={900} color={RED} />

    {/* 8 · CTA 92–104 */}
    <Words text="¿Quieres tu tokenizadora o revisar si tu desarrollo está al día?" at={92.09} until={104} size={58} y={300} width={TW} weight={800} />
    <Close at={93.6} />
    <OneGag g={{ ...OUTRO_MUEJEJE, at: 99.6, dur: 4.4, y: 0.9, size: 0.26 }} />
  </AbsoluteFill>
);

void PiRobot; void PiCube; void TX;
