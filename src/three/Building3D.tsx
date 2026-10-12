import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { FullFrame3D, type Region } from './FullFrame3D';
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C } from '../brand/brand';

// Edificio 3D hecho de bloques que, en el cuadro `splitAt`, se desarma
// y cada bloque se convierte en un token (moneda) que flota y gira.
// Todo depende del número de cuadro: se renderiza igual siempre.

const COLS = 4; // ancho
const DEPTH = 3; // fondo
const FLOORS = 11; // pisos
const S = 0.42; // tamaño de bloque
const GAP = 0.05;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Scene: React.FC<{ riseFrom: number; splitAt: number }> = ({ riseFrom, splitAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cubes = useRef<THREE.InstancedMesh>(null);
  const coins = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);

  const cells = useMemo(() => {
    const out: { x: number; y: number; z: number; floor: number; seed: string; isWindow: boolean }[] = [];
    for (let f = 0; f < FLOORS; f++)
      for (let c = 0; c < COLS; c++)
        for (let d = 0; d < DEPTH; d++) {
          out.push({
            x: (c - (COLS - 1) / 2) * (S + GAP),
            y: f * (S + GAP) + S / 2,
            z: (d - (DEPTH - 1) / 2) * (S + GAP),
            floor: f,
            seed: `${f}-${c}-${d}`,
            isWindow: random(`w${f}${c}${d}`) > 0.45,
          });
        }
    return out;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const cm = cubes.current!;
    const km = coins.current!;
    const t = frame - riseFrom;
    const split = frame - splitAt;
    cells.forEach((cell, i) => {
      // 1) construcción piso por piso
      const appear = interpolate(t - cell.floor * 1.6, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
      // 2) tokenización: el bloque sale disparado y se transforma en moneda
      const delay = (FLOORS - cell.floor) * 0.6 + random(`d${cell.seed}`) * 6;
      const k = interpolate(split - delay, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const dir = new THREE.Vector3(cell.x, cell.y - (FLOORS * (S + GAP)) / 2, cell.z).normalize();
      const spread = 1.6 + random(`r${cell.seed}`) * 1.8;
      const floatT = Math.max(0, split - delay) / fps;
      const px = cell.x + dir.x * spread * k;
      const py = cell.y + dir.y * spread * k * 0.8 + Math.sin(floatT * 2 + random(`p${cell.seed}`) * 6) * 0.08 * k;
      const pz = cell.z + dir.z * spread * k + 0.6 * k;

      // cubo: se encoge mientras aparece la moneda
      const cubeScale = appear * (1 - k);
      dummy.position.set(px, py, pz);
      dummy.rotation.set(k * 2.4 * random(`a${cell.seed}`), k * 3 * random(`b${cell.seed}`), 0);
      dummy.scale.setScalar(Math.max(0.0001, cubeScale));
      dummy.updateMatrix();
      cm.setMatrixAt(i, dummy.matrix);
      color.set(cell.isWindow ? '#9DB0FF' : C.cobalt);
      cm.setColorAt(i, color);

      // moneda
      const coinScale = interpolate(k, [0.35, 1], [0, 1], clamp);
      dummy.position.set(px, py, pz);
      dummy.rotation.set(Math.PI / 2, 0, floatT * 3 + random(`s${cell.seed}`) * 6);
      dummy.rotateX(0.5);
      dummy.scale.setScalar(Math.max(0.0001, coinScale));
      dummy.updateMatrix();
      km.setMatrixAt(i, dummy.matrix);
    });
    cm.instanceMatrix.needsUpdate = true;
    if (cm.instanceColor) cm.instanceColor.needsUpdate = true;
    km.instanceMatrix.needsUpdate = true;
    if (group.current) group.current.rotation.y = -0.6 + (frame / fps) * 0.35;
  }, [frame, cells, dummy, color, riseFrom, splitAt, fps]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <directionalLight position={[-6, 2, -4]} intensity={1.2} color={C.soft} />
      <pointLight position={[0, 2, 4]} intensity={8} color={C.cobalt} distance={12} />
      <group ref={group} position={[0, -2.6, 0]}>
        <instancedMesh ref={cubes} args={[undefined, undefined, cells.length]}>
          <boxGeometry args={[S, S, S]} />
          <meshStandardMaterial metalness={0.35} roughness={0.25} />
        </instancedMesh>
        <instancedMesh ref={coins} args={[undefined, undefined, cells.length]}>
          <cylinderGeometry args={[0.26, 0.26, 0.06, 32]} />
          <meshStandardMaterial color={'#C9D3FF'} metalness={0.9} roughness={0.18} emissive={C.cobalt} emissiveIntensity={0.25} />
        </instancedMesh>
        {/* base */}
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.4, 64]} />
          <meshStandardMaterial color={'#1A1D2B'} metalness={0.2} roughness={0.8} transparent opacity={0.9} />
        </mesh>
      </group>
    </>
  );
};

export const Building3D: React.FC<{ region: Region; riseFrom?: number; splitAt?: number }> = ({ region, riseFrom = 0, splitAt = 45 }) => (
  <FullFrame3D region={region} worldHeight={6.4} distance={11}>
    <Scene riseFrom={riseFrom} splitAt={splitAt} />
  </FullFrame3D>
);
