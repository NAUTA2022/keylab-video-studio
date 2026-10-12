import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

/*
 * "La sanguijuela argentina" — personaje 3D original, estilo caricatura.
 * Cuerpo torneado gordito con contorno negro (casco invertido), camiseta a
 * rayas celeste y blanca con el 10 (sin escudos ni marcas), ojos grandes con
 * párpados, cejas y boca que se abre al hablar. Se ilumina con el HDRI de la
 * escena, igual que los modelos de Kenney.
 *
 * Tiempos en cuadros (relativos a la escena):
 *  turnAt   deja de mirar la calle y gira a cámara con rebote
 *  talk     ventanas [inicio, fin] en que habla
 *  stickAt  "se pegó": aplastón de ventosa con rebote
 * `face` es el giro en Y que deja la cara mirando a cámara.
 */

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const SKIN = '#7FA33F';
const SKIN_DARK = '#5E7E2A';
const INK = '#141A0C';
const CELESTE = '#6CB4EE';

// perfil (radio, altura) del cuerpo, cabeza redonda arriba
const PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.46, 0.02],
  [0.53, 0.22],
  [0.52, 0.55],
  [0.48, 0.9],
  [0.44, 1.15],
  [0.38, 1.36],
  [0.27, 1.55],
  [0.12, 1.67],
  [0.0, 1.7],
];
const curve = new THREE.SplineCurve(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)));
const PTS = curve.getPoints(80);
const profile = (scale = 1, from = 0, to = 2) => PTS.filter((p) => p.y >= from && p.y <= to).map((p) => new THREE.Vector2(Math.max(0.0001, p.x * scale), p.y));
const radiusAt = (y: number) => PTS.reduce((b, p) => (Math.abs(p.y - y) < Math.abs(b.y - y) ? p : b), PTS[0]).x;

const useJersey = () =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 1024;
    cv.height = 256;
    const g = cv.getContext('2d')!;
    const n = 14;
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 === 0 ? CELESTE : '#FFFFFF';
      g.fillRect((i * cv.width) / n, 0, cv.width / n + 1, cv.height);
    }
    g.font = '400 168px Anton, Impact, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 16;
    g.lineJoin = 'round';
    g.strokeStyle = '#FFFFFF';
    g.strokeText('10', cv.width / 2, cv.height / 2 + 6);
    g.fillStyle = INK;
    g.fillText('10', cv.width / 2, cv.height / 2 + 6);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

/* contorno de caricatura: la misma geometría, un poco más grande, por dentro y en negro */
const Outline: React.FC<{ geometry: THREE.BufferGeometry; s?: number }> = ({ geometry, s = 1.045 }) => (
  <mesh geometry={geometry} scale={s}>
    <meshBasicMaterial color={INK} side={THREE.BackSide} />
  </mesh>
);

