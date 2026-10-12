import React from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../brand/brand';
import {
  PiBuildingApartmentFill,
  PiMapPinAreaFill,
  PiBedFill,
  PiCraneTowerFill,
  PiHouseLineFill,
  PiWarehouseFill,
  PiStorefrontFill,
  PiFactoryFill,
  PiTreeEvergreenFill,
  PiBuildingsFill,
  PiCoinsFill,
  PiCarProfileFill,
  PiCoffeeFill,
  PiCowFill,
  PiHandshakeFill,
  PiChartLineUpFill,
  PiRocketLaunchFill,
  PiShieldCheckFill,
  PiHardHatFill,
} from 'react-icons/pi';
import type { IconType } from 'react-icons';

// Assets SVG animados (trazo que se dibuja, rellenos, pops), todos atados al cuadro.
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Progreso 0→1 de un trazo que se dibuja (usar con pathLength=1) */
const useDraw = (start: number, dur = 18) => {
  const f = useCurrentFrame();
  return interpolate(f - start, [0, dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
};
const drawProps = (p: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p });

/* ---------- Hoja de cálculo caótica + chat de las 11 p. m. ---------- */
export const ExcelChaos: React.FC<{ width: number; excelAt: number; chatAt: number; nightAt: number }> = ({ width, excelAt, chatAt, nightAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const H = width * 0.78;
  const gridP = useDraw(excelAt, 14);
  const rows = 7;
  const cols = 5;
  const gx = 20;
  const gy = 70;
  const gw = width * 0.62;
  const gh = H * 0.62;
  const cw = gw / cols;
  const rh = gh / rows;
  const shake = f > excelAt + 30 ? Math.sin(f * 1.7) * 2 : 0;
  const bubbles = [
    { t: 0, text: '¿Aún está disponible?', me: false },
    { t: 7, text: '¿Precio final??', me: false },
    { t: 14, text: 'Te mando el Excel', me: true },
  ];
  const sheetIn = spring({ frame: f - excelAt + 4, fps, config: { damping: 14 } });
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} style={{ overflow: 'visible' }}>
      {/* hoja */}
      <g transform={`translate(${shake}, ${(1 - sheetIn) * 40}) rotate(${-3 + shake * 0.3} ${gx + gw / 2} ${gy + gh / 2})`} opacity={sheetIn}>
        <rect x={gx} y={gy - 44} width={gw} height={gh + 44} rx={14} fill="#FFFFFF" stroke={C.line} strokeWidth={3} />
        <rect x={gx} y={gy - 44} width={gw} height={44} rx={14} fill="#1F7A47" />
        <rect x={gx} y={gy - 14} width={gw} height={14} fill="#1F7A47" />
        <text x={gx + 18} y={gy - 14} fontFamily={FONT.body} fontWeight={800} fontSize={22} fill="#FFFFFF">
          ventas_FINAL_v7_ahoraSi.xlsx
        </text>
        {Array.from({ length: rows + 1 }).map((_, r) => (
          <line key={`r${r}`} x1={gx} x2={gx + gw} y1={gy + r * rh} y2={gy + r * rh} stroke={C.line} strokeWidth={2} {...drawProps(gridP)} />
        ))}
        {Array.from({ length: cols + 1 }).map((_, c) => (
          <line key={`c${c}`} y1={gy} y2={gy + gh} x1={gx + c * cw} x2={gx + c * cw} stroke={C.line} strokeWidth={2} {...drawProps(gridP)} />
        ))}
        {Array.from({ length: rows * cols }).map((_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const appear = f - excelAt - 8 - i * 0.6;
          if (appear < 0) return null;
          const err = random(`e${i}`) > 0.82;
          const txt = err ? '#¡REF!' : c === 0 ? `Apto ${101 + r}` : `${Math.floor(random(`v${i}`) * 900 + 100)}`;
          return (
            <text key={i} x={gx + c * cw + 10} y={gy + r * rh + rh * 0.68} fontFamily={FONT.body} fontWeight={err ? 900 : 600} fontSize={rh * 0.42} fill={err ? '#E5484D' : C.ink}>
              {txt}
            </text>
          );
        })}
      </g>
      {/* chat */}
      {bubbles.map((b, i) => {
        const s = spring({ frame: f - chatAt - b.t, fps, config: { damping: 11, stiffness: 200 } });
        if (f < chatAt + b.t) return null;
        const bw = width * 0.5;
        const bx = b.me ? width - bw - 10 : width * 0.42;
        const by = H * 0.38 + i * 92;
        return (
          <g key={i} transform={`translate(${bx + bw / 2}, ${by + 35}) scale(${s}) translate(${-bw / 2}, -35)`}>
            <rect width={bw} height={74} rx={22} fill={b.me ? '#D9FDD3' : '#FFFFFF'} stroke={C.line} strokeWidth={2} />
            <text x={20} y={34} fontFamily={FONT.body} fontWeight={700} fontSize={24} fill={C.ink}>
              {b.text}
            </text>
            <text x={bw - 150} y={60} fontFamily={FONT.body} fontWeight={600} fontSize={17} fill={C.gray}>
              11:0{4 + i} p. m. {b.me ? '✓✓' : ''}
            </text>
          </g>
        );
      })}
      {/* luna: es de noche */}
      {(() => {
        const m = spring({ frame: f - nightAt, fps, config: { damping: 10 } });
        if (f < nightAt) return null;
        return (
          <g transform={`translate(${width - 70}, 40) scale(${m}) rotate(${(1 - m) * -40})`}>
            <circle r={34} fill={C.ink} />
            <circle r={30} cx={14} cy={-8} fill="#F1EFEA" />
            <text x={-4} y={8} fontFamily={FONT.body} fontWeight={900} fontSize={18} fill="#F1EFEA">
              z
            </text>
          </g>
        );
      })()}
    </svg>
  );
};

