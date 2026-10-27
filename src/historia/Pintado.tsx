import React, { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Persona3D } from './Persona3D';

// Personaje pintado a pincel seco / lápiz, con borde que "hierve" como un aura.
// Se dibuja en canvas cuadro a cuadro desde un esqueleto:
//  1) masa sólida (torso + brazos + cabeza + muslos) con el contorno ligeramente tembloroso,
//  2) trazos de textura que viajan con cada hueso (las marcas del pincel),
//  3) pelos de pincel en el borde, re-sorteados cada 3 cuadros (aura viva),
//  4) un resplandor difuso detrás que respira.

type V = [number, number];
const rnd = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const rot = (v: V, a: number): V => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export type Pose = {
  sway: number; breathe: number; headTurn: number; headTilt: number;
  lArm: number; rArm: number; lElbow: number; rElbow: number; lean: number;
};
export const IDLE: Pose = { sway: 0, breathe: 0, headTurn: 0, headTilt: 0, lArm: 0.12, rArm: 0.12, lElbow: -0.06, rElbow: -0.06, lean: 0 };

/* Esqueleto (cadera en 0,0; cabeza arriba, muslos cortados abajo como la referencia) */
const skeleton = (p: Pose) => {
  const hip: V = [p.sway * 12, 0];
  const tilt = p.lean + p.sway * 0.015;
  const at = (v: V): V => add(hip, rot(v, tilt));
  const chestY = -360 - p.breathe * 5;
  const neck = at([0, -470 - p.breathe * 5]);
  const head = add(neck, rot([0, -132], p.headTilt));
  const shW = 158 + p.breathe * 3;
  const lSh = at([-shW, chestY - 62]);
  const rSh = at([shW, chestY - 62]);
  const lEl = add(lSh, rot([0, 285], p.lArm));
  const rEl = add(rSh, rot([0, 285], -p.rArm));
  const lWr = add(lEl, rot([0, 255], p.lArm + p.lElbow));
  const rWr = add(rEl, rot([0, 255], -p.rArm - p.rElbow));
  const lHa = add(lWr, rot([0, 120], p.lArm + p.lElbow * 1.1));
  const rHa = add(rWr, rot([0, 120], -p.rArm - p.rElbow * 1.1));
  const torso: V[] = [
    [-62, -486], [-120, -470], [-160, -446], [-172, -410], [-170, -330], [-152, -210], [-126, -100], [-122, -40], [-132, 36],
    [132, 36], [122, -40], [126, -100], [152, -210], [170, -330], [172, -410], [160, -446], [120, -470], [62, -486],
  ].map(([x, y]) => at([x * (1 + p.breathe * 0.01), y]));
  return { hip, neck, head, lSh, rSh, lEl, rEl, lWr, rWr, lHa, rHa, torso, tilt };
};

/* Polígono de una cápsula ahusada de A a B */
const capsule = (a: V, b: V, ra: number, rb: number, steps = 10): V[] => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const ang = Math.atan2(dy, dx);
  const pts: V[] = [];
  for (let i = 0; i <= steps; i++) {
    const th = ang + Math.PI / 2 + (Math.PI * i) / steps;
    pts.push([a[0] + Math.cos(th) * ra, a[1] + Math.sin(th) * ra]);
  }
  for (let i = 0; i <= steps; i++) {
    const th = ang - Math.PI / 2 + (Math.PI * i) / steps;
    pts.push([b[0] + Math.cos(th) * rb, b[1] + Math.sin(th) * rb]);
  }
  return pts;
};
const ellipse = (c: V, rx: number, ry: number, rotA: number, n = 28): V[] =>
  Array.from({ length: n }, (_, i) => {
    const th = (i / n) * Math.PI * 2;
    return add(c, rot([Math.cos(th) * rx, Math.sin(th) * ry], rotA));
  });

