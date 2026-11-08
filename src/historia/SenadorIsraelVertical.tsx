import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { ensureFonts } from '../brand/fonts';

// Senador Josué Alirio Barrera · versión PRO vertical 1080x1920 · 131.7 s (estructura v3: él poco en cámara, fotos detrás de su voz).
// 0–6 apertura en partículas · 6–49 pleno (él 4.5 s → fotos con frases → él 5.3 s) · 49–65.2 gobernador "amigos en todo tiempo" ·
// 65.2–67.7 Senado → fotos con frases y LOVE/RESPECT/SUPPORT/BLESS hasta 126.7 · 126.7–131.7 cierre en partículas.
ensureFonts();
export const SENADOR_V_DUR = 131.7;
const FPS = 30;
const M = 'media/senador-israel/';
const BLUE = '#3D7BFF', SKY = '#9CC2FF', GOLD = '#F2C14E', INK = '#FFFFFF';
const DISPLAY = 'Anton', BODY = 'Figtree';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const pin = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });
const out = (t: number, b: number, d = 0.4) => interpolate(t, [b - d, b], [1, 0], clamp);

const PL = 6, PL_F0 = PL + 4.5, PL_F1 = PL + 37.7, GOB = 49, SEN = 65.2, SEN_F = SEN + 2.5, FIN = 126.7;
const sen = (o: number) => o - 119.4 + SEN;
const gob = (o: number) => o - 35.8 + GOB;

const Polvo: React.FC<{ o?: number }> = ({ o = 1 }) => {
  const t = useT();
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
      {Array.from({ length: 80 }, (_, i) => {
        const r = (k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
        const sp = 20 + r(1) * 60, sz = 2 + r(2) * 5;
        const y = ((r(3) * 2150 - t * sp) % 2150 + 2150) % 2150 - 115;
        const x = r(4) * 1080 + Math.sin(t * (0.3 + r(5)) + i) * 40;
        const c = i % 3 === 0 ? GOLD : i % 3 === 1 ? SKY : INK;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (1 + r(6) * 2) + i));
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: sz, background: c, opacity: tw * 0.75, boxShadow: `0 0 ${sz * 4}px ${c}` }} />;
      })}
    </AbsoluteFill>
  );
};

const Sub: React.FC<{ a: number; b: number; text: string }> = ({ a, b, text }) => {
  const t = useT();
  if (t < a || t > b + 0.2) return null;
  const o = Math.min(pin(t, a, 0.25), out(t, b + 0.2, 0.25));
  const words = text.split(' ');
  const per = Math.min(0.12, (b - a) * 0.6 / words.length);
  return (
    <div style={{ position: 'absolute', left: 70, top: 1470, width: 940, textAlign: 'center', opacity: o }}>
      <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, lineHeight: 1.25, color: INK, textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 2px #000' }}>
        {words.map((wd, i) => {
          const p = pin(t, a + i * per, 0.35);
          return <React.Fragment key={i}>{i ? ' ' : null}<span style={{ display: 'inline-block', opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 8}px)` }}>{wd}</span></React.Fragment>;
        })}
      </span>
    </div>
  );
};

const Frase: React.FC<{ a: number; b: number; text: string; size: number; color?: string; kicker?: string; y?: number }> = ({ a, b, text, size, color = INK, kicker, y = 190 }) => {
  const t = useT();
  if (t < a || t > b) return null;
  const o = out(t, b, 0.45);
  return (
    <div style={{ position: 'absolute', left: 60, top: y, width: 960, textAlign: 'center', opacity: o, filter: `blur(${(1 - o) * 8}px)` }}>
      {kicker ? <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 7, color: GOLD, marginBottom: 14, opacity: pin(t, a, 0.5) }}>{kicker}</div> : null}
      <div style={{ fontFamily: DISPLAY, fontSize: size, lineHeight: 1.03, color, textTransform: 'uppercase', textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>
        {text.split(' ').map((wd, i) => {
          const p = pin(t, a + 0.1 + i * 0.08, 0.7);
          return <React.Fragment key={i}>{i ? ' ' : null}<span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}><span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)` }}>{wd}</span></span></React.Fragment>;
        })}
      </div>
    </div>
  );
};

