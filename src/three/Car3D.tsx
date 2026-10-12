import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C } from '../brand/brand';
import { FullFrame3D, type Region } from './FullFrame3D';
import { useGltfs } from './loaders';
import { useThree } from '@react-three/fiber';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* Carro hecho de bloques (voxels): carrocería + cabina. Ruedas aparte. */
const S = 0.34;
const voxels = (() => {
  const v: { x: number; y: number; z: number; part: 'body' | 'cabin' | 'glass' }[] = [];
  for (let x = 0; x < 10; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 4; z++) v.push({ x: (x - 4.5) * S, y: (y + 0.9) * S, z: (z - 1.5) * S, part: 'body' });
  for (let x = 2; x < 7; x++) for (let z = 0; z < 4; z++) v.push({ x: (x - 4.5) * S, y: 2.9 * S, z: (z - 1.5) * S, part: x === 2 || x === 6 || z === 0 || z === 3 ? 'glass' : 'cabin' });
  for (let x = 3; x < 6; x++) for (let z = 1; z < 3; z++) v.push({ x: (x - 4.5) * S, y: 3.9 * S, z: (z - 1.5) * S, part: 'cabin' });
  return v;
})();
const WHEELS: [number, number][] = [[-1.05, -0.62], [-1.05, 0.62], [1.05, -0.62], [1.05, 0.62]];

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.6} />
    <directionalLight position={[4, 8, 6]} intensity={2.2} />
    <directionalLight position={[-6, 2, -4]} intensity={1.2} color={C.soft} />
    <pointLight position={[0, 2, 4]} intensity={8} color={C.cobalt} distance={12} />
  </>
);

/* ---------- 1) Carro que se parte en tokens (modelos Kenney, CC0) ----------
 * Sedán real con textura; en `splitAt` se encoge con un destello y de su
 * volumen salen monedas que vuelan a una rejilla ordenada (los tokens). */
const N_COINS = 48;
const SplitScene: React.FC<{ enterAt: number; splitAt: number; models: (THREE.Group | null)[]; onReady: () => void }> = ({ enterAt, splitAt, models, onReady }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { advance } = useThree();
  const carRef = useRef<THREE.Group>(null);
  const coins = useRef<THREE.InstancedMesh>(null);
  const flash = useRef<THREE.PointLight>(null);
  const mounted = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const parts = useMemo(() => {
    const [sedan, coin] = models;
    if (!sedan || !coin) return null;
    const box = new THREE.Box3().setFromObject(sedan);
    const size = box.getSize(new THREE.Vector3());
    const scale = 3.4 / Math.max(size.x, size.z);
    let mesh: THREE.Mesh | null = null;
    coin.traverse((o) => {
      if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
    });
    const cm = mesh as unknown as THREE.Mesh;
    const cbox = new THREE.Box3().setFromBufferAttribute(cm.geometry.attributes.position as THREE.BufferAttribute);
    const csize = cbox.getSize(new THREE.Vector3());
    return { sedan, scale, floor: -box.min.y * scale, coinGeo: cm.geometry, coinMat: cm.material as THREE.Material, coinScale: 0.36 / Math.max(csize.x, csize.y) };
  }, [models]);

  useLayoutEffect(() => {
    if (!parts) return;
    const t = frame - enterAt;
    const split = frame - splitAt;
    const enter = interpolate(t, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
    const gone = interpolate(split, [0, 9], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
    if (carRef.current) {
      carRef.current.scale.setScalar(Math.max(0.0001, parts.scale * enter * gone));
      carRef.current.rotation.y = -0.6 + (frame / fps) * 0.35;
      carRef.current.position.y = parts.floor * enter * gone - 0.6;
    }
    for (let i = 0; i < N_COINS; i++) {
      const d = random(`cd${i}`) * 6;
      const k = interpolate(split - d, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const sx = (random(`sx${i}`) - 0.5) * 3;
      const sy = random(`sy${i}`) * 1.1;
      const sz = (random(`sz${i}`) - 0.5) * 1.4;
      const gx = ((i % 8) - 3.5) * 0.48;
      const gy = (Math.floor(i / 8) - 2.5) * 0.48 + 0.4;
      dummy.position.set(
        THREE.MathUtils.lerp(sx, gx, k),
        THREE.MathUtils.lerp(sy - 0.3, gy, k) + Math.sin(k * Math.PI) * (1 + random(`ch${i}`)),
        THREE.MathUtils.lerp(sz, 0.6, k) + Math.sin(k * Math.PI) * (random(`cz${i}`) - 0.5) * 2,
      );
      dummy.rotation.set(0, (frame / fps) * 2.4 + random(`cs${i}`) * 6, 0);
      dummy.scale.setScalar(Math.max(0.0001, parts.coinScale * interpolate(split - d, [0, 6], [0, 1], clamp)));
      dummy.updateMatrix();
      coins.current!.setMatrixAt(i, dummy.matrix);
    }
    coins.current!.instanceMatrix.needsUpdate = true;
    if (flash.current) flash.current.intensity = split >= 0 ? 60 * Math.exp(-(split / fps) * 5) : 0;
    if (!mounted.current) {
      mounted.current = true;
      advance(performance.now());
      onReady();
    }
  }, [frame, enterAt, splitAt, fps, dummy, parts, advance, onReady]);

  if (!parts) return null;
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 8, 6]} intensity={2.4} color={'#FFF1E0'} />
      <directionalLight position={[-6, 3, -4]} intensity={1.4} color={C.soft} />
      <pointLight ref={flash} position={[0, 0.6, 2.5]} intensity={0} color={'#FFFFFF'} distance={10} />
      <group rotation={[0.22, 0, 0]}>
        <group ref={carRef}>
          <primitive object={parts.sedan} />
        </group>
        {/* sombra de contacto */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.59, 0]} scale={[1, 0.55, 1]}>
          <circleGeometry args={[1.9, 48]} />
          <meshBasicMaterial color={'#141519'} transparent opacity={interpolate(frame - splitAt, [0, 9], [0.16, 0], clamp) * interpolate(frame - enterAt, [0, 10], [0, 1], clamp)} depthWrite={false} />
        </mesh>
        <instancedMesh ref={coins} args={[parts.coinGeo, parts.coinMat, N_COINS]} />
      </group>
    </>
  );
};

