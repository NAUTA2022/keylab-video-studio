import React from 'react';
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, BRAND_FILES } from '../brand/brand';
import { optionalAsset } from '../brand/assets';
import type { Scene } from '../schema';
import { BlurText, CountUp, DecryptedText, RotatingText, SplitText, TextType, usePop } from '../bits/text';
import { LowRes } from '../components/LowRes';
import PatternWaves from '../reactbits/PatternWaves';
import CrystalizedBall from '../reactbits/CrystalizedBall';
import { LiquidChrome } from '../reactbits/LiquidChrome';
import { Building3D } from '../three/Building3D';
import { CityCar3D } from '../three/Car3D';
import { TaxiCity3D } from '../three/TaxiCity3D';
import { ASSET_ICONS } from '../svg/assets';
import { Phone3D } from '../three/Phone3D';
import { AssetSequence, ExcelChaos } from '../svg/assets';
import { EY_FOX, OUTRO_MUEJEJE, OUTRO_MUEJEJE_LEAD, OneGag } from '../components/Gags';
import { Sequence } from 'remotion';
import { BrowserWindow, GeoIcon, Isotipo, MaskReveal, Stamp, Wordmark, usePunch, useLayout } from '../components/ui';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Columna de contenido centrada
const Column: React.FC<{ children: React.ReactNode; top?: number; center?: boolean }> = ({ children, top, center = true }) => {
  const L = useLayout();
  const punch = usePunch();
  return (
    <div
      style={{
        position: 'absolute',
        left: L.colLeft,
        width: L.colWidth,
        top: top ?? L.logoY + 90,
        bottom: L.height - L.subtitleY + 70,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: center ? 'center' : 'flex-start',
        transform: `scale(${punch})`,
      }}
    >
      {children}
    </div>
  );
};

const useK = () => (useLayout().vertical ? 1 : 0.8);

// Convierte un cue en segundos (o su valor por defecto) a cuadros
const useCue = (cues: Record<string, number> | undefined) => {
  const { fps } = useVideoConfig();
  return (name: string, fallback: number) => Math.round((cues?.[name] ?? fallback) * fps);
};

// Zona inferior para el asset (debajo del texto, encima de los subtítulos)
const AssetArea: React.FC<{ top: number; children: (w: number, h: number) => React.ReactNode; full?: boolean }> = ({ top, children, full }) => {
  const L = useLayout();
  const left = full ? 0 : L.colLeft;
  const w = full ? L.width : L.colWidth;
  const h = L.subtitleY - 70 - top;
  return <div style={{ position: 'absolute', left, top, width: w, height: h }}>{children(w, h)}</div>;
};

