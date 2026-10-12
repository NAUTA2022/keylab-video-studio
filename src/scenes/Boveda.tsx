import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PiBuildingApartmentFill, PiCoinFill, PiStarFill, PiUserFill } from 'react-icons/pi';
import { C, FONT } from '../brand/brand';
import type { Scene } from '../schema';
import { useLayout } from '../components/ui';
import { CountUp, SplitText } from '../bits/text';
import { DonExcusas } from '../svg/DonExcusas';
import { DonRig } from '../svg/DonRig';
import { gesture } from '../motion/primitives';
import { lipAt } from '../motion/useLipSync';
import labios from '../../public/media/boveda/voz-v2.labios.json';
import { Inversor } from '../svg/Inversor';
import { ComicBubble } from '../components/ComicBubble';
import { LottieEmoji, withEmojis, type EmojiName } from '../components/LottieEmoji';

/* emoji animado que aparece con rebote y se va */
const EmojiPop: React.FC<{ name: EmojiName; at: number; until: number; x: number; y: number; size: number; rotate?: number }> = ({ name, at, until, x, y, size, rotate = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f >= until) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 9, stiffness: 220 } });
  const out = interpolate(f, [until - 6, until], [1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `scale(${p * out}) rotate(${rotate}deg)` }}>
      <LottieEmoji name={name} size={size} />
    </div>
  );
};
import { PickupLot3D, pickupSpotOnScreen } from '../three/PickupLot3D';
import { Vault3D, vaultDoorOnScreen } from '../three/Vault3D';

/*
 * Escenas del video "La bóveda" (trazabilidad + desembolso por hitos).
 * Don Excusas es un personaje 2D inventado; los modelos 3D son de Kenney (CC0).
 * Todos los tiempos vienen de `cues` (segundos desde el inicio de la escena).
 */

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const useCue = (cues: Record<string, number> | undefined) => {
  const { fps } = useVideoConfig();
  return (name: string, fallback: number) => Math.round((cues?.[name] ?? fallback) * fps);
};
const SKY = 'linear-gradient(180deg, #0B0D18 0%, #121A4A 30%, #2D52FF 62%, #8EA2FF 80%, #F2C6A8 100%)';

/* Texto de meme: blanco con borde negro, entra con rebote (colores sólidos) */
const Meme: React.FC<{ text: string; at: number; until?: number; y: number; size?: number; rotate?: number; color?: string }> = ({ text, at, until = 1e9, y, size = 120, rotate = -3, color = '#FFFFFF' }) => {
  const f = useCurrentFrame();
  if (f < at || f >= until) return null;
  const p = interpolate(f - at, [0, 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.4)) });
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        top: y,
        textAlign: 'center',
        fontFamily: FONT.display,
        fontSize: size,
        lineHeight: 1,
        color,
        WebkitTextStroke: `${size * 0.075}px #000000`,
        paintOrder: 'stroke fill',
        textTransform: 'uppercase',
        transform: `scale(${0.4 + 0.6 * p}) rotate(${rotate}deg)`,
        opacity: p,
      }}
    >
      {withEmojis(text, size * 1.15)}
    </div>
  );
};

