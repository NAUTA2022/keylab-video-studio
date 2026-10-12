import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { DonRig } from '../svg/DonRig';
import { DonExcusas } from '../svg/DonExcusas';
import { gesture } from '../motion/primitives';
import { useLipSync } from '../motion/useLipSync';
import labios from '../../public/media/boveda/voz-v2.labios.json';

const VOZ = staticFile('media/boveda/voz-v2.mp3');
const OFFSET = 13.6; // "Año uno: es que llovió, parce…"

/** Prueba: imagen que rebota (antes) vs. marioneta articulada con labios sincronizados (ahora). */
export const TestRig: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const talk = useLipSync(labios, OFFSET);
  const arm = gesture(f, fps, 8, 0, -28) + gesture(f, fps, 70, 0, 20) + gesture(f, fps, 130, 0, 8);
  const label = (t: string, x: number) => (
    <div style={{ position: 'absolute', left: x, top: 260, width: 520, textAlign: 'center', fontFamily: 'Anton, Impact, sans-serif', fontSize: 64, color: '#141519' }}>{t}</div>
  );
  return (
    <AbsoluteFill style={{ background: '#EFEDE7' }}>
      <Audio src={VOZ} startFrom={Math.round(OFFSET * fps)} />
      {label('ANTES', 10)}
      {label('AHORA', 550)}
      <DonExcusas height={900} pose="stand" talk={Math.abs(Math.sin(f * 0.5)) * 0.6} style={{ left: -60, top: 520 }} />
      <DonRig height={900} talk={talk} arm={arm} style={{ left: 560, top: 520 }} />
    </AbsoluteFill>
  );
};
