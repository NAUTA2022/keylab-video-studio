import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
// WebGL (fondos Aurora, Silk, LightRays) sin tarjeta gráfica:
Config.setChromiumOpenGlRenderer('angle');
Config.setEntryPoint('src/index.ts');
