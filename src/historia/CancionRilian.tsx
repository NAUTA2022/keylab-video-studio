import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { PiAirplaneTilt, PiChatCircleText, PiGlobeHemisphereWest, PiHeartFill, PiHouseLine, PiPlanet, PiSparkle, PiSun } from 'react-icons/pi';
import { ensureFonts } from '../brand/fonts';
import { Backdrop } from './Historia';
import A from './rilian-analisis.json';

// "Rilian" · canción de amor a distancia cantada en indonesio. Vertical 1080x1920, 174 s.
// Mismo estilo: negro con puntos, personajes pintados con aura (horneados una vez y reusados en bucle),
// letra en indonesio + traducción al español, visuales que nacen de cada frase y crecen con la música.
ensureFonts();
export const RILIAN_DUR = 174;
const FPS = 30;
const INK = '#FFFFFF', SOFT = '#8CA0FF', PINK = '#FF8CB8', GOLD = '#FFC85A', MUTED = '#8A8D99';
const BODY = 'Figtree', DISPLAY = 'Anton';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.8) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const win = (t: number, a: number, b: number, fi = 0.8, fo = 0.8) => Math.min(pin(t, a, fi), interpolate(t, [b - fo, b], [1, 0], clamp));
const energy = (t: number) => { const i = Math.floor(t); const e = A.energy; const a = e[Math.min(i, e.length - 1)] ?? 0, b = e[Math.min(i + 1, e.length - 1)] ?? 0; return a + (b - a) * (t - i); };
// golpe de pulso en cada tiempo (60 BPM) y más fuerte cada 4
const beat = (t: number) => { if (t < A.beat0) return 0; const k = (t - A.beat0) / A.period; const f = k - Math.floor(k); const bar = Math.floor(k) % 4 === 0 ? 1 : 0.55; return Math.exp(-f * 6) * bar; };
const VOID0 = 97.0, DROP = 99.95;

type Line = { id: string; w: [string, number][]; es: string; a: number; b: number };
const L: Line[] = [
  { id: 'msg', w: [['Saya', 25.08], ['bertemu', 25.6], ['anda', 26.4], ['melalui', 26.84], ['pesan.', 27.6]], es: 'Te conocí por un mensaje.', a: 25.0, b: 28.9 },
  { id: 'mundo1', w: [['Anda', 29.12], ['wanita', 29.54], ['terbaik', 30.54], ['di', 31.28], ['dunia.', 31.54]], es: 'Eres la mejor mujer del mundo.', a: 29.0, b: 32.9 },
  { id: 'cantik', w: [['Kamu', 33.1], ['cantik', 33.54], ['dan', 34.82], ['pintar.', 35.32]], es: 'Eres hermosa e inteligente.', a: 33.0, b: 36.9 },
  { id: 'kuat', w: [['Anda', 37.1], ['seorang', 37.5], ['wanita', 38.6], ['yang', 39.36], ['kuat.', 39.86]], es: 'Eres una mujer fuerte.', a: 37.0, b: 40.9 },
  { id: 'cinta1', w: [['Aku', 41.14], ['sangat', 41.56], ['mencintaimu.', 42.9]], es: 'Te amo muchísimo.', a: 41.0, b: 44.9 },
  { id: 'cinta2', w: [['Saya', 45.06], ['sangat', 45.58], ['mencintaimu.', 46.82]], es: 'Te amo muchísimo.', a: 45.0, b: 48.95 },
  { id: 'sol', w: [['Kamu', 49.1], ['adalah', 49.5], ['matahariku.', 50.82]], es: 'Eres mi sol.', a: 49.0, b: 52.9 },
  { id: 'mundo', w: [['Kau', 53.08], ['adalah', 53.48], ['duniaku.', 54.82]], es: 'Eres mi mundo.', a: 53.0, b: 56.9 },
  { id: 'familia', w: [['Saya', 57.1], ['ingin', 57.66], ['memulai', 58.82], ['sebuah', 59.54], ['keluarga', 60.62], ['dengan', 62.54], ['anda.', 63.6]], es: 'Quiero formar una familia contigo.', a: 57.0, b: 65.4 },
  { id: 'viaje', w: [['Di', 65.6], ['masa', 65.84], ['depan', 66.6], ['aku', 67.48], ['kan', 67.88], ['bepergian', 69.1], ['bersamamu.', 70.88]], es: 'En el futuro viajaré contigo.', a: 65.5, b: 72.8 },
  { id: 'cielo', w: [['Ketika', 73.04], ['saya', 73.74], ['melihat', 74.26], ['ke', 75.28], ['langit,', 75.6], ['anda', 77.14], ['adalah', 77.5], ['konstelasi', 78.6], ['saya.', 80.58]], es: 'Cuando miro al cielo, eres mi constelación.', a: 72.95, b: 81.7 },
  { id: 'lejos', w: [['Aku', 81.86], ['jauh', 82.58], ['sekali', 83.6], ['dan', 84.86], ['aku', 85.72], ['sangat', 86.6], ['merindukanmu.', 87.62]], es: 'Estoy muy lejos y te extraño muchísimo.', a: 81.8, b: 91.4 },
  { id: 'sayang', w: [['Aku', 91.86], ['mencintaimu,', 92.6], ['sayang.', 98.12]], es: 'Te amo, mi amor.', a: 91.8, b: 97.3 },
];
const lineAt = (id: string) => L.find((l) => l.id === id)!;

