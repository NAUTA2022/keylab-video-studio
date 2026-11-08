import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { ensureFonts } from '../brand/fonts';

// Senador Josué Alirio Barrera · Casanare Bendice a Israel · versión completa horizontal 1920x1080 · 115.6 s.
// 0–6 apertura en partículas (bandera de Israel → Colombia → explota) · 6–49 pleno con la bandera + frases ·
// 49–56.6 intervención en el Senado · 56.6–110.5 fotos del evento con su voz · 110.5–115.6 cierre en partículas.
ensureFonts();
export const SENADOR_DUR = 115.6;
const FPS = 30;
const M = 'media/senador-israel/';
const BLUE = '#3D7BFF', SKY = '#9CC2FF', GOLD = '#F2C14E', INK = '#FFFFFF';
const DISPLAY = 'Anton', BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const out = (t: number, b: number, d = 0.4) => interpolate(t, [b - d, b], [1, 0], clamp);

const PLENO = 6, SENADO = 49, SEN_ORIG = 119.4, FOTOS = 56.6, FIN = 110.5;
const sen = (o: number) => o - SEN_ORIG + SENADO; // tiempo del discurso del Senado → video

/* Polvo de luz que flota y sale del cuadro (siempre en movimiento) */
const Polvo: React.FC<{ o?: number }> = ({ o = 1 }) => {
  const t = useT();
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
      {Array.from({ length: 90 }, (_, i) => {
        const r = (k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
        const sp = 18 + r(1) * 50, sz = 2 + r(2) * 5;
        const y = ((r(3) * 1300 - t * sp) % 1300 + 1300) % 1300 - 110;
        const x = r(4) * 1920 + Math.sin(t * (0.3 + r(5)) + i) * 40;
        const c = i % 3 === 0 ? GOLD : i % 3 === 1 ? SKY : INK;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (1 + r(6) * 2) + i));
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: sz, background: c, opacity: tw * 0.75, boxShadow: `0 0 ${sz * 4}px ${c}` }} />;
      })}
    </AbsoluteFill>
  );
};

/* Subtítulo en inglés con revelado por palabra */
const Sub: React.FC<{ a: number; b: number; text: string; x?: number; w?: number; y?: number }> = ({ a, b, text, x = 160, w = 1600, y = 948 }) => {
  const t = useT();
  if (t < a || t > b + 0.2) return null;
  const o = Math.min(pin(t, a, 0.25), out(t, b + 0.2, 0.25));
  const words = text.split(' ');
  const per = Math.min(0.12, (b - a) * 0.6 / words.length);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, textAlign: 'center', opacity: o }}>
      <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, lineHeight: 1.25, color: INK, textShadow: '0 2px 10px rgba(0,0,0,0.95), 0 0 2px #000' }}>
        {words.map((wd, i) => {
          const p = pin(t, a + i * per, 0.35);
          return <React.Fragment key={i}>{i ? ' ' : null}<span style={{ display: 'inline-block', opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 8}px)` }}>{wd}</span></React.Fragment>;
        })}
      </span>
    </div>
  );
};

/* Frase grande que entra por palabras (máscara) */
const Frase: React.FC<{ a: number; b: number; text: string; x: number; y: number; w: number; size: number; color?: string; kicker?: string; align?: 'left' | 'center' }> = ({ a, b, text, x, y, w, size, color = INK, kicker, align = 'left' }) => {
  const t = useT();
  if (t < a || t > b) return null;
  const o = out(t, b, 0.45);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, textAlign: align, opacity: o, filter: `blur(${(1 - o) * 8}px)` }}>
      {kicker ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: GOLD, marginBottom: 14, opacity: pin(t, a, 0.5), transform: `translateX(${(1 - pin(t, a, 0.6)) * -30}px)` }}>{kicker}</div> : null}
      <div style={{ fontFamily: DISPLAY, fontSize: size, lineHeight: 1.02, color, textTransform: 'uppercase', textShadow: '0 4px 30px rgba(0,0,0,0.75)' }}>
        {text.split(' ').map((wd, i) => {
          const p = pin(t, a + 0.1 + i * 0.08, 0.7);
          return <React.Fragment key={i}>{i ? ' ' : null}<span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}><span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)` }}>{wd}</span></span></React.Fragment>;
        })}
      </div>
    </div>
  );
};

