import { TestLottie } from './scenes/TestLottie';
import { TestRig } from './scenes/TestRig';
import { Historia, HISTORIA_DUR } from './historia/Historia';
import { HistoriaVertical } from './historia/HistoriaVertical';
import { NoticiaHackeos, HACKEOS_DUR } from './historia/NoticiaHackeos';
import { PersonajePrueba } from './historia/Pintado';
import { SebastianVivo, UlisesVivo } from './historia/Retrato';
import React from 'react';
import { Composition } from 'remotion';
import { KeyLabVideo } from './KeyLabVideo';
import { TestDon } from './TestDon';
import { TestReactBits } from './TestReactBits';
import { FPS, totalFrames, videoSchema, type VideoProps } from './schema';
import demo from './data/demo-tokenizacion.json';
import assetEy from './data/asset-ey.json';
import senorC from './data/senor-c.json';
import boveda from './data/boveda.json';
import assetCierre from './data/asset-cierre.json';

const defaults = videoSchema.parse(demo) as VideoProps;
const calc = ({ props }: { props: VideoProps }) => ({ durationInFrames: totalFrames(props) });

export const Root: React.FC = () => (
  <>
    <Composition id="KeyLabReel" component={KeyLabVideo} schema={videoSchema} defaultProps={defaults} calculateMetadata={calc} durationInFrames={totalFrames(defaults)} fps={FPS} width={1080} height={1920} />
    <Composition id="KeyLabWide" component={KeyLabVideo} schema={videoSchema} defaultProps={defaults} calculateMetadata={calc} durationInFrames={totalFrames(defaults)} fps={FPS} width={1920} height={1080} />
    <Composition id="SenorC" component={KeyLabVideo} schema={videoSchema} defaultProps={videoSchema.parse(senorC) as VideoProps} calculateMetadata={calc} durationInFrames={1368} fps={FPS} width={1080} height={1920} />
    <Composition id="Boveda" component={KeyLabVideo} schema={videoSchema} defaultProps={videoSchema.parse(boveda) as VideoProps} calculateMetadata={calc} durationInFrames={1704} fps={FPS} width={1080} height={1920} />
    {/* Assets fijos reutilizables: el "Ey." y el cierre van iguales en todos los videos */}
    <Composition id="KL-Ey" component={KeyLabVideo} schema={videoSchema} defaultProps={videoSchema.parse(assetEy) as VideoProps} calculateMetadata={calc} durationInFrames={36} fps={FPS} width={1080} height={1920} />
    <Composition id="KL-Cierre" component={KeyLabVideo} schema={videoSchema} defaultProps={videoSchema.parse(assetCierre) as VideoProps} calculateMetadata={calc} durationInFrames={111} fps={FPS} width={1080} height={1920} />
    <Composition id="HistoriaKeyLab" component={Historia} durationInFrames={HISTORIA_DUR * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="NoticiaHackeos" component={NoticiaHackeos} durationInFrames={HACKEOS_DUR * FPS} fps={FPS} width={1080} height={1920} />
    <Composition id="HistoriaVertical" component={HistoriaVertical} durationInFrames={HISTORIA_DUR * FPS} fps={FPS} width={1080} height={1920} />
    <Composition id="PersonajePrueba" component={PersonajePrueba} durationInFrames={9 * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="SebastianVivo" component={SebastianVivo} durationInFrames={10 * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="UlisesVivo" component={UlisesVivo} durationInFrames={10 * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="GaleriaEmojis" component={TestLottie} durationInFrames={180} fps={FPS} width={1080} height={1920} />
    <Composition id="TestRig" component={TestRig} durationInFrames={180} fps={FPS} width={1080} height={1920} />
    <Composition id="TestDon" component={TestDon} durationInFrames={30} fps={FPS} width={1080} height={1920} />
    <Composition id="GaleriaReactBits" component={TestReactBits} durationInFrames={360} fps={FPS} width={1080} height={1920} />
  </>
);
