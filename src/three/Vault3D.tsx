import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { FullFrame3D, makeCamera, projectToScreen, type Region } from './FullFrame3D';
import { useGltfs } from './loaders';

/*
 * Bóveda de banco 3D (metal pulido con reflejos HDRI): puerta redonda con
 * rueda, pernos y tres luces de hito (H1, H2, H3).
 *  coinsAt    monedas (Kenney coin.glb) que entran volando a la bóveda abierta
 *  slamAt     la puerta se cierra de golpe (CLANK) con rebote y temblor
 *  releaseAt  se enciende H1 y sale el primer tramo de monedas
 * La puerta empieza abierta si slamAt está en el futuro; si slamAt < 0, cerrada.
 */

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const V_WORLD_HEIGHT = 5.4;
export const V_DISTANCE = 12;
const ROT = new THREE.Euler(0.08, 0.32, 0);
const R = 1.6; // radio de la puerta
const OPEN = -1.9;

const metal = (color: string, rough = 0.28) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: rough });

const useLabelTex = (text: string) =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 128;
    cv.height = 64;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#1B1E26';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#E9ECF2';
    g.font = '400 44px Anton, Impact, sans-serif';
    g.textAlign = 'center';
    g.fillText(text, 64, 50);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);

const N_IN = 26;
const N_OUT = 14;

const Scene: React.FC<{ slamAt: number; coinsAt: number; releaseAt: number; models: (THREE.Group | null)[]; onReady: () => void }> = ({ slamAt, coinsAt, releaseAt, models, onReady }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { advance } = useThree();
  const door = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  const shake = useRef<THREE.Group>(null);
  const coinsIn = useRef<THREE.InstancedMesh>(null);
  const coinsOut = useRef<THREE.InstancedMesh>(null);
  const lights = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const glow = useRef<THREE.PointLight>(null);
  const mounted = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const steel = useMemo(() => metal('#C3C9D4', 0.22), []);
  const steelDark = useMemo(() => metal('#8A93A3', 0.35), []);
  const brass = useMemo(() => metal('#D8B25A', 0.3), []);
  const labels = [useLabelTex('H1'), useLabelTex('H2'), useLabelTex('H3')];

  const coin = useMemo(() => {
    const c = models[0];
    if (!c) return null;
    let mesh: THREE.Mesh | null = null;
    c.traverse((o) => {
      if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
    });
    const m = mesh as unknown as THREE.Mesh;
    const b = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position as THREE.BufferAttribute);
    const sz = b.getSize(new THREE.Vector3());
    return { geo: m.geometry, mat: m.material as THREE.Material, scale: 0.42 / Math.max(sz.x, sz.y) };
  }, [models]);

  useLayoutEffect(() => {
    if (!coin) return;
    const t = frame / fps;
    const st = frame - slamAt;
    // puerta: abierta -> cierra con rebote (ease out back) y temblor
    const close = slamAt < 0 ? 1 : interpolate(st, [-7, 0], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const bounce = st >= 0 ? Math.sin(st * 1.3) * Math.exp(-st * 0.35) * 0.05 : 0;
    if (door.current) door.current.rotation.y = OPEN * (1 - close) - bounce;
    const sh = st >= 0 && slamAt >= 0 ? Math.exp(-st * 0.25) * 0.06 : 0;
    if (shake.current) shake.current.position.set(Math.sin(frame * 2.1) * sh, Math.cos(frame * 2.7) * sh, 0);
    // la rueda gira para trabar después del golpe
    if (wheel.current) wheel.current.rotation.z = interpolate(st, [3, 14], [0, Math.PI * 0.75], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
    // luces de hito: rojas, H1 verde al liberar
    lights.current.forEach((m, i) => {
      if (!m) return;
      const on = i === 0 && frame >= releaseAt;
      m.color.set(on ? '#22C55E' : '#E5484D');
      m.emissive.set(on ? '#22C55E' : '#E5484D');
      m.emissiveIntensity = on ? 2.2 : 0.8 + 0.3 * Math.sin(t * 6 + i);
    });
    if (glow.current) glow.current.intensity = 14 * (1 - close);
    // monedas que entran (antes del golpe)
    for (let i = 0; i < N_IN; i++) {
      const d = coinsAt + random(`ci${i}`) * 22;
      const k = interpolate(frame - d, [0, 16], [0, 1], clamp);
      const from = new THREE.Vector3(-6 + random(`cx${i}`) * 3, 4 + random(`cy${i}`) * 2, 3 + random(`cz${i}`) * 2);
      const to = new THREE.Vector3((random(`tx${i}`) - 0.5) * 1.2, (random(`ty${i}`) - 0.5) * 1.2, -0.8);
      const p = from.clone().lerp(to, Easing.in(Easing.quad)(k));
      p.y += Math.sin(k * Math.PI) * 1.2;
      dummy.position.copy(p);
      dummy.rotation.set(k * 8 + i, k * 6, 0);
      const vis = k > 0 && k < 1 && !(slamAt >= 0 && frame > slamAt && k > 0.9);
      dummy.scale.setScalar(vis ? coin.scale : 0.0001);
      dummy.updateMatrix();
      coinsIn.current!.setMatrixAt(i, dummy.matrix);
    }
    coinsIn.current!.instanceMatrix.needsUpdate = true;
    // primer tramo que sale al liberar H1
    for (let i = 0; i < N_OUT; i++) {
      const d = releaseAt + i * 1.2;
      const k = interpolate(frame - d, [0, 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      dummy.position.set(1.0 + k * (4 + random(`ox${i}`) * 2), 0.4 + Math.sin(k * Math.PI) * (1.5 + random(`oy${i}`)) - k * 1.2, 0.6 + k * 1.5);
      dummy.rotation.set(0, frame * 0.3 + i, 0);
      dummy.scale.setScalar(k > 0 && k < 1 ? coin.scale : 0.0001);
      dummy.updateMatrix();
      coinsOut.current!.setMatrixAt(i, dummy.matrix);
    }
    coinsOut.current!.instanceMatrix.needsUpdate = true;
    if (!mounted.current) {
      mounted.current = true;
      advance(performance.now());
      onReady();
    }
  }, [frame, fps, slamAt, coinsAt, releaseAt, coin, dummy, advance, onReady]);

  if (!coin) return null;
  const bolts = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2);
  return (
    <>
      <hemisphereLight args={['#E8ECFF', '#262A36', 0.5]} />
      <directionalLight position={[4, 6, 8]} intensity={2.2} color={'#FFF4E6'} />
      <directionalLight position={[-6, 2, 4]} intensity={1.2} color={'#8CA0FF'} />
      <group rotation={ROT}>
        <group ref={shake}>
          {/* muro de concreto con marco */}
          <mesh position={[0, 0, -0.5]}>
            <boxGeometry args={[30, 20, 0.6]} />
            <meshStandardMaterial color={'#1C1F27'} roughness={1} envMapIntensity={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.18]}>
            <torusGeometry args={[R + 0.18, 0.2, 24, 96]} />
            <primitive object={steelDark} attach="material" />
          </mesh>
          {/* interior con brillo dorado (se ve con la puerta abierta) */}
          <mesh position={[0, 0, -0.2]}>
            <circleGeometry args={[R, 64]} />
            <meshStandardMaterial color={'#14161D'} emissive={'#5A4310'} emissiveIntensity={0.6} />
          </mesh>
          <pointLight ref={glow} position={[0, 0, 0.4]} color={'#FFC75A'} distance={6} intensity={0} />
          {/* puerta con bisagra a la izquierda */}
          <group position={[-R, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 1.8, 24]} />
              <primitive object={steelDark} attach="material" />
            </mesh>
            <group ref={door}>
              <group position={[R, 0, 0.05]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[R, R, 0.42, 96]} />
                  <primitive object={steel} attach="material" />
                </mesh>
                {[0.62, 0.95, 1.3].map((r, i) => (
                  <mesh key={i} position={[0, 0, 0.22]}>
                    <torusGeometry args={[r * R * 0.7, 0.035, 12, 96]} />
                    <primitive object={steelDark} attach="material" />
                  </mesh>
                ))}
                {bolts.map((a, i) => (
                  <mesh key={i} position={[Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
                    <primitive object={brass} attach="material" />
                  </mesh>
                ))}
                {/* rueda */}
                <group ref={wheel} position={[0, 0, 0.36]}>
                  <mesh>
                    <torusGeometry args={[0.55, 0.06, 16, 64]} />
                    <primitive object={brass} attach="material" />
                  </mesh>
                  {[0, 1, 2].map((i) => (
                    <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
                      <boxGeometry args={[1.1, 0.07, 0.07]} />
                      <primitive object={brass} attach="material" />
                    </mesh>
                  ))}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.15, 0.15, 0.16, 32]} />
                    <primitive object={steelDark} attach="material" />
                  </mesh>
                </group>
                {/* luces de hito */}
                {[-0.5, 0, 0.5].map((x, i) => (
                  <group key={i} position={[x, -0.95, 0.24]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.1, 0.1, 0.05, 24]} />
                      <meshStandardMaterial ref={(m) => void (lights.current[i] = m)} color={'#E5484D'} emissive={'#E5484D'} emissiveIntensity={1} toneMapped={false} />
                    </mesh>
                    <mesh position={[0, -0.24, 0]}>
                      <planeGeometry args={[0.32, 0.16]} />
                      <meshBasicMaterial map={labels[i]} />
                    </mesh>
                  </group>
                ))}
              </group>
            </group>
          </group>
          <instancedMesh ref={coinsIn} args={[coin.geo, coin.mat, N_IN]} />
          <instancedMesh ref={coinsOut} args={[coin.geo, coin.mat, N_OUT]} />
        </group>
      </group>
    </>
  );
};