/* ======================= 1 · GANCHO: tremenda Hilux vs. lote con maleza ======================= */
export const BovedaHook: React.FC<Extract<Scene, { type: 'boveda-hook' }>> = ({ cues }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const cue = useCue(cues);
  const region = { x: 0, y: 520, w: L.width, h: L.subtitleY - 40 - 520 };
  const lotAt = cue('lot', 4.85);
  const don = pickupSpotOnScreen(f, fps, L.width, L.height, region, lotAt, [2.9, 0, 1.4]);
  const dh = 1.95 * don.ppu * (560 / 460);
  const dw = dh * (400 / 560);
  const shine = pickupSpotOnScreen(f, fps, L.width, L.height, region, lotAt, [0.6, 1.8, 0.8]);
  return (
    <AbsoluteFill style={{ background: SKY }}>
      <PickupLot3D region={region} lotAt={lotAt} />
      <DonRig height={dh} seed={5} arm={gesture(f, fps, cue('hilux', 2.9), 0, -18)} style={{ left: don.x - (dh * 563) / 986 / 2, top: don.y - dh }} />
      {/* destellos de "tremenda Hilux" */}
      {f >= cue('hilux', 2.9) && f < lotAt
        ? [0, 1, 2].map((i) => {
            const k = ((f - cue('hilux', 2.9)) / 14 + i * 0.33) % 1;
            const sc = Math.sin(k * Math.PI);
            return (
              <svg key={i} width={90} height={90} viewBox="-50 -50 100 100" style={{ position: 'absolute', left: shine.x - 45 + (i - 1) * 140, top: shine.y - 45 - i * 40, transform: `scale(${sc}) rotate(${k * 90}deg)` }}>
                <path d="M0 -48 L10 -10 L48 0 L10 10 L0 48 L-10 10 L-48 0 L-10 -10 Z" fill="#FFFFFF" />
              </svg>
            );
          })
        : null}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(11,13,24,0.9) 0%, rgba(11,13,24,0.6) 26%, rgba(11,13,24,0) 42%)' }} />
      <Meme text="Él: tremenda Hilux 🛻" at={cue('hilux', 2.9)} until={cue('gono', 3.65)} y={320} size={104} />
      <Meme text="Uy, este gonorrea 😤" at={cue('gono', 3.65)} until={lotAt} y={320} size={112} rotate={3} color="#FFD43B" />
      {f >= cue('gono', 3.65) && f < lotAt + 6
        ? (() => {
            const g = cue('gono', 3.65);
            const pin = spring({ frame: f - g, fps, config: { damping: 11, stiffness: 180 } });
            const out = interpolate(f, [lotAt - 2, lotAt + 6], [0, 1], clamp);
            return <Inversor height={560} mood="angry" rage={0.45} shout={f - g < 30 ? Math.abs(Math.sin((f - g) * 0.8)) : 0} frame={f} style={{ left: 640 + (1 - pin) * 500 + out * 500, top: 760 }} />;
          })()
        : null}
      <Meme text="Tú: un lote con maleza 🌿" at={cue('lote', 5.6)} y={320} size={100} />
    </AbsoluteFill>
  );
};

/* ======================= 2 · MINI HISTORIA: Don Excusas ======================= */
const EXCUSES = [
  { year: 'Año 1', text: 'Es que llovió, parce', at: 'ex1', yAt: 'a1' },
  { year: 'Año 2', text: 'Es que la licencia, mor', at: 'ex2', yAt: 'a2' },
  { year: 'Año 3', text: 'Es que mi primo, ¿sí o qué?', at: 'ex3', yAt: 'a3' },
];
const RAGE = 'Este tetra, quintu, cuadru, triple hijue pu—'.split(' ');

