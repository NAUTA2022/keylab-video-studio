import React, { useEffect, useState } from 'react';
import { Lottie, type LottieAnimationData } from '@remotion/lottie';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

/*
 * Emojis animados (Lottie) de Noto Emoji Animation de Google — licencia CC BY 4.0.
 * Archivos en public/lottie/emoji/<código>.json. Se reproducen sincronizados con
 * el cuadro del video (@remotion/lottie), así que el render es determinista.
 */
export const EMOJI = {
  enojado: '1f621', puteando: '1f92c', bufido: '1f624', risa: '1f602', carcajada: '1f923',
  fuego: '1f525', 'plata-vuela': '1f4b8', 'cabeza-explota': '1f92f', grito: '1f631', ojos: '1f440',
  calavera: '1f480', cohete: '1f680', check: '2705', equis: '274c', fiesta: '1f389',
  'ojos-blanco': '1f644', payaso: '1f921', facha: '1f60e', aplauso: '1f44f', cien: '1f4af',
  reloj: '23f0', candado: '1f512', sube: '1f4c8', codicioso: '1f911', diablito: '1f608',
  derretido: '1fae0', pensando: '1f914', porfa: '1f64f', fuerza: '1f4aa',
} as const;
export type EmojiName = keyof typeof EMOJI;

/** emoji de texto → nombre animado, para reemplazarlos en los memes */
export const EMOJI_FROM_CHAR: Record<string, EmojiName> = {
  '😡': 'enojado', '🤬': 'puteando', '😤': 'bufido', '😂': 'risa', '🤣': 'carcajada', '🔥': 'fuego',
  '💸': 'plata-vuela', '🤯': 'cabeza-explota', '😱': 'grito', '👀': 'ojos', '💀': 'calavera',
  '🚀': 'cohete', '✅': 'check', '❌': 'equis', '🎉': 'fiesta', '🙄': 'ojos-blanco', '🤡': 'payaso',
  '😎': 'facha', '👏': 'aplauso', '💯': 'cien', '⏰': 'reloj', '🔒': 'candado', '📈': 'sube',
  '🤑': 'codicioso', '😈': 'diablito', '🫠': 'derretido', '🤔': 'pensando', '🙏': 'porfa', '💪': 'fuerza',
};

const cache = new Map<string, LottieAnimationData>();

export const LottieEmoji: React.FC<{ name: EmojiName; size: number; loop?: boolean; playbackRate?: number; style?: React.CSSProperties }> = ({
  name,
  size,
  loop = true,
  playbackRate = 1,
  style,
}) => {
  const code = EMOJI[name];
  const [data, setData] = useState<LottieAnimationData | null>(() => cache.get(code) ?? null);
  const [handle] = useState(() => (cache.has(code) ? null : delayRender(`Emoji ${name}`)));
  useEffect(() => {
    if (data) return;
    fetch(staticFile(`lottie/emoji/${code}.json`))
      .then((r) => r.json())
      .then((j) => {
        cache.set(code, j);
        setData(j);
        if (handle !== null) continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [code, data, handle, name]);
  if (!data) return null;
  return (
    <div style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', ...style }}>
      <Lottie animationData={data} loop={loop} playbackRate={playbackRate} style={{ width: size, height: size }} />
    </div>
  );
};

/** Reemplaza los emojis de un texto por su versión animada (si existe en el catálogo). */
export const withEmojis = (text: string, size: number): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let buf = '';
  Array.from(text.replace(/️/g, '')).forEach((ch, i) => {
    const name = EMOJI_FROM_CHAR[ch];
    if (name) {
      if (buf) out.push(buf);
      buf = '';
      out.push(<LottieEmoji key={i} name={name} size={size} style={{ marginTop: -size * 0.12 }} />);
    } else buf += ch;
  });
  if (buf) out.push(buf);
  return out;
};