export const Leech3D: React.FC<{ turnAt: number; talk: [number, number][]; stickAt: number; face: number; height?: number }> = ({
  turnAt,
  talk,
  stickAt,
  face,
  height = 1.75,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const jersey = useJersey();
  const root = useRef<THREE.Group>(null);
  const squash = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const mouthOpen = useRef<THREE.Group>(null);
  const mouthClosed = useRef<THREE.Mesh>(null);
  const lids = useRef<(THREE.Mesh | null)[]>([]);
  const pupils = useRef<(THREE.Group | null)[]>([]);
  const brows = useRef<(THREE.Mesh | null)[]>([]);
  const tail = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const body = new THREE.LatheGeometry(profile(), 64, Math.PI, Math.PI * 2);
    const shirt = new THREE.LatheGeometry(profile(1.07, 0.1, 0.95), 64, Math.PI, Math.PI * 2);
    const sphere = new THREE.SphereGeometry(1, 40, 28);
    const lid = new THREE.SphereGeometry(1.08, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const brow = new THREE.CapsuleGeometry(0.035, 0.17, 6, 12);
    const smile = new THREE.TorusGeometry(0.11, 0.024, 10, 32, Math.PI * 0.8);
    const sleeve = new THREE.CylinderGeometry(0.13, 0.17, 0.24, 28);
    return { body, shirt, sphere, lid, brow, smile, sleeve };
  }, []);

  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.32, metalness: 0.05 }), []);
  const skinDarkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN_DARK, roughness: 0.38 }), []);

  useLayoutEffect(() => {
    const t = frame / fps;
    const turn = interpolate(frame - turnAt, [0, 9], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
    if (torso.current) {
      torso.current.rotation.y = THREE.MathUtils.lerp(face + 1.25, face, turn);
      torso.current.rotation.z = Math.sin(t * 2.3) * 0.035 + (1 - turn) * 0.06;
    }
    const st = (frame - stickAt) / fps;
    const sq = st >= 0 ? 1 - 0.3 * Math.exp(-st * 5) * Math.cos(st * 17) : 1 + Math.sin(t * 3) * 0.015;
    if (squash.current) squash.current.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    if (tail.current) tail.current.scale.set(1, st >= 0 ? 0.85 + 0.15 * sq : 1, 1);

    // párpados: entrecerrados con actitud; parpadeo después de pegarse
    const lid = interpolate(frame - turnAt, [3, 11], [0.1, 0.55], clamp);
    const blink = Math.abs(frame - (stickAt + 20)) < 2 ? 1 : 0;
    lids.current.forEach((l, i) => {
      if (!l) return;
      const k = Math.max(blink, lid * (i === 0 ? 1 : 0.85));
      l.rotation.x = THREE.MathUtils.lerp(-1.45, -0.05, k);
    });
    const look = 1 - turn;
    pupils.current.forEach((p) => p && (p.position.x = look * 0.07));

    let open = 0;
    let talking = false;
    for (const [a, b] of talk) {
      if (frame >= a && frame <= b) {
        talking = true;
        open = 0.2 + 0.8 * Math.abs(Math.sin(((frame - a) / fps) * 14 + random(`lm${Math.floor(frame / 3)}`) * 0.9));
      }
    }
    if (mouthOpen.current) {
      mouthOpen.current.visible = open > 0.08;
      mouthOpen.current.scale.set(1, 0.25 + open * 0.75, 1);
    }
    if (mouthClosed.current) mouthClosed.current.visible = open <= 0.08;
    brows.current.forEach((b, i) => {
      if (!b) return;
      const lift = talking ? Math.sin(t * (i ? 9 : 11)) * 0.02 : 0;
      b.position.y = 1.47 + (i === 1 ? 0.03 : 0) + lift;
      b.rotation.z = Math.PI / 2 + (i === 0 ? -0.32 : 0.22);
    });
  }, [frame, fps, turnAt, talk, stickAt, face]);

  const sc = height / 1.7;
  return (
    <group ref={root} scale={sc}>
      {/* sombra de contacto sobre el techo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.25, 0.012, 0]} scale={[1.6, 0.9, 1]}>
        <circleGeometry args={[0.6, 40]} />
        <meshBasicMaterial color={'#000000'} transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {/* cola pegada al techo, con ventosa */}
      <group ref={tail}>
        {[
          [-0.48, 0.15, 0.3],
          [-0.82, 0.11, 0.24],
          [-1.1, 0.08, 0.19],
        ].map(([x, y, r], i) => (
          <group key={i} position={[x, y, 0]} scale={[r * 1.25, r * 0.75, r]}>
            <mesh geometry={geo.sphere} material={i % 2 ? skinDarkMat : skinMat} />
            <Outline geometry={geo.sphere} s={1.07} />
          </group>
        ))}
        <mesh position={[-1.32, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={skinDarkMat}>
          <torusGeometry args={[0.1, 0.04, 12, 28]} />
        </mesh>
      </group>

      <group ref={squash}>
        <group ref={torso}>
          {/* cuerpo */}
          <mesh geometry={geo.body} material={skinMat} />
          <Outline geometry={geo.body} s={1.035} />
          {/* brillo de la cabeza */}
          <mesh geometry={geo.sphere} position={[-0.17, 1.42, 0.22]} scale={[0.05, 0.1, 0.03]} rotation={[0, 0, 0.5]}>
            <meshBasicMaterial color={'#E9F7C4'} transparent opacity={0.7} />
          </mesh>

          {/* camiseta del 10 con mangas cortas */}
          <mesh geometry={geo.shirt}>
            <meshStandardMaterial map={jersey} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <Outline geometry={geo.shirt} s={1.03} />
          <mesh position={[0, 0.94, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radiusAt(0.94) * 1.07, 0.035, 12, 48]} />
            <meshStandardMaterial color={CELESTE} roughness={0.7} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.52, 0.8, 0]} rotation={[0, 0, side * 0.9]}>
              <mesh geometry={geo.sleeve}>
                <meshStandardMaterial color={CELESTE} roughness={0.75} />
              </mesh>
              <mesh geometry={geo.sleeve} scale={1.08}>
                <meshBasicMaterial color={INK} side={THREE.BackSide} />
              </mesh>
            </group>
          ))}

          {/* ojos */}
          {[-0.15, 0.15].map((x, i) => (
            <group key={i} position={[x, 1.3, 0.3]} rotation={[0, x * 0.9, 0]}>
              <group scale={[0.135, 0.16, 0.12]}>
                <mesh geometry={geo.sphere}>
                  <meshStandardMaterial color={'#FFFFFF'} roughness={0.15} />
                </mesh>
                <Outline geometry={geo.sphere} s={1.09} />
                <mesh ref={(m) => void (lids.current[i] = m)} geometry={geo.lid} material={skinMat} />
              </group>
              <group ref={(g) => void (pupils.current[i] = g)}>
                <mesh geometry={geo.sphere} position={[0, -0.01, 0.105]} scale={[0.058, 0.066, 0.03]}>
                  <meshStandardMaterial color={INK} roughness={0.2} />
                </mesh>
                <mesh geometry={geo.sphere} position={[-0.02, 0.018, 0.13]} scale={0.016}>
                  <meshBasicMaterial color={'#FFFFFF'} />
                </mesh>
              </group>
            </group>
          ))}
          {/* cejas */}
          {[-0.16, 0.16].map((x, i) => (
            <mesh key={i} ref={(m) => void (brows.current[i] = m)} geometry={geo.brow} position={[x, 1.47, 0.36]}>
              <meshStandardMaterial color={INK} roughness={0.5} />
            </mesh>
          ))}
          {/* boca: sonrisa canchera cerrada / abierta al hablar */}
          <mesh ref={mouthClosed} geometry={geo.smile} position={[0.03, 1.12, 0.415]} rotation={[0.1, 0, Math.PI * 1.12]}>
            <meshStandardMaterial color={INK} roughness={0.5} />
          </mesh>
          <group ref={mouthOpen} position={[0.02, 1.08, 0.4]}>
            <mesh geometry={geo.sphere} scale={[0.15, 0.1, 0.06]}>
              <meshStandardMaterial color={'#3B0B14'} roughness={0.6} />
            </mesh>
            <mesh geometry={geo.sphere} scale={[0.16, 0.11, 0.055]} position={[0, 0, -0.005]}>
              <meshBasicMaterial color={INK} side={THREE.BackSide} />
            </mesh>
            <mesh geometry={geo.sphere} position={[0.01, -0.05, 0.03]} scale={[0.08, 0.035, 0.035]}>
              <meshStandardMaterial color={'#E35D73'} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
