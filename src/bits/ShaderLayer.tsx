import React, { useLayoutEffect, useRef } from 'react';
import { useVideoConfig } from 'remotion';

// Capa WebGL de pantalla completa que dibuja UN cuadro por cada frame de Remotion.
// Los fondos de React Bits usan requestAnimationFrame; aquí el tiempo (uTime)
// viene del número de cuadro, así el render sale idéntico y sin saltos.

export type Uniform = number | [number, number] | [number, number, number] | number[];

const VERT = `attribute vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;

type GLState = {
  gl: WebGLRenderingContext;
  prog: WebGLProgram;
  locs: Map<string, WebGLUniformLocation | null>;
};

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error('Shader: ' + gl.getShaderInfoLog(s));
  }
  return s;
};

export const ShaderLayer: React.FC<{
  frag: string;
  uniforms: Record<string, Uniform>;
  style?: React.CSSProperties;
  scale?: number; // resolución interna (0.5 = la mitad, más rápido)
}> = ({ frag, uniforms, style, scale = 0.6 }) => {
  const { width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<GLState | null>(null);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  useLayoutEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true })!;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    st.current = { gl, prog, locs: new Map() };
    return () => {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      st.current = null;
    };
  }, [frag]);

  useLayoutEffect(() => {
    const s = st.current;
    if (!s) return;
    const { gl, prog, locs } = s;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const all: Record<string, Uniform> = { uResolution: [w, h], ...uniforms };
    for (const [name, v] of Object.entries(all)) {
      if (!locs.has(name)) locs.set(name, gl.getUniformLocation(prog, name));
      const l = locs.get(name);
      if (!l) continue;
      if (typeof v === 'number') gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2fv(l, v);
      else if (v.length === 3) gl.uniform3fv(l, v);
      else gl.uniform3fv(l, new Float32Array(v)); // arrays de vec3
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }}
    />
  );
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const c = hex.replace('#', '');
  return [parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255];
};
