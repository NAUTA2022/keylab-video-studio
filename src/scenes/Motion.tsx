import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PiCoinFill, PiMapPinFill } from 'react-icons/pi';
import { C, FONT } from '../brand/brand';
import type { Scene } from '../schema';
import { useLayout } from '../components/ui';
import { LottieEmoji, withEmojis, type EmojiName } from '../components/LottieEmoji';
import { DonRig } from '../svg/DonRig';
import { ExcelChaos } from '../svg/assets';
import { bob, gesture } from '../motion/primitives';
import { Bailarin } from '../svg/Bailarin';

/*
 * Escena "mg" (motion graphics sobre foto real).
 * - Fondo: foto real (Wikimedia Commons u otra con licencia) con Ken Burns
 *   (zoom y paneo continuos), tinte oscuro o cobalto y viñeta para leer textos.
 * - Capas animadas por cuadro, cada una con `at` (segundos desde el inicio de
 *   la escena): textos que golpean, contadores, dona de porcentaje, barras,
 *   chips, pines, emojis animados, lluvia de monedas, globos de chat, la hoja
 *   de Excel caótica y el personaje articulado Don Excusas (DonRig).
 * - `shake`: momentos de sacudida de cámara (golpes en el ritmo).
 * Todo depende del número de cuadro: render determinista.
 */

type MG = Extract<Scene, { type: 'mg' }>;
type Layer = MG['layers'][number];

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const backOut = (k = 1.8) => Easing.out(Easing.back(k));

/* aparición con rebote y salida rápida; devuelve null si no está visible */
const useWin = (at: number, until?: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = Math.round(at * fps);
  const u = until !== undefined ? Math.round(until * fps) : Infinity;
  const vis = f >= a && f < u;
  const pin = spring({ frame: f - a, fps, config: { damping: 12, stiffness: 190 } });
  const out = u === Infinity ? 1 : interpolate(f, [u - 5, u], [1, 0], clamp);
  return { f, fps, a, vis, pin, out, local: f - a };
};

/* ---------- capas ---------- */

