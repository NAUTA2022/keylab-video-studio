import React from 'react';
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  PiCarProfileFill,
  PiCoinFill,
  PiUserFill,
  PiCalendarCheckFill,
  PiMoneyFill,
  PiXBold,
  PiTagFill,
  PiArrowsClockwiseBold,
  PiDropFill,
  PiMapPinFill,
} from 'react-icons/pi';
import { C, FONT } from '../brand/brand';
import type { Scene } from '../schema';
import { useLayout } from '../components/ui';
import { CarSplit3D } from '../three/Car3D';
import { CountUp } from '../bits/text';

/**
 * ESCENA "story": historia contada en beats sincronizados con la voz.
 * Cada beat tiene un cue (segundos desde el inicio de la escena):
 *  senor · car · plata · split · people · dolar · drive · monthly · tired · vende · sigue · count · ocho
 * Íconos: react-icons (Phosphor). Carro en pedacitos: Three.js a cuadro completo.
 */
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const useCueF = (cues: Record<string, number> | undefined) => {
  const { fps } = useVideoConfig();
  return (k: string, d: number) => Math.round((cues?.[k] ?? d) * fps);
};

// Título grande del beat (Anton) que entra con golpe y sale hacia arriba
const BeatTitle: React.FC<{ text: string; from: number; to: number; color?: string }> = ({ text, from, to, color = C.ink }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  if (f < from || f >= to) return null;
  const s = spring({ frame: f - from, fps, config: { damping: 12, stiffness: 200 } });
  const out = interpolate(f, [to - 5, to], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: L.colLeft,
        width: L.colWidth,
        top: L.logoY + 110,
        fontFamily: FONT.display,
        fontSize: L.vertical ? 118 : 96,
        lineHeight: 1,
        color,
        textTransform: 'uppercase',
        transform: `translateY(${(1 - s) * 60 - (1 - out) * 40}px) scale(${0.9 + 0.1 * s})`,
        transformOrigin: 'left center',
        opacity: out,
      }}
    >
      {text}
    </div>
  );
};

// Ventana de tiempo de un beat
const useWin = (from: number, to: number) => {
  const f = useCurrentFrame();
  return { on: f >= from && f < to, local: f - from, out: interpolate(f, [to - 5, to], [1, 0], clamp) };
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; damping?: number }> = ({ at, children, style, damping = 10 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = spring({ frame: f - at, fps, config: { damping, stiffness: 190 } });
  return <div style={{ position: 'absolute', transform: `scale(${s})`, ...style }}>{children}</div>;
};

/* Silueta con la "C" en vez de cara */
const Silhouette: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 200 230">
    <path d="M20 230 C20 160 60 135 100 135 C140 135 180 160 180 230 Z" fill={C.ink} />
    <circle cx="100" cy="72" r="58" fill={C.ink} />
    <text x="100" y="100" textAnchor="middle" fontFamily={FONT.display} fontSize="82" fill={C.white}>
      C
    </text>
  </svg>
);