/* 1 · HOOK — fondo PatternWaves + edificio 3D que se convierte en tokens */
export const Hook: React.FC<Extract<Scene, { type: 'hook' }>> = ({ kicker, title, highlight, asset, cues, quotes }) => {
  const k = useK();
  const L = useLayout();
  const cue = useCue(cues);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const has3d = asset === 'building3d' || asset === 'city-car3d' || asset === 'taxi-leech';
  const titleAt = cue('title', 0);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      {asset === 'taxi-leech' ? (
        // cielo de atardecer en colores de marca (detrás del 3D)
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0B0D18 0%, #121A4A 30%, #2D52FF 62%, #8EA2FF 80%, #F2C6A8 100%)' }} />
      ) : (
        <LowRes scale={0.5}>
          <PatternWaves preset="silk" color={C.cobalt} backgroundColor={C.night} fade="edges" />
        </LowRes>
      )}
      {asset === 'city-car3d' ? (
        <CityCar3D
          region={L.vertical ? { x: 0, y: 840, w: L.width, h: L.subtitleY - 40 - 840 } : { x: L.width - 900, y: 160, w: 820, h: 760 }}
          driveAt={cue('drive', 0)}
          boomAt={cue('boom', 1.4)}
        />
      ) : null}
      {asset === 'taxi-leech' ? (() => {
        const region = L.vertical ? { x: 0, y: 700, w: L.width, h: L.subtitleY - 50 - 700 } : { x: L.width - 980, y: 120, w: 900, h: 840 };
        const timing = { wideAt: cue('title', 2.2), driveAt: cue('pega', 4.4) + 3 };
        return (
          <>
            <TaxiCity3D
              region={region}
              {...timing}
              leech={{
                turnAt: cue('turn', 0.1),
                talk: (quotes ?? []).map((q) => [Math.round(q.at * fps), Math.round(q.to * fps)] as [number, number]),
                stickAt: cue('pega', 4.4),
              }}
            />
            {/* velo oscuro arriba para que el logo y el título se lean sobre los edificios */}
            <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(11,13,24,0.92) 0%, rgba(11,13,24,0.75) 28%, rgba(11,13,24,0) 46%)' }} />
          </>
        );
      })() : null}
      {(quotes ?? []).map((q, i) => {
        const a = Math.round(q.at * fps);
        const next = quotes![i + 1];
        const end = next ? Math.round(next.at * fps) : titleAt;
        if (frame < a || frame >= end) return null;
        const p = interpolate(frame - a, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.4)) });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 40,
              right: 40,
              top: L.vertical ? 330 : 120,
              textAlign: 'center',
              fontFamily: FONT.display,
              fontSize: 132 * k,
              lineHeight: 1,
              color: C.white,
              WebkitTextStroke: `${10 * k}px #000000`,
              paintOrder: 'stroke fill',
              textTransform: 'uppercase',
              transform: `scale(${0.4 + 0.6 * p}) rotate(${i % 2 ? 3 : -3}deg)`,
              opacity: p,
            }}
          >
            {q.text}
          </div>
        );
      })}
      {asset === 'building3d' ? (
        <Building3D
          region={L.vertical ? { x: L.colLeft, y: 760, w: L.colWidth, h: L.subtitleY - 90 - 760 } : { x: L.width - 820, y: 160, w: 700, h: 760 }}
          riseFrom={cue('building', 0.1)}
          splitAt={cue('tokens', 1.4)}
        />
      ) : null}
      {frame >= titleAt ? <Column center={!has3d}>
        <DecryptedText text={kicker.toUpperCase()} delay={titleAt} style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 30 * k, letterSpacing: 4, color: C.soft }} scrambleColor={C.cobalt} />
        <div style={{ height: 24 }} />
        <div style={{ fontFamily: FONT.display, fontSize: (has3d ? 120 : 150) * k, lineHeight: 0.95, color: C.white, textTransform: 'uppercase' }}>
          <SplitText text={title} delay={titleAt + 6} stagger={1.2} />
        </div>
        {highlight ? (
          <div style={{ marginTop: 22, fontFamily: FONT.display, fontSize: (has3d ? 112 : 150) * k, lineHeight: 1, textTransform: 'uppercase' }}>
            <MaskReveal delay={cue('boom', cues?.tokens ?? 0.73)}>
              <span style={{ background: C.cobalt, color: C.white, padding: '0 18px' }}>{highlight}</span>
            </MaskReveal>
          </div>
        ) : null}
      </Column> : null}
    </AbsoluteFill>
  );
};

/* 2 · ROAST — hoja de cálculo caótica + chat de las 11 p. m. */
export const Roast: React.FC<Extract<Scene, { type: 'roast' }>> = ({ lines, punch, asset, cues }) => {
  const k = useK();
  const L = useLayout();
  const { fps } = useVideoConfig();
  const cue = useCue(cues);
  const gap = Math.round(0.7 * fps);
  const hasAsset = asset === 'excel-chat';
  return (
    <>
      <Column center={!hasAsset}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: (hasAsset ? 54 : 64) * k, lineHeight: 1.12, color: i === lines.length - 1 ? C.ink : C.gray, marginBottom: 16 }}>
            <BlurText text={l} delay={cue(`line${i}`, (i * gap) / fps)} />
          </div>
        ))}
        {punch ? (
          <div style={{ marginTop: 18 }}>
            <Stamp text={punch} delay={cue('punch', (lines.length * gap + 4) / fps)} size={44 * k} />
          </div>
        ) : null}
      </Column>
      {hasAsset ? (
        <AssetArea top={L.vertical ? 760 : 420}>
          {(w) => <ExcelChaos width={w} excelAt={cue('excel', 1.6)} chatAt={cue('chat', 2.2)} nightAt={cue('night', 2.9)} />}
        </AssetArea>
      ) : null}
    </>
  );
};

