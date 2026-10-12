import React, { useLayoutEffect } from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { useBake } from './bake';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, useHdriTexture, type Hdri } from './loaders';

/**
 * REGLA 3D DE KEY LAB
 * El lienzo 3D SIEMPRE ocupa el cuadro completo (1080×1920 en 9:16).
 * Nunca se mete el 3D en una caja más chica: si una animación sale de la caja
 * (monedas que vuelan, un objeto que entra rotando) se recorta en el render.
 *
 * En su lugar se define `region`: el rectángulo en píxeles donde debe verse
 * el objeto. La cámara se desplaza (setViewOffset) para que el centro de la
 * escena caiga en el centro de esa región, y el fov se calcula para que
 * `worldHeight` unidades del mundo llenen la altura de la región.
 * Lo que se salga de la región sigue visible en el resto del cuadro.
 */
export type Region = { x: number; y: number; w: number; h: number };

const Framing: React.FC<{ region: Region; worldHeight: number; distance: number }> = ({ region, worldHeight, distance }) => {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const W = size.width;
    const H = size.height;
    const cx = region.x + region.w / 2;
    const cy = region.y + region.h / 2;
    // Vista virtual del doble de tamaño, centrada en la región
    // fov vertical sobre la altura virtual (2H) para que worldHeight llene region.h
    const fovRad = 2 * Math.atan((worldHeight / 2) * ((2 * H) / region.h) / distance);
    cam.fov = THREE.MathUtils.radToDeg(fovRad);
    cam.aspect = W / H;
    cam.position.set(0, 0, distance);
    cam.lookAt(0, 0, 0);
    cam.setViewOffset(2 * W, 2 * H, W - cx, H - cy, W, H);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, region.x, region.y, region.w, region.h, worldHeight, distance]);
  return null;
};

/* Misma cámara que Framing, fuera del lienzo: sirve para ubicar elementos 2D
   (HTML/SVG) exactamente encima de un punto del mundo 3D. */
export const makeCamera = (W: number, H: number, region: Region, worldHeight: number, distance: number) => {
  const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000);
  const cx = region.x + region.w / 2;
  const cy = region.y + region.h / 2;
  cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan((worldHeight / 2) * ((2 * H) / region.h) / distance));
  cam.position.set(0, 0, distance);
  cam.lookAt(0, 0, 0);
  cam.setViewOffset(2 * W, 2 * H, W - cx, H - cy, W, H);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  return cam;
};
export const projectToScreen = (cam: THREE.PerspectiveCamera, p: THREE.Vector3, W: number, H: number) => {
  const v = p.clone().project(cam);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
};

/*
 * Calidad de imagen: tone mapping ACES, color sRGB, sombras suaves e
 * iluminación por HDRI (reflejos y luz ambiente reales). Por defecto `city`.
 */
type FullFrame3DProps = {
  region: Region;
  worldHeight: number; // alto (en unidades 3D) que debe llenar la región
  distance?: number;
  hdri?: Hdri | null;
  envIntensity?: number;
  exposure?: number;
  children: React.ReactNode;
};

/** Muestra el cuadro horneado si existe; si no, calcula el 3D en vivo. */
export const FullFrame3D: React.FC<FullFrame3DProps> = (props) => {
  const bake = useBake();
  if (bake.dir && !bake.baking) {
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <Img src={staticFile(`${bake.dir}/${bake.absFrame}.png`)} style={{ width: '100%', height: '100%' }} />
      </AbsoluteFill>
    );
  }
  return <Live3D {...props} />;
};

const Live3D: React.FC<FullFrame3DProps> = ({ region, worldHeight, distance = 10, hdri = 'city', envIntensity = 1, exposure = 1.15, children }) => {
  const { width, height } = useVideoConfig();
  const env = useHdriTexture(hdri);
  return (
    <AbsoluteFill data-3d="" style={{ pointerEvents: 'none' }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ position: [0, 0, distance], fov: 40, near: 0.1, far: 400 }}
      >
        <Framing region={region} worldHeight={worldHeight} distance={distance} />
        {env.tex ? <Environment texture={env.tex} intensity={envIntensity} onReady={env.ready} /> : null}
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