export const CarSplit3D: React.FC<{ region: Region; enterAt?: number; splitAt?: number }> = ({ region, enterAt = 0, splitAt = 30 }) => {
  const { scenes, ready } = useGltfs(['3d/kenney-car/sedan.glb', '3d/kenney-coin/coin.glb']);
  return (
    <FullFrame3D region={region} worldHeight={3.3} distance={10} hdri="city" envIntensity={0.75} exposure={1.0}>
      <SplitScene enterAt={enterAt} splitAt={splitAt} models={scenes} onReady={ready} />
    </FullFrame3D>
  );
};

/* ---------- 2) Gancho: ciudad de noche, el carro entra y explota ---------- */
const CityScene: React.FC<{ driveAt: number; boomAt: number }> = ({ driveAt, boomAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const car = useRef<THREE.Group>(null);
  const parts = useRef<THREE.InstancedMesh>(null);
  const fire = useRef<THREE.InstancedMesh>(null);
  const flash = useRef<THREE.PointLight>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  // edificios de fondo (deterministas)
  const city = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        x: -9 + i * 0.86 + random(`bx${i}`) * 0.3,
        z: -3.2 - random(`bz${i}`) * 2.5,
        w: 0.6 + random(`bw${i}`) * 0.5,
        h: 1.6 + random(`bh${i}`) * 4.2,
      })),
    [],
  );

  const N_FIRE = 70;
  useLayoutEffect(() => {
    const t = (frame - driveAt) / fps;
    const b = frame - boomAt;
    // el carro llega desde la izquierda y frena en el centro
    const x = interpolate(frame - driveAt, [0, Math.max(1, boomAt - driveAt)], [-7, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
    if (car.current) {
      car.current.position.set(x, 0, 0.6);
      car.current.visible = b < 0;
      car.current.rotation.z = b < 0 ? Math.sin(t * 22) * 0.008 : 0;
    }
    // explosión: piezas del carro + bola de fuego
    voxels.forEach((v, i) => {
      const k = Math.max(0, b) / fps;
      const dir = new THREE.Vector3(v.x + (random(`px${i}`) - 0.5), v.y + 0.8 + random(`py${i}`), v.z + (random(`pz${i}`) - 0.5)).normalize();
      const sp = 5 + random(`ps${i}`) * 6;
      dummy.position.set(v.x + dir.x * sp * k, v.y + dir.y * sp * k - 4.9 * k * k, v.z + 0.6 + dir.z * sp * k);
      dummy.rotation.set(k * 9 * random(`pr${i}`), k * 7, k * 5);
      dummy.scale.setScalar(b >= 0 ? Math.max(0.0001, 1 - k * 0.6) : 0.0001);
      dummy.updateMatrix();
      parts.current!.setMatrixAt(i, dummy.matrix);
      color.set(v.part === 'glass' ? '#9DB0FF' : C.cobalt);
      parts.current!.setColorAt(i, color);
    });
    parts.current!.instanceMatrix.needsUpdate = true;
    if (parts.current!.instanceColor) parts.current!.instanceColor.needsUpdate = true;
    for (let i = 0; i < N_FIRE; i++) {
      const k = Math.max(0, b) / fps;
      const dir = new THREE.Vector3(random(`fx${i}`) - 0.5, random(`fy${i}`) * 0.9, random(`fz${i}`) - 0.5).normalize();
      const r = (1 - Math.exp(-k * 5)) * (1.2 + random(`fr${i}`) * 1.6);
      dummy.position.set(dir.x * r, 0.6 + dir.y * r + k * 0.8, 0.6 + dir.z * r);
      dummy.rotation.set(0, 0, 0);
      const life = b >= 0 ? Math.max(0, 1 - k / (0.6 + random(`fl${i}`) * 0.6)) : 0;
      dummy.scale.setScalar(Math.max(0.0001, life * (0.35 + random(`fs${i}`) * 0.4)));
      dummy.updateMatrix();
      fire.current!.setMatrixAt(i, dummy.matrix);
      color.set(random(`fc${i}`) > 0.5 ? '#FFB547' : random(`fc2${i}`) > 0.5 ? '#FF5A1F' : '#FFF3C4');
      fire.current!.setColorAt(i, color);
    }
    fire.current!.instanceMatrix.needsUpdate = true;
    if (fire.current!.instanceColor) fire.current!.instanceColor.needsUpdate = true;
    if (flash.current) flash.current.intensity = b >= 0 ? 120 * Math.exp(-(b / fps) * 6) : 0;
  }, [frame, driveAt, boomAt, fps, dummy, color]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 5]} intensity={1.4} />
      <pointLight position={[-4, 3, 3]} intensity={10} color={C.cobalt} distance={14} />
      <pointLight ref={flash} position={[0, 1.2, 1.5]} intensity={0} color={'#FF8A3D'} distance={20} />
      {/* calle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 8]} />
        <meshStandardMaterial color={'#14161F'} roughness={0.9} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-11 + i * 2, 0.01, 1.7]}>
          <planeGeometry args={[0.9, 0.08]} />
          <meshBasicMaterial color={'#8CA0FF'} />
        </mesh>
      ))}
      {/* edificios */}
      {city.map((c, i) => (
        <mesh key={i} position={[c.x, c.h / 2, c.z]}>
          <boxGeometry args={[c.w, c.h, 0.8]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#1B2140' : '#12162A'} emissive={'#2D52FF'} emissiveIntensity={0.08} />
        </mesh>
      ))}
      {/* carro */}
      <group ref={car}>
        {voxels.map((v, i) => (
          <mesh key={i} position={[v.x, v.y, v.z]}>
            <boxGeometry args={[S * 0.96, S * 0.96, S * 0.96]} />
            <meshStandardMaterial color={v.part === 'glass' ? '#9DB0FF' : C.cobalt} metalness={0.35} roughness={0.25} />
          </mesh>
        ))}
        {WHEELS.map(([x, z], i) => (
          <mesh key={`w${i}`} position={[x, 0.22, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.18, 24]} />
            <meshStandardMaterial color={'#0A0A0F'} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[1.75, 0.55, -0.4]}>
          <boxGeometry args={[0.05, 0.16, 0.22]} />
          <meshBasicMaterial color={'#FFF3C4'} />
        </mesh>
        <mesh position={[1.75, 0.55, 0.4]}>
          <boxGeometry args={[0.05, 0.16, 0.22]} />
          <meshBasicMaterial color={'#FFF3C4'} />
        </mesh>
      </group>
      <instancedMesh ref={parts} args={[undefined, undefined, voxels.length]}>
        <boxGeometry args={[S * 0.9, S * 0.9, S * 0.9]} />
        <meshStandardMaterial metalness={0.35} roughness={0.25} />
      </instancedMesh>
      <instancedMesh ref={fire} args={[undefined, undefined, N_FIRE]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
};

export const CityCar3D: React.FC<{ region: Region; driveAt?: number; boomAt?: number }> = ({ region, driveAt = 0, boomAt = 40 }) => (
  <FullFrame3D region={region} worldHeight={5.2} distance={12}>
    <group rotation={[0.18, -0.35, 0]} position={[0, -1.2, 0]}>
      <CityScene driveAt={driveAt} boomAt={boomAt} />
    </group>
  </FullFrame3D>
);