/* 3 · NOTICIA (capturas reales: nota + web de la empresa) */
export const News: React.FC<Extract<Scene, { type: 'news' }>> = ({ source, date, headline, articleShot, siteShot, siteUrl, chip, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const k = useK();
  const split = Math.round((dur * fps) / 2);
  const showSite = !!siteShot && f > split;
  const slide = interpolate(f - split, [0, 12], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const chipPop = usePop(showSite ? split + 10 : 18);
  const winW = L.colWidth;
  const winH = L.vertical ? 760 : 520;
  return (
    <Column>
      <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 26 * k, letterSpacing: 3, color: C.gray, marginBottom: 22 }}>
        FUENTE · <span style={{ color: C.cobalt }}>{source.toUpperCase()}</span> · {date.toUpperCase()}
      </div>
      <div style={{ position: 'relative', width: winW, height: winH }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <BrowserWindow url={source.toLowerCase().replace(/\s+/g, '') + '.com'} shot={articleShot} width={winW} height={winH}>
            <div style={{ padding: 44 }}>
              <div style={{ width: 120, height: 10, background: C.cobalt, marginBottom: 28 }} />
              <div style={{ fontFamily: FONT.body, fontWeight: 900, fontSize: 54 * k, lineHeight: 1.12, color: C.ink }}>
                <TextType text={headline} delay={6} cps={40} cursorColor={C.cobalt} />
              </div>
            </div>
          </BrowserWindow>
        </div>
        {siteShot ? (
          <div style={{ position: 'absolute', inset: 0, transform: `translateX(${slide * 110}%)` }}>
            <BrowserWindow url={siteUrl ?? ''} shot={siteShot} width={winW} height={winH} />
          </div>
        ) : null}
        {chip ? (
          <div
            style={{
              position: 'absolute',
              right: -10,
              bottom: -26,
              transform: `scale(${chipPop})`,
              background: C.ink,
              color: C.white,
              fontFamily: FONT.body,
              fontWeight: 800,
              fontSize: 30 * k,
              padding: '14px 26px',
              borderRadius: 40,
            }}
          >
            {chip}
          </div>
        ) : null}
      </div>
    </Column>
  );
};

/* Dato con contador (+ celular 3D con la app de inversión) */
export const Stat: React.FC<Extract<Scene, { type: 'stat' }>> = ({ value, decimals, prefix, suffix, label, note, asset, project, cues }) => {
  const k = useK();
  const L = useLayout();
  const cue = useCue(cues);
  const hasPhone = asset === 'phone3d';
  return (
    <>
      <Column center={!hasPhone}>
        <div style={{ fontFamily: FONT.display, fontSize: (hasPhone ? 170 : 230) * k, lineHeight: 1, color: C.cobalt }}>
          <CountUp to={value} decimals={decimals} prefix={prefix} suffix={suffix} delay={4} dur={36} />
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: (hasPhone ? 44 : 52) * k, lineHeight: 1.15, color: C.ink, marginTop: 14 }}>
          <BlurText text={label} delay={14} />
        </div>
        {note ? <div style={{ marginTop: 16, fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: C.gray }}>{note}</div> : null}
      </Column>
      {hasPhone ? (
        <Phone3D
          region={L.vertical ? { x: L.colLeft, y: 700, w: L.colWidth, h: L.subtitleY - 90 - 700 } : { x: L.width - 760, y: 140, w: 600, h: 800 }}
          investAt={cue('invest', 3.2)}
          amount={value}
          project={project}
        />
      ) : null}
    </>
  );
};

