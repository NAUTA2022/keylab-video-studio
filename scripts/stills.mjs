import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
const [comp, outDir, ...times] = process.argv.slice(2);
const B = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable: B, chromiumOptions: { gl: 'swangle' } });
for (const t of times) {
  const frame = Math.round(parseFloat(t) * composition.fps);
  await renderStill({ composition, serveUrl, output: `${outDir}/s-${t}.jpg`, frame, imageFormat: 'jpeg', scale: 0.5, browserExecutable: B, chromiumOptions: { gl: 'swangle' } });
}
console.log('ok');