/** Punto de la puerta en pantalla (para el golpe de Don Excusas en 2D). */
export const vaultDoorOnScreen = (W: number, H: number, region: Region) => {
  const cam = makeCamera(W, H, region, V_WORLD_HEIGHT, V_DISTANCE);
  const m = new THREE.Matrix4().makeRotationFromEuler(ROT);
  const p = new THREE.Vector3(0, -R * 1.05, 0.3).applyMatrix4(m);
  const up = new THREE.Vector3(0, -R * 1.05 + 1, 0.3).applyMatrix4(m);
  const a = projectToScreen(cam, p, W, H);
  const b = projectToScreen(cam, up, W, H);
  return { x: a.x, y: a.y, ppu: Math.hypot(b.x - a.x, b.y - a.y) };
};

export const Vault3D: React.FC<{ region: Region; slamAt: number; coinsAt?: number; releaseAt?: number }> = ({ region, slamAt, coinsAt = -999, releaseAt = 99999 }) => {
  const { scenes, ready } = useGltfs(['3d/kenney-coin/coin.glb']);
  return (
    <FullFrame3D region={region} worldHeight={V_WORLD_HEIGHT} distance={V_DISTANCE} hdri="studio" envIntensity={1.1} exposure={1.05}>
      <Scene slamAt={slamAt} coinsAt={coinsAt} releaseAt={releaseAt} models={scenes} onReady={ready} />
    </FullFrame3D>
  );
};