const TextLayer: React.FC<{ l: Extract<Layer, { k: 'text' }> }> = ({ l }) => {
  const L = useLayout();
  const { vis, local, out } = useWin(l.at, l.until);
  if (!vis) return null;
  const size = l.size ?? 96;
  const display = (l.font ?? 'display') === 'display';
  const words = l.text.split(' ');
  const bg = l.bg === 'cobalt' ? C.cobalt : l.bg === 'white' ? C.white : l.bg === 'ink' ? C.ink : undefined;
  const color = l.color ?? (l.bg === 'white' ? C.ink : C.white);
  const slam = l.anim === 'slam';
  const sIn = slam ? interpolate(local, [0, 5], [2.4, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const sOp = slam ? interpolate(local, [0, 3], [0, 1], clamp) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: l.x !== undefined ? l.x : L.colLeft - 20,
        right: l.x !== undefined ? undefined : L.width - L.colRight - 20,
        top: l.y,
        textAlign: l.align ?? 'left',
        opacity: out * sOp,
        transform: `scale(${sIn}) rotate(${l.rotate ?? 0}deg)`,
        transformOrigin: l.align === 'center' ? '50% 50%' : '0% 50%',
      }}
    >
      <span
        style={{
          display: 'inline',
          fontFamily: display ? FONT.display : FONT.body,
          fontWeight: display ? 400 : 800,
          fontSize: size,
          lineHeight: display ? 1.02 : 1.2,
          letterSpacing: display ? 1 : 0,
          textTransform: display ? 'uppercase' : 'none',
          color,
          background: bg,
          padding: bg ? `${size * 0.04}px ${size * 0.14}px` : undefined,
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          textShadow: bg ? undefined : '0 6px 28px rgba(0,0,0,0.55)',
        }}
      >
        {slam
          ? withEmojis(l.text, size * 1.05)
          : words.map((w, i) => {
              const d = local - i * (l.stagger ?? 3);
              const p = interpolate(d, [0, 7], [0, 1], { ...clamp, easing: backOut(2) });
              return (
                <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * size * 0.6}px) rotate(${(1 - p) * 6}deg)`, marginRight: size * 0.22 }}>
                  {withEmojis(w, size * 1.05)}
                </span>
              );
            })}
      </span>
    </div>
  );
};

const CountLayer: React.FC<{ l: Extract<Layer, { k: 'count' }> }> = ({ l }) => {
  const L = useLayout();
  const { vis, local, out, fps } = useWin(l.at, l.until);
  if (!vis) return null;
  const dur = Math.round((l.dur ?? 1.1) * fps);
  // Easing.exp nunca llega a 1 (queda en 0,999): al terminar se fija el valor exacto
  const v = local >= dur ? l.to : interpolate(local, [0, dur], [l.from ?? 0, l.to], { ...clamp, easing: Easing.out(Easing.exp) });
  const [int, dec] = v.toFixed(l.decimals ?? 0).split('.');
  const txt = `${l.prefix ?? ''}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${dec ? ',' + dec : ''}${l.suffix ?? ''}`;
  const size = l.size ?? 300;
  const land = interpolate(local, [dur - 4, dur, dur + 6], [1, 1.12, 1], clamp);
  const enter = interpolate(local, [0, 6], [0.6, 1], { ...clamp, easing: backOut(2.4) });
  return (
    <div
      style={{
        position: 'absolute',
        left: l.align === 'center' ? 0 : L.colLeft - 20,
        right: l.align === 'center' ? 0 : undefined,
        top: l.y,
        textAlign: l.align ?? 'left',
        fontFamily: FONT.display,
        fontSize: size,
        lineHeight: 0.95,
        color: l.color === 'cobalt' ? C.cobalt : l.color === 'soft' ? C.soft : C.white,
        fontVariantNumeric: 'tabular-nums',
        opacity: out,
        transform: `scale(${enter * land})`,
        transformOrigin: l.align === 'center' ? '50% 50%' : '0% 60%',
        textShadow: '0 10px 40px rgba(0,0,0,0.5)',
      }}
    >
      {txt}
    </div>
  );
};

const DonutLayer: React.FC<{ l: Extract<Layer, { k: 'donut' }> }> = ({ l }) => {
  const { vis, local, out, pin } = useWin(l.at, l.until);
  if (!vis) return null;
  const r = l.r ?? 260;
  const sw = r * 0.16;
  const circ = 2 * Math.PI * r;
  const p = interpolate(local, [4, 34], [0, l.value / 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const spin = interpolate(local, [0, 40], [-140, -90], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <svg
      width={r * 2 + sw * 2}
      height={r * 2 + sw * 2}
      viewBox={`${-r - sw} ${-r - sw} ${r * 2 + sw * 2} ${r * 2 + sw * 2}`}
      style={{ position: 'absolute', left: l.x - r - sw, top: l.y - r - sw, opacity: out, transform: `scale(${0.5 + 0.5 * pin}) rotate(${spin}deg)` }}
    >
      <circle r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={sw} />
      <circle r={r} fill="none" stroke={C.cobalt} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${circ * p} ${circ}`} />
      {/* marcas que giran alrededor */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const on = i / 24 < p;
        return <circle key={i} cx={Math.cos(a) * (r + sw * 1.1)} cy={Math.sin(a) * (r + sw * 1.1)} r={on ? 5 : 3} fill={on ? C.white : 'rgba(255,255,255,0.35)'} />;
      })}
    </svg>
  );
};

