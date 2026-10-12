import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, layout } from './brand/brand';
import { ensureFonts } from './brand/fonts';
import { optionalAsset } from './brand/assets';
import { FPS, totalFrames, type Scene, type VideoProps } from './schema';
import { Aurora, DotGrid, Silk } from './bits/backgrounds';
import { Chrome, CutFlash, Subtitles } from './components/ui';
import { ClockDriver } from './clock/ClockDriver';
import { Gags } from './components/Gags';
import { ClipScene, Close, DARK_SCENES, Ey, Hook, News, Pivot, Roast, Solution, Stat, Statement } from './scenes/scenes';
import { Story } from './scenes/Story';
import { BovedaHook, BovedaStory, BovedaVault } from './scenes/Boveda';
import { BakeContext, BakeOnly3DStyle } from './three/bake';
import baked from '../public/baked/manifest.json';

ensureFonts();

const renderScene = (s: Scene) => {
  switch (s.type) {
    case 'hook':
      return <Hook {...s} />;
    case 'roast':
      return <Roast {...s} />;
    case 'news':
      return <News {...s} />;
    case 'stat':
      return <Stat {...s} />;
    case 'ey':
      return <Ey {...s} />;
    case 'pivot':
      return <Pivot {...s} />;
    case 'solution':
      return <Solution {...s} />;
    case 'close':
      return <Close {...s} />;
    case 'story':
      return <Story {...s} />;
    case 'clip':
      return <ClipScene {...s} />;
    case 'statement':
      return <Statement {...s} />;
    case 'boveda-hook':
      return <BovedaHook {...s} />;
    case 'boveda-story':
      return <BovedaStory {...s} />;
    case 'boveda-vault':
      return <BovedaVault {...s} />;
  }
};

const LightBackground: React.FC<{ kind: VideoProps['background'] }> = ({ kind }) => {
  const { width, height } = useVideoConfig();
  const L = layout(width, height);
  if (kind === 'dots') return <DotGrid clear={[L.colLeft - 40, L.colRight + 40, L.logoY + 40, L.progressY + 30]} />;
  if (kind === 'aurora') return <Aurora colors={[C.line, C.soft, C.line]} opacity={0.35} amplitude={0.8} />;
  if (kind === 'silk')
    return (
      <AbsoluteFill style={{ opacity: 0.08 }}>
        <Silk color={C.cobalt} />
      </AbsoluteFill>
    );
  return null;
};

export const KeyLabVideo: React.FC<VideoProps> = (p) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const voice = p.voice ? optionalAsset(p.voice) : null;
  const music = p.music ? optionalAsset(p.music) : null;
  const soundtrack = p.soundtrack ? optionalAsset(p.soundtrack) : null;

  // Cuadro de inicio de cada escena
  let acc = 0;
  const timeline = p.scenes.map((s) => {
    const from = acc;
    const len = Math.round(s.dur * FPS);
    acc += len;
    return { s, from, len };
  });
  const current = timeline.find((t) => f >= t.from && f < t.from + t.len) ?? timeline[timeline.length - 1];
  const dark = DARK_SCENES.has(current.s.type) || (current.s.type === 'clip' && current.s.dark);
  const contentIndex = timeline.filter((t) => !DARK_SCENES.has(t.s.type)).indexOf(current) + 1;

  // La música baja (duck) mientras habla la voz y sube al final
  const musicVol = voice
    ? interpolate(f, [0, durationInFrames - 45, durationInFrames - 10, durationInFrames], [p.musicVolume, p.musicVolume, p.musicVolume * 2.2, 0], {
        extrapolateRight: 'clamp',
      })
    : p.musicVolume * 3;

  return (
    <AbsoluteFill style={{ background: C.bone }}>
      {p.bake3d ? <BakeOnly3DStyle /> : null}
      <ClockDriver />
      {!dark ? <LightBackground kind={p.background} /> : null}
      {timeline.map(({ s, from, len }, i) => (
        <Sequence key={i} from={from} durationInFrames={len} name={`${i + 1}. ${s.type}`}>
          <BakeContext.Provider value={{ baking: !!p.bake3d, absFrame: f, dir: p.bakeKey ? (baked as Record<string, Record<string, string>>)[p.bakeKey]?.[String(i)] : undefined }}>
            <AbsoluteFill>{renderScene(s)}</AbsoluteFill>
          </BakeContext.Provider>
          {i > 0 ? <CutFlash color={DARK_SCENES.has(s.type) ? C.cobalt : C.white} /> : null}
        </Sequence>
      ))}
      {current.s.type !== 'ey' && current.s.type !== 'close' ? (
        <Chrome tag={current.s.tag} index={Math.max(1, contentIndex)} dark={dark} progress={f / Math.max(1, totalFrames(p) - 1)} />
      ) : null}
      {current.s.type !== 'ey' && current.s.type !== 'close' ? <Subtitles items={p.subtitles} dark={dark} /> : null}
      <Gags gags={p.gags} />
      {soundtrack ? <Audio src={soundtrack} /> : null}
      {!soundtrack && voice ? <Audio src={voice} /> : null}
      {!soundtrack && music ? <Audio src={music} volume={musicVol} /> : null}
    </AbsoluteFill>
  );
};
