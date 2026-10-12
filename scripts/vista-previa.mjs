#!/usr/bin/env node
/*
 * Vista previa rápida para revisar antes del render final.
 *   node scripts/vista-previa.mjs <Composición> <src/data/video.json>
 * 1) hornea el 3D que haga falta (solo lo que cambió)
 * 2) renderiza a la mitad de resolución (540×960) → out/previa/<Composición>-<fecha>.mp4
 * Pasa el JSON como --props, así sirve para cualquier video (KeyLabReel + su JSON).
 * Esa previa se sube a la Sala de Revisión, donde se dejan notas por segundo.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const [comp, data] = process.argv.slice(2);
if (!comp || !data) {
  console.error('uso: node scripts/vista-previa.mjs <Composición> <src/data/video.json>');
  process.exit(1);
}
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
execFileSync('node', ['scripts/hornear3d.mjs', comp, data], { stdio: 'inherit' });
fs.mkdirSync('out/previa', { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const out = `out/previa/${comp}-${stamp}.mp4`;
const t0 = Date.now();
execFileSync('npx', ['remotion', 'render', comp, out, `--props=${data}`, '--scale=0.5', '--crf=28', '--jpeg-quality=75', `--browser-executable=${BROWSER}`, '--concurrency=2', '--log=error'], { stdio: 'inherit' });
console.log(`vista previa lista en ${((Date.now() - t0) / 1000).toFixed(0)} s → ${out}`);
