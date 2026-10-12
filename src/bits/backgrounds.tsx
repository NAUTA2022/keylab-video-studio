import React from 'react';
import { random, useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { ShaderLayer, hexToRgb } from './ShaderLayer';

// Fondos adaptados de React Bits (reactbits.dev, MIT + Commons Clause, © David Haz).
// Uso interno para producir videos; no redistribuir estos componentes sueltos.

/* ---------------- Aurora ---------------- */
const AURORA = `precision highp float;
uniform float uTime; uniform float uAmplitude; uniform vec3 uColorStops[3];
uniform vec2 uResolution; uniform float uBlend;
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0*fract(p*C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x+0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
  vec3 g; g.x = a0.x*x0.x + h.x*x0.y; g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0*dot(m, g);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 ramp = uv.x < 0.5 ? mix(uColorStops[0], uColorStops[1], uv.x*2.0) : mix(uColorStops[1], uColorStops[2], (uv.x-0.5)*2.0);
  float height = snoise(vec2(uv.x*2.0 + uTime*0.1, uTime*0.25)) * 0.5 * uAmplitude;
  height = exp(height); height = (uv.y*2.0 - height + 0.2);
  float intensity = 0.6*height; float mid = 0.20;
  float a = smoothstep(mid - uBlend*0.5, mid + uBlend*0.5, intensity);
  gl_FragColor = vec4(intensity*ramp*a, a);
}`;

export const Aurora: React.FC<{ colors?: [string, string, string]; amplitude?: number; blend?: number; speed?: number; opacity?: number; fromBottom?: boolean }> = ({
  colors = ['#011EFF', '#8CA0FF', '#2D52FF'],
  amplitude = 1,
  blend = 0.5,
  speed = 1,
  opacity = 1,
  fromBottom = false,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <ShaderLayer
      frag={AURORA}
      style={{ opacity, transform: fromBottom ? 'scaleY(-1)' : undefined }}
      uniforms={{ uTime: (f / fps) * speed, uAmplitude: amplitude, uBlend: blend, uColorStops: colors.flatMap(hexToRgb) }}
    />
  );
};

/* ---------------- Silk ---------------- */
const SILK = `precision highp float;
uniform float uTime; uniform vec3 uColor; uniform float uSpeed; uniform float uScale;
uniform float uRotation; uniform float uNoiseIntensity; uniform vec2 uResolution;
const float e = 2.71828182845904523536;
float noise(vec2 t){ vec2 r = e*sin(e*t); return fract(r.x*r.y*(1.0+t.x)); }
vec2 rot(vec2 uv, float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c)*uv; }
void main(){
  vec2 vUv = gl_FragCoord.xy / uResolution; vUv.x *= uResolution.x/uResolution.y;
  float rnd = noise(gl_FragCoord.xy);
  vec2 uv = rot(vUv*uScale, uRotation); vec2 tex = uv*uScale; float t = uSpeed*uTime;
  tex.y += 0.03*sin(8.0*tex.x - t);
  float pattern = 0.6 + 0.4*sin(5.0*(tex.x + tex.y + cos(3.0*tex.x + 5.0*tex.y) + 0.02*t) + sin(20.0*(tex.x + tex.y - 0.1*t)));
  vec3 col = uColor*pattern - vec3(rnd/15.0*uNoiseIntensity);
  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}`;

export const Silk: React.FC<{ color?: string; speed?: number; scale?: number; rotation?: number; noise?: number }> = ({
  color = '#2D52FF',
  speed = 5,
  scale = 1,
  rotation = 0,
  noise = 1.5,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <ShaderLayer
      frag={SILK}
      uniforms={{ uTime: f / fps, uColor: hexToRgb(color), uSpeed: speed, uScale: scale, uRotation: rotation, uNoiseIntensity: noise }}
    />
  );
};

/* ---------------- LightRays ---------------- */
const RAYS = `precision highp float;
uniform float uTime; uniform vec2 uResolution; uniform vec2 rayPos; uniform vec2 rayDir;
uniform vec3 raysColor; uniform float raysSpeed; uniform float lightSpread; uniform float rayLength;
uniform float fadeDistance; uniform float distortion;
float rayStrength(vec2 src, vec2 dir, vec2 coord, float sA, float sB, float speed){
  vec2 d = coord - src; vec2 n = normalize(d); float ca = dot(n, dir);
  float da = ca + distortion*sin(uTime*2.0 + length(d)*0.01)*0.2;
  float spread = pow(max(da,0.0), 1.0/max(lightSpread,0.001));
  float dist = length(d); float maxD = uResolution.x*rayLength;
  float lf = clamp((maxD - dist)/maxD, 0.0, 1.0);
  float ff = clamp((uResolution.x*fadeDistance - dist)/(uResolution.x*fadeDistance), 0.5, 1.0);
  float base = clamp((0.45 + 0.15*sin(da*sA + uTime*speed)) + (0.3 + 0.2*cos(-da*sB + uTime*speed)), 0.0, 1.0);
  return base*lf*ff*spread;
}
void main(){
  vec2 coord = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  float r = rayStrength(rayPos, rayDir, coord, 36.2214, 21.11349, 1.5*raysSpeed)*0.5
          + rayStrength(rayPos, rayDir, coord, 22.3991, 18.0234, 1.1*raysSpeed)*0.4;
  float b = 1.0 - coord.y/uResolution.y;
  vec3 c = vec3(r*(0.1+b*0.8), r*(0.3+b*0.6), r*(0.5+b*0.5))*raysColor;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
}`;

export const LightRays: React.FC<{ color?: string; speed?: number; spread?: number; length?: number; distortion?: number; opacity?: number }> = ({
  color = '#8CA0FF',
  speed = 1,
  spread = 0.8,
  length = 1.6,
  distortion = 0.05,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const k = 0.6; // misma escala interna que ShaderLayer
  return (
    <ShaderLayer
      frag={RAYS}
      style={{ opacity, mixBlendMode: 'screen' }}
      uniforms={{
        uTime: f / fps,
        rayPos: [0.5 * width * k, -0.2 * height * k],
        rayDir: [0, 1],
        raysColor: hexToRgb(color),
        raysSpeed: speed,
        lightSpread: spread,
        rayLength: length,
        fadeDistance: 1,
        distortion,
      }}
    />
  );
};

/* ---------------- Particles (2D, determinista) ---------------- */
export const Particles: React.FC<{ count?: number; color?: string; maxSize?: number; drift?: number; seed?: string }> = ({
  count = 90,
  color = '#FFFFFF',
  maxSize = 5,
  drift = 40,
  seed = 'kl',
}) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill>
      <svg width={width} height={height}>
        {Array.from({ length: count }).map((_, i) => {
          const x0 = random(`${seed}x${i}`) * width;
          const y0 = random(`${seed}y${i}`) * height;
          const sp = 0.3 + random(`${seed}s${i}`);
          const ph = random(`${seed}p${i}`) * Math.PI * 2;
          const y = (((y0 - t * drift * sp) % height) + height) % height;
          const x = x0 + Math.sin(t * sp + ph) * 18;
          const r = 1 + random(`${seed}r${i}`) * maxSize;
          const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 * sp + ph));
          return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={a} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- DotGrid / Squares (2D) ---------------- */
export const DotGrid: React.FC<{ gap?: number; color?: string; accent?: string; size?: number; clear?: [number, number, number, number] }> = ({
  gap = 54,
  color = '#DEDAD1',
  accent = '#2D52FF',
  size = 4,
  clear,
}) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  const cols = Math.ceil(width / gap) + 1;
  const rows = Math.ceil(height / gap) + 1;
  // onda que recorre la rejilla en diagonal (equivalente a la interacción de DotGrid)
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = c * gap;
      const y = r * gap;
      const d = (c + r) * 0.18 - t * 3;
      // dentro de la zona de contenido la onda casi no se ve (el texto manda)
      const inside = clear && x > clear[0] && x < clear[1] && y > clear[2] && y < clear[3];
      const k = (Math.max(0, Math.sin(d)) ** 12) * (inside ? 0.12 : 1);
      dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={size + k * 3} fill={k > 0.4 ? accent : color} opacity={0.5 + k * 0.5} />);
    }
  return (
    <AbsoluteFill>
      <svg width={width} height={height}>
        {dots}
      </svg>
    </AbsoluteFill>
  );
};