const BarLayer: React.FC<{ l: Extract<Layer, { k: 'bar' }> }> = ({ l }) => {
  const L = useLayout();
  const { vis, local, out, pin } = useWin(l.at, l.until);
  if (!vis) return null;
  const w = L.colWidth;
  const p = interpolate(local, [3, 26], [0, l.value / (l.max ?? 100)], { ...clamp, easing: Easing.out(Easing.cubic) });
  const col = l.color === 'white' ? C.white : C.cobalt;
  return (
    <div style={{ position: 'absolute', left: L.colLeft, top: l.y, width: w, opacity: out, transform: `translateX(${(1 - pin) * -80}px)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: C.white, marginBottom: 12, textShadow: '0 3px 14px rgba(0,0,0,0.6)' }}>
        <span>{l.label}</span>
        <span>{l.valueLabel ?? ''}</span>
      </div>
      <div style={{ height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
        <div style={{ width: `${p * 100}%`, height: '100%', borderRadius: 17, background: col }} />
      </div>
    </div>
  );
};

const ChipLayer: React.FC<{ l: Extract<Layer, { k: 'chip' }> }> = ({ l }) => {
  const L = useLayout();
  const { vis, out, pin } = useWin(l.at, l.until);
  if (!vis) return null;
  const tone = l.tone ?? 'white';
  const bg = tone === 'cobalt' ? C.cobalt : tone === 'ink' ? 'rgba(13,14,17,0.82)' : C.white;
  const fg = tone === 'white' ? C.ink : C.white;
  return (
    <div
      style={{
        position: 'absolute',
        left: l.x ?? L.colLeft,
        top: l.y,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 26px',
        borderRadius: 999,
        background: bg,
        color: fg,
        fontFamily: FONT.body,
        fontWeight: 800,
        fontSize: l.size ?? 34,
        letterSpacing: l.caps ? 3 : 0,
        textTransform: l.caps ? 'uppercase' : 'none',
        opacity: out,
        transform: `scale(${pin}) rotate(${l.rotate ?? 0}deg)`,
        transformOrigin: '0% 50%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap',
      }}
    >
      {l.pin ? <PiMapPinFill size={(l.size ?? 34) * 1.1} color={tone === 'white' ? C.cobalt : C.white} /> : null}
      {withEmojis(l.text, (l.size ?? 34) * 1.3)}
    </div>
  );
};

const EmojiLayer: React.FC<{ l: Extract<Layer, { k: 'emoji' }> }> = ({ l }) => {
  const { vis, out, pin, local } = useWin(l.at, l.until);
  if (!vis) return null;
  const s = l.size ?? 180;
  const wob = Math.sin(local * 0.35) * 6;
  return (
    <div style={{ position: 'absolute', left: l.x - s / 2, top: l.y - s / 2, opacity: out, transform: `scale(${pin}) rotate(${(l.rotate ?? 0) + wob}deg)` }}>
      <LottieEmoji name={l.name as EmojiName} size={s} />
    </div>
  );
};

const CoinsLayer: React.FC<{ l: Extract<Layer, { k: 'coins' }> }> = ({ l }) => {
  const L = useLayout();
  const { vis, local } = useWin(l.at, l.until ?? l.at + 2.2);
  if (!vis) return null;
  const n = l.n ?? 18;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }).map((_, i) => {
        const ang = (random(`a${i}`) - 0.5) * Math.PI * 1.4 - Math.PI / 2;
        const sp = 26 + random(`s${i}`) * 30;
        const t = local;
        const x = (l.x ?? L.width / 2) + Math.cos(ang) * sp * t;
        const y = (l.y ?? 900) + Math.sin(ang) * sp * t + 0.9 * t * t;
        const sz = 50 + random(`z${i}`) * 50;
        const flip = Math.cos(t * 0.35 + i);
        if (y > L.subtitleY - 90) return null; // nunca sobre los subtítulos
        return (
          <div key={i} style={{ position: 'absolute', left: x - sz / 2, top: y - sz / 2, transform: `scaleX(${flip}) rotate(${t * 9 + i * 30}deg)` }}>
            <PiCoinFill size={sz} color={i % 3 === 0 ? C.white : '#FFC93C'} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const BubbleLayer: React.FC<{ l: Extract<Layer, { k: 'bubble' }> }> = ({ l }) => {
  const { vis, out, pin } = useWin(l.at, l.until);
  if (!vis) return null;
  const me = !!l.me;
  return (
    <div
      style={{
        position: 'absolute',
        left: l.x,
        top: l.y,
        maxWidth: 520,
        padding: '18px 26px 14px',
        borderRadius: 26,
        borderBottomRightRadius: me ? 6 : 26,
        borderBottomLeftRadius: me ? 26 : 6,
        background: me ? '#D9FDD3' : C.white,
        color: C.ink,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 36,
        boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
        opacity: out,
        transform: `scale(${pin}) rotate(${l.rotate ?? 0}deg)`,
        transformOrigin: me ? '100% 100%' : '0% 100%',
      }}
    >
      {withEmojis(l.text, 44)}
      <div style={{ fontSize: 20, color: '#667781', textAlign: 'right', marginTop: 4 }}>{l.time ?? '11:04 p. m.'}{me ? ' ✓✓' : ''}</div>
    </div>
  );
};

const PinLayer: React.FC<{ l: Extract<Layer, { k: 'pin' }> }> = ({ l }) => {
  const { vis, out, local } = useWin(l.at, l.until);
  if (!vis) return null;
  const drop = interpolate(local, [0, 8], [-260, 0], { ...clamp, easing: Easing.bounce });
  const ring = (local % 30) / 30;
  return (
    <div style={{ position: 'absolute', left: l.x, top: l.y, opacity: out }}>
      <div style={{ position: 'absolute', left: -60 * (0.4 + ring), top: -20 * (0.4 + ring), width: 120 * (0.4 + ring), height: 40 * (0.4 + ring), borderRadius: '50%', border: `4px solid ${C.white}`, opacity: 1 - ring }} />
      <div style={{ position: 'absolute', left: -50, top: -110 + drop }}>
        <PiMapPinFill size={100} color={C.cobalt} />
      </div>
      <div style={{ position: 'absolute', left: 64, top: -92 + drop * 0.4, whiteSpace: 'nowrap', fontFamily: FONT.body, fontWeight: 900, fontSize: 40, color: C.white, letterSpacing: 3, textShadow: '0 4px 18px rgba(0,0,0,0.7)' }}>
        {l.text}
      </div>
    </div>
  );
};

const ExcelLayer: React.FC<{ l: Extract<Layer, { k: 'excel' }> }> = ({ l }) => {
  const { fps } = useVideoConfig();
  const { vis, out, pin, local } = useWin(l.at, l.until);
  if (!vis) return null;
  const a = Math.round(l.at * fps);
  const wob = Math.sin(local * 0.25) * 1.5;
  return (
    <div style={{ position: 'absolute', left: l.x, top: l.y, opacity: out, transform: `scale(${0.7 + 0.3 * pin}) rotate(${(l.rotate ?? 3) + wob}deg)`, transformOrigin: '50% 50%', filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.45))' }}>
      <ExcelChaos width={l.width ?? 560} excelAt={a} chatAt={a + Math.round((l.chat ?? 1.2) * fps)} nightAt={a + Math.round((l.night ?? 2) * fps)} />
    </div>
  );
};

const DonLayer: React.FC<{ l: Extract<Layer, { k: 'don' }> }> = ({ l }) => {
  const { vis, f, fps, local, out } = useWin(l.at, l.until);
  if (!vis) return null;
  const h = l.h ?? 900;
  const enter = interpolate(local, [0, 10], [1, 0], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  // brazo: cada gesto con anticipación y sobrepaso; vuelve a reposo después
  let arm = 0;
  (l.gestures ?? []).forEach((g, i) => {
    const at = Math.round(g * fps);
    if (f >= at) arm = gesture(f, fps, at, 0, i % 2 === 0 ? -28 : 20) * interpolate(f - at, [16, 30], [1, 0.3], clamp);
  });
  // sudor: gotas que caen de la frente cuando está nervioso
  const sweat = (l.sweat ?? []).some((t) => f >= t * fps && f < t * fps + 40);
  const w = h * (563 / 986);
  const x = l.x + enter * (l.from === 'right' ? 700 : -700);
  const y = l.y + bob(f, fps, 5, 0.9);
  const tilt = Math.sin((f / fps) * Math.PI * 1.1) * 1.5;
  return (
    <div style={{ position: 'absolute', left: x, top: y - h, width: w, height: h, opacity: out, transform: `rotate(${tilt}deg) scaleX(${l.flip ? -1 : 1})`, transformOrigin: '50% 100%' }}>
      <DonRig height={h} arm={arm} seed={l.seed ?? 4} style={{ left: 0, top: 0 }} />
      {sweat
        ? [0, 1].map((i) => {
            const t = ((f + i * 13) % 26) / 26;
            return (
              <svg key={i} width={34} height={46} viewBox="0 0 34 46" style={{ position: 'absolute', left: w * (0.68 + i * 0.1), top: h * (0.13 + t * 0.12), opacity: 1 - t }}>
                <path d="M17 2 C 6 20, 2 28, 2 32 A 15 13 0 0 0 32 32 C 32 28, 28 20, 17 2 Z" fill="#8FD3FF" stroke="#2A2340" strokeWidth={3} />
              </svg>
            );
          })
        : null}
    </div>
  );
};

const MemeLayer: React.FC<{ l: Extract<Layer, { k: 'meme' }> }> = ({ l }) => {
  const { vis, out, local } = useWin(l.at, l.until);
  if (!vis) return null;
  const size = l.size ?? 110;
  const p = interpolate(local, [0, 6], [0, 1], { ...clamp, easing: backOut(2.4) });
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        top: l.y,
        textAlign: 'center',
        fontFamily: FONT.display,
        fontSize: size,
        lineHeight: 1,
        color: l.color ?? '#FFFFFF',
        WebkitTextStroke: `${size * 0.075}px #000000`,
        paintOrder: 'stroke fill',
        textTransform: 'uppercase',
        transform: `scale(${0.4 + 0.6 * p}) rotate(${l.rotate ?? -3}deg)`,
        opacity: p * out,
      }}
    >
      {withEmojis(l.text, size * 1.15)}
    </div>
  );
};

