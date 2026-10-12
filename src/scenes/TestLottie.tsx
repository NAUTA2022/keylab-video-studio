import React from 'react';
import { AbsoluteFill } from 'remotion';
import { EMOJI, LottieEmoji, type EmojiName } from '../components/LottieEmoji';

/** Galería de emojis animados disponibles (nombre → animación). */
export const TestLottie: React.FC = () => (
  <AbsoluteFill style={{ background: '#EFEDE7', padding: 40, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: 10 }}>
    {(Object.keys(EMOJI) as EmojiName[]).map((n) => (
      <div key={n} style={{ width: 190, textAlign: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 22, color: '#141519' }}>
        <LottieEmoji name={n} size={150} />
        <div>{n}</div>
      </div>
    ))}
  </AbsoluteFill>
);
