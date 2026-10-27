import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

// Retrato pintado "vivo" (estilo splash animado de League of Legends):
// la imagen se monta en una malla fina y se deforma muy poco por zonas
// (respiración del torso, cabeza que se inclina, brazos que se mecen, balanceo general).
// Las zonas se definen con puntos clave en píxeles de la imagen original.

export type Rig = {
  src: string; w: number; h: number;
  neck: [number, number]; // pivote de la cabeza
  headTop: number; // y donde la cabeza ya es 100 % cabeza
  headBottom: number; // y donde deja de influir
  lShoulder: [number, number]; rShoulder: [number, number];
  armInner: [number, number]; // x interior de cada brazo (izq, der) donde empieza la influencia
  feet: [number, number];
};

export const ULISES: Rig = {
  src: 'personajes/historia/ulises.png', w: 945, h: 1665,
  neck: [470, 470], headTop: 420, headBottom: 520,
  lShoulder: [255, 590], rShoulder: [700, 590], armInner: [300, 660], feet: [480, 1665],
};

export type Motion = {
  breathe: number; // -1..1
  headRot: number; // radianes
  headX: number; headY: number; // px
  lArm: number; rArm: number; // radianes
  sway: number; // radianes (todo el cuerpo desde los pies)
};

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const rotAround = (x: number, y: number, cx: number, cy: number, a: number): [number, number] => {
  const c = Math.cos(a), s = Math.sin(a);
  const dx = x - cx, dy = y - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
};

const deform = (rig: Rig, m: Motion, x: number, y: number): [number, number] => {
  let px = x, py = y;
  // respiración: el pecho se expande y los hombros suben un poco
  const chest = smooth(1300, 650, y) * smooth(420, 560, y);
  px += (x - rig.neck[0]) * 0.006 * m.breathe * chest;
  py -= 4 * m.breathe * smooth(1400, 600, y);
  // brazos: giran desde el hombro, más hacia la mano
  const wl = smooth(rig.armInner[0], rig.armInner[0] - 90, x) * smooth(560, 760, y);
  if (wl > 0) { const [rx, ry] = rotAround(px, py, rig.lShoulder[0], rig.lShoulder[1], m.lArm * wl); px = rx; py = ry; }
  const wr = smooth(rig.armInner[1], rig.armInner[1] + 90, x) * smooth(560, 760, y);
  if (wr > 0) { const [rx, ry] = rotAround(px, py, rig.rShoulder[0], rig.rShoulder[1], m.rArm * wr); px = rx; py = ry; }
  // cabeza: inclinación desde el cuello
  const wh = smooth(rig.headBottom, rig.headTop, y);
  if (wh > 0) {
    const [rx, ry] = rotAround(px, py, rig.neck[0], rig.neck[1], m.headRot * wh);
    px = rx + m.headX * wh; py = ry + m.headY * wh;
  }
  // balanceo general desde los pies
  const [sx, sy] = rotAround(px, py, rig.feet[0], rig.feet[1], m.sway);
  return [sx, sy];
};

const Mesh: React.FC<{ rig: Rig; tex: THREE.Texture; motion: Motion; scale: number }> = ({ rig, tex, motion, scale }) => {
  const { size } = useThree();
  const geo = useMemo(() => new THREE.PlaneGeometry(rig.w, rig.h, 90, 160), [rig]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }), [tex]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    // plano centrado: pasar a píxeles de imagen (y hacia abajo)
    const ix = base[i * 3] + rig.w / 2;
    const iy = rig.h / 2 - base[i * 3 + 1];
    const [dx, dy] = deform(rig, motion, ix, iy);
    pos.setXYZ(i, dx - rig.w / 2, rig.h / 2 - dy, 0);
  }
  pos.needsUpdate = true;
  void size;
  return <mesh geometry={geo} material={mat} scale={[scale, scale, 1]} />;
};

