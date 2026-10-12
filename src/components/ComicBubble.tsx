import React, { useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import { Bubble, Comical } from 'comicaljs';
import { FONT } from '../brand/brand';

/*
 * Globo de diálogo de cómic hecho con Comical-JS (BloomBooks, MIT).
 * La librería dibuja la forma del globo y la cola alrededor del texto y la
 * deja como SVG estático en el DOM (startEditing → stopEditing), así cada
 * cuadro del video sale igual. La cola apunta a (tipX, tipY), en píxeles
 * del cuadro (1080×1920).
 *
 * style: 'speech' (diálogo) · 'shout' (grito, bordes en punta) · 'thought'
 */
export const ComicBubble: React.FC<{
  text: string;
  x: number;
  y: number;
  width: number;
  tipX: number;
  tipY: number;
  style?: 'speech' | 'shout' | 'thought';
  fontSize?: number;
  scale?: number;
  rotate?: number;
}> = ({ text, x, y, width, tipX, tipY, style = 'speech', fontSize = 42, scale = 1, rotate = 0 }) => {
  const parent = useRef<HTMLDivElement>(null);
  const child = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const [first] = useState(() => delayRender('Globo de diálogo (Comical)'));
  const key = `${text}|${x}|${y}|${width}|${tipX}|${tipY}|${style}`;

  useLayoutEffect(() => {
    const p = parent.current;
    const c = child.current;
    const o = outer.current;
    if (!p || !c || !o) return;
    // nuevo bloqueo por cada globo: el cuadro no se captura hasta que la forma esté lista
    const handle = delayRender('Globo de diálogo (Comical)');
    // la librería mide el texto en pantalla: se quita la animación (escala/giro)
    // mientras mide, si no el globo sale de otro tamaño en cada cuadro y parpadea
    const saved = o.style.transform;
    o.style.transform = 'none';
    // limpia el SVG de una versión anterior del globo
    p.querySelectorAll('svg').forEach((s) => s.remove());
    const spec = Bubble.getDefaultBubbleSpec(c, style);
    const midX = (x + width / 2 + tipX) / 2;
    const midY = (y + c.offsetHeight + tipY) / 2 - 30;
    spec.tails = [{ tipX, tipY, midpointX: midX, midpointY: midY, autoCurve: true }];
    spec.backgroundColors = ['#FFFFFF'];
    spec.outerBorderColor = undefined;
    spec.shadowOffset = 0;
    new Bubble(c).setBubbleSpec(spec);
    Comical.startEditing([p]);
    // la forma del globo se calcula de forma asíncrona: espera y deja el SVG fijo
    const id = setTimeout(() => {
      Comical.stopEditing();
      o.style.transform = saved;
      continueRender(handle);
      continueRender(first);
    }, 400);
    return () => {
      clearTimeout(id);
      continueRender(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div
      ref={outer}
      style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `rotate(${rotate}deg) scale(${scale})`, transformOrigin: `${tipX}px ${tipY}px`, pointerEvents: 'none' }}
    >
    <div ref={parent} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920 }}>
      <div
        ref={child}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width,
          padding: '34px 40px',
          boxSizing: 'border-box',
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.12,
          color: '#141519',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        {text}
      </div>
    </div>
    </div>
  );
};