/* 4 · "Ey." pantalla completa cobalto */
export const Ey: React.FC<Extract<Scene, { type: 'ey' }>> = ({ word }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const s = interpolate(f, [0, 6], [1.6, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <AbsoluteFill style={{ background: C.cobalt, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: FONT.display, fontSize: L.vertical ? 420 : 340, color: C.white, transform: `scale(${s})`, lineHeight: 1 }}>{word}</div>
      {/* Asset fijo: zorro de la ceja (no se cambia entre videos) */}
      <OneGag g={L.vertical ? EY_FOX : { ...EY_FOX, x: 0.78, y: 0.66, size: 0.3 }} />
    </AbsoluteFill>
  );
};

/* 5 · GIRO (el drop): fondo noche con Aurora + LightRays */
export const Pivot: React.FC<Extract<Scene, { type: 'pivot' }>> = ({ lead, words, dur, wordsAt, icons, cues }) => {
  const k = useK();
  const L = useLayout();
  const { fps } = useVideoConfig();
  const cue = useCue(cues);
  const every = Math.max(14, Math.floor(((dur - 0.6) * fps) / words.length));
  const times = wordsAt?.map((t) => Math.round(t * fps));
  const iconItems = icons
    ? [
        ...(cues?.edificio !== undefined ? [{ kind: 'edificio' as const, at: cue('edificio', 1.2) }] : []),
        ...icons.map((kind, i) => ({ kind, at: times?.[i] ?? 10 + i * every })),
      ]
    : null;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <LowRes scale={0.4}>
        <LiquidChrome baseColor={[0.02, 0.06, 0.45]} speed={0.35} amplitude={0.45} interactive={false} />
      </LowRes>
      <AbsoluteFill style={{ background: 'rgba(13,14,17,0.45)' }} />
      <Column center={!icons}>
        <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 64 * k, lineHeight: 1.15, color: C.white }}>
          <SplitText text={lead} by="words" stagger={3} />
        </div>
        <div style={{ marginTop: 34, fontFamily: FONT.display, fontSize: 120 * k, lineHeight: 1.1, textTransform: 'uppercase' }}>
          <RotatingText words={words} every={every} delay={10} pillColor={C.cobalt} textColor={C.white} times={times} />
        </div>
      </Column>
      {iconItems ? (
        <AssetArea top={L.vertical ? 860 : 520}>
          {(w, h) => (
            <div style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AssetSequence items={iconItems} size={Math.min(w, h) * 0.7} />
            </div>
          )}
        </AssetArea>
      ) : null}
    </AbsoluteFill>
  );
};

/* 6 · SOLUCIÓN: cómo lo construye Key Lab (tarjetas que se apilan) */
const ICONS = ['block', 'coin', 'shield', 'bolt'] as const;
export const Solution: React.FC<Extract<Scene, { type: 'solution' }>> = (props) => {
  const clipSrc = props.clip ? optionalAsset(props.clip) : null;
  // Explicación / demo de plataforma dibujada con animation-studio (clip 9:16 a cuadro completo)
  if (clipSrc) return <OffthreadVideo src={clipSrc} muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
  return <SolutionCards {...props} />;
};
const SolutionCards: React.FC<Extract<Scene, { type: 'solution' }>> = ({ title, items }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = useK();
  const step = Math.round(0.55 * fps);
  return (
    <Column>
      <div style={{ fontFamily: FONT.display, fontSize: 104 * k, lineHeight: 1, color: C.ink, textTransform: 'uppercase', marginBottom: 40 }}>
        <SplitText text={title} by="words" stagger={3} />
      </div>
      {items.map((it, i) => {
        const t = interpolate(f - 10 - i * step, [0, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              background: C.white,
              border: `2px solid ${C.line}`,
              borderRadius: 22,
              padding: '24px 30px',
              marginBottom: 20,
              opacity: t,
              transform: `translateX(${(1 - t) * 120}px) rotate(${(1 - t) * 4}deg)`,
            }}
          >
            <GeoIcon kind={ICONS[i % ICONS.length]} size={64 * k} />
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 42 * k, color: C.ink, lineHeight: 1.15 }}>{it}</div>
          </div>
        );
      })}
    </Column>
  );
};

