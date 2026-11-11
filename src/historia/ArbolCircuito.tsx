import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';

// Árbol-circuito vectorial: tronco de líneas paralelas, copa ramificada, raíces, nodos cuadrados
// y "señales" (cuadraditos) que viajan por las ramas como datos en un circuito.
// t = segundos desde el inicio del hook. FRUTO = momento en que los nodos de las puntas se vuelven dorados.

type P = [number, number];
type Seg = { p0: P; c: P; p1: P; t0: number; dur: number; w: number; pts: P[]; len: number; parent: number; leaf: boolean; node: number; root: boolean };

const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

const quad = (p0: P, c: P, p1: P, u: number): P => {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u;
  return [a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]];
};

const BASE: P = [540, 1290], TOP: P = [540, 1030];
const STEP = 0.2; // segundos por nivel de rama

function build() {
  const r = rng(11);
  const segs: Seg[] = [];
  const add = (p0: P, c: P, p1: P, t0: number, dur: number, w: number, parent: number, root: boolean) => {
    segs.push({ p0, c, p1, t0, dur, w, pts: [], len: 0, parent, leaf: true, node: 0, root });
    if (parent >= 0) segs[parent].leaf = false;
    return segs.length - 1;
  };
  // copa (coordenadas crudas, luego se encajan en la caja)
  const crown: number[] = [];
  const grow = (x: number, y: number, a: number, pa: number, len: number, depth: number, t0: number, parent: number) => {
    const p1: P = [x + Math.sin(a) * len, y - Math.cos(a) * len];
    const c: P = [x + Math.sin(pa) * len * 0.55, y - Math.cos(pa) * len * 0.55];
    const i = add([x, y], c, p1, t0, STEP, Math.max(1.3, 2.6 - (6 - depth) * 0.22), parent, false);
    crown.push(i);
    if (depth <= 0) return;
    const kids = depth >= 4 ? 2 : r() < 0.22 ? 3 : r() < 0.2 ? 1 : 2;
    for (let k = 0; k < kids; k++) {
      const side = kids === 2 ? (k ? 1 : -1) : k - 1;
      let na = a + side * (0.32 + r() * 0.3) + (r() - 0.5) * 0.15;
      na += Math.sign(a || side) * 0.07; // la copa se abre hacia los lados
      na = Math.max(-1.32, Math.min(1.32, na));
      grow(p1[0], p1[1], na, a, len * (0.6 + r() * 0.35), depth - 1, t0 + STEP, i);
    }
  };
  // tronco: 3 líneas paralelas
  const trunk: number[] = [];
  for (const dx of [-26, -9, 9, 26]) trunk.push(add([BASE[0] + dx * 1.6, BASE[1]], [BASE[0] + dx * 0.7, (BASE[1] + TOP[1]) / 2], [TOP[0] + dx * 0.35, TOP[1]], 0, 0.32, 2.4, -1, false));
  const mains = [-0.95, -0.5, -0.12, 0.12, 0.5, 0.95];
  mains.forEach((a, k) => grow(TOP[0], TOP[1], a, 0, 120 * (0.85 + r() * 0.3), 5, 0.32, trunk[k % trunk.length]));
  // encajar la copa en [90,990] x [560, TOP]
  let minX = 1e9, maxX = -1e9, minY = 1e9;
  for (const i of crown) for (const p of [segs[i].p1, segs[i].c]) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); }
  const sx = Math.min(470 / Math.max(TOP[0] - minX, maxX - TOP[0]), 1.8), sy = (TOP[1] - 580) / (TOP[1] - minY);
  const fit = (p: P): P => [TOP[0] + (p[0] - TOP[0]) * sx, TOP[1] + (p[1] - TOP[1]) * sy];
  for (const i of crown) { const s = segs[i]; s.p0 = fit(s.p0); s.c = fit(s.c); s.p1 = fit(s.p1); }
  // raíces
  const roots = (x: number, y: number, a: number, pa: number, len: number, depth: number, t0: number, parent: number) => {
    const p1: P = [x + Math.sin(a) * len, y + Math.cos(a) * len * 0.45];
    const c: P = [x + Math.sin(pa) * len * 0.5, y + Math.cos(pa) * len * 0.3];
    const i = add([x, y], c, p1, t0, 0.24, Math.max(1.1, 2.2 - (4 - depth) * 0.3), parent, true);
    if (depth <= 0) return;
    for (const side of [-1, 1]) roots(p1[0], p1[1], Math.max(-1.5, Math.min(1.5, a + side * (0.25 + r() * 0.25))), a, len * (0.68 + r() * 0.1), depth - 1, t0 + 0.24, i);
  };
  [-1.25, -0.7, -0.25, 0.25, 0.7, 1.25].forEach((a) => roots(BASE[0], BASE[1], a, 0, 105, 3, 0.05, -1));
  // muestreo para largo y señales
  for (const s of segs) {
    for (let k = 0; k <= 14; k++) s.pts.push(quad(s.p0, s.c, s.p1, k / 14));
    for (let k = 1; k < s.pts.length; k++) s.len += Math.hypot(s.pts[k][0] - s.pts[k - 1][0], s.pts[k][1] - s.pts[k - 1][1]);
    s.node = s.leaf ? (r() < (s.root ? 0.3 : 0.3) ? 5 + r() * 5 : 0) : r() < 0.4 ? 6 + r() * 6 : 0;
  }
  // cadenas tronco→hoja (y base→punta de raíz) para las señales
  const chains: { pts: P[]; len: number; root: boolean }[] = [];
  segs.forEach((s, i) => {
    if (!s.leaf) return;
    const path: number[] = [];
    for (let j = i; j >= 0; j = segs[j].parent) path.unshift(j);
    const pts: P[] = []; let len = 0;
    for (const j of path) { for (const p of segs[j].pts) { if (pts.length) len += Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]); pts.push(p); } }
    chains.push({ pts, len, root: s.root });
  });
  const pulses = Array.from({ length: 30 }, (_, k) => ({ chain: Math.floor(r() * chains.length), speed: 420 + r() * 380, phase: r() * 900, start: 0.9 + r() * 0.8, size: 4 + r() * 3 }));
  return { segs, chains, pulses };
}

