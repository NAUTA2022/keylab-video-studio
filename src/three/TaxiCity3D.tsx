import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { FullFrame3D, makeCamera, projectToScreen, type Region } from './FullFrame3D';
import { useGltfs } from './loaders';
import { Leech3D } from './Leech3D';

/*
 * Ciudad con modelos de la comunidad (Kenney, CC0): taxi, calle con faroles,
 * rascacielos y edificios bajos. Iluminación HDRI de atardecer + sol con sombras.
 *
 * La cámara va de un primer plano del techo del taxi (`wideAt`) a un plano
 * general, y en `driveAt` el taxi arranca (la ciudad pasa, las ruedas giran).
 * `taxiRoofOnScreen` da la posición en pantalla del techo, para montar encima
 * un personaje 2D (SVG) que se mueve con el carro.
 */

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const TAXI_WORLD_HEIGHT = 4.4;
export const TAXI_DISTANCE = 12;
const CAR_SCALE = 1.3;
const SCENE_ROT = new THREE.Euler(0.12, -0.38, 0);
// techo del taxi en coordenadas del modelo (detrás del letrero)
const ROOF = new THREE.Vector3(0, 1.08, -0.42);

export type TaxiTiming = { wideAt: number; driveAt: number };
export type LeechTiming = { turnAt: number; talk: [number, number][]; stickAt: number };