type Shape = { poly: V[]; axis: [V, V] };
const shapes = (k: ReturnType<typeof skeleton>, p: Pose): Shape[] => {
  const headC: V = add(k.head, [p.headTurn * 8, 0]);
  return [
    { poly: k.torso, axis: [k.neck, k.hip] },
    { poly: capsule(add(k.neck, [0, 30]), add(k.neck, [0, -46]), 58, 52), axis: [k.neck, add(k.neck, [0, -60])] },
    { poly: ellipse(headC, 76, 94, p.headTilt), axis: [add(headC, [0, -80]), add(headC, [0, 80])] },
    { poly: ellipse(add(headC, [-72 + p.headTurn * 50, 10]), 13, 22, 0), axis: [headC, headC] },
    { poly: capsule(k.lSh, k.lEl, 64, 50), axis: [k.lSh, k.lEl] },
    { poly: capsule(k.rSh, k.rEl, 64, 50), axis: [k.rSh, k.rEl] },
    { poly: capsule(k.lEl, k.lWr, 50, 36), axis: [k.lEl, k.lWr] },
    { poly: capsule(k.rEl, k.rWr, 50, 36), axis: [k.rEl, k.rWr] },
    { poly: capsule(k.lWr, k.lHa, 38, 26), axis: [k.lWr, k.lHa] },
    { poly: capsule(k.rWr, k.rHa, 38, 26), axis: [k.rWr, k.rHa] },
    { poly: capsule(add(k.hip, [-78, 0]), add(k.hip, [-84, 460]), 96, 74), axis: [add(k.hip, [-78, 0]), add(k.hip, [-84, 460])] },
    { poly: capsule(add(k.hip, [78, 0]), add(k.hip, [84, 460]), 96, 74), axis: [add(k.hip, [78, 0]), add(k.hip, [84, 460])] },
  ];
};

const inside = (pt: V, poly: V[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const bbox = (poly: V[]) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
};

const drawFigure = (ctx: CanvasRenderingContext2D, pose: Pose, frame: number, o: { cx: number; cy: number; scale: number; reveal: number; ink: string; seed: number; glowOnly?: boolean }) => {
  const k = skeleton(pose);
  const S = shapes(k, pose);
  const boil = Math.floor(frame / 3);
  ctx.save();
  ctx.translate(o.cx, o.cy);
  ctx.scale(o.scale, o.scale);
  // revelado: barrido de pintura de arriba hacia abajo con borde irregular
  const top = -760, bottom = 500;
  const edgeY = top + (bottom - top) * o.reveal;
  ctx.beginPath();
  ctx.moveTo(-600, top - 50);
  ctx.lineTo(600, top - 50);
  const J = rnd(o.seed * 31 + boil);
  for (let x = 600; x >= -600; x -= 40) ctx.lineTo(x, edgeY + (J() - 0.5) * 70);
  ctx.closePath();
  ctx.clip();

  // 1) masa sólida con contorno tembloroso
  const W = rnd(o.seed * 17 + boil * 101);
  ctx.fillStyle = o.ink;
  ctx.globalAlpha = 1;
  for (const s of S) {
    const q = s.poly.map(([x, y]) => [x + (W() - 0.5) * 6, y + (W() - 0.5) * 6] as V);
    ctx.beginPath();
    const mid = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(q[q.length - 1], q[0]);
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < q.length; i++) { const m = mid(q[i], q[(i + 1) % q.length]); ctx.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]); }
    ctx.closePath();
    ctx.fill();
  }
  if (!o.glowOnly) {
    // 2) marcas de pincel dentro de la masa (tonos un poco más oscuros y más claros), estables por hueso
    ctx.lineCap = 'round';
    S.forEach((s, si) => {
      const R = rnd(o.seed * 1000 + si * 97);
      const b = bbox(s.poly);
      const ax = s.axis[1][0] - s.axis[0][0], ay = s.axis[1][1] - s.axis[0][1];
      const base = Math.atan2(ay, ax);
      const area = (b.x1 - b.x0) * (b.y1 - b.y0);
      const n = Math.round(area / 1400);
      for (let i = 0; i < n; i++) {
        const pt: V = [b.x0 + R() * (b.x1 - b.x0), b.y0 + R() * (b.y1 - b.y0)];
        const kind = R();
        const ang = base + (R() - 0.5) * 1.4 + (R() < 0.3 ? Math.PI / 2 : 0);
        const L = 26 + R() * 90;
        const w = 6 + R() * 18;
        if (!inside(pt, s.poly)) continue;
        ctx.strokeStyle = kind < 0.35 ? '#B9B9C0' : kind < 0.75 ? '#D6D6DC' : '#FFFFFF';
        ctx.globalAlpha = kind < 0.35 ? 0.16 + R() * 0.22 : 0.22 + R() * 0.4;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(pt[0] - Math.cos(ang) * L * 0.5, pt[1] - Math.sin(ang) * L * 0.5);
        ctx.quadraticCurveTo(pt[0] + (R() - 0.5) * 10, pt[1] + (R() - 0.5) * 10, pt[0] + Math.cos(ang) * L * 0.5, pt[1] + Math.sin(ang) * L * 0.5);
        ctx.stroke();
      }
    });
  }
  // 3) pelos de pincel en el borde: salen del contorno y cambian cada 3 cuadros (aura)
  ctx.strokeStyle = o.ink;
  ctx.lineCap = 'round';
  S.forEach((s, si) => {
    const B = rnd(o.seed * 7777 + si * 131 + boil * 7919);
    const poly = s.poly;
    let per = 0;
    for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    const n = Math.round(per / 14);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(B() * poly.length);
      const a = poly[idx], b = poly[(idx + 1) % poly.length];
      const t = B();
      const p: V = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      let nx = ty / tl, ny = -tx / tl; // normal
      if (inside([p[0] + nx * 6, p[1] + ny * 6], poly)) { nx = -nx; ny = -ny; }
      const out = 2 + Math.pow(B(), 2) * 44;
      const along = (B() - 0.5) * 30;
      ctx.globalAlpha = 0.25 + B() * 0.65;
      ctx.lineWidth = 0.8 + B() * 3.5;
      ctx.beginPath();
      ctx.moveTo(p[0] - nx * 4, p[1] - ny * 4);
      ctx.lineTo(p[0] + nx * out + (tx / tl) * along, p[1] + ny * out + (ty / tl) * along);
      ctx.stroke();
    }
  });
  ctx.restore();
  ctx.globalAlpha = 1;
};