/* ---------- Íconos de activos (react-icons / Phosphor): edificio, lote, hotel, proyecto... ---------- */

export const ASSET_ICONS: Record<string, IconType> = {
  edificio: PiBuildingApartmentFill,
  lote: PiMapPinAreaFill,
  hotel: PiBedFill,
  proyecto: PiCraneTowerFill,
  casa: PiHouseLineFill,
  bodega: PiWarehouseFill,
  local: PiStorefrontFill,
  fabrica: PiFactoryFill,
  finca: PiTreeEvergreenFill,
  oficinas: PiBuildingsFill,
  tokens: PiCoinsFill,
  carro: PiCarProfileFill,
  cafe: PiCoffeeFill,
  ganado: PiCowFill,
  manos: PiHandshakeFill,
  crecer: PiChartLineUpFill,
  cohete: PiRocketLaunchFill,
  escudo: PiShieldCheckFill,
  constructor: PiHardHatFill,
};
export type Kind = keyof typeof ASSET_ICONS;

/** Ícono funcional con entrada: pop con resorte, revelado de abajo hacia arriba y anillo que pulsa */
export const AssetIcon: React.FC<{ kind: string; start: number; size: number; color?: string }> = ({ kind, start, size, color = C.white }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Icon = ASSET_ICONS[kind] ?? PiBuildingApartmentFill;
  if (f < start) return null;
  const local = f - start;
  const pop = spring({ frame: local, fps, config: { damping: 11, stiffness: 170 } });
  const reveal = interpolate(local, [0, 10], [100, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ring = interpolate(local, [0, 16], [0.6, 1.35], clamp);
  const ringO = interpolate(local, [0, 16], [0.9, 0], clamp);
  const float = Math.sin(local / 9) * 6;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${float}px)` }}>
      <div style={{ position: 'absolute', width: size * 0.9, height: size * 0.9, borderRadius: '50%', border: `${size * 0.025}px solid ${C.soft}`, transform: `scale(${ring})`, opacity: ringO }} />
      <div
        style={{
          width: size * 0.82,
          height: size * 0.82,
          borderRadius: '50%',
          background: C.cobalt,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${pop})`,
          boxShadow: `0 0 ${size * 0.25}px rgba(45,82,255,0.55)`,
        }}
      >
        <div style={{ clipPath: `inset(${reveal}% 0 0 0)` }}>
          <Icon size={size * 0.5} color={color} />
        </div>
      </div>
    </div>
  );
};

/** Muestra el ícono correspondiente a cada momento (cambia con la voz) */
export const AssetSequence: React.FC<{ items: { kind: string; at: number }[]; size: number }> = ({ items, size }) => {
  const f = useCurrentFrame();
  const active = [...items].reverse().find((i) => f >= i.at);
  if (!active) return null;
  const out = items.find((i) => i.at > active.at);
  const leave = out ? interpolate(f, [out.at - 4, out.at], [1, 0], clamp) : 1;
  return (
    <div style={{ opacity: leave, transform: `scale(${0.85 + 0.15 * leave})` }}>
      <AssetIcon key={active.kind + active.at} kind={active.kind} start={active.at} size={size} />
    </div>
  );
};