const texCache = new Map<string, Promise<THREE.Texture>>();
const loadTex = (src: string) => {
  if (!texCache.has(src)) {
    texCache.set(src, new Promise((res, rej) => new THREE.TextureLoader().load(staticFile(src), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, rej)));
  }
  return texCache.get(src)!;
};

export const RetratoVivo: React.FC<{ rig: Rig; motion: Motion; x: number; y: number; height: number; width?: number; heightPx?: number }> = ({ rig, motion, x, y, height }) => {
  const { width: W, height: H } = useVideoConfig();
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender('Cargando retrato'));
  useLayoutEffect(() => { loadTex(rig.src).then((t) => { setTex(t); continueRender(handle); }); }, [rig, handle]);
  const scale = height / rig.h;
  return (
    <AbsoluteFill>
      <ThreeCanvas width={W} height={H} orthographic camera={{ left: -W / 2, right: W / 2, top: H / 2, bottom: -H / 2, near: 0.1, far: 1000, position: [0, 0, 10], zoom: 1 }} gl={{ alpha: true, antialias: true }}>
        {tex ? (
          <group position={[x - W / 2, H / 2 - y, 0]}>
            <Mesh rig={rig} tex={tex} motion={motion} scale={scale} />
          </group>
        ) : null}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

/* Movimiento "idle" sutil: respiración, cabeza que mira y vuelve, brazos que se mecen */
export const idle = (t: number, phase = 0): Motion => {
  const ez = Easing.inOut(Easing.sin);
  const look = interpolate(Math.sin((t + phase) * 0.45), [-1, 1], [-1, 1], { easing: ez });
  return {
    breathe: Math.sin((t + phase) * 1.6),
    headRot: 0.018 * look + 0.006 * Math.sin((t + phase) * 1.1),
    headX: 3 * look,
    headY: 1.5 * Math.sin((t + phase) * 1.6 + 0.5),
    lArm: 0.012 * Math.sin((t + phase) * 0.9 + 0.8),
    rArm: -0.012 * Math.sin((t + phase) * 0.9 + 0.2),
    sway: 0.004 * Math.sin((t + phase) * 0.6),
  };
};

/* Polvo / brasas que flotan alrededor (como los splash animados) */
const Motas: React.FC<{ cx: number; cy: number; w: number; h: number; n?: number }> = ({ cx, cy, w, h, n = 40 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const r1 = Math.sin(i * 12.9898) * 43758.5453; const a = r1 - Math.floor(r1);
        const r2 = Math.sin(i * 78.233) * 12345.678; const b = r2 - Math.floor(r2);
        const speed = 18 + b * 30;
        const yy = cy + h / 2 - (((t * speed + b * h) % h));
        const xx = cx - w / 2 + a * w + Math.sin(t * 0.8 + i) * 12;
        const life = ((t * speed + b * h) % h) / h;
        const o = Math.sin(life * Math.PI) * (0.25 + a * 0.5);
        const s = 2 + a * 4;
        return <div key={i} style={{ position: 'absolute', left: xx, top: yy, width: s, height: s, borderRadius: '50%', background: '#DADDE8', opacity: o, filter: 'blur(0.6px)' }} />;
      })}
    </>
  );
};

/* Prueba: Ulises vivo */
export const UlisesVivo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const fade = interpolate(t, [0, 1.2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const push = interpolate(t, [0, 10], [1, 1.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glow = 0.5 + Math.sin(t * 1.2) * 0.1;
  return (
    <AbsoluteFill style={{ background: '#050507' }}>
      {/* contraluz suave para separar la silueta del negro */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 28% 48% at 50% 46%, rgba(170,180,215,${0.16 * glow}) 0%, rgba(5,5,7,0) 70%)` }} />
      <AbsoluteFill style={{ opacity: fade, transform: `scale(${push})`, transformOrigin: '50% 60%' }}>
        <RetratoVivo rig={ULISES} motion={idle(t)} x={960} y={560} height={1040} />
      </AbsoluteFill>
      <Motas cx={960} cy={560} w={760} h={1000} />
    </AbsoluteFill>
  );
};