export const taxiRig = (frame: number, fps: number, { wideAt, driveAt }: TaxiTiming) => {
  const w = interpolate(frame - wideAt, [0, 20], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const s = THREE.MathUtils.lerp(2.25, 1.05, w);
  const focus = new THREE.Vector3(THREE.MathUtils.lerp(-0.45, 0.25, w), THREE.MathUtils.lerp(2.15, 1.85, w), 0);
  const dt = Math.max(0, (frame - driveAt) / fps);
  const dist = dt * dt * 2.4;
  const speed = Math.min(1, dt * 1.4);
  const bounce = speed > 0 ? Math.abs(Math.sin((frame / fps) * 19)) * 0.03 * speed : 0;
  return { s, focus, dist, speed, bounce };
};

const carMatrix = (rig: ReturnType<typeof taxiRig>) => {
  const m = new THREE.Matrix4().makeRotationFromEuler(SCENE_ROT);
  m.multiply(new THREE.Matrix4().makeTranslation(-rig.focus.x * rig.s, -rig.focus.y * rig.s, -rig.focus.z * rig.s));
  m.multiply(new THREE.Matrix4().makeScale(rig.s, rig.s, rig.s));
  m.multiply(new THREE.Matrix4().makeTranslation(0, rig.bounce, 0));
  m.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
  m.multiply(new THREE.Matrix4().makeScale(CAR_SCALE, CAR_SCALE, CAR_SCALE));
  return m;
};

/** Punto del techo en pantalla y cuántos píxeles mide 1 unidad del mundo ahí. */
export const taxiRoofOnScreen = (frame: number, fps: number, W: number, H: number, region: Region, timing: TaxiTiming) => {
  const rig = taxiRig(frame, fps, timing);
  const cam = makeCamera(W, H, region, TAXI_WORLD_HEIGHT, TAXI_DISTANCE);
  const m = carMatrix(rig);
  const p = ROOF.clone().applyMatrix4(m);
  const up = ROOF.clone().add(new THREE.Vector3(0, 1 / CAR_SCALE, 0)).applyMatrix4(m);
  const a = projectToScreen(cam, p, W, H);
  const b = projectToScreen(cam, up, W, H);
  return { x: a.x, y: a.y, ppu: Math.hypot(b.x - a.x, b.y - a.y) };
};

const MODELS = [
  '3d/kenney-car/taxi.glb',
  '3d/kenney-city/road-straight-lightposts.glb',
  '3d/kenney-city/road-straight.glb',
  '3d/kenney-commercial/building-skyscraper-a.glb',
  '3d/kenney-commercial/building-skyscraper-b.glb',
  '3d/kenney-commercial/building-skyscraper-e.glb',
  '3d/kenney-commercial/low-detail-building-a.glb',
  '3d/kenney-commercial/low-detail-building-b.glb',
  '3d/kenney-commercial/low-detail-building-c.glb',
  '3d/kenney-commercial/low-detail-building-g.glb',
  '3d/kenney-commercial/low-detail-building-h.glb',
  '3d/kenney-commercial/low-detail-building-wide-a.glb',
  '3d/kenney-city/grass-trees.glb',
];

const SPAN = 44; // largo del tramo de ciudad que se repite

const CityScene: React.FC<TaxiTiming & { loaded: (THREE.Group | null)[]; onReady: () => void; leech?: LeechTiming }> = ({ loaded, onReady, leech, ...timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rigRef = useRef<THREE.Group>(null);
  const carRef = useRef<THREE.Group>(null);
  const scroll = useRef<(THREE.Object3D | null)[]>([]);
  const { advance } = useThree();
  const mounted = useRef(false);

  // arma la ciudad con copias de los modelos
  const city = useMemo(() => {
    if (loaded.some((x) => !x)) return null;
    const [taxi, roadL, road, ...rest] = loaded as THREE.Group[];
    const ground = (o: THREE.Object3D) => {
      const b = new THREE.Box3().setFromObject(o);
      return -b.min.y;
    };
    const items: { obj: THREE.Object3D; x: number }[] = [];
    const tile = 4; // cada tramo de calle mide 1 unidad × escala 4
    for (let i = 0; i < SPAN / tile; i++) {
      const r = (i % 2 === 0 ? roadL : road).clone();
      r.scale.setScalar(4); // cada tramo mide 1 unidad: escala = separación, sin huecos
      r.position.set(-SPAN / 2 + i * tile + tile / 2, 0, 0);
      r.rotation.y = Math.PI / 2;
      r.position.y = ground(r) * 0 - 0.01;
      items.push({ obj: r, x: r.position.x });
    }
    const tall = rest.slice(0, 3);
    const low = rest.slice(3, 9);
    const trees = rest[9];
    // fila de atrás: rascacielos; fila media: edificios bajos; árboles en la vereda
    for (let i = 0; i < 11; i++) {
      const src = tall[i % 3];
      const o = src.clone();
      const sc = 2.1 + random(`ts${i}`) * 0.5;
      o.scale.setScalar(sc);
      o.rotation.y = Math.floor(random(`tr${i}`) * 4) * (Math.PI / 2);
      const x = -SPAN / 2 + i * 4 + random(`tx${i}`) * 1.2;
      o.position.set(x, 0, -9.5 - random(`tz${i}`) * 2);
      o.position.y = ground(o);
      items.push({ obj: o, x });
    }
    for (let i = 0; i < 15; i++) {
      const o = low[i % low.length].clone();
      o.scale.setScalar(1.7 + random(`ls${i}`) * 0.4);
      o.rotation.y = Math.floor(random(`lr${i}`) * 4) * (Math.PI / 2);
      const x = -SPAN / 2 + i * 2.95 + random(`lx${i}`) * 0.4;
      o.position.set(x, 0, -5.6);
      o.position.y = ground(o);
      items.push({ obj: o, x });
    }
    for (let i = 0; i < 11; i++) {
      const o = trees.clone();
      o.scale.setScalar(1.6);
      const x = -SPAN / 2 + i * 4 + 1.5;
      o.position.set(x, 0, -3.4);
      o.position.y = ground(o) - 0.05;
      items.push({ obj: o, x });
    }
    const car = taxi.clone();
    return { items, car };
  }, [loaded]);

  useLayoutEffect(() => {
    if (!city) return;
    const rig = taxiRig(frame, fps, timing);
    if (rigRef.current) {
      rigRef.current.scale.setScalar(rig.s);
      rigRef.current.position.set(-rig.focus.x * rig.s, -rig.focus.y * rig.s, -rig.focus.z * rig.s);
    }
    if (carRef.current) carRef.current.position.y = rig.bounce;
    city.items.forEach((it, i) => {
      const o = scroll.current[i];
      if (!o) return;
      let x = it.x - rig.dist;
      x = ((((x + SPAN / 2) % SPAN) + SPAN) % SPAN) - SPAN / 2;
      o.position.x = x;
    });
    city.car.traverse((o) => {
      if (o.name.startsWith('wheel')) o.rotation.x = rig.dist * 3.2;
    });
    if (!mounted.current) {
      // los modelos llegaron después del cuadro ya dibujado: redibuja una vez y libera el render
      mounted.current = true;
      advance(performance.now());
      onReady();
    }
  }, [frame, fps, timing, city, onReady, advance]);

  if (!city) return null;
  return (
    <>
      <hemisphereLight args={['#C9D3FF', '#1B1F3A', 0.6]} />
      <directionalLight
        position={[-6, 9, 7]}
        intensity={2.6}
        color={'#FFE2C4'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[6, 4, -6]} intensity={1.6} color={'#6B84FF'} />
      <group rotation={SCENE_ROT}>
        <group ref={rigRef}>
          {city.items.map((it, i) => (
            <group key={i} ref={(g) => void (scroll.current[i] = g)} position={[it.x, 0, 0]}>
              <primitive object={it.obj} position={[0, it.obj.position.y, it.obj.position.z]} />
            </group>
          ))}
          {/* piso general (vereda y asfalto bajo las calles) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -2]} receiveShadow>
            <planeGeometry args={[90, 34]} />
            <meshStandardMaterial color={'#454B63'} roughness={0.92} />
          </mesh>
          <group ref={carRef}>
            <group rotation={[0, Math.PI / 2, 0]} scale={CAR_SCALE}>
              <primitive object={city.car} />
            </group>
            {leech ? (
              // sobre el techo (ROOF en coordenadas del modelo, girado y escalado como el taxi)
              <group position={[ROOF.z * CAR_SCALE + 0.12, ROOF.y * CAR_SCALE + 0.24, -ROOF.x * CAR_SCALE]}>
                <Leech3D {...leech} face={-SCENE_ROT.y} />
              </group>
            ) : null}
          </group>
        </group>
      </group>
    </>
  );
};

export const TaxiCity3D: React.FC<{ region: Region; leech?: LeechTiming } & TaxiTiming> = ({ region, leech, ...timing }) => {
  const { scenes: loaded, ready } = useGltfs(MODELS); // se carga fuera del lienzo: Remotion espera a los modelos
  return (
    <FullFrame3D region={region} worldHeight={TAXI_WORLD_HEIGHT} distance={TAXI_DISTANCE} hdri="sunset" envIntensity={0.9} exposure={1.1}>
      <CityScene {...timing} loaded={loaded} onReady={ready} leech={leech} />
    </FullFrame3D>
  );
};