const G = build();

const at = (pts: P[], len: number, s: number): P => {
  let acc = 0;
  for (let k = 1; k < pts.length; k++) {
    const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    if (acc + d >= s) { const u = (s - acc) / (d || 1); return [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * u, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * u]; }
    acc += d;
  }
  return pts[pts.length - 1];
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const ArbolCircuito: React.FC<{ t: number; fruto: number; fin: number; gold?: string }> = ({ t, fruto, fin, gold = '#F2C14E' }) => {
  const o = interpolate(t, [fin - 0.3, fin], [1, 0], clamp);
  const breathe = 1 + Math.sin(t * 1.3) * 0.006;
  const lines: React.ReactNode[] = [], nodes: React.ReactNode[] = [], sig: React.ReactNode[] = [];
  G.segs.forEach((s, i) => {
    const p = interpolate(t, [s.t0, s.t0 + s.dur], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
    if (p <= 0) return;
    lines.push(<path key={i} d={`M${s.p0[0]},${s.p0[1]} Q${s.c[0]},${s.c[1]} ${s.p1[0]},${s.p1[1]}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke="#fff" strokeOpacity={s.root ? 0.7 : 0.85} strokeWidth={s.w} fill="none" strokeLinecap="round" />);
    if (s.node && p >= 1) {
      const pop = interpolate(t, [s.t0 + s.dur, s.t0 + s.dur + 0.18], [1.8, 1], clamp);
      const fr = s.leaf && !s.root ? interpolate(t, [fruto + (s.p1[0] / 1080) * 0.35, fruto + (s.p1[0] / 1080) * 0.35 + 0.15], [0, 1], clamp) : 0;
      const tw = 0.75 + 0.25 * Math.sin(t * 5 + i * 1.7);
      const z = s.node * pop * (1 + fr * 0.25);
      nodes.push(<rect key={i} x={s.p1[0] - z / 2} y={s.p1[1] - z / 2} width={z} height={z} rx={1.2} fill={fr > 0.5 ? gold : '#fff'} opacity={tw} />);
    }
  });
  G.pulses.forEach((q, k) => {
    if (t < q.start) return;
    const ch = G.chains[q.chain];
    const cyc = ch.len + 260;
    const s = ((t - q.start) * q.speed + q.phase) % cyc;
    if (s > ch.len) return;
    const col = t > fruto && !ch.root ? gold : '#fff';
    for (let j = 0; j < 4; j++) {
      const ss = s - j * 7; if (ss < 0) break;
      const [x, y] = at(ch.pts, ch.len, ss);
      const z = q.size * (1 - j * 0.2);
      sig.push(<rect key={`${k}-${j}`} x={x - z / 2} y={y - z / 2} width={z} height={z} fill={col} opacity={1 - j * 0.28} />);
    }
  });
  return (
    <AbsoluteFill style={{ opacity: o, transform: `scale(${breathe})` }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', overflow: 'visible' }}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="pie" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fff" stopOpacity="0.16" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx={540} cy={1300} rx={380} ry={60} fill="url(#pie)" opacity={interpolate(t, [0, 0.6], [0, 1], clamp)} />
        <g filter="url(#glow)">{lines}</g>
        <g filter="url(#glow)">{nodes}</g>
        <g>{sig}</g>
      </svg>
    </AbsoluteFill>
  );
};
