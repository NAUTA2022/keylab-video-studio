import React from 'react';
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';

/*
 * "La sanguijuela argentina" — personaje 2D original (SVG), estilo sticker.
 * Camiseta a rayas celeste y blanca con el 10, sin escudos ni marcas.
 * Todo se anima con el número de cuadro:
 *  turnAt   deja de mirar la calle y gira a cámara con rebote
 *  talk     ventanas [inicio, fin] (cuadros) en que habla
 *  stickAt  "se pegó": aplastón de ventosa con rebote
 * El punto (0,0) del componente es la base del cuerpo (donde toca el techo).
 */

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const INK = '#17200E';
const SKIN = '#7FA33F';
const SKIN_SHADE = '#5E7E2A';
const SKIN_LIGHT = '#A9CC63';
const CELESTE = '#6CB4EE';
const MOUTH = '#3B0B14';
const TONGUE = '#E35D73';

// silueta del cuerpo (base en y=480, centro x=250)
const BODY =
  'M166 480 C138 400 146 300 166 232 C176 150 204 90 250 86 C296 90 324 150 334 232 C354 300 362 400 334 480 Q250 498 166 480 Z';
const SHIRT = 'M162 286 Q250 262 338 286 L346 452 Q250 476 154 452 Z';

const Eye: React.FC<{ cx: number; cy: number; lid: number; look: number; id: string }> = ({ cx, cy, lid, look, id }) => {
  const rx = 25;
  const ry = 30;
  const lidY = cy - ry + lid * ry * 1.25; // 0 abierto, 1 casi cerrado
  return (
    <g>
      <clipPath id={id}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
      </clipPath>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx + look * 11} cy={cy + 6} r={11.5} fill={INK} />
        <circle cx={cx + look * 11 - 4} cy={cy + 2} r={3.6} fill="#FFFFFF" />
        <rect x={cx - rx - 2} y={cy - ry - 2} width={rx * 2 + 4} height={Math.max(0, lidY - (cy - ry - 2))} fill={SKIN} />
        <path d={`M${cx - rx - 2} ${lidY} Q${cx} ${lidY + 7} ${cx + rx + 2} ${lidY}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={6} />
    </g>
  );
};

const Mouth: React.FC<{ open: number }> = ({ open }) => {
  if (open < 0.08) {
    // sonrisa canchera, de costado
    return <path d="M222 232 Q252 246 284 226" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />;
  }
  const h = 8 + open * 30;
  const d = `M220 226 Q252 220 286 224 Q282 ${226 + h} 252 ${228 + h} Q224 ${226 + h} 220 226 Z`;
  return (
    <g>
      <clipPath id="leech-mouth">
        <path d={d} />
      </clipPath>
      <path d={d} fill={MOUTH} />
      <ellipse cx={254} cy={228 + h} rx={17} ry={9} fill={TONGUE} clipPath="url(#leech-mouth)" />
      <path d={d} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

export const Leech2D: React.FC<{
  height: number; // alto en píxeles del cuerpo
  turnAt: number;
  talk: [number, number][];
  stickAt: number;
  style?: React.CSSProperties;
}> = ({ height, turnAt, talk, stickAt, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const turn = interpolate(frame - turnAt, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
  const look = interpolate(turn, [0, 1], [1, 0]);
  const lid = interpolate(frame - turnAt, [3, 10], [0.15, 0.55], clamp);
  const blink = Math.abs(frame - (stickAt + 20)) < 2;

  let open = 0;
  let talking = false;
  for (const [a, b] of talk) {
    if (frame >= a && frame <= b) {
      talking = true;
      const ph = (frame - a) / fps;
      open = 0.2 + 0.8 * Math.abs(Math.sin(ph * 14 + random(`lm${Math.floor(frame / 3)}`) * 0.9));
    }
  }

  // aplastón al pegarse + respiración
  const st = (frame - stickAt) / fps;
  const sq = st >= 0 ? 1 - 0.3 * Math.exp(-st * 5) * Math.cos(st * 17) : 1 + Math.sin(t * 3) * 0.015;
  const tilt = (1 - turn) * -7 + Math.sin(t * 2.4) * 1.5 + (talking ? Math.sin(t * 9) * 1.5 : 0);
  const browL = talking ? -4 + Math.sin(t * 11) * 3 : -2;
  const browR = talking ? -12 + Math.sin(t * 9) * 4 : -9;

  const w = height * (440 / 520);
  return (
    <div style={{ position: 'absolute', width: w, height, ...style }}>
      <svg
        viewBox="0 0 440 520"
        width={w}
        height={height}
        style={{ overflow: 'visible', transformOrigin: '57% 92%', transform: `scale(${1 / Math.sqrt(sq)}, ${sq}) rotate(${tilt}deg)` }}
      >
        {/* sombra de contacto */}
        <ellipse cx={230} cy={488} rx={150} ry={16} fill="#000000" opacity={0.28} />
        {/* cola con ventosa, pegada al techo */}
        {[
          [146, 470, 44, 32],
          [98, 480, 35, 26],
          [60, 488, 27, 20],
        ].map(([cx, cy, rx, ry], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry * (st >= 0 ? 0.85 + 0.15 * sq : 1)} fill={i % 2 ? SKIN_SHADE : SKIN} stroke={INK} strokeWidth={6} />
        ))}
        <ellipse cx={30} cy={494} rx={16} ry={11} fill={SKIN_SHADE} stroke={INK} strokeWidth={6} />
        <ellipse cx={30} cy={494} rx={6} ry={4} fill={INK} />

        {/* cuerpo */}
        <clipPath id="leech-body">
          <path d={BODY} />
        </clipPath>
        <path d={BODY} fill={SKIN} />
        <g clipPath="url(#leech-body)">
          <ellipse cx={352} cy={300} rx={78} ry={250} fill={SKIN_SHADE} />
          {[132, 186, 262].map((y) => (
            <path key={y} d={`M150 ${y} Q250 ${y + 16} 350 ${y}`} stroke={SKIN_SHADE} strokeWidth={6} fill="none" />
          ))}
        </g>
        <ellipse cx={206} cy={126} rx={13} ry={30} fill={SKIN_LIGHT} transform="rotate(-24 206 126)" />
        <path d={BODY} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />

        {/* camiseta 10 */}
        <path d="M168 292 L130 312 L142 346 L172 334 Z" fill={CELESTE} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M332 292 L370 312 L358 346 L328 334 Z" fill={CELESTE} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <clipPath id="leech-shirt">
          <path d={SHIRT} />
        </clipPath>
        <path d={SHIRT} fill="#FFFFFF" />
        <g clipPath="url(#leech-shirt)">
          {[168, 216, 264, 312].map((x) => (
            <rect key={x} x={x} y={250} width={24} height={240} fill={CELESTE} />
          ))}
          <ellipse cx={352} cy={380} rx={40} ry={140} fill="#000000" opacity={0.08} />
        </g>
        <path d="M214 274 Q250 304 286 274" stroke={INK} strokeWidth={6} fill={CELESTE} />
        <text
          x={250}
          y={412}
          textAnchor="middle"
          fontFamily="Anton, Impact, sans-serif"
          fontSize={92}
          fill={INK}
          stroke="#FFFFFF"
          strokeWidth={8}
          paintOrder="stroke"
        >
          10
        </text>
        <path d={SHIRT} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />

        {/* cara */}
        <Eye cx={226} cy={176} lid={blink ? 1 : lid} look={look} id="leech-eye-l" />
        <Eye cx={280} cy={176} lid={blink ? 1 : lid * 0.85} look={look} id="leech-eye-r" />
        <path d={`M200 ${136 + browL} L246 ${142 - browL * 0.3}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M262 ${138 - browR * 0.2} L306 ${134 + browR}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <Mouth open={open} />
      </svg>
    </div>
  );
};
