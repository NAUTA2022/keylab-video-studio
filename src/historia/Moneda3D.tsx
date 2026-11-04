import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Moneda de oro 3D (metal PBR con reflejos de entorno), corona de Chrysós en relieve en ambas caras y canto estriado.

type Texs = { color: THREE.Texture; bump: THREE.Texture; edge: THREE.Texture };
const loadTex = (src: string, srgb: boolean, repeat?: [number, number], rot = 0) => new Promise<THREE.Texture>((res) => {
  new THREE.TextureLoader().load(staticFile(src), (t) => {
    t.center.set(0.5, 0.5); t.rotation = rot;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    res(t);
  });
});

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  return null;
};

const Coin: React.FC<{ t: number; tx: Texs }> = ({ t, tx }) => {
  const { color, bump, edge } = tx;
  const mats = useMemo(() => {
    const face = new THREE.MeshStandardMaterial({ map: color, bumpMap: bump, bumpScale: 4, metalness: 1, roughness: 0.26, envMapIntensity: 1.4 });
    const side = new THREE.MeshStandardMaterial({ color: '#E2AE3E', bumpMap: edge, bumpScale: 2, metalness: 1, roughness: 0.32, envMapIntensity: 1.3 });
    return [side, face, face];
  }, [color, bump, edge]);
  const spin = t * 2.1;
  return (
    <group rotation={[0.22 * Math.sin(t * 1.3) + 0.12, spin, 0.08 * Math.sin(t * 0.9)]} position={[0, 0.06 * Math.sin(t * 2.2), 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mats}>
        <cylinderGeometry args={[1, 1, 0.16, 128, 1]} />
      </mesh>
    </group>
  );
};

export const Moneda3D: React.FC<{ at: number; size?: number }> = ({ at, size = 620 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, f / fps - at);
  const [tx, setTx] = useState<Texs | null>(null);
  const [handle] = useState(() => delayRender('Texturas moneda'));
  useLayoutEffect(() => {
    Promise.all([loadTex('media/chrysos/coin-color.png', true, undefined, Math.PI / 2), loadTex('media/chrysos/coin-bump.png', false, undefined, Math.PI / 2), loadTex('media/chrysos/coin-edge.png', false, [6, 1])])
      .then(([color, bump, edge]) => { setTx({ color, bump, edge }); continueRender(handle); });
  }, [handle]);
  return (
    <ThreeCanvas width={size} height={size} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }} camera={{ position: [0, 0, 3.6], fov: 38 }} style={{ background: 'transparent' }}>
      <Env />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} color="#FFF3D6" />
      <directionalLight position={[-4, -2, 3]} intensity={0.9} color="#9DB0FF" />
      <pointLight position={[0, 0, 3]} intensity={6} distance={8} color="#FFE2A0" />
      {tx ? <Coin t={t} tx={tx} /> : null}
    </ThreeCanvas>
  );
};
