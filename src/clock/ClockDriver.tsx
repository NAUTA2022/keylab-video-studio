import React, { useLayoutEffect } from 'react';
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { vTick } from '../reactbits/vclock';

// Avanza el reloj virtual al tiempo del cuadro actual y espera a que los
// componentes de React Bits dibujen antes de que Remotion tome la captura.
const realTimeout = (fn: () => void, ms = 0) => window.setTimeout(fn, ms);

export const ClockDriver: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useLayoutEffect(() => {
    const h = delayRender(`reloj cuadro ${frame}`);
    const ms = (frame / fps) * 1000;
    realTimeout(() => {
      vTick(ms);
      realTimeout(() => {
        vTick(ms);
        continueRender(h);
      }, 0);
    }, 0);
  }, [frame, fps]);
  return null;
};