const DancerLayer: React.FC<{ l: Extract<Layer, { k: 'dancer' }> }> = ({ l }) => {
  const { vis, out, pin, local, fps, f } = useWin(l.at, l.until);
  if (!vis) return null;
  let x = l.x;
  let y = l.y;
  let h = l.h ?? 600;
  if (l.move) {
    const m = interpolate(f, [l.move.at * fps, l.move.at * fps + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    x += (l.move.x - x) * m;
    y += (l.move.y - y) * m;
    h += (l.move.h - h) * m;
  }
  const dog = l.dog ?? true;
  const w = h * ((dog ? 420 : 260) / 420);
  const enter = interpolate(local, [0, 8], [0, 1], { ...clamp, easing: backOut(1.8) });
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h, opacity: out, transform: `scale(${enter * pin})`, transformOrigin: '50% 100%' }}>
      <Bailarin height={h} frame={f} dog={dog} />
    </div>
  );
};

const VideoLayer: React.FC<{ l: Extract<Layer, { k: 'video' }> }> = ({ l }) => {
  const { vis, out, local, fps, f, a } = useWin(l.at, l.until);
  if (!vis) return null;
  let x = l.x;
  let y = l.y;
  let w = l.w;
  if (l.move) {
    const m = interpolate(f, [l.move.at * fps, l.move.at * fps + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    x += (l.move.x - x) * m;
    y += (l.move.y - y) * m;
    w += (l.move.w - w) * m;
  }
  const h = w / l.aspect;
  const enter = interpolate(local, [0, 8], [0, 1], { ...clamp, easing: backOut(1.8) });
  const bw = Math.max(6, w * 0.022);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: w * 0.06,
        border: `${bw}px solid ${C.white}`,
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        opacity: out,
        transform: `scale(${enter}) rotate(${(l.rotate ?? 0) * enter}deg)`,
      }}
    >
      <Sequence from={a} layout="none">
        <OffthreadVideo src={staticFile(l.src)} muted startFrom={Math.round((l.from ?? 0) * fps)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Sequence>
      {l.label ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: w * 0.04, textAlign: 'center', fontFamily: FONT.display, fontSize: w * 0.12, color: C.white, WebkitTextStroke: `${w * 0.009}px #000`, paintOrder: 'stroke fill' }}>
          {withEmojis(l.label, w * 0.13)}
        </div>
      ) : null}
    </div>
  );
};

