import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Persona3D, type Layer } from './Persona3D';

// Personaje pintado "horneado": se renderiza UNA vez como video transparente (webm con alfa)
// y después se reusa en cualquier video con <OffthreadVideo transparent>, sin volver a dibujar el 3D.
// Tamaño 736x864 (cabe un busto + torso). Duración 8 s, se repite en bucle.
export type FiguraLoopProps = { rgb: string; yaw: number; ink: string; clip: string; seed: number };

export const FiguraLoop: React.FC<FiguraLoopProps> = ({ rgb, yaw, ink, clip, seed }) => {
  const layers: Layer[] = [{ clip, weight: 1, offset: seed }];
  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      <Persona3D id={`loop-${seed}`} width={736} height={864} yaw={yaw} aura={1.5} auraRGB={rgb} ink={ink} cam={{ y: 1.3, z: 2.05, fov: 35, lookY: 1.25 }} layers={layers} />
    </AbsoluteFill>
  );
};
