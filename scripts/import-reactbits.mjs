// Importa componentes ORIGINALES de React Bits y los conecta al reloj del video.
// Uso:
//   git clone --depth 1 https://github.com/DavidHDev/react-bits.git ../react-bits
//   node scripts/import-reactbits.mjs ../react-bits Backgrounds/Aurora TextAnimations/TechText
// Copia src/ts-default/<Categoria>/<Nombre>/ a src/reactbits/ y reescribe:
//   requestAnimationFrame / cancelAnimationFrame / performance.now / IntersectionObserver
// para que avancen cuadro a cuadro con Remotion.
import fs from 'node:fs';
import path from 'node:path';

const [, , repo, ...comps] = process.argv;
if (!repo || comps.length === 0) {
  console.error('Uso: node scripts/import-reactbits.mjs <ruta-react-bits> <Categoria/Nombre> ...');
  process.exit(1);
}
const outDir = path.resolve('src/reactbits');
const header = "import { vRaf, vCaf, vNow, VIntersectionObserver } from './vclock';\n";

for (const c of comps) {
  const src = path.join(repo, 'src/ts-default', c);
  const name = path.basename(c);
  for (const f of fs.readdirSync(src)) {
    let txt = fs.readFileSync(path.join(src, f), 'utf8');
    if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      txt = txt
        .replace(/window\.requestAnimationFrame\b/g, 'vRaf')
        .replace(/window\.cancelAnimationFrame\b/g, 'vCaf')
        .replace(/\brequestAnimationFrame\b/g, 'vRaf')
        .replace(/\bcancelAnimationFrame\b/g, 'vCaf')
        .replace(/\bperformance\.now\(\)/g, 'vNow()')
        .replace(/new IntersectionObserver\(/g, 'new VIntersectionObserver(');
      txt = txt.replace(/^('use client';\s*)?/, (m) => m + header);
    }
    fs.writeFileSync(path.join(outDir, f), txt);
  }
  console.log('Importado:', name);
}
