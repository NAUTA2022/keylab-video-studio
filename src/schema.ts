import { z } from 'zod';

// Todo el contenido de un video vive en un JSON con esta forma (src/data/*.json).
// Cambiar el video = cambiar el JSON. El diseño no se toca.

const sceneBase = {
  dur: z.number().positive().describe('segundos'),
  tag: z.string().optional(),
  // momentos clave dentro de la escena (segundos desde que empieza), para sincronizar assets con la voz
  cues: z.record(z.string(), z.number()).optional(),
};

export const sceneSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hook'), ...sceneBase, kicker: z.string(), title: z.string(), highlight: z.string().optional(), asset: z.enum(['building3d', 'city-car3d', 'taxi-leech']).optional(), quotes: z.array(z.object({ text: z.string(), at: z.number(), to: z.number() })).optional().describe('frases de personaje en letra de meme (segundos dentro de la escena)') }),
  z.object({ type: z.literal('roast'), ...sceneBase, lines: z.array(z.string()).min(1).max(4), punch: z.string().optional(), asset: z.enum(['excel-chat']).optional() }),
  z.object({
    type: z.literal('news'),
    ...sceneBase,
    source: z.string(),
    date: z.string(),
    headline: z.string(),
    articleShot: z.string().optional().describe('captura de la nota en public/, ej. media/nota.png'),
    siteUrl: z.string().optional(),
    siteShot: z.string().optional().describe('captura de la web de la empresa en public/'),
    chip: z.string().optional(),
  }),
  z.object({ type: z.literal('stat'), ...sceneBase, value: z.number(), decimals: z.number().default(0), prefix: z.string().default(''), suffix: z.string().default(''), label: z.string(), note: z.string().optional(), asset: z.enum(['phone3d']).optional(), project: z.string().optional() }),
  z.object({ type: z.literal('ey'), ...sceneBase, word: z.string().default('Ey.') }),
  z.object({ type: z.literal('pivot'), ...sceneBase, lead: z.string(), words: z.array(z.string()).min(1), wordsAt: z.array(z.number()).optional().describe('segundo en que entra cada palabra'), icons: z.array(z.string()).optional().describe('íconos react-icons: edificio, lote, hotel, proyecto, casa, bodega, local, fabrica, finca, oficinas, tokens') }),
  z.object({ type: z.literal('solution'), ...sceneBase, title: z.string(), items: z.array(z.string()).max(4).default([]), clip: z.string().optional().describe('clip de animation-studio en public/, ej. clips/demo-plataforma.mp4: reemplaza las tarjetas') }),
  z.object({ type: z.literal('story'), ...sceneBase }),
  z.object({ type: z.literal('clip'), ...sceneBase, clip: z.string().describe('clip 9:16 (animation-studio) en public/'), dark: z.boolean().default(false), from: z.number().default(0).describe('segundo del clip donde empieza esta escena') }),
  z.object({ type: z.literal('boveda-hook'), ...sceneBase }),
  z.object({ type: z.literal('boveda-story'), ...sceneBase }),
  z.object({ type: z.literal('boveda-vault'), ...sceneBase, mode: z.enum(['store', 'run']) }),
  z.object({
    type: z.literal('statement'),
    ...sceneBase,
    lines: z.array(z.object({ text: z.string(), at: z.number(), icon: z.string().optional(), big: z.boolean().optional() })),
  }),
  z.object({ type: z.literal('close'), ...sceneBase, cta: z.string().default('Agenda una reunión'), url: z.string().default('keylab.tech') }),
]);

export const videoSchema = z.object({
  bakeKey: z.string().optional().describe('clave para el 3D horneado en public/baked/<clave>/ (scripts/hornear3d.mjs)'),
  bake3d: z.boolean().optional().describe('solo al hornear: renderiza únicamente el 3D'),
  voice: z.string().optional().describe('audio de la voz en public/, ej. media/voz.mp3'),
  music: z.string().optional().describe('música en public/'),
  soundtrack: z.string().optional().describe('banda completa (voz + música + efectos) generada por scripts/sonorizar.py; si existe, reemplaza voice y music'),
  musicVolume: z.number().min(0).max(1).default(0.18),
  background: z.enum(['aurora', 'silk', 'dots', 'none']).default('dots'),
  scenes: z.array(sceneSchema).min(1),
  subtitles: z.array(z.object({ from: z.number(), to: z.number(), text: z.string() })).default([]),
  // Memes del zorro (humor "cada tanto"): segundos absolutos del video
  gags: z
    .array(
      z.object({
        at: z.number(),
        dur: z.number(),
        image: z.string().describe('imagen en public/, ej. memes/zorro-ceja.png'),
        style: z.enum(['sticker', 'cutout']).default('sticker'),
        x: z.number().default(0.5).describe('centro horizontal, 0..1 del ancho'),
        y: z.number().default(0.5).describe('centro vertical, 0..1 del alto'),
        size: z.number().default(0.45).describe('ancho, 0..1 del ancho del video'),
        rotate: z.number().optional(),
        from: z.enum(['bottom', 'left', 'right']).optional(),
        bounce: z.boolean().optional(),
        caption: z.string().optional(),
        sfx: z.string().optional().describe('sonido en public/, ej. sfx/boing.mp3'),
        sfxGain: z.number().optional(),
        duck: z.boolean().optional().describe('baja la música mientras suena (para risas o frases)'),
      }),
    )
    .optional(),
});

export type VideoProps = z.infer<typeof videoSchema>;
export type Scene = z.infer<typeof sceneSchema>;

export const FPS = 30;
export const totalFrames = (p: VideoProps) => Math.round(p.scenes.reduce((a, s) => a + s.dur, 0) * FPS);
