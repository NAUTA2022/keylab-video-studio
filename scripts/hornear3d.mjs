#!/usr/bin/env node
/*
 * Hornea el 3D de cada escena una sola vez (secuencia PNG con transparencia) para
 * que los renders siguientes solo calculen el 2D.
 *
 *   node scripts/hornear3d.mjs <Composición> <src/data/video.json> [--force] [--escena=N] [--reusar]
 *
 * --reusar: si cambió código de src/three/ que NO altera la imagen, reutiliza el
 *   horneado existente de cada escena (solo le actualiza la huella) en vez de
 *   volver a renderizarlo.
 *
 * Una escena se vuelve a hornear solo si cambió su JSON, su posición/duración en
 * el video o algún archivo de src/three/ o public/3d/. Si cambias cómo la escena
 * le pasa datos al 3D (región, tiempos) en src/scenes/, usa --force o --escena=N.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [comp, dataPath, ...flags] = process.argv.slice(2);
if (!comp || !dataPath) {
  console.error('uso: node scripts/hornear3d.mjs <Composición> <src/data/video.json> [--force] [--escena=N]');
  process.exit(1);
}
const force = flags.includes('--force');
const reuse = flags.includes('--reusar');
const only = flags.find((f) => f.startsWith('--escena='))?.split('=')[1];
const FPS = 30;
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const key = data.bakeKey;
if (!key) throw new Error(`${dataPath} no tiene "bakeKey"`);

// escenas que usan 3D
const has3D = (s) =>
  ['boveda-hook', 'boveda-vault', 'story'].includes(s.type) ||
  (s.type === 'hook' && s.asset) ||
  (s.type === 'stat' && s.asset === 'phone3d');

// huella de todo lo que afecta al 3D
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const deps = createHash('sha1');
// bake.tsx y loaders.ts son infraestructura: no cambian la imagen
for (const f of walk('src/three').filter((f) => !/(bake\.tsx|loaders\.ts)$/.test(f)).sort()) deps.update(f).update(fs.readFileSync(f));
for (const f of walk('public/3d').sort()) deps.update(f + fs.statSync(f).size);
const depsHash = deps.digest('hex');

const manPath = 'public/baked/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manPath, 'utf8'));
manifest[key] ??= {};

let from = 0;
for (const [i, s] of data.scenes.entries()) {
  const len = Math.round(s.dur * FPS);
  const start = from;
  from += len;
  if (!has3D(s) || (only !== undefined && String(i) !== only)) continue;
  const h = createHash('sha1').update(JSON.stringify(s)).update(`${start}:${len}`).update(depsHash).digest('hex').slice(0, 10);
  const rel = `baked/${key}/${i}-${h}`;
  const dir = path.join('public', rel);
  if (!force && only === undefined && manifest[key][i] === rel && fs.existsSync(dir)) {
    console.log(`escena ${i} (${s.type}): 3D al día`);
    continue;
  }
  const base = path.join('public/baked', key);
  const old = fs.existsSync(base) ? fs.readdirSync(base).find((d) => d.startsWith(`${i}-`)) : undefined;
  if (reuse && !force && old) {
    if (path.join(base, old) !== dir) fs.renameSync(path.join(base, old), dir);
    manifest[key][i] = rel;
    console.log(`escena ${i} (${s.type}): horneado reutilizado → public/${rel}`);
    continue;
  }
  const tmp = path.join('out', '.horno', `${key}-${i}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`escena ${i} (${s.type}): horneando cuadros ${start}-${start + len - 1}…`);
  const t0 = Date.now();
  execFileSync('npx', ['remotion', 'render', comp, tmp, '--sequence', '--image-format=png', `--frames=${start}-${start + len - 1}`, '--props', JSON.stringify({ ...data, bake3d: true }), `--browser-executable=${BROWSER}`, '--concurrency=2', '--log=error'], { stdio: 'inherit' });
  // el horneado viejo se borra solo cuando el nuevo salió bien
  if (fs.existsSync(base)) for (const d of fs.readdirSync(base)) if (d.startsWith(`${i}-`)) fs.rmSync(path.join(base, d), { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(tmp)) {
    const n = parseInt(f.match(/(\d+)\.png$/)[1], 10);
    fs.renameSync(path.join(tmp, f), path.join(dir, `${n}.png`));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  manifest[key][i] = rel;
  fs.writeFileSync(manPath, JSON.stringify(manifest, null, 2));
  console.log(`  listo en ${((Date.now() - t0) / 1000).toFixed(0)} s → public/${rel}`);
}
fs.writeFileSync(manPath, JSON.stringify(manifest, null, 2));