/* ---------- Letra: indonesio palabra a palabra + español ---------- */
const Lyric: React.FC<{ l: Line }> = ({ l }) => {
  const t = useT();
  if (t < l.a - 0.1 || t > l.b + 0.1) return null;
  const o = win(t, l.a, l.b, 0.3, 0.5);
  const es = pin(t, l.w[0][1] + 0.4, 1.0);
  return (
    <div style={{ position: 'absolute', top: 250, left: 70, width: 940, textAlign: 'center', opacity: o }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 64, lineHeight: 1.15, color: INK }}>
        {l.w.map(([w, s], i) => {
          const p = pin(t, s - 0.05, 0.5);
          const hot = t >= s && t < (l.w[i + 1]?.[1] ?? l.b);
          return <span key={i} style={{ display: 'inline-block', marginRight: 18, opacity: 0.15 + 0.85 * p, transform: `translateY(${(1 - p) * 16}px)`, color: hot ? '#FFFFFF' : '#D8DBE8', textShadow: hot ? '0 0 24px rgba(140,160,255,0.7)' : 'none' }}>{w}</span>;
        })}
      </div>
      <div style={{ marginTop: 26, fontFamily: BODY, fontWeight: 700, fontSize: 42, color: SOFT, opacity: es, transform: `translateY(${(1 - es) * 12}px)` }}>{l.es}</div>
    </div>
  );
};

/* ---------- Cielo de estrellas que crece con la canción; en el drop, viaje (warp) ---------- */
const STARS = Array.from({ length: 220 }, (_, i) => {
  const r = (k: number) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  return { x: r(1) * 1080, y: r(2) * 1920, s: 1.2 + r(3) * 3, ph: r(4) * 6.28, at: r(5) };
});
const Sky: React.FC = () => {
  const t = useT();
  const reveal = interpolate(t, [0, 24, 72, 100], [0.15, 0.45, 0.8, 1], clamp);
  const warp = t > DROP ? Math.min(1, (t - DROP) / 0.6) * (0.4 + energy(t) * 0.6) : 0;
  const voidK = t > VOID0 && t < DROP ? 0.2 : 1;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: voidK }}>
      {STARS.map((s, i) => {
        if (s.at > reveal) return null;
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + s.ph));
        const b = beat(t) * (s.at < 0.3 ? 1 : 0.4);
        if (warp > 0) {
          const cx = 540, cy = 900; const dx = s.x - cx, dy = s.y - cy;
          const k = ((t - DROP) * (0.25 + s.at * 0.5) + s.at) % 1;
          const x = cx + dx * (0.2 + k * 1.6), y = cy + dy * (0.2 + k * 1.6);
          const len = 1 + warp * 40 * k;
          return <line key={i} x1={x} y1={y} x2={x - (dx / (Math.hypot(dx, dy) + 1)) * len} y2={y - (dy / (Math.hypot(dx, dy) + 1)) * len} stroke="#E6EAFF" strokeWidth={s.s * 0.8} strokeLinecap="round" opacity={(0.35 + 0.65 * tw) * Math.min(1, k * 3)} />;
        }
        return <circle key={i} cx={s.x} cy={s.y} r={s.s * (1 + b * 0.6)} fill="#E6EAFF" opacity={(0.25 + 0.6 * tw) * (0.6 + b * 0.4)} />;
      })}
    </svg>
  );
};