export const PaintedFigure: React.FC<{ pose: Pose; x: number; y: number; scale: number; reveal: number; seed?: number; ink?: string; aura?: number }> = ({
  pose, x, y, scale, reveal, seed = 1, ink = '#ECECEE', aura = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const main = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const m = main.current?.getContext('2d');
    const g = glow.current?.getContext('2d');
    if (m) { m.clearRect(0, 0, width, height); drawFigure(m, pose, frame, { cx: x, cy: y, scale, reveal, ink, seed }); }
    if (g) { g.clearRect(0, 0, width, height); drawFigure(g, pose, frame, { cx: x, cy: y, scale: scale * 1.04, reveal, ink: '#9FB0FF', seed, glowOnly: true }); }
  });
  const pulse = 0.35 + (Math.sin(frame / 20) + 1) * 0.12;
  return (
    <AbsoluteFill>
      <canvas ref={glow} width={width} height={height} style={{ position: 'absolute', inset: 0, filter: 'blur(38px)', opacity: pulse * aura }} />
      <canvas ref={main} width={width} height={height} style={{ position: 'absolute', inset: 0 }} />
    </AbsoluteFill>
  );
};

/* Prueba: persona real (mocap) pintada a pincel, con aura que hierve */
export const PersonajePrueba: React.FC<{ model?: string }> = ({ model = 'xbot' }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const ez = Easing.inOut(Easing.cubic);
  const nod = interpolate(t, [2.4, 2.8, 4.2, 4.6], [0, 1, 1, 0], { ...clamp, easing: ez });
  const shake = interpolate(t, [5.4, 5.8, 7.0, 7.4], [0, 1, 1, 0], { ...clamp, easing: ez });
  const yaw = Math.PI + interpolate(t, [0, 9], [0.45, 0.05], { ...clamp, easing: ez });
  const reveal = interpolate(t, [0.1, 2.0], [0, 110], { ...clamp, easing: Easing.out(Easing.cubic) });
  const push = interpolate(t, [0, 9], [2.45, 2.2], clamp);
  return (
    <AbsoluteFill style={{ background: '#050507' }}>
      <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `linear-gradient(180deg, #000 ${reveal - 12}%, transparent ${reveal}%)`, maskImage: `linear-gradient(180deg, #000 ${reveal - 12}%, transparent ${reveal}%)` }}>
        <Persona3D
          model={model}
          yaw={yaw}
          cam={{ y: 1.38, z: push, fov: 35, lookY: 1.12 }}
          layers={[
            { clip: model === 'soldier' ? 'Idle' : 'idle', weight: 1 },
            { clip: 'agree', weight: nod, additive: true, offset: -2.4 },
            { clip: 'headShake', weight: shake, additive: true, offset: -5.4 },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};
