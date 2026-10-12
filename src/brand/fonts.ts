import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Fuentes locales (woff2 de @fontsource), así el render no depende de internet.
const faces: { family: string; file: string; weight: string }[] = [
  { family: 'Anton', file: 'fonts/anton-latin-400-normal.woff2', weight: '400' },
  ...['400', '600', '700', '800', '900'].map((w) => ({
    family: 'Figtree',
    file: `fonts/figtree-latin-${w}-normal.woff2`,
    weight: w,
  })),
];

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  for (const f of faces) {
    loadFont({ family: f.family, url: staticFile(f.file), weight: f.weight, format: 'woff2' }).catch((e) =>
      console.error('No se pudo cargar la fuente', f.file, e),
    );
  }
};