/* Luz que respira con el pulso */
const Pulse: React.FC = () => {
  const t = useT();
  const e = energy(t), b = beat(t);
  const voidK = t > VOID0 && t < DROP ? 0 : 1;
  const flash = t > DROP ? Math.exp(-(t - DROP) * 3.5) : 0;
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 92%, rgba(255,140,184,${(0.12 + 0.25 * b * e) * voidK}) 0%, rgba(5,5,7,0) 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 35% at 50% 48%, rgba(140,160,255,${(0.05 + 0.18 * b * e) * voidK}) 0%, rgba(5,5,7,0) 70%)` }} />
      {flash > 0.01 ? <AbsoluteFill style={{ background: `rgba(255,255,255,${flash})` }} /> : null}
    </>
  );
};

/* ---------- Personaje horneado (video transparente en bucle) ---------- */
const Baked: React.FC<{ src: string; x: number; y: number; h: number; o?: number }> = ({ src, x, y, h, o = 1 }) => {
  // recorte de personaje ya renderizado (fondo negro) que se funde con "screen"; bucle ida y vuelta de 11,6 s
  const w = h;
  const mask = 'linear-gradient(180deg, #000 55%, transparent 76%)';
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, opacity: o, mixBlendMode: 'screen', WebkitMaskImage: mask, maskImage: mask }}>
      <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)', maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)', filter: 'contrast(1.15) brightness(0.93)' }}>
        <Loop durationInFrames={348}>
          <OffthreadVideo src={staticFile(`personajes/loops/${src}.mp4`)} muted style={{ width: '100%', height: '100%' }} />
        </Loop>
      </div>
    </div>
  );
};

/* Ícono con brillo */
const Glow: React.FC<{ Icon: React.ComponentType<{ size?: number; color?: string }>; x: number; y: number; size: number; color: string; o: number; s?: number; rot?: number }> = ({ Icon, x, y, size, color, o, s = 1, rot = 0 }) => (
  o <= 0 ? null : <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: o, transform: `scale(${s}) rotate(${rot}deg)`, filter: `drop-shadow(0 0 30px ${color})` }}><Icon size={size} color={color} /></div>
);

/* Constelación en forma de corazón: estrellas que se unen */
const HEART = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  return [16 * Math.sin(a) ** 3, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))];
});
const Constellation: React.FC<{ at: number; cx: number; cy: number; k: number; o: number; glow?: number }> = ({ at, cx, cy, k, o, glow = 0 }) => {
  const t = useT();
  if (o <= 0) return null;
  const pts = HEART.map(([x, y]) => [cx + x * k, cy + y * k]);
  const n = interpolate(t, [at, at + 4.5], [0, pts.length], clamp);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: o }}>
      {pts.map(([x, y], i) => {
        const [x2, y2] = pts[(i + 1) % pts.length];
        const p = Math.max(0, Math.min(1, n - i));
        return <line key={`l${i}`} x1={x} y1={y} x2={x + (x2 - x) * p} y2={y + (y2 - y) * p} stroke={PINK} strokeWidth={2.5 + glow * 3} opacity={0.7} style={{ filter: `drop-shadow(0 0 ${8 + glow * 20}px ${PINK})` }} />;
      })}
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={(6 + glow * 4) * Math.min(1, Math.max(0, n - i + 1))} fill="#FFFFFF" style={{ filter: `drop-shadow(0 0 12px ${PINK})` }} />)}
    </svg>
  );
};

/* Arco punteado con algo que viaja */
const Arc: React.FC<{ a: [number, number]; b: [number, number]; lift: number; p: number; o: number; color: string; children?: React.ReactNode }> = ({ a, b, lift, p, o, color, children }) => {
  if (o <= 0) return null;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - lift;
  const q = (s: number) => [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * mx + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * my + s * s * b[1]];
  const [x, y] = q(p);
  const [x2, y2] = q(Math.min(1, p + 0.01));
  const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: o }}>
        <path d={`M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}`} fill="none" stroke={color} strokeWidth={3} strokeDasharray="6 14" opacity={0.6} />
      </svg>
      <div style={{ position: 'absolute', left: x - 50, top: y - 50, width: 100, height: 100, opacity: o, transform: `rotate(${ang}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </>
  );
};

const Title: React.FC<{ a: number; b: number; y: number; size: number; sub?: string; es?: string }> = ({ a, b, y, size, sub, es }) => {
  const t = useT();
  const o = win(t, a, b, 1.6, 1.6);
  if (o <= 0) return null;
  const ls = interpolate(t, [a, a + 4], [40, 18], { ...clamp, easing: ease });
  return (
    <div style={{ position: 'absolute', top: y, left: 0, width: 1080, textAlign: 'center', opacity: o }}>
      <div style={{ fontFamily: DISPLAY, fontSize: size, letterSpacing: ls, color: INK, textTransform: 'uppercase', textShadow: '0 0 40px rgba(255,140,184,0.45)', paddingLeft: ls }}>Rilian</div>
      {sub ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: INK, marginTop: 24 }}>{sub}</div> : null}
      {es ? <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 36, color: SOFT, marginTop: 12 }}>{es}</div> : null}
    </div>
  );
};

