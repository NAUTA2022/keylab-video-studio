import type React from 'react';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import { useBake } from './bake';

/** true cuando la escena usa 3D horneado: no hace falta cargar modelos */
const useSkip3D = () => {
  const b = useBake();
  return !!b.dir && !b.baking;
};
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

/*
 * Carga de modelos 3D de la comunidad (glTF/GLB) e iluminación HDRI.
 * Todo pasa por delayRender: Remotion no toma el cuadro hasta que el
 * modelo y su textura estén listos, así nunca sale un cuadro vacío.
 *
 * Modelos en public/3d/ (ver public/3d/LICENCIAS.md).
 */

const gltfCache = new Map<string, Promise<THREE.Group>>();

const loadGltf = (path: string) => {
  if (!gltfCache.has(path)) {
    gltfCache.set(
      path,
      new Promise<THREE.Group>((resolve, reject) => {
        new GLTFLoader().load(staticFile(path), (g) => {
          g.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
              m.castShadow = true;
              m.receiveShadow = true;
              const mats = Array.isArray(m.material) ? m.material : [m.material];
              mats.forEach((mat) => {
                const sm = mat as THREE.MeshStandardMaterial;
                if (sm.map) {
                  sm.map.colorSpace = THREE.SRGBColorSpace;
                  sm.map.anisotropy = 8;
                }
              });
            }
          });
          resolve(g.scene);
        }, undefined, reject);
      }),
    );
  }
  return gltfCache.get(path)!;
};

/** Devuelve una copia del modelo (cada uso tiene su propio árbol de nodos). */
export const useGltf = (path: string): THREE.Group | null => {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const skip = useSkip3D();
  const [handle] = useState(() => (skip ? null : delayRender(`Modelo 3D ${path}`, { timeoutInMilliseconds: 60000 })));
  useEffect(() => {
    if (handle === null) return;
    loadGltf(path)
      .then((s) => {
        setScene(s.clone(true));
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [path, handle]);
  return scene;
};

/** Varios modelos a la vez, en el mismo orden.
 *  Remotion sigue esperando hasta que la escena 3D llame a `ready()` (ya montada
 *  dentro del lienzo): así el primer cuadro nunca sale sin los modelos. */
export const useGltfs = (paths: string[]): { scenes: (THREE.Group | null)[]; ready: () => void } => {
  const key = paths.join('|');
  const [scenes, setScenes] = useState<(THREE.Group | null)[]>(() => paths.map(() => null));
  const skip = useSkip3D();
  const [handle] = useState(() => (skip ? null : delayRender(`Modelos 3D ${key}`, { timeoutInMilliseconds: 60000 })));
  useEffect(() => {
    if (handle === null) return;
    Promise.all(paths.map(loadGltf))
      .then((all) => setScenes(all.map((s) => s.clone(true))))
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, handle]);
  const ready = useMemo(() => {
    let done = false;
    return () => {
      if (!done && handle !== null) {
        done = true;
        continueRender(handle);
      }
    };
  }, [handle]);
  return { scenes, ready };
};

/** Caja del modelo: tamaño y centro, para normalizar escalas. */
export const useBox = (obj: THREE.Object3D | null) =>
  useMemo(() => {
    if (!obj) return null;
    const box = new THREE.Box3().setFromObject(obj);
    return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
  }, [obj]);

/* ---------- Iluminación HDRI (public/3d/hdri/*.exr, CC0 de Poly Haven) ---------- */
export type Hdri = 'city' | 'sunset' | 'dawn' | 'studio' | 'night';
const envCache = new Map<string, Promise<THREE.DataTexture>>();

/** Carga el HDRI fuera del lienzo 3D (en el árbol normal de React), para que
 *  Remotion espere de verdad a que esté listo antes de tomar el cuadro. */
export const useHdriTexture = (hdri: Hdri | null): { tex: THREE.DataTexture | null; ready: () => void } => {
  const [tex, setTex] = useState<THREE.DataTexture | null>(null);
  const [handle] = useState(() => (hdri ? delayRender(`HDRI ${hdri}`, { timeoutInMilliseconds: 60000 }) : null));
  useEffect(() => {
    if (!hdri || handle === null) return;
    if (!envCache.has(hdri)) {
      envCache.set(hdri, new Promise((res, rej) => new EXRLoader().load(staticFile(`3d/hdri/${hdri}.exr`), res, undefined, rej)));
    }
    envCache
      .get(hdri)!
      .then((t) => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        setTex(t);
      })
      .catch((e) => cancelRender(e));
  }, [hdri, handle]);
  const ready = useMemo(() => {
    let done = false;
    return () => {
      if (!done && handle !== null) {
        done = true;
        continueRender(handle);
      }
    };
  }, [handle]);
  return { tex, ready };
};

/** Dentro del lienzo: aplica el HDRI como luz ambiente y reflejos. */
export const Environment: React.FC<{ texture: THREE.DataTexture; intensity?: number; onReady?: () => void }> = ({ texture, intensity = 1, onReady }) => {
  const { gl, scene, advance } = useThree();
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromEquirectangular(texture);
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;
    pm.dispose();
    advance(performance.now());
    onReady?.();
    return () => rt.dispose();
  }, [gl, scene, texture, intensity, onReady, advance]);
  return null;
};
