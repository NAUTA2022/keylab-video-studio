import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { FullFrame3D, makeCamera, projectToScreen, type Region } from './FullFrame3D';
import { useGltfs } from './loaders';

/*
 * Gancho "tremenda Hilux": camioneta pickup (Kenney Car Kit, CC0, sin logos)
 * brillando frente a edificios, y al lado el lote con maleza (Kenney Nature Kit).
 * En `lotAt` la cámara se desliza de la camioneta al lote.
 * `pickupSpotOnScreen` da dónde pararse en pantalla (para montar a Don Excusas en 2D).
 */

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const PL_WORLD_HEIGHT = 5.2;
export const PL_DISTANCE = 13;
const ROT = new THREE.Euler(0.16, -0.32, 0);
const LOT_X = 12;

export const pickupRig = (frame: number, fps: number, lotAt: number) => {
  const k = interpolate(frame - lotAt, [0, 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const push = interpolate(frame, [0, lotAt], [1.18, 1.3], clamp); // dolly lento sobre la camioneta
  const s = THREE.MathUtils.lerp(push, 1.0, k);
  const focus = new THREE.Vector3(THREE.MathUtils.lerp(1.1, LOT_X, k), THREE.MathUtils.lerp(1.0, 1.5, k), THREE.MathUtils.lerp(0.6, 0, k));
  return { s, focus };
};
const rigMatrix = (r: ReturnType<typeof pickupRig>) =>
  new THREE.Matrix4()
    .makeRotationFromEuler(ROT)
    .multiply(new THREE.Matrix4().makeTranslation(-r.focus.x * r.s, -r.focus.y * r.s, -r.focus.z * r.s))
    .multiply(new THREE.Matrix4().makeScale(r.s, r.s, r.s));

export const pickupSpotOnScreen = (frame: number, fps: number, W: number, H: number, region: Region, lotAt: number, world: [number, number, number]) => {
  const cam = makeCamera(W, H, region, PL_WORLD_HEIGHT, PL_DISTANCE);
  const m = rigMatrix(pickupRig(frame, fps, lotAt));
  const p = new THREE.Vector3(...world).applyMatrix4(m);
  const up = new THREE.Vector3(world[0], world[1] + 1, world[2]).applyMatrix4(m);
  const a = projectToScreen(cam, p, W, H);
  const b = projectToScreen(cam, up, W, H);
  return { x: a.x, y: a.y, ppu: Math.hypot(b.x - a.x, b.y - a.y) };
};

const MODELS = [
  '3d/kenney-car/truck.glb',
  '3d/kenney-commercial/building-skyscraper-a.glb',
  '3d/kenney-commercial/building-skyscraper-e.glb',
  '3d/kenney-commercial/low-detail-building-a.glb',
  '3d/kenney-commercial/low-detail-building-h.glb',
  '3d/kenney-city/road-straight.glb',
  '3d/kenney-nature/ground_grass.glb',
  '3d/kenney-nature/grass_large.glb',
  '3d/kenney-nature/grass.glb',
  '3d/kenney-nature/plant_bushLarge.glb',
  '3d/kenney-nature/plant_bushDetailed.glb',
  '3d/kenney-nature/rock_largeA.glb',
  '3d/kenney-nature/stump_old.glb',
  '3d/kenney-nature/fence_simple.glb',
  '3d/kenney-city/grass-trees.glb',
];

const useSignTexture = () =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 256;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#F4E3B8';
    g.fillRect(0, 0, 512, 256);
    g.strokeStyle = '#7A5532';
    g.lineWidth = 14;
    g.strokeRect(7, 7, 498, 242);
    g.fillStyle = '#2B1D12';
    g.font = '400 92px Anton, Impact, sans-serif';
    g.textAlign = 'center';
    g.fillText('AQUÍ VA', 256, 112);
    g.fillText('TU APTO', 256, 214);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

const Scene: React.FC<{ lotAt: number; models: (THREE.Group | null)[]; onReady: () => void }> = ({ lotAt, models, onReady }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { advance } = useThree();
  const rig = useRef<THREE.Group>(null);
  const truckRef = useRef<THREE.Group>(null);
  const mounted = useRef(false);
  const sign = useSignTexture();

  const built = useMemo(() => {
    if (models.some((m) => !m)) return null;
    const [truck, skyA, skyE, lowA, lowH, road, ground, grassL, grass, bushL, bushD, rock, stump, fence, trees] = models as THREE.Group[];
    const ground0 = (o: THREE.Object3D) => -new THREE.Box3().setFromObject(o).min.y;
    const put = (src: THREE.Group, x: number, z: number, s: number, ry = 0) => {
      const o = src.clone();
      o.scale.setScalar(s);
      o.rotation.y = ry;
      o.position.set(x, 0, z);
      o.position.y = ground0(o);
      return o;
    };
    const items: THREE.Object3D[] = [];
    // calle
    for (let i = -4; i < 9; i++) {
      const r = road.clone();
      r.scale.setScalar(4); // cada tramo mide 1 unidad: escala = separación, sin huecos
      r.rotation.y = Math.PI / 2;
      r.position.set(i * 4, -0.01, 3.2);
      items.push(r);
    }
    // edificios detrás de la camioneta
    items.push(put(skyA, -4.5, -6.5, 2.4), put(skyE, 0.8, -7.5, 2.6, Math.PI / 2), put(lowA, 4.8, -5, 2.1), put(lowH, -1.5, -3.6, 1.6, Math.PI));
    items.push(put(trees, -3.6, 0.4, 1.4), put(trees, 5.0, 0.6, 1.4));
    // el lote: pasto, maleza alta, arbustos, piedra, tronco, cerca caída
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 1; z++) items.push(put(ground, LOT_X + x * 1.9, z * 1.9, 1.9));
    for (let i = 0; i < 26; i++) {
      const src = i % 3 === 0 ? grassL : i % 3 === 1 ? grass : bushD;
      items.push(put(src, LOT_X - 4 + random(`gx${i}`) * 8, -3.4 + random(`gz${i}`) * 5, 1.4 + random(`gs${i}`) * 1.2, random(`gr${i}`) * 6));
    }
    items.push(put(bushL, LOT_X + 2.6, -2.4, 2.2), put(bushL, LOT_X - 3.2, -2.8, 1.8), put(rock, LOT_X + 1.4, 0.6, 1.4), put(stump, LOT_X - 1.8, 0.2, 1.6));
    for (let i = 0; i < 5; i++) {
      const f = put(fence, LOT_X - 4 + i * 2, 1.9, 2, 0);
      if (i === 2) f.rotation.z = 0.5; // cerca caída
      items.push(f);
    }
    items.push(put(skyA, LOT_X + 2, -9, 2.2), put(lowH, LOT_X - 5, -6.5, 1.8));
    const tr = truck.clone();
    const box = new THREE.Box3().setFromObject(tr);
    const size = box.getSize(new THREE.Vector3());
    const sc = 4.2 / Math.max(size.x, size.z);
    tr.scale.setScalar(sc);
    tr.position.y = -box.min.y * sc;
    // pintura brillante: más metal y barniz en la carrocería
    tr.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = (m.material as THREE.MeshStandardMaterial).clone();
        mat.color.set('#3B4254'); // gris grafito: la textura se oscurece, se ve camioneta de lujo
        mat.metalness = 0.55;
        mat.roughness = 0.18;
        m.material = mat;
      }
    });
    return { items, truck: tr };
  }, [models]);

  useLayoutEffect(() => {
    if (!built) return;
    const r = pickupRig(frame, fps, lotAt);
    if (rig.current) {
      rig.current.scale.setScalar(r.s);
      rig.current.position.set(-r.focus.x * r.s, -r.focus.y * r.s, -r.focus.z * r.s);
    }
    if (truckRef.current) truckRef.current.rotation.y = 0.55 + Math.sin(frame / fps) * 0.015;
    if (!mounted.current) {
      mounted.current = true;
      advance(performance.now());
      onReady();
    }
  }, [frame, fps, lotAt, built, advance, onReady]);

  if (!built) return null;
  return (
    <>
      <hemisphereLight args={['#DDE4FF', '#3A3F55', 0.7]} />
      <directionalLight position={[-7, 10, 8]} intensity={2.8} color={'#FFF0DC'} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0005} />
      <directionalLight position={[6, 5, -6]} intensity={1.4} color={'#8CA0FF'} />
      {/* brillo "tremenda Hilux" */}
      <pointLight position={[1.5, 3, 4]} intensity={18} distance={10} color={'#FFFFFF'} />
      <group rotation={ROT}>
        <group ref={rig}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.03, -1]} receiveShadow>
            <planeGeometry args={[70, 30]} />
            <meshStandardMaterial color={'#6E7486'} roughness={0.95} />
          </mesh>
          {built.items.map((o, i) => (
            <primitive key={i} object={o} />
          ))}
          <group ref={truckRef}>
            <primitive object={built.truck} />
          </group>
          {/* letrero del lote */}
          <group position={[LOT_X - 0.6, 0, 1.2]} rotation={[0, 0.2, -0.06]}>
            <mesh position={[0, 0.8, 0]} castShadow>
              <boxGeometry args={[0.14, 1.6, 0.14]} />
              <meshStandardMaterial color={'#7A5532'} roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.7, 0.08]} castShadow>
              <boxGeometry args={[2.0, 1.0, 0.08]} />
              <meshStandardMaterial map={sign} roughness={0.85} />
            </mesh>
          </group>
        </group>
      </group>
    </>
  );
};

export const PickupLot3D: React.FC<{ region: Region; lotAt: number }> = ({ region, lotAt }) => {
  const { scenes, ready } = useGltfs(MODELS);
  return (
    <FullFrame3D region={region} worldHeight={PL_WORLD_HEIGHT} distance={PL_DISTANCE} hdri="sunset" envIntensity={1} exposure={1.1}>
      <Scene lotAt={lotAt} models={scenes} onReady={ready} />
    </FullFrame3D>
  );
};