export const Story: React.FC<Extract<Scene, { type: 'story' }>> = ({ cues, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const cue = useCueF(cues);
  const END = Math.round(dur * fps);
  const t = {
    senor: cue('senor', 0.15),
    car: cue('car', 2.85),
    plata: cue('plata', 4.5),
    split: cue('split', 5.5),
    people: cue('people', 7.5),
    dolar: cue('dolar', 8.95),
    drive: cue('drive', 9.75),
    monthly: cue('monthly', 11.5),
    tired: cue('tired', 14.3),
    vende: cue('vende', 15.85),
    sigue: cue('sigue', 16.35),
    count: cue('count', 18.2),
    ocho: cue('ocho', 19.67),
  };
  const stageTop = L.vertical ? 600 : 300;
  const stageH = L.subtitleY - 80 - stageTop;
  const cx = L.width / 2;
  const cy = stageTop + stageH / 2;

  return (
    <AbsoluteFill>
      {/* ---------- 1. Señor C ---------- */}
      <BeatTitle text="Señor C 🇦🇷" from={t.senor} to={t.split} />
      {(() => {
        const w = useWin(t.senor, t.split);
        if (!w.on) return null;
        const s = spring({ frame: w.local, fps, config: { damping: 12 } });
        const toLeft = interpolate(f, [t.car, t.car + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        return (
          <div style={{ position: 'absolute', left: cx - 190 - toLeft * 200, top: cy - 230, opacity: w.out, transform: `translateY(${(1 - s) * 120}px)` }}>
            <Silhouette size={380} />
          </div>
        );
      })()}
      {/* compra un carro */}
      {f >= t.car && f < t.split ? (
        <Pop at={t.car} style={{ left: cx + 30, top: cy - 120 }}>
          <PiCarProfileFill size={330} color={C.cobalt} />
        </Pop>
      ) : null}
      {/* en vez de poner toda la plata él: billete tachado */}
      {f >= t.plata && f < t.split ? (
        <Pop at={t.plata} style={{ left: cx + 110, top: cy + 120 }} damping={8}>
          <div style={{ position: 'relative', width: 170, height: 170 }}>
            <PiMoneyFill size={170} color="#1F8A57" />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PiXBold size={170} color="#E5484D" />
            </div>
          </div>
        </Pop>
      ) : null}

      {/* ---------- 2. Pedacitos digitales (3D) ---------- */}
      <BeatTitle text="Pedacitos digitales" from={t.split} to={t.people} color={C.cobalt} />
      {f >= t.split - 2 && f < t.drive ? (
        <CarSplit3D region={{ x: L.colLeft, y: stageTop + 20, w: L.colWidth, h: stageH * 0.62 }} enterAt={t.split - 2} splitAt={t.split + 12} />
      ) : null}

      {/* ---------- 3. Desde 1 USD: la gente entra ---------- */}
      <BeatTitle text="Desde 1 USD" from={t.people} to={t.drive} />
      {f >= t.people && f < t.drive
        ? Array.from({ length: 6 }).map((_, i) => {
            const at = t.people + i * 4;
            const x = L.colLeft + 40 + i * ((L.colWidth - 120) / 5);
            const y = stageTop + stageH * 0.78;
            const coinK = interpolate(f, [t.dolar + i * 2, t.dolar + i * 2 + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
            return (
              <React.Fragment key={i}>
                <Pop at={at} style={{ left: x, top: y }}>
                  <PiUserFill size={96} color={C.ink} />
                </Pop>
                {f >= t.dolar + i * 2 && coinK < 1 ? (
                  <div style={{ position: 'absolute', left: x + 22 + (cx - x - 48) * coinK, top: y - 40 - (stageH * 0.38) * coinK, transform: `scale(${1 - coinK * 0.4})` }}>
                    <PiCoinFill size={56} color="#E8B931" />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })
        : null}
      {f >= t.dolar && f < t.drive ? (
        <div style={{ position: 'absolute', right: L.width - L.colRight, top: stageTop + stageH * 0.62, fontFamily: FONT.display, fontSize: 90, color: C.cobalt }}>
          <CountUp to={1} from={0} decimals={2} prefix="$" delay={t.dolar} dur={14} separator="." />
        </div>
      ) : null}

      {/* ---------- 4. Sale a trabajar en Uber ---------- */}
      <BeatTitle text="A camellar en Uber 🚕" from={t.drive} to={t.monthly} />
      {f >= t.drive && f < t.monthly
        ? (() => {
            const k = interpolate(f, [t.drive, t.monthly - 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
            const roadY = cy + 40;
            return (
              <>
                <svg style={{ position: 'absolute', left: 0, top: roadY + 110 }} width={L.width} height={40}>
                  <line x1={L.colLeft - 60} x2={L.colRight + 60} y1={20} y2={20} stroke={C.line} strokeWidth={14} strokeLinecap="round" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line key={i} x1={L.colLeft - 40 + i * 110 - ((f * 12) % 110)} x2={L.colLeft + 10 + i * 110 - ((f * 12) % 110)} y1={20} y2={20} stroke={C.white} strokeWidth={4} />
                  ))}
                </svg>
                <div style={{ position: 'absolute', left: L.colLeft - 40 + k * (L.colWidth - 200), top: roadY - 60, transform: `translateY(${Math.sin(f * 1.3) * 3}px)` }}>
                  <PiCarProfileFill size={220} color={C.cobalt} />
                </div>
                {[0.25, 0.6, 0.9].map((p, i) => (
                  <Pop key={i} at={t.drive + 6 + i * 8} style={{ left: L.colLeft + p * L.colWidth - 40, top: roadY - 180 }}>
                    <PiMapPinFill size={80} color={i === 2 ? C.cobalt : C.gray} />
                  </Pop>
                ))}
              </>
            );
          })()
        : null}

      {/* ---------- 5. Plata cada mes ---------- */}
      <BeatTitle text="Plata cada mes" from={t.monthly} to={t.tired} color={C.cobalt} />
      {f >= t.monthly && f < t.tired
        ? (() => {
            const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN'];
            const per = Math.max(6, Math.floor((t.tired - t.monthly) / months.length));
            const mi = Math.min(months.length - 1, Math.floor((f - t.monthly) / per));
            return (
              <>
                <Pop at={t.monthly} style={{ left: cx - 130, top: stageTop }}>
                  <div style={{ position: 'relative' }}>
                    <PiCalendarCheckFill size={260} color={C.ink} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: FONT.display, fontSize: 66, color: C.ink }}>
                      <span style={{ background: C.bone, padding: '0 12px' }}>{months[mi]}</span>
                    </div>
                  </div>
                </Pop>
                {Array.from({ length: 6 }).map((_, i) => {
                  const x = L.colLeft + 40 + i * ((L.colWidth - 120) / 5);
                  const y = stageTop + stageH * 0.78;
                  return (
                    <React.Fragment key={i}>
                      <div style={{ position: 'absolute', left: x, top: y }}>
                        <PiUserFill size={96} color={C.ink} />
                      </div>
                      {months.slice(0, mi + 1).map((_, m) => {
                        const st = t.monthly + m * per + 4 + i;
                        const k = interpolate(f, [st, st + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
                        if (f < st || k >= 1) return null;
                        return (
                          <div key={m} style={{ position: 'absolute', left: cx - 28 + (x + 20 - cx) * k, top: stageTop + 230 + (y - stageTop - 230 - 40) * k }}>
                            <PiCoinFill size={52} color="#E8B931" />
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </>
            );
          })()
        : null}

      {/* ---------- 6. ¿Carro cansado? Vende o sigue ---------- */}
      <BeatTitle text="¿Carro cansado? 😮‍💨" from={t.tired} to={t.count} />
      {f >= t.tired && f < t.count ? (
        <>
          <div style={{ position: 'absolute', left: cx - 200, top: stageTop + 20, transform: `rotate(${Math.sin(f * 0.25) * 4}deg) translateY(${Math.abs(Math.sin(f * 0.25)) * 10}px)` }}>
            <PiCarProfileFill size={400} color={C.gray} />
            {[0, 1, 2].map((i) => {
              const k = ((f - t.tired + i * 9) % 27) / 27;
              return (
                <div key={i} style={{ position: 'absolute', left: 300 + i * 30, top: 30 + k * 120, opacity: 1 - k }}>
                  <PiDropFill size={44} color="#5AB0FF" />
                </div>
              );
            })}
          </div>
          <Pop at={t.vende} style={{ left: L.colLeft, top: stageTop + stageH * 0.68 }} damping={9}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.ink, color: C.white, fontFamily: FONT.body, fontWeight: 900, fontSize: 46, padding: '18px 30px', borderRadius: 60 }}>
              <PiTagFill size={50} /> VENDE
            </div>
          </Pop>
          <Pop at={t.sigue} style={{ left: L.colLeft + 360, top: stageTop + stageH * 0.68 }} damping={9}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.cobalt, color: C.white, fontFamily: FONT.body, fontWeight: 900, fontSize: 46, padding: '18px 30px', borderRadius: 60 }}>
              <PiArrowsClockwiseBold size={50} /> SIGUE
            </div>
          </Pop>
        </>
      ) : null}

      {/* ---------- 7. Auto #8 ---------- */}
      {f >= t.count && f < END
        ? (() => {
            const n = Math.min(8, 1 + Math.floor(interpolate(f, [t.count, t.ocho], [0, 7], clamp)));
            const s = spring({ frame: f - t.ocho, fps, config: { damping: 8, stiffness: 220 } });
            return (
              <>
                <div style={{ position: 'absolute', left: L.colLeft, top: L.logoY + 110, fontFamily: FONT.display, fontSize: 118, color: C.ink, lineHeight: 1 }}>
                  AUTO <span style={{ color: C.cobalt, display: 'inline-block', transform: `scale(${f >= t.ocho ? 1 + 0.25 * (1 - s) + 0.0 : 1})` }}>#{n}</span>
                </div>
                {Array.from({ length: n }).map((_, i) => {
                  const col = i % 4;
                  const row = Math.floor(i / 4);
                  return (
                    <Pop key={i} at={t.count + Math.round((i / 7) * (t.ocho - t.count))} style={{ left: L.colLeft + col * (L.colWidth / 4), top: stageTop + 40 + row * 230 }}>
                      <PiCarProfileFill size={L.colWidth / 4 - 20} color={i === 7 ? C.cobalt : C.ink} />
                    </Pop>
                  );
                })}
              </>
            );
          })()
        : null}
    </AbsoluteFill>
  );
};
