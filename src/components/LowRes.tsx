import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';

// Renderiza un efecto pesado a menor resolución y lo escala a pantalla completa.
// En un PC con tarjeta gráfica puedes subir scale a 1.
export const LowRes: React.FC<{ scale?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ scale = 0.5, children, style }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: width * scale, height: height * scale, transform: `scale(${1 / scale})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
