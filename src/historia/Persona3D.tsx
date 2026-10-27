import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Persona real (anatomía y movimiento de captura de Mixamo) dibujada como silueta plana
// y pasada por un filtro de pincel: borde que hierve (aura) + vetas de pincel seco.

type Loaded = { scene: THREE.Group; clips: THREE.AnimationClip[] };
// sin clonar: clonar mallas con esqueleto rompía el Soldier; cada instancia carga su copia (key)
const cache = new Map<string, Promise<Loaded>>();
const load = (model: string, key: string) => {
  const k = model + '#' + key;
  if (!cache.has(k)) cache.set(k, new Promise<Loaded>((res, rej) =>
    new GLTFLoader().load(staticFile(`3d/personas/${model}.glb`), (g) => res({ scene: g.scene, clips: g.animations }), undefined, rej)));
  return cache.get(k)!;
};

export type Layer = { clip: string; weight: number; additive?: boolean; speed?: number; offset?: number };

const Rig: React.FC<{ data: Loaded; layers: Layer[]; t: number; yaw: number; x: number; ink: string; cam: { y: number; z: number; fov: number; lookY: number } }> = ({ data, layers, t, yaw, x, ink, cam }) => {
  const { camera } = useThree();
  const { obj, mixer, actions } = useMemo(() => {
    const obj = data.scene as THREE.Group; // cada instancia carga su propia copia (ver load)
    const mat = new THREE.MeshBasicMaterial({ color: ink, side: THREE.DoubleSide });
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.material = mat; m.frustumCulled = false; }
    });
    const mixer = new THREE.AnimationMixer(obj);
    const actions = new Map<string, THREE.AnimationAction>();
    for (const c of data.clips) {
      const additive = ['agree', 'headShake', 'sad_pose', 'sneak_pose'].includes(c.name);
      const clip = additive ? THREE.AnimationUtils.makeClipAdditive(c.clone()) : c;
      const a = mixer.clipAction(clip);
      if (additive) a.blendMode = THREE.AdditiveAnimationBlendMode;
      a.play();
      a.setEffectiveWeight(0);
      actions.set(c.name, a);
    }
    return { obj, mixer, actions };
  }, [data, ink]);
  // pose determinista por cuadro
  for (const a of actions.values()) a.setEffectiveWeight(0);
  for (const l of layers) {
    const a = actions.get(l.clip);
    if (!a) continue;
    const d = a.getClip().duration;
    a.time = (((t + (l.offset ?? 0)) * (l.speed ?? 1)) % d + d) % d;
    a.setEffectiveWeight(l.weight);
  }
  mixer.update(0);
  obj.rotation.y = yaw;
  obj.position.x = x;
  camera.position.set(0, cam.y, cam.z);
  (camera as THREE.PerspectiveCamera).fov = cam.fov;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  camera.lookAt(0, cam.lookY, 0);
  return <primitive object={obj} />;
};

/* Filtro de pincel. `seed` cambia cada pocos cuadros para que el borde hierva. */
export const BrushFilter: React.FC<{ id: string; seed: number; edge?: number; streaks?: number }> = ({ id, seed, edge = 1, streaks = 1 }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      {/* suaviza la silueta (redondea juntas del maniquí) antes del pincel */}
      <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="bl" />
      <feComponentTransfer in="bl" result="soft">
        <feFuncA type="linear" slope="6" intercept="-2.4" />
      </feComponentTransfer>
      {/* borde: desplazamiento grueso + fino (pelos de pincel) */}
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="n1" />
      <feDisplacementMap in="soft" in2="n1" scale={16 * edge} xChannelSelector="R" yChannelSelector="G" result="d1" />
      <feTurbulence type="fractalNoise" baseFrequency="0.09 0.22" numOctaves={2} seed={seed + 50} result="n2" />
      <feDisplacementMap in="d1" in2="n2" scale={12 * edge} xChannelSelector="R" yChannelSelector="G" result="d2" />
      {/* vetas de pincel seco dentro de la masa */}
      <feTurbulence type="fractalNoise" baseFrequency="0.03 0.006" numOctaves={3} seed={Math.floor(seed / 3) + 9} result="s" />
      <feColorMatrix in="s" type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${-5 * streaks} 0 0 0 ${2.1 * streaks}`} result="sAlpha" />
      <feComposite in="sAlpha" in2="d2" operator="in" result="streakMask" />
      <feFlood floodColor="#A9A9B2" result="gray" />
      <feComposite in="gray" in2="streakMask" operator="in" result="grayStreaks" />
      <feMerge>
        <feMergeNode in="d2" />
        <feMergeNode in="grayStreaks" />
      </feMerge>
    </filter>
  </svg>
);

export const Persona3D: React.FC<{
  layers: Layer[]; yaw?: number; x?: number; width?: number; height?: number; style?: React.CSSProperties; ink?: string;
  cam?: { y: number; z: number; fov: number; lookY: number }; aura?: number; id?: string; boilEvery?: number; tOffset?: number; model?: string;
}> = ({ model = 'xbot', layers, yaw = Math.PI + 0.35, x = 0, width, height, style, ink = '#EDEDF0', cam = { y: 1.4, z: 1.95, fov: 35, lookY: 1.22 }, aura = 1, id = 'brush', boilEvery = 3, tOffset = 0 }) => {
  const frame = useCurrentFrame();
  const vc = useVideoConfig();
  const W = width ?? vc.width;
  const H = height ?? vc.height;
  const [data, setData] = useState<Loaded | null>(null);
  const [handle] = useState(() => delayRender('Cargando persona 3D'));
  useLayoutEffect(() => {
    load(model, id).then((d) => { setData(d); continueRender(handle); });
  }, [handle, model, id]);
  const t = frame / vc.fps + tOffset;
  const seed = Math.floor(frame / boilEvery) % 997;
  const glow = 0.35 + (Math.sin(frame / 20) + 1) * 0.12;
  return (
    <div style={{ position: 'absolute', width: W, height: H, ...style }}>
      <BrushFilter id={id} seed={seed} />
      <div style={{ position: 'absolute', inset: 0, filter: `url(#${id}) drop-shadow(0 0 26px rgba(150,170,255,${glow * aura}))` }}>
        <ThreeCanvas width={W} height={H} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} style={{ background: 'transparent' }}>
          {data ? <Rig data={data} layers={layers} t={t} yaw={yaw} x={x} ink={ink} cam={cam} /> : null}
        </ThreeCanvas>
      </div>
    </div>
  );
};