export const BovedaStory: React.FC<Extract<Scene, { type: 'boveda-story' }>> = ({ cues }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const cue = useCue(cues);
  const t = {
    don: cue('don', 0.13),
    plata: cue('plata', 1.97),
    dos: cue('doscientas', 2.83),
    edificio: cue('edificio', 4.21),
    a1: cue('a1', 5.21),
    ex1: cue('ex1', 6.43),
    a2: cue('a2', 7.27),
    ex2: cue('ex2', 8.79),
    a3: cue('a3', 9.81),
    ex3: cue('ex3', 11.31),
    evidencia: cue('evidencia', 12.19),
    render: cue('render', 13.87),
    rabia: cue('rabia', 14.7),
  };
  const rage = f >= t.rabia;
  // Don habla cuando sale cada excusa
  const talking = EXCUSES.some((e) => f >= cue(e.at, 0) && f < cue(e.at, 0) + 24);
  // la boca sigue la voz real (la narración dice sus excusas)
  const talking40 = EXCUSES.some((e) => f >= cue(e.at, 0) - 2 && f < cue(e.at, 0) + 42);
  const talk = talking40 ? lipAt(labios, f, 7.45) : 0;
  // gesto de "es que…" con la mano en cada excusa
  const armDon = EXCUSES.reduce((a, e) => a + gesture(f, fps, cue(e.at, 0) - 4, 0, -22) - gesture(f, fps, cue(e.at, 0) + 40, 0, -22), 0);
  void talking;
  const donIn = spring({ frame: f - t.don, fps, config: { damping: 12, stiffness: 160 } });
  const shake = rage ? Math.sin(f * 2.3) * 14 : 0;

  // excusómetro: sube con cada excusa y revienta en la tercera
  const level = EXCUSES.reduce((acc, e, i) => acc + interpolate(f - cue(e.at, 0), [0, 10], [0, 1 / 3], { ...clamp, easing: Easing.out(Easing.back(2)) }) * (i < 3 ? 1 : 0), 0);
  const boomAt = t.ex3 + 16;
  const boom = f >= boomAt;
  const exc = EXCUSES.filter((e) => f >= cue(e.at, 0)).length - 1;
  const showExcuses = f >= t.a1 && f < t.evidencia;

  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      {/* título */}
      <div style={{ position: 'absolute', left: L.colLeft, top: 300, width: L.colWidth }}>
        <div style={{ fontFamily: FONT.display, fontSize: 118, lineHeight: 0.95, color: C.ink, textTransform: 'uppercase' }}>
          <SplitText text="Don Excusas" delay={t.don} stagger={1.2} />
        </div>
        {f >= t.don + 10 ? (
          <div style={{ marginTop: 14, display: 'inline-block', background: C.ink, color: C.white, fontFamily: FONT.body, fontWeight: 800, fontSize: 28, letterSpacing: 2, padding: '8px 18px', borderRadius: 10, textTransform: 'uppercase', opacity: interpolate(f - t.don - 10, [0, 8], [0, 1], clamp) }}>
            Constructor · 0 edificios entregados
          </div>
        ) : null}
      </div>

      {/* Don Excusas */}
      {!rage ? (
        <DonRig height={705} talk={talk} arm={armDon} style={{ left: 95 + (1 - donIn) * -500, top: 1320 - 705 }} />
      ) : null}

      {/* reacción con emoji animado a cada excusa */}
      {!rage
        ? (['ojos-blanco', 'payaso', 'calavera'] as EmojiName[]).map((n, i) => (
            <EmojiPop key={n} name={n} at={cue(EXCUSES[i].at, 0) + 6} until={i < 2 ? cue(EXCUSES[i + 1].at, 0) : t.evidencia} x={130} y={650} size={150} rotate={-8} />
          ))
        : null}
      {!rage ? <EmojiPop name="payaso" at={t.render + 4} until={t.rabia} x={930} y={560} size={170} rotate={10} /> : null}
      {/* 200 inversionistas → plata → "para un edificio" */}
      {f >= t.plata && f < t.a1
        ? Array.from({ length: 20 }).map((_, i) => {
            const at = t.plata + i * 1.2;
            const s = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 200 } });
            const x = 560 + (i % 4) * 100;
            const y = 640 + Math.floor(i / 4) * 92;
            // moneda que viaja hacia Don
            const k = interpolate(f - at - 12, [0, 18], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
            return (
              <React.Fragment key={i}>
                <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${s})` }}>
                  <PiUserFill size={70} color={i % 5 === 0 ? C.cobalt : '#5C5A55'} />
                </div>
                {k > 0 && k < 1 ? (
                  <div style={{ position: 'absolute', left: x + (300 - x) * k, top: y + (980 - y) * k - Math.sin(k * Math.PI) * 120 }}>
                    <PiCoinFill size={40} color="#E8B33A" />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })
        : null}
      {f >= t.dos && f < t.a1 ? (
        <div style={{ position: 'absolute', left: 560, top: 560, fontFamily: FONT.display, fontSize: 64, color: C.ink }}>
          <CountUp to={200} delay={t.dos} dur={20} /> <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.gray }}>inversionistas</span>
        </div>
      ) : null}
      {f >= t.edificio && f < t.a1 ? (
        <div style={{ position: 'absolute', left: 620, top: 1120, display: 'flex', alignItems: 'center', gap: 14, transform: `scale(${spring({ frame: f - t.edificio, fps, config: { damping: 10 } })})` }}>
          <div style={{ border: `5px dashed ${C.cobalt}`, borderRadius: 18, padding: 8, lineHeight: 0 }}>
            <PiBuildingApartmentFill size={90} color={C.cobalt} />
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: C.ink, lineHeight: 1.1 }}>
            Edificio
            <br />
            <span style={{ color: C.gray, fontWeight: 600, fontSize: 24 }}>(en teoría)</span>
          </div>
        </div>
      ) : null}

      {/* excusas año por año + excusómetro */}
      {showExcuses ? (
        <>
          {EXCUSES.map((e, i) => {
            const ya = cue(e.yAt, 0);
            const next = i < 2 ? cue(EXCUSES[i + 1].yAt, 0) : t.evidencia;
            if (f < ya || f >= next) return null;
            const p = spring({ frame: f - ya, fps, config: { damping: 12, stiffness: 200 } });
            return (
              <div key={i} style={{ position: 'absolute', left: 560, top: 600, fontFamily: FONT.display, fontSize: 110, color: C.cobalt, textTransform: 'uppercase', transform: `scale(${p})`, transformOrigin: 'left center' }}>
                {e.year}
              </div>
            );
          })}
          {exc >= 0 ? (
            <ComicBubble
              key={exc}
              text={`“${EXCUSES[exc].text}”`}
              x={480}
              y={790}
              width={540}
              tipX={345}
              tipY={800}
              style="speech"
              fontSize={44}
              scale={0.7 + 0.3 * spring({ frame: f - cue(EXCUSES[exc].at, 0), fps, config: { damping: 16, stiffness: 200 } })}
            />
          ) : null}
          {/* excusómetro */}
          <div style={{ position: 'absolute', left: 600, top: 1070, width: 340 }}>
            {!boom ? (
              <svg width={340} height={200} viewBox="-170 -170 340 200">
                <path d="M-150 0 A150 150 0 0 1 150 0" fill="none" stroke={C.line} strokeWidth={30} />
                <path d="M-150 0 A150 150 0 0 1 -75 -130" fill="none" stroke="#1FA971" strokeWidth={30} />
                <path d="M-75 -130 A150 150 0 0 1 75 -130" fill="none" stroke="#F5B83D" strokeWidth={30} />
                <path d="M75 -130 A150 150 0 0 1 150 0" fill="none" stroke="#E5484D" strokeWidth={30} />
                <g transform={`rotate(${-90 + level * 180 + (level > 0.9 ? Math.sin(f * 2) * 6 : 0)})`}>
                  <path d="M-8 0 L0 -130 L8 0 Z" fill={C.ink} />
                </g>
                <circle r={16} fill={C.ink} />
              </svg>
            ) : (
              <div style={{ position: 'relative', height: 200 }}>
                {Array.from({ length: 22 }).map((_, i) => {
                  const k = (f - boomAt) / fps;
                  const a = random(`b${i}`) * Math.PI * 2;
                  const v = 300 + random(`v${i}`) * 400;
                  return <div key={i} style={{ position: 'absolute', left: 170 + Math.cos(a) * v * k, top: 100 + Math.sin(a) * v * k + 600 * k * k, width: 22, height: 14, background: ['#E5484D', '#F5B83D', C.cobalt, '#1FA971'][i % 4], transform: `rotate(${k * 900 + i * 40}deg)`, opacity: Math.max(0, 1 - k * 1.2) }} />;
                })}
              </div>
            )}
            <div style={{ textAlign: 'center', fontFamily: FONT.body, fontWeight: 900, fontSize: 28, letterSpacing: 3, color: boom ? '#E5484D' : C.ink, textTransform: 'uppercase' }}>{boom ? 'Excusómetro: reventado 💥' : 'Excusómetro'}</div>
          </div>
        </>
      ) : null}

      {/* la "evidencia": un render */}
      {f >= t.evidencia && !rage ? (
        <div style={{ position: 'absolute', left: 520, top: 560, transform: `rotate(4deg) scale(${spring({ frame: f - t.evidencia, fps, config: { damping: 12 } })})` }}>
          <div style={{ width: 420, height: 760, borderRadius: 56, background: C.ink, padding: 16, boxShadow: '0 30px 60px rgba(20,21,25,0.25)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', position: 'relative', background: '#1B1E26' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '22px 20px 12px', fontFamily: FONT.body, fontWeight: 800, fontSize: 22, color: C.white, background: 'rgba(0,0,0,0.6)', zIndex: 2 }}>
                Don Excusas
                <div style={{ fontWeight: 600, fontSize: 18, opacity: 0.8 }}>render_final_FINAL_v3.jpg</div>
              </div>
              <Img src={staticFile('media/boveda/render.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      ) : null}
      {f >= t.render && !rage ? (
        <div style={{ position: 'absolute', left: 120, top: 1000, width: 840, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              border: '10px solid #E5484D',
              color: '#E5484D',
              background: 'rgba(255,255,255,0.94)',
              fontFamily: FONT.display,
              fontSize: 78,
              lineHeight: 1,
              padding: '14px 26px',
              borderRadius: 14,
              textTransform: 'uppercase',
              transform: `rotate(-7deg) scale(${interpolate(f - t.render, [0, 8], [2.2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})`,
              opacity: interpolate(f - t.render, [0, 4], [0, 1], clamp),
            }}
          >
            ¿Me estás jodiendo?
            <br />
            Es un render
          </div>
        </div>
      ) : null}

      {/* la rabia del inversionista → corta el EY */}
      {rage ? (
        <AbsoluteFill style={{ background: '#B3131B', left: -60, top: -60, right: -60, bottom: -60, width: 'auto', height: 'auto' }}>
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,80,60,${0.5 + 0.2 * Math.sin(f)}) 0%, rgba(80,0,0,0.9) 75%)` }} />
          {/* el zorro gruñón en grande, temblando de la rabia */}
          <div style={{ position: 'absolute', left: 150, top: 680, width: 900, height: 900, transform: `translate(${Math.sin(f * 2.3) * 10}px, ${Math.cos(f * 1.9) * 8}px) rotate(${-3 + Math.sin(f * 1.7) * 3}deg) scale(${interpolate(f - t.rabia, [0, 6], [0.6, 1], clamp) + 0.03 * Math.abs(Math.sin(f * 0.7))})` }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', border: '16px solid #FFFFFF', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
              <Img src={staticFile('memes/zorro-grunon.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <div style={{ position: 'absolute', left: 50, right: 50, top: 280, textAlign: 'center', fontFamily: FONT.display, fontSize: 92, lineHeight: 1.02, color: '#FFFFFF', WebkitTextStroke: '7px #000000', paintOrder: 'stroke fill', textTransform: 'uppercase' }}>
            {RAGE.slice(0, Math.min(RAGE.length, 1 + Math.floor((f - t.rabia) / 9))).join(' ')}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ======================= 3 · BÓVEDA: la plata entra / Don se estampa ======================= */
export const BovedaVault: React.FC<Extract<Scene, { type: 'boveda-vault' }>> = ({ cues, mode }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const cue = useCue(cues);
  const region = { x: 0, y: 420, w: L.width, h: L.subtitleY - 60 - 420 };
  if (mode === 'store') {
    const slam = cue('slam', 1.06);
    return (
      <AbsoluteFill style={{ background: '#0D0E11' }}>
        <Vault3D region={region} coinsAt={0} slamAt={slam} releaseAt={cue('release', 2.12)} />
        <Meme text="La plata, en bóveda 🔒" at={cue('title', 0.15)} until={slam + 2} y={290} size={96} />
        <Meme text="¡CLANK!" at={slam} until={slam + 14} y={760} size={150} rotate={-6} color="#FFD43B" />
        <Meme text="Se libera por hitos ✅" at={cue('hitos', 1.5)} y={290} size={96} rotate={2} />
      </AbsoluteFill>
    );
  }
  // modo "run": Don corre a llevarse la plata y la puerta se le cierra en la cara
  const slam = cue('slam', 3.18);
  const hit = slam + 2;
  const door = vaultDoorOnScreen(L.width, L.height, region);
  const runStart = cue('run', 1.2);
  const k = interpolate(f, [runStart, hit], [0, 1], clamp);
  const dh = 600;
  const dw = dh * (400 / 560);
  const after = (f - hit) / fps;
  let x = interpolate(k, [0, 1], [-dw, door.x - dw * 0.55]);
  let rot = 0;
  let sx = 1;
  let sy = 1;
  let dy = 0;
  if (f >= hit) {
    sx = interpolate(after, [0, 0.08, 0.3], [1, 0.55, 1], clamp); // se aplasta contra la puerta
    sy = interpolate(after, [0, 0.08, 0.3], [1, 1.15, 1], clamp);
    x -= interpolate(after, [0.1, 0.8], [0, 150], { ...clamp, easing: Easing.out(Easing.cubic) });
    rot = interpolate(after, [0.15, 0.7], [0, -14], { ...clamp, easing: Easing.out(Easing.bounce) });
    dy = 0;
  }
  const groundY = door.y + 40;
  return (
    <AbsoluteFill style={{ background: '#0D0E11' }}>
      <Vault3D region={region} slamAt={slam} />
      <div style={{ position: 'absolute', left: x, top: groundY - dh * (548 / 560) + dy, width: dw, height: dh, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '50% 98%' }}>
        <DonExcusas height={dh} pose={f >= hit ? 'stand' : 'run'} phase={f * 0.6} talk={f >= hit ? 0.4 : 0.2} dizzy={f >= hit + 6} />
      </div>
      {/* estrellitas de mareo */}
      {f >= hit + 6
        ? [0, 1, 2, 3].map((i) => {
            const a = (f / fps) * 6 + (i * Math.PI) / 2;
            return (
              <div key={i} style={{ position: 'absolute', left: x + dw * 0.5 - 26 + Math.cos(a) * 120, top: groundY - dh * 0.98 - 10 + Math.sin(a) * 30 }}>
                <PiStarFill size={52} color="#FFD43B" />
              </div>
            );
          })
        : null}
      <Meme text="¿Y si intenta salir corriendo? 🏃" at={cue('title', 0.32)} until={hit} y={290} size={92} />
      <Meme text="¡Ni en pedo, papá! 🤣" at={hit + 2} y={290} size={124} rotate={-4} color="#FFD43B" />
      <Meme text="¡BOING!" at={hit} until={hit + 14} y={520} size={140} rotate={8} />
    </AbsoluteFill>
  );
};
