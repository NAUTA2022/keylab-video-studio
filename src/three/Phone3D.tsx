import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { FullFrame3D, type Region } from './FullFrame3D';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { C, FONT } from '../brand/brand';

// Celular 3D con una app de inversión en pantalla (dibujada en canvas cada cuadro).
// En `investAt` el botón "Invertir" se presiona, cae un token y el saldo sube.

const SW = 540; // resolución de la pantalla (px)
const SH = 1100;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

const drawScreen = (g: CanvasRenderingContext2D, f: number, investAt: number, amount: number, project: string) => {
  const press = interpolate(f - investAt, [-4, 0, 4], [1, 0.94, 1], clamp);
  const done = interpolate(f - investAt, [4, 24], [0, 1], { ...clamp, easing: Easing.out(Easing.exp) });
  g.fillStyle = C.night;
  g.fillRect(0, 0, SW, SH);
  // barra superior
  g.fillStyle = '#FFFFFF';
  g.font = `700 26px ${FONT.body}`;
  g.fillText('9:41', 40, 56);
  // encabezado
  g.fillStyle = C.soft;
  g.font = `800 24px ${FONT.body}`;
  g.fillText('TU MARCA · INVERSIONES', 40, 130);
  g.fillStyle = '#FFFFFF';
  g.font = `900 46px ${FONT.body}`;
  g.fillText(project, 40, 190);
  // tarjeta del proyecto con edificio plano
  roundRect(g, 40, 230, SW - 80, 300, 28);
  g.fillStyle = '#161A2E';
  g.fill();
  g.fillStyle = C.cobalt;
  for (let i = 0; i < 5; i++) {
    const h = 80 + i * 30 + (i === 2 ? 60 : 0);
    g.fillRect(90 + i * 72, 500 - h, 56, h);
  }
  g.fillStyle = '#9DB0FF';
  for (let i = 0; i < 5; i++)
    for (let r = 0; r < 4; r++) {
      const h = 80 + i * 30 + (i === 2 ? 60 : 0);
      if (r * 30 + 30 < h) g.fillRect(100 + i * 72, 500 - h + 16 + r * 30, 14, 12), g.fillRect(122 + i * 72, 500 - h + 16 + r * 30, 14, 12);
    }
  // progreso de financiación
  const funded = 0.62 + 0.04 * done;
  g.fillStyle = '#8F8B83';
  g.font = `700 24px ${FONT.body}`;
  g.fillText(`Financiado ${Math.round(funded * 100)}%`, 40, 580);
  roundRect(g, 40, 600, SW - 80, 16, 8);
  g.fillStyle = '#23263A';
  g.fill();
  roundRect(g, 40, 600, (SW - 80) * funded, 16, 8);
  g.fillStyle = C.cobalt;
  g.fill();
  // saldo de tokens
  g.fillStyle = '#8F8B83';
  g.fillText('Tus tokens', 40, 680);
  g.fillStyle = '#FFFFFF';
  g.font = `900 72px ${FONT.body}`;
  g.fillText(`${Math.round(amount * done)} USD`, 40, 760);
  // botón
  const bw = (SW - 80) * press;
  const bx = 40 + ((SW - 80) - bw) / 2;
  roundRect(g, bx, 860 + (1 - press) * 20, bw, 110 * press, 55 * press);
  g.fillStyle = done > 0.5 ? '#FFFFFF' : C.cobalt;
  g.fill();
  g.fillStyle = done > 0.5 ? C.ink : '#FFFFFF';
  g.font = `900 40px ${FONT.body}`;
  const label = done > 0.5 ? '✓ Invertido' : `Invertir ${amount} USD`;
  const tw = g.measureText(label).width;
  g.fillText(label, SW / 2 - tw / 2, 930);
};

const Scene: React.FC<{ investAt: number; amount: number; project: string }> = ({ investAt, amount, project }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const group = useRef<THREE.Group>(null);
  const coin = useRef<THREE.Mesh>(null);
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = SW;
    c.height = SH;
    return c;
  }, []);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [canvas]);

  useLayoutEffect(() => {
    drawScreen(canvas.getContext('2d')!, frame, investAt, amount, project);
    tex.needsUpdate = true;
    const t = frame / fps;
    const enter = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
    if (group.current) {
      group.current.position.y = -4 + 4 * enter;
      group.current.rotation.y = -0.45 + Math.sin(t * 0.9) * 0.18 + (1 - enter) * 1.2;
      group.current.rotation.x = 0.08 + Math.sin(t * 0.7) * 0.05;
    }
    // token que cae dentro de la pantalla
    const fall = interpolate(frame - investAt, [-18, 0], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    if (coin.current) {
      coin.current.visible = fall > 0 && fall < 1;
      coin.current.position.set(0.15, 3.4 - 3.6 * fall, 0.7);
      coin.current.rotation.set(Math.PI / 2 - 0.3, 0, t * 9);
    }
  }, [frame, canvas, tex, investAt, amount, project, fps]);

  const W = 2.3;
  const H = 4.7;
  const body = useMemo(() => {
    const s = new THREE.Shape();
    const r = 0.38;
    s.moveTo(-W / 2 + r, -H / 2);
    s.lineTo(W / 2 - r, -H / 2);
    s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r);
    s.lineTo(W / 2, H / 2 - r);
    s.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2);
    s.lineTo(-W / 2 + r, H / 2);
    s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r);
    s.lineTo(-W / 2, -H / 2 + r);
    s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
    return new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 16 });
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 6]} intensity={2.4} />
      <directionalLight position={[-5, -1, 3]} intensity={1.4} color={C.soft} />
      <pointLight position={[-2, 2, 3]} intensity={10} color={C.cobalt} distance={10} />
      <group ref={group}>
        <mesh geometry={body} position={[0, 0, -0.28]}>
          <meshStandardMaterial color={'#1B1E2A'} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.065]}>
          <planeGeometry args={[W - 0.16, H - 0.16]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        {/* isla de la cámara */}
        <mesh position={[0, H / 2 - 0.22, 0.07]}>
          <planeGeometry args={[0.6, 0.12]} />
          <meshBasicMaterial color={'#000000'} />
        </mesh>
      </group>
      <mesh ref={coin}>
        <cylinderGeometry args={[0.42, 0.42, 0.09, 40]} />
        <meshStandardMaterial color={'#C9D3FF'} metalness={0.95} roughness={0.15} emissive={C.cobalt} emissiveIntensity={0.3} />
      </mesh>
    </>
  );
};

export const Phone3D: React.FC<{ region: Region; investAt?: number; amount?: number; project?: string }> = ({
  region,
  investAt = 90,
  amount = 100,
  project = 'Torre Laureles',
}) => (
  <FullFrame3D region={region} worldHeight={5.6} distance={10}>
    <Scene investAt={investAt} amount={amount} project={project} />
  </FullFrame3D>
);