/* 7 · CIERRE: isotipo 3D flotando con barrido de luz + wordmark + CTA */
export const Close: React.FC<Extract<Scene, { type: 'close' }>> = ({ cta, url, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const t = f / fps;
  const float = Math.sin(t * 2.2) * 14;
  const sweep = interpolate(f, [8, 36], [-60, 160], clamp);
  const iso = L.vertical ? 420 : 300;
  const pop = usePop(0, 14);
  const isoSrc = optionalAsset(BRAND_FILES.isotipo3d);
  return (
    <AbsoluteFill style={{ background: C.night, alignItems: 'center', justifyContent: 'center' }}>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: L.vertical ? -120 : -40 }}>
        <div style={{ position: 'relative', width: iso, height: iso }}>
          {/* Crystalized Ball (React Bits original) centrada detrás del isotipo, a media resolución */}
          <div style={{ position: 'absolute', left: iso / 2 - iso * 1.2, top: iso / 2 - iso * 1.2, width: iso * 2.4, height: iso * 2.4 }}>
            <div style={{ width: iso * 1.2, height: iso * 1.2, transform: 'scale(2)', transformOrigin: '0 0' }}>
              <CrystalizedBall preset="abyss" color={C.cobalt} size={0.62} interactive={false} />
            </div>
          </div>
        <div style={{ position: 'relative', transform: `translateY(${float}px) scale(${pop})` }}>
          <Isotipo size={iso} />
          {isoSrc ? (
          <div
            style={{
              WebkitMaskImage: `url(${isoSrc})`,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent ${sweep - 20}%, rgba(255,255,255,0.55) ${sweep}%, transparent ${sweep + 20}%)`,
              pointerEvents: 'none',
            }}
          />
          ) : null}
        </div>
        </div>
        <div style={{ marginTop: 40 }}>
          <MaskReveal delay={10}>
            <Wordmark width={L.vertical ? 520 : 420} />
          </MaskReveal>
        </div>
        <div style={{ marginTop: 56, fontFamily: FONT.body, fontWeight: 900, fontSize: L.vertical ? 64 : 52, color: C.white }}>
          <SplitText text={cta} by="words" delay={18} stagger={3} />
        </div>
        <div style={{ marginTop: 16, fontFamily: FONT.body, fontWeight: 800, fontSize: L.vertical ? 44 : 36, color: C.soft }}>
          <BlurText text={url} delay={28} />
        </div>
      </div>
      {/* Asset fijo: zorro muejeje al final (no se cambia entre videos) */}
      <Sequence from={Math.max(0, Math.round((dur - OUTRO_MUEJEJE_LEAD) * fps))} layout="none">
        <OneGag g={L.vertical ? OUTRO_MUEJEJE : { ...OUTRO_MUEJEJE, x: 0.82, y: 0.7, size: 0.18 }} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const DARK_SCENES = new Set(['hook', 'ey', 'pivot', 'close', 'statement', 'boveda-hook', 'boveda-vault', 'mg']);

/* Clip a cuadro completo (explicaciones de animation-studio) */
export const ClipScene: React.FC<Extract<Scene, { type: 'clip' }>> = ({ clip, from }) => {
  const src = optionalAsset(clip);
  const { fps } = useVideoConfig();
  if (!src) return null;
  return <OffthreadVideo src={src} muted startFrom={Math.round((from ?? 0) * fps)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
};

/* Frases de cierre emocional: cada línea entra en su cue; "big" crece hasta llenar el ancho */
export const Statement: React.FC<Extract<Scene, { type: 'statement' }>> = ({ lines }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <LowRes scale={0.4}>
        <LiquidChrome baseColor={[0.02, 0.06, 0.45]} speed={0.3} amplitude={0.35} interactive={false} />
      </LowRes>
      <AbsoluteFill style={{ background: 'rgba(13,14,17,0.55)' }} />
      <div style={{ position: 'absolute', left: L.colLeft, width: L.colWidth, top: L.logoY + 140, display: 'flex', flexDirection: 'column', gap: 40 }}>
        {lines.map((ln, i) => {
          const at = Math.round(ln.at * fps);
          if (f < at) return null;
          const s = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 180 } });
          const Icon = ln.icon ? ASSET_ICONS[ln.icon] : null;
          const grow = ln.big ? interpolate(f - at, [0, 24], [0.6, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) }) : 1;
          return (
            <div key={i} style={{ transform: `translateY(${(1 - s) * 50}px)`, opacity: Math.min(1, s * 1.5) }}>
              {Icon ? (
                <div style={{ width: 150, height: 150, borderRadius: '50%', background: C.cobalt, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transform: `scale(${s})`, boxShadow: '0 0 60px rgba(45,82,255,0.6)' }}>
                  <Icon size={90} color={C.white} />
                </div>
              ) : null}
              <div
                style={{
                  fontFamily: FONT.display,
                  fontSize: ln.big ? 190 : 104,
                  lineHeight: 1,
                  color: ln.big ? C.soft : C.white,
                  textTransform: 'uppercase',
                  transform: `scale(${grow})`,
                  transformOrigin: 'left center',
                }}
              >
                {ln.text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
