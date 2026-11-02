import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Persona3D } from '../historia/Persona3D';

// Hornea una persona pintada (idle, 2.5 s = 75 cuadros, loop perfecto) en PNG transparente.
// Se renderiza UNA vez y luego se reusa en cualquier video (sin 3D en vivo).
export const HORNO_W = 1046, HORNO_H = 1230;
export const FiguraHorno: React.FC<{ yaw: number; seed: string }> = ({ yaw, seed }) => (
  <AbsoluteFill style={{ background: 'transparent' }}>
    <Persona3D id={`horno-${seed}`} width={HORNO_W} height={HORNO_H} yaw={yaw} aura={1.5} cam={{ y: 1.3, z: 2.05, fov: 35, lookY: 1.25 }} layers={[{ clip: 'idle', weight: 1 }]} />
  </AbsoluteFill>
);