/* Foto con Ken Burns */
const Foto: React.FC<{ k: string; a: number; b: number; fade?: number; dir?: number }> = ({ k, a, b, fade = 0.7, dir = 1 }) => {
  const t = useT();
  if (t < a - 0.01 || t > b) return null;
  const o = Math.min(pin(t, a, fade), out(t, b, 0.01));
  const p = (t - a) / (b - a);
  const s = 1.14 - 0.1 * p;
  const tx = dir * (p - 0.5) * 60;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Img src={staticFile(`${M}blur/${k}.jpg`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <Img src={staticFile(`${M}fotos/${k}.jpg`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s}) translateX(${tx}px)` }} />
    </AbsoluteFill>
  );
};

/* Rótulo del senador */
const Rotulo: React.FC<{ a: number; b: number; x: number; y: number }> = ({ a, b, x, y }) => {
  const t = useT();
  if (t < a || t > b) return null;
  const p = pin(t, a, 0.8), o = out(t, b, 0.4);
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o }}>
      <div style={{ width: 8, height: 120, background: BLUE, position: 'absolute', left: -26, top: 0, transform: `scaleY(${p})`, transformOrigin: 'top' }} />
      <div style={{ overflow: 'hidden' }}><div style={{ fontFamily: DISPLAY, fontSize: 58, color: INK, transform: `translateY(${(1 - p) * 100}%)` }}>SENATOR JOSUÉ ALIRIO BARRERA</div></div>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 6, color: SKY, opacity: pin(t, a + 0.3, 0.6) }}>SENATE OF THE REPUBLIC OF COLOMBIA</div>
    </div>
  );
};

/* Contador 0 → 100 % */
const Cien: React.FC<{ a: number; b: number; x: number; y: number }> = ({ a, b, x, y }) => {
  const t = useT();
  if (t < a || t > b) return null;
  const v = interpolate(t, [a, a + 0.9], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = interpolate(t, [a + 0.85, a + 1.05, a + 1.35], [1, 1.1, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: out(t, b, 0.4) }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 260, lineHeight: 0.95, color: INK, transform: `scale(${s})`, transformOrigin: 'left center' }}>{Math.round(v)}<span style={{ color: SKY }}>%</span></div>
      <div style={{ fontFamily: DISPLAY, fontSize: 110, color: SKY, opacity: pin(t, a + 0.8, 0.5) }}>PRO-ISRAEL</div>
    </div>
  );
};

/* Palabra grande que golpea (amamos, respetamos…) */
const Golpe: React.FC<{ at: number; b: number; text: string; i: number }> = ({ at, b, text, i }) => {
  const t = useT();
  if (t < at || t > b) return null;
  const s = interpolate(t, [at, at + 0.25], [1.5, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <div style={{ position: 'absolute', left: 0, top: 170 + i * 168, width: 1920, textAlign: 'center', opacity: Math.min(pin(t, at, 0.15), out(t, b, 0.5)) }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 150, color: i === 3 ? GOLD : INK, display: 'inline-block', transform: `scale(${s})`, textShadow: '0 6px 40px rgba(0,0,0,0.7)' }}>{text}</span>
    </div>
  );
};

const SUBS_PLENO: [number, number, string][] = [
  [0.2, 6.5, "Here from the Congress of the Republic of Colombia, we support opening"],
  [6.5, 12.8, "Colombia's embassy in Jerusalem. We have defended this position. We are 100% pro-Israel."],
  [13.4, 19.2, "We defend Israel not only because it has been an ally of Colombia,"],
  [19.2, 25.0, "but because there is a promise, a blessing upon that people, where God Himself said"],
  [25.3, 30.8, "He will bless those who bless them and curse those who curse them. And we bless the people"],
  [30.8, 37.4, "of Israel, as a Colombian congressman, as a senator of the Republic. I bless the people of Israel,"],
  [37.7, 42.4, "we defend them, and we will always be their friends and allies. God bless you."],
];
const SUBS_SEN: [number, number, string][] = [
  [119.5, 124.3, "Today, first of all, we want to lift our prayers to Almighty God"],
  [124.3, 130.1, "and to state, as a senator of the Republic, from the floor of the Senate,"],
  [130.1, 137.7, "that many of the congressmen here today stand with the people of Israel,"],
  [137.7, 144.5, "that we support Israel and disagree with the way they are being treated"],
  [144.5, 150.4, "by some countries that today back the terrorists who want to wipe them out;"],
  [150.4, 155.9, "that there are also many Colombians who pray every day, who kneel and ask God"],
  [155.9, 163.3, "for the people of Israel. Many Christians, many people of this beautiful country, Colombia,"],
  [163.5, 171.2, "tell Almighty God today that, even though some stand against this people"],
  [171.2, 175.4, "and want to see it destroyed, there are so many of us Colombians who"],
];
const FOTOS_LIST = ['p7', 'p4', 'p6', 'p1', 'p18', 'p16', 'p12', 'p8', 'p17', 'p14', 'p15', 'p11', 'p2'];

export const SenadorIsrael: React.FC = () => {
  const t = useT();
  const fotoDur = (FIN - FOTOS) / FOTOS_LIST.length;
  const flash = interpolate(t, [4.18, 4.22, 4.8], [0, 0.85, 0], clamp);
  const titleP = pin(t, 4.3, 0.9);
  const sw = interpolate(t, [PLENO, PLENO + 1.0], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ background: '#04060C', overflow: 'hidden' }}>
      <Audio src={staticFile(`${M}audio-full.mp3`)} />

      {/* 1 · APERTURA 0–6 */}
      <Sequence durationInFrames={Math.round(PLENO * FPS) + 6}>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, #0B1F4D 0%, #04060C 70%)' }} />
        <AbsoluteFill style={{ mixBlendMode: 'screen' }}><OffthreadVideo src={staticFile(`${M}apertura-particulas.mp4`)} muted /></AbsoluteFill>
        {t >= 4.3 ? (
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: out(t, 6.05, 0.35) }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 34, letterSpacing: 14, color: GOLD, opacity: titleP, marginBottom: 18 }}>COLOMBIA · ISRAEL</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 170, color: INK, lineHeight: 1, transform: `scale(${1.12 - 0.12 * titleP})`, opacity: titleP, letterSpacing: interpolate(t, [4.3, 6], [2, 10]) }}>CASANARE BLESSES ISRAEL</div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 8, color: SKY, marginTop: 22, opacity: pin(t, 4.8, 0.6) }}>SENATOR JOSUÉ ALIRIO BARRERA</div>
          </AbsoluteFill>
        ) : null}
        <Polvo o={interpolate(t, [0, 1.5], [0, 0.8], clamp)} />
      </Sequence>

      {/* 2 · PLENO 6–49 */}
      {t >= PLENO && t < SENADO + 0.3 ? (
        <AbsoluteFill style={{ opacity: out(t, SENADO + 0.3, 0.3) }}>
          {['p14', 'p12', 'p6', 'p15'].map((k, i) => <Foto key={k} k={k} a={PLENO + i * 10.75} b={PLENO + (i + 1) * 10.75 + 0.8} fade={i ? 1.2 : 0.01} dir={i % 2 ? -1 : 1} />)}
          <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(4,6,12,0.55) 0%, rgba(4,6,12,0.75) 40%, rgba(4,6,12,0.88) 100%)' }} />
          <Polvo o={0.7} />
          <div style={{ position: 'absolute', left: 150, top: 60, width: 540, height: 960, borderRadius: 30, overflow: 'hidden', border: `3px solid ${SKY}`, boxShadow: `0 0 60px rgba(61,123,255,0.45), 0 30px 80px rgba(0,0,0,0.7)`, transform: `translateY(${(1 - sw) * 80}px) scale(${0.94 + 0.06 * sw})`, opacity: sw }}>
            <Sequence from={Math.round(PLENO * FPS)}><OffthreadVideo src={staticFile(`${M}pleno.mp4`)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Sequence>
          </div>
          <Rotulo a={PLENO + 0.8} b={PLENO + 9} x={790} y={90} />
          <Frase a={PLENO + 6.4} b={PLENO + 10.9} kicker="WE SUPPORT" text="Colombia's embassy in Jerusalem" x={790} y={300} w={1000} size={110} />
          <Cien a={PLENO + 11.0} b={PLENO + 19.0} x={790} y={230} />
          <Frase a={PLENO + 19.2} b={PLENO + 25.2} kicker="NOT ONLY AN ALLY" text="A promise. A blessing." x={790} y={300} w={1000} size={130} color={INK} />
          <Frase a={PLENO + 25.3} b={PLENO + 30.8} kicker="GENESIS 12:3" text="I will bless those who bless you" x={790} y={280} w={1000} size={112} color={GOLD} />
          <Frase a={PLENO + 30.9} b={PLENO + 37.6} kicker="AS A SENATOR OF THE REPUBLIC" text="I bless the people of Israel" x={790} y={280} w={1000} size={120} />
          <Frase a={PLENO + 37.7} b={SENADO} kicker="ALWAYS" text="Friends and allies" x={790} y={300} w={1000} size={150} color={SKY} />
          {SUBS_PLENO.map(([a, b, s], i) => <Sub key={i} a={a + PLENO} b={b + PLENO} text={s} x={760} w={1060} y={830} />)}
        </AbsoluteFill>
      ) : null}

      {/* 3 · SENADO 49–56.6 */}
      {t >= SENADO && t < FOTOS + 0.8 ? (
        <AbsoluteFill style={{ opacity: Math.min(pin(t, SENADO, 0.3), 1) }}>
          <Sequence from={Math.round(SENADO * FPS)}><OffthreadVideo src={staticFile(`${M}senado.mp4`)} muted style={{ width: '100%', height: '100%', transform: `scale(${1 + (t - SENADO) * 0.006})` }} /></Sequence>
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%)' }} />
        </AbsoluteFill>
      ) : null}

      {/* 4 · FOTOS DEL EVENTO 56.6–110.5 */}
      {t >= FOTOS && t < FIN + 0.4 ? (
        <AbsoluteFill style={{ opacity: out(t, FIN + 0.4, 0.4) }}>
          {FOTOS_LIST.map((k, i) => <Foto key={k} k={k} a={FOTOS + i * fotoDur} b={FOTOS + (i + 1) * fotoDur + 0.7} fade={0.7} dir={i % 2 ? -1 : 1} />)}
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(4,6,12,0.7) 0%, rgba(4,6,12,0.25) 34%, rgba(4,6,12,0) 62%, rgba(4,6,12,0.75) 100%)' }} />
          <Polvo o={0.6} />
          <Frase a={FOTOS + 0.3} b={FOTOS + 5.6} kicker="CASANARE, COLOMBIA" text="Casanare blesses Israel" x={110} y={90} w={1500} size={120} />
          <Frase a={sen(130.6)} b={sen(137.6)} kicker="FROM THE FLOOR OF THE SENATE" text="We stand with Israel" x={110} y={90} w={1500} size={120} color={SKY} />
          <Frase a={sen(150.6)} b={sen(155.8)} kicker="EVERY DAY" text="Colombians pray for Israel" x={110} y={90} w={1500} size={120} color={GOLD} />
          <Frase a={sen(156.4)} b={sen(163.2)} kicker="ONE NATION" text="This beautiful country, Colombia" x={110} y={90} w={1600} size={110} />
          <Golpe at={sen(175.48)} b={FIN - 0.1} text="LOVE" i={0} />
          <Golpe at={sen(176.46)} b={FIN - 0.1} text="RESPECT" i={1} />
          <Golpe at={sen(177.64)} b={FIN - 0.1} text="SUPPORT" i={2} />
          <Golpe at={sen(178.96)} b={FIN - 0.1} text="BLESS" i={3} />
        </AbsoluteFill>
      ) : null}
      {SUBS_SEN.map(([a, b, s], i) => <Sub key={i} a={sen(a)} b={sen(b)} text={s} />)}
      <Sub a={sen(175.4)} b={sen(180.7)} text="love, respect, support and bless the people of Israel." />

      {/* 5 · CIERRE 110.5–115.6 */}
      <Sequence from={Math.round(FIN * FPS)}>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 45%, #0B1F4D 0%, #04060C 72%)' }} />
        <AbsoluteFill style={{ mixBlendMode: 'screen' }}><OffthreadVideo src={staticFile(`${M}cierre-particulas.mp4`)} muted /></AbsoluteFill>
        <Polvo o={0.7} />
      </Sequence>
      <Frase a={FIN + 1.4} b={SENADOR_DUR - 0.1} text="Colombia stands with Israel" x={0} y={700} w={1920} size={120} align="center" />
      <Sequence from={Math.round(FIN * FPS)}>
        {t > FIN + 2.2 ? <div style={{ position: 'absolute', top: 850, width: 1920, textAlign: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 34, letterSpacing: 8, color: SKY, opacity: Math.min(pin(t, FIN + 2.2, 0.7), out(t, SENADOR_DUR - 0.1, 0.6)) }}>SENATOR JOSUÉ ALIRIO BARRERA · SHALOM</div> : null}
      </Sequence>
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(t, [SENADOR_DUR - 0.6, SENADOR_DUR], [0, 1], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