const renderLayer = (l: Layer, i: number) => {
  switch (l.k) {
    case 'text':
      return <TextLayer key={i} l={l} />;
    case 'count':
      return <CountLayer key={i} l={l} />;
    case 'donut':
      return <DonutLayer key={i} l={l} />;
    case 'bar':
      return <BarLayer key={i} l={l} />;
    case 'chip':
      return <ChipLayer key={i} l={l} />;
    case 'emoji':
      return <EmojiLayer key={i} l={l} />;
    case 'coins':
      return <CoinsLayer key={i} l={l} />;
    case 'bubble':
      return <BubbleLayer key={i} l={l} />;
    case 'pin':
      return <PinLayer key={i} l={l} />;
    case 'excel':
      return <ExcelLayer key={i} l={l} />;
    case 'don':
      return <DonLayer key={i} l={l} />;
    case 'meme':
      return <MemeLayer key={i} l={l} />;
    case 'dancer':
      return <DancerLayer key={i} l={l} />;
    case 'video':
      return <VideoLayer key={i} l={l} />;
  }
};

/* ---------- escena ---------- */
export const MotionScene: React.FC<MG> = ({ photo, credit, kb, tint, blur, layers, shake, dur }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const L = useLayout();
  const n = Math.max(1, Math.round(dur * fps));
  const t = interpolate(f, [0, n], [0, 1], clamp);
  const [s0, x0, y0] = kb?.from ?? [1.12, -3, 0];
  const [s1, x1, y1] = kb?.to ?? [1.28, 3, -2];
  const sc = s0 + (s1 - s0) * t;
  const tx = x0 + (x1 - x0) * t;
  const ty = y0 + (y1 - y0) * t;
  // sacudida de cámara en los golpes
  let sx = 0;
  let sy = 0;
  for (const s of shake ?? []) {
    const d = f - Math.round(s * fps);
    if (d >= 0 && d < 12) {
      const k = 1 - d / 12;
      sx += Math.sin(d * 2.7) * 18 * k;
      sy += Math.cos(d * 3.1) * 14 * k;
    }
  }
  const tintBg =
    tint === 'cobalt'
      ? 'linear-gradient(180deg, rgba(8,14,65,0.80) 0%, rgba(45,82,255,0.45) 45%, rgba(8,14,65,0.88) 100%)'
      : 'linear-gradient(180deg, rgba(13,14,17,0.78) 0%, rgba(13,14,17,0.30) 38%, rgba(13,14,17,0.45) 62%, rgba(13,14,17,0.92) 100%)';
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        {photo ? (
          <Img
            src={staticFile(photo)}
            style={{
              position: 'absolute',
              width,
              height,
              objectFit: 'cover',
              transform: `scale(${sc}) translate(${tx}%, ${ty}%)`,
              filter: blur ? `blur(${blur}px)` : undefined,
            }}
          />
        ) : null}
        <AbsoluteFill style={{ background: tintBg }} />
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)' }} />
        {layers.map(renderLayer)}
      </AbsoluteFill>
      {credit ? (
        <div style={{ position: 'absolute', right: 24, top: L.uiSafeBottom + 24, fontFamily: FONT.body, fontWeight: 600, fontSize: 18, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
          {credit}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