export const CancionRilian: React.FC = () => {
  const t = useT();
  const e = energy(t);
  const bt = beat(t);
  const voidK = t > VOID0 && t < DROP ? interpolate(t, [VOID0, VOID0 + 0.6], [1, 0.12], clamp) : 1;
  // posiciones de la pareja: lejos en los versos, se separan más en "lejos", se juntan en el drop
  const apart = interpolate(t, [81.8, 86, DROP, DROP + 3], [0, 1, 1, -1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const gap = apart >= 0 ? 290 + apart * 60 : 290 + apart * 170; // distancia al centro
  const himX = 540 - gap, herX = 540 + gap;
  const figIn = Math.min(pin(t, 15.5, 2.5), 1);
  const herIn = pin(t, 19.5, 2.5);
  const lift = bt * e * 10;
  const fy = 1830;
  const auraHer = 1 + (t > 37.1 && t < 41 ? 0.4 * Math.sin((t - 37.1) * 3) ** 2 : 0);
  const heartO = win(t, 41.14, 48.95, 0.4, 0.6);
  const sunO = win(t, 49.1, 52.95, 0.8, 0.6) + win(t, 112, 124, 1, 1) * 0.9;
  const worldO = win(t, 53.08, 56.9, 0.8, 0.6) + win(t, 112, 124, 1, 1) * 0.9;
  const houseO = win(t, 57.1, 65.4, 1, 0.6) + win(t, 136, 147, 1, 1);
  const planeO = win(t, 65.6, 72.8, 0.6, 0.6) + win(t, 124, 136, 0.8, 0.8);
  const constO = win(t, 73.04, 81.7, 1, 0.8) + win(t, DROP, 112, 0.2, 1) + win(t, 147, 160, 1, 1);
  const orbit = (t - 112) * 0.6;
  return (
    <AbsoluteFill style={{ background: '#050507', overflow: 'hidden' }}>
      <Backdrop />
      <Audio src={staticFile('media/rilian/rilian.mp3')} />
      <Sky />
      <Pulse />

      <div style={{ position: 'absolute', inset: 0, opacity: voidK }}>
        {/* intro: título */}
        <Title a={4.1} b={23.6} y={560} size={190} />

        {/* visuales de cada frase (zona media) */}
        {/* mensaje que viaja de él a ella */}
        <Arc a={[himX, 1250]} b={[herX, 1250]} lift={360} p={interpolate(t, [25.3, 28.0], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })} o={win(t, 25.08, 28.9, 0.4, 0.6)} color={SOFT}>
          <PiChatCircleText size={96} color={INK} style={{ filter: `drop-shadow(0 0 20px ${SOFT})` }} />
        </Arc>
        <Glow Icon={PiGlobeHemisphereWest} x={540} y={950} size={300} color={SOFT} o={win(t, 29.12, 32.9, 0.8, 0.6) * 0.9} rot={(t - 29) * 8} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Glow key={i} Icon={PiSparkle} x={herX + Math.cos(i * 1.05 + t) * 170} y={1300 + Math.sin(i * 1.05 + t) * 140} size={60 + (i % 3) * 20} color={PINK} o={win(t, 33.54 + i * 0.25, 36.9, 0.4, 0.6)} s={1 + bt * 0.3} />
        ))}
        <Glow Icon={PiHeartFill} x={540} y={960} size={360} color={PINK} o={heartO} s={1 + bt * 0.18 + (t > 45 ? 0.15 : 0)} />
        <Glow Icon={PiSun} x={t < 100 ? 540 : 540 + Math.cos(orbit) * 380} y={t < 100 ? interpolate(t, [49.1, 51], [1250, 930], { ...clamp, easing: ease }) : 1100 + Math.sin(orbit) * 260} size={t < 100 ? 380 : 200} color={GOLD} o={Math.min(1, sunO)} rot={t * 6} s={1 + bt * 0.08} />
        <Glow Icon={PiPlanet} x={t < 100 ? 540 : 540 + Math.cos(orbit + Math.PI) * 380} y={t < 100 ? 950 : 1100 + Math.sin(orbit + Math.PI) * 260} size={t < 100 ? 340 : 190} color={SOFT} o={Math.min(1, worldO)} rot={-t * 4} />
        <Glow Icon={PiHouseLine} x={540} y={t < 100 ? 1050 : 1080} size={t < 100 ? 300 : 340} color={GOLD} o={Math.min(1, houseO)} s={1 + bt * 0.05} />
        {[0, 1, 2].map((i) => (
          <Glow key={i} Icon={PiHeartFill} x={540 - 50 + i * 50} y={t < 100 ? 1050 + 30 : 1090} size={34} color={PINK} o={Math.min(1, houseO) * pin(t, (t < 100 ? 60.62 : 138) + i * 0.4, 0.5)} />
        ))}
        {t < 100 ? (
          <Arc a={[himX, 1300]} b={[herX, 1300]} lift={520} p={interpolate(t, [66.0, 71.5], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })} o={planeO} color={GOLD}>
            <PiAirplaneTilt size={90} color={INK} style={{ transform: 'rotate(45deg)', filter: `drop-shadow(0 0 16px ${GOLD})` }} />
          </Arc>
        ) : (
          [0, 1, 2].map((i) => {
            const c = 124 + i * 4; const p = interpolate(t, [c, c + 3.6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
            return <Arc key={i} a={i % 2 ? [960, 1400] : [120, 1400]} b={i % 2 ? [120, 800] : [960, 800]} lift={300} p={p} o={planeO * win(t, c, c + 3.9, 0.3, 0.4)} color={GOLD}><PiAirplaneTilt size={90} color={INK} style={{ transform: 'rotate(45deg)', filter: `drop-shadow(0 0 16px ${GOLD})` }} /></Arc>;
          })
        )}
        <Constellation at={t < 100 ? 74.26 : t < 147 ? DROP : 147} cx={540} cy={t < 100 ? 930 : 900} k={t < 100 ? 20 : 26} o={Math.min(1, constO)} glow={t > DROP ? bt : 0} />

        {/* distancia: línea entre los dos que se estira */}
        {(() => {
          const o = win(t, 82.58, 91.4, 0.8, 0.8);
          if (o <= 0) return null;
          return (
            <>
              <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: o }}>
                <line x1={himX + 60} y1={1560} x2={herX - 60} y2={1560} stroke={SOFT} strokeWidth={2.5} strokeDasharray="4 12" />
              </svg>
              <div style={{ position: 'absolute', top: 1500, left: 0, width: 1080, textAlign: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: MUTED, opacity: o }}>{Math.round(interpolate(t, [82.6, 89], [0, 17000], clamp)).toLocaleString('es-CO')} KM</div>
            </>
          );
        })()}

        {/* la pareja */}
        <Baked src="el-azul" x={himX} y={fy - lift} h={620} o={figIn * (t > 82 && t < DROP ? 0.75 : 1)} />
        <Baked src="ella-rosa" x={herX} y={fy - lift} h={620 * auraHer ** 0.05} o={herIn * (t > 82 && t < DROP ? 0.75 : 1)} />

        {/* letra */}
        {L.map((l) => <Lyric key={l.id} l={l} />)}

        {/* final instrumental: frases que vuelven */}
        {[
          [112, 123.6, 'Matahariku · Duniaku', 'Mi sol · Mi mundo'],
          [124, 135.6, 'Bepergian bersamamu', 'Viajar contigo'],
          [136, 146.6, 'Keluarga', 'Familia'],
          [147, 159.6, 'Konstelasi saya', 'Mi constelación'],
        ].map(([a, b, id, es]) => {
          const o = win(t, a as number, b as number, 1.2, 1.2);
          if (o <= 0) return null;
          return (
            <div key={a as number} style={{ position: 'absolute', top: 300, left: 60, width: 960, textAlign: 'center', opacity: o }}>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 72, color: INK, letterSpacing: 2 }}>{id}</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 42, color: SOFT, marginTop: 18 }}>{es}</div>
            </div>
          );
        })}
        <Title a={160} b={173.6} y={300} size={170} sub="Aku mencintaimu, sayang." es="Te amo, mi amor." />
      </div>

      {/* vacío: solo queda "sayang" */}
      {t > VOID0 && t < DROP ? (
        <div style={{ position: 'absolute', top: 860, left: 0, width: 1080, textAlign: 'center', opacity: pin(t, 98.12, 0.4) }}>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 110, color: INK, textShadow: `0 0 40px ${PINK}` }}>sayang.</div>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, color: SOFT, marginTop: 10 }}>mi amor.</div>
        </div>
      ) : null}
      <AbsoluteFill style={{ background: '#050507', opacity: interpolate(t, [172.2, 174], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};

void lineAt;