/* Foto: fondo desenfocado a pantalla completa + foto grande al centro con paneo */
const Foto: React.FC<{ k: string; a: number; b: number; dir?: number }> = ({ k, a, b, dir = 1 }) => {
  const t = useT();
  if (t < a - 0.01 || t > b) return null;
  const o = pin(t, a, 0.7);
  const p = (t - a) / (b - a);
  const tx = dir * (p - 0.5) * 240;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Img src={staticFile(`${M}blur/${k}.jpg`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 - 0.05 * p})` }} />
      <div style={{ position: 'absolute', left: 0, top: 640, width: 1080, height: 720, overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
        <Img src={staticFile(`${M}fotos/${k}.jpg`)} style={{ position: 'absolute', left: -230 + tx, top: 0, width: 1540, height: 720, objectFit: 'cover', transform: `scale(${1.06 - 0.06 * p})` }} />
      </div>
      <div style={{ position: 'absolute', left: 0, top: 638, width: 1080, height: 4, background: SKY, opacity: 0.8 }} />
      <div style={{ position: 'absolute', left: 0, top: 1358, width: 1080, height: 4, background: SKY, opacity: 0.8 }} />
    </AbsoluteFill>
  );
};

const Fotos: React.FC<{ list: string[]; a: number; b: number }> = ({ list, a, b }) => {
  const d = (b - a) / list.length;
  return <>{list.map((k, i) => <Foto key={k + i} k={k} a={a + i * d} b={a + (i + 1) * d + 0.7} dir={i % 2 ? -1 : 1} />)}</>;
};

const Rotulo: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (t < a || t > b) return null;
  const p = pin(t, a, 0.8), o = out(t, b, 0.4);
  return (
    <div style={{ position: 'absolute', left: 90, top: 1240, opacity: o }}>
      <div style={{ width: 8, height: 120, background: BLUE, position: 'absolute', left: -26, top: 0, transform: `scaleY(${p})`, transformOrigin: 'top' }} />
      <div style={{ overflow: 'hidden' }}><div style={{ fontFamily: DISPLAY, fontSize: 60, color: INK, transform: `translateY(${(1 - p) * 100}%)`, textShadow: '0 4px 20px rgba(0,0,0,0.7)' }}>SENATOR JOSUÉ ALIRIO BARRERA</div></div>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 5, color: SKY, opacity: pin(t, a + 0.3, 0.6), textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>SENATE OF THE REPUBLIC OF COLOMBIA</div>
    </div>
  );
};

const Cien: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT();
  if (t < a || t > b) return null;
  const v = interpolate(t, [a, a + 0.9], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = interpolate(t, [a + 0.85, a + 1.05, a + 1.35], [1, 1.1, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 0, top: 150, width: 1080, textAlign: 'center', opacity: out(t, b, 0.4) }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 260, lineHeight: 0.95, color: INK, transform: `scale(${s})`, textShadow: '0 6px 40px rgba(0,0,0,0.7)' }}>{Math.round(v)}<span style={{ color: SKY }}>%</span></div>
      <div style={{ fontFamily: DISPLAY, fontSize: 100, color: SKY, opacity: pin(t, a + 0.8, 0.5) }}>PRO-ISRAEL</div>
    </div>
  );
};

const Golpe: React.FC<{ at: number; b: number; text: string; i: number }> = ({ at, b, text, i }) => {
  const t = useT();
  if (t < at || t > b) return null;
  const s = interpolate(t, [at, at + 0.25], [1.5, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const y = i < 2 ? 110 + i * 150 : 1400 + (i - 2) * 150;
  return (
    <div style={{ position: 'absolute', left: 0, top: y, width: 1080, textAlign: 'center', opacity: Math.min(pin(t, at, 0.15), out(t, b, 0.5)) }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 150, color: i === 3 ? GOLD : INK, display: 'inline-block', transform: `scale(${s})`, textShadow: '0 6px 40px rgba(0,0,0,0.8)' }}>{text}</span>
    </div>
  );
};

/* Video horizontal al centro sobre su propio fondo desenfocado */
const Horizontal: React.FC<{ src: string; from: number; a: number; b: number }> = ({ src, from, a, b }) => {
  const t = useT();
  if (t < a || t > b) return null;
  return (
    <AbsoluteFill style={{ opacity: Math.min(pin(t, a, 0.3), out(t, b, 0.3)) }}>
      <Sequence from={Math.round(from * FPS)}>
        <OffthreadVideo src={staticFile(src)} muted style={{ position: 'absolute', left: -1100, top: 0, width: 3280, height: 1920, objectFit: 'cover', filter: 'blur(26px) brightness(0.45)' }} />
        <OffthreadVideo src={staticFile(src)} muted style={{ position: 'absolute', left: 0, top: 650, width: 1080, height: 608, objectFit: 'cover' }} />
      </Sequence>
    </AbsoluteFill>
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
const SUBS_GOB: [number, number, string][] = [
  [36.0, 42.1, "We are friends of God's people. Friends are not just within four walls;"],
  [42.1, 46.7, "friends are friends in public and in private, in good times and in bad,"],
  [46.7, 51.9, "and Casanare is a friend of the people of Israel."],
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
  [175.4, 180.7, "love, respect, support and bless the people of Israel."],
];

export const SenadorIsraelVertical: React.FC = () => {
  const t = useT();
  const flash = interpolate(t, [4.18, 4.22, 4.8], [0, 0.85, 0], clamp);
  const tp = pin(t, 4.3, 0.9);
  return (
    <AbsoluteFill style={{ background: '#04060C', overflow: 'hidden' }}>
      <Audio src={staticFile(`${M}audio-pro-v3.mp3`)} />

      {/* 1 · APERTURA */}
      {t < PL + 0.3 ? (
        <AbsoluteFill style={{ opacity: out(t, PL + 0.3, 0.3) }}>
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 42%, #0B1F4D 0%, #04060C 72%)' }} />
          <AbsoluteFill style={{ mixBlendMode: 'screen' }}><OffthreadVideo src={staticFile(`${M}apertura-particulas-v.mp4`)} muted /></AbsoluteFill>
          {t >= 4.3 ? (
            <div style={{ position: 'absolute', top: 1180, width: 1080, textAlign: 'center' }}>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 12, color: GOLD, opacity: tp }}>COLOMBIA · ISRAEL</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 150, color: INK, lineHeight: 1, marginTop: 14, transform: `scale(${1.12 - 0.12 * tp})`, opacity: tp }}>CASANARE<br />BLESSES ISRAEL</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: SKY, marginTop: 22, opacity: pin(t, 4.8, 0.6) }}>SENATOR JOSUÉ ALIRIO BARRERA</div>
            </div>
          ) : null}
          <Polvo o={interpolate(t, [0, 1.5], [0, 0.8], clamp)} />
        </AbsoluteFill>
      ) : null}

      {/* 2 · PLENO: él → fotos con frases → él */}
      {t >= PL && t < GOB + 0.3 ? (
        <AbsoluteFill style={{ opacity: out(t, GOB + 0.3, 0.3) }}>
          <Sequence from={Math.round(PL * FPS)}><OffthreadVideo src={staticFile(`${M}pleno.mp4`)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Sequence>
          {t >= PL_F0 && t < PL_F1 + 0.4 ? (
            <AbsoluteFill style={{ opacity: out(t, PL_F1 + 0.4, 0.4) }}>
              <Fotos list={['n1', 'p14', 'p6', 'p3', 'p9', 'p19', 'p11', 'p13']} a={PL_F0} b={PL_F1} />
              <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(4,6,12,0.55) 0%, rgba(4,6,12,0) 30%, rgba(4,6,12,0) 70%, rgba(4,6,12,0.6) 100%)' }} />
              <Polvo o={0.6} />
              <Frase a={PL_F0 + 0.1} b={PL + 10.9} kicker="WE SUPPORT" text="Colombia's embassy in Jerusalem" size={104} />
              <Cien a={PL + 11.0} b={PL + 19.0} />
              <Frase a={PL + 19.2} b={PL + 25.2} kicker="NOT ONLY AN ALLY" text="A promise. A blessing." size={120} />
              <Frase a={PL + 25.3} b={PL + 30.8} kicker="GENESIS 12:3" text="I will bless those who bless you" size={100} color={GOLD} />
              <Frase a={PL + 30.9} b={PL_F1} kicker="AS A SENATOR OF THE REPUBLIC" text="I bless the people of Israel" size={104} />
            </AbsoluteFill>
          ) : null}
          <Rotulo a={PL + 0.6} b={PL_F0 - 0.1} />
          <Frase a={PL_F1 + 0.3} b={GOB} kicker="ALWAYS" text="Friends and allies" size={130} color={SKY} y={150} />
          {SUBS_PLENO.map(([a, b, s], i) => <Sub key={i} a={a + PL} b={b + PL} text={s} />)}
        </AbsoluteFill>
      ) : null}

      {/* 3 · GOBERNADOR: amigos en todo tiempo */}
      <Horizontal src={`${M}gob.mp4`} from={GOB} a={GOB} b={SEN + 0.3} />
      {t >= GOB && t < SEN ? <Polvo o={0.5} /> : null}
      <Frase a={GOB + 0.4} b={gob(46.5)} kicker="CASANARE" text="Friends are not just within four walls" size={96} y={170} />
      <Frase a={gob(46.7)} b={SEN} kicker="IN GOOD TIMES AND IN BAD" text="Casanare is a friend of Israel" size={104} color={GOLD} y={170} />
      {SUBS_GOB.map(([a, b, s], i) => <Sub key={i} a={gob(a)} b={gob(b)} text={s} />)}

      {/* 4 · SENADO 2.5 s → fotos */}
      <Horizontal src={`${M}senado.mp4`} from={SEN} a={SEN} b={SEN_F + 0.8} />
      {t >= SEN_F && t < FIN + 0.4 ? (
        <AbsoluteFill style={{ opacity: out(t, FIN + 0.4, 0.4) }}>
          <Fotos list={['p7', 'n2', 'p4', 'p1', 'p18', 'p16', 'n4', 'p12', 'p8', 'p17', 'n3', 'p15', 'p2', 'p14']} a={SEN_F} b={FIN} />
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(4,6,12,0.55) 0%, rgba(4,6,12,0) 30%, rgba(4,6,12,0) 70%, rgba(4,6,12,0.6) 100%)' }} />
          <Polvo o={0.6} />
          <Frase a={SEN_F + 0.3} b={SEN_F + 6} kicker="CASANARE, COLOMBIA" text="Casanare blesses Israel" size={120} />
          <Frase a={sen(130.6)} b={sen(137.6)} kicker="FROM THE FLOOR OF THE SENATE" text="We stand with Israel" size={130} color={SKY} />
          <Frase a={sen(150.6)} b={sen(155.8)} kicker="EVERY DAY" text="Colombians pray for Israel" size={120} color={GOLD} />
          <Frase a={sen(156.4)} b={sen(163.2)} kicker="ONE NATION" text="This beautiful country, Colombia" size={110} />
          <Golpe at={sen(175.48)} b={FIN - 0.1} text="LOVE" i={0} />
          <Golpe at={sen(176.46)} b={FIN - 0.1} text="RESPECT" i={1} />
          <Golpe at={sen(177.64)} b={FIN - 0.1} text="SUPPORT" i={2} />
          <Golpe at={sen(178.96)} b={FIN - 0.1} text="BLESS" i={3} />
        </AbsoluteFill>
      ) : null}
      {SUBS_SEN.map(([a, b, s], i) => (i < 9 ? <Sub key={i} a={sen(a)} b={sen(b)} text={s} /> : null))}

      {/* 5 · CIERRE */}
      {t >= FIN ? (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 38%, #0B1F4D 0%, #04060C 72%)' }} />
          <Sequence from={Math.round(FIN * FPS)}><AbsoluteFill style={{ mixBlendMode: 'screen' }}><OffthreadVideo src={staticFile(`${M}cierre-particulas-v.mp4`)} muted /></AbsoluteFill></Sequence>
          <Polvo o={0.7} />
          <Frase a={FIN + 1.4} b={SENADOR_V_DUR - 0.1} text="Colombia stands with Israel" size={130} y={1180} />
          {t > FIN + 2.2 ? <div style={{ position: 'absolute', top: 1500, width: 1080, textAlign: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: SKY, opacity: Math.min(pin(t, FIN + 2.2, 0.7), out(t, SENADOR_V_DUR - 0.1, 0.6)) }}>SENATOR JOSUÉ ALIRIO BARRERA<br />SHALOM</div> : null}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(t, [SENADOR_V_DUR - 0.6, SENADOR_V_DUR], [0, 1], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
