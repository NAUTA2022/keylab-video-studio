import React from 'react';
import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import rig from '../../public/personajes/rig/don.json';
import { blink, breathe, handTalk } from '../motion/primitives';

/*
 * Don Excusas articulado (marioneta por capas, técnica cutout):
 * capas cortadas de don-stand.png con scripts/rig_don.py.
 *  - parpadeo natural (párpado del color de la piel)
 *  - boca que se abre con `talk` 0..1 (usar useLipSync para seguir la voz)
 *  - antebrazo que gira en el codo: `arm` grados + gesticula solo al hablar
 *  - respiración del torso
 * Pies en la parte de abajo al centro; `height` en px.
 */
export const DonRig: React.FC<{
  height: number;
  talk?: number;
  arm?: number;
  seed?: number;
  style?: React.CSSProperties;
}> = ({ height, talk = 0, arm = 0, seed = 3, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [W, H] = rig.size;
  const k = height / H;
  const lid = blink(frame, fps, seed);
  const br = breathe(frame, fps);
  const armDeg = arm + handTalk(frame, fps, Math.min(1, talk * 1.6), 7);
  const [mx, my] = rig.mouth;
  const mo = Math.max(0, talk);
  const layer = (l: { x: number; y: number; w: number; h: number }, src: string, extra?: React.CSSProperties) => (
    <Img src={staticFile(src)} style={{ position: 'absolute', left: l.x, top: l.y, width: l.w, height: l.h, ...extra }} />
  );
  return (
    <div style={{ position: 'absolute', width: W * k, height, ...style }}>
      <div style={{ position: 'absolute', left: W * 0.5 * k - height * 0.22, top: height * 0.985, width: height * 0.44, height: height * 0.03, borderRadius: '50%', background: 'rgba(0,0,0,0.16)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        {/* todo el cuerpo respira desde los pies */}
        <div style={{ position: 'absolute', inset: 0, transform: `scaleY(${br})`, transformOrigin: '50% 100%' }}>
          {layer(rig.arm, 'personajes/rig/don-arm.png', { transform: `rotate(${armDeg}deg)`, transformOrigin: `${rig.elbow[0] - rig.arm.x}px ${rig.elbow[1] - rig.arm.y}px` })}
          {layer(rig.body, 'personajes/rig/don-body.png')}
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
            <defs>
              {rig.eyes.map(([x, y, rx, ry], i) => (
                <clipPath id={`don-eye-${i}`} key={i}>
                  <ellipse cx={x} cy={y} rx={rx + 3} ry={ry + 3} />
                </clipPath>
              ))}
            </defs>
            {/* boca: aparece al hablar, debajo del bigote */}
            {mo > 0.04 ? (
              <g>
                <ellipse cx={mx} cy={my + 3 + mo * 7} rx={13 + mo * 7} ry={3 + mo * 12} fill="#5E1F2A" />
                <ellipse cx={mx + 2} cy={my + 6 + mo * 13} rx={7 + mo * 4} ry={2 + mo * 4} fill="#E0707A" />
              </g>
            ) : null}
            {/* párpados */}
            {lid > 0.02
              ? rig.eyes.map(([x, y, rx, ry], i) => {
                  const edge = y - ry - 3 + lid * (ry * 2 + 8);
                  const lash = Math.min(edge, y + ry * 0.25);
                  return (
                    <React.Fragment key={i}>
                      <g clipPath={`url(#don-eye-${i})`}>
                        <rect x={x - rx - 4} y={y - ry - 4} width={rx * 2 + 8} height={edge - (y - ry) + 4} fill={rig.skin} />
                      </g>
                      <path d={`M${x - rx + 2} ${lash} Q${x} ${lash + 6} ${x + rx - 2} ${lash}`} stroke="#2A2340" strokeWidth={4} strokeLinecap="round" fill="none" />
                    </React.Fragment>
                  );
                })
              : null}
          </svg>
          {layer(rig.mustache, 'personajes/rig/don-mustache.png')}
        </div>
      </div>
    </div>
  );
};
