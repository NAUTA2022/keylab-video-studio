// Renderiza varios cuadros de un video en una sola pasada (un bundle, muchos stills).
// node scripts/stills.mjs <Composición> <json> <carpeta> <segundo,segundo,...>
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const [comp, json, outDir, secs] = process.argv.slice(2);
const props = JSON.parse(fs.readFileSync(json, 'utf8'));
const browserExecutable = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: comp, inputProps: props, browserExecutable });
fs.mkdirSync(outDir, { recursive: true });
for (const s of secs.split(',').map(Number)) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * 30));
  const output = path.join(outDir, `t${String(s).replace('.', '_')}.png`);
  await renderStill({ composition, serveUrl, inputProps: props, frame, output, browserExecutable, scale: 0.5 });
  console.log('ok', s, output);
}
