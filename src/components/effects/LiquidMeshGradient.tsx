import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 v_uv;
void main() {
  v_uv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
varying vec2 v_uv;

#define NUM_OCTAVES 4

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec4(0.0, i1.y, 1.0, 1.0)) + i.x + vec4(0.0, i1.x, 1.0, 1.0 ));
  vec3 m = max(0.5 - vec4(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 x) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
  for (int i = 0; i < NUM_OCTAVES; ++i) {
    v += a * snoise(x);
    x = rot * x * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (v_uv - 0.5) * 2.0;
  uv.x *= u_resolution.x / u_resolution.y;

  vec2 mouse = u_mouse * 2.0 - 1.0;

  vec2 q = vec2(0.);
  q.x = fbm( uv + 0.00 * u_time );
  q.y = fbm( uv + vec2(1.0) );

  vec2 r = vec2(0.);
  r.x = fbm( uv + 1.0*q + vec2(1.7,9.2) + 0.15*u_time + mouse * 0.5 );
  r.y = fbm( uv + 1.0*q + vec2(8.3,2.8) + 0.126*u_time );

  float f = fbm(uv + r);

  vec3 color1 = vec3(76.0/255.0, 29.0/255.0, 149.0/255.0);
  vec3 color2 = vec3(124.0/255.0, 58.0/255.0, 237.0/255.0);
  vec3 color3 = vec3(219.0/255.0, 39.0/255.0, 119.0/255.0);
  vec3 color4 = vec3(0.0, 0.0, 0.0);
  vec3 color5 = vec3(0.05, 0.05, 0.05);

  float mixFactor1 = smoothstep(0.0, 0.8, f);
  float mixFactor2 = smoothstep(0.2, 1.0, length(q));
  float mixFactor3 = smoothstep(0.0, 0.5, r.x);

  vec3 col = mix(color1, color2, mixFactor1);
  col = mix(col, color3, mixFactor2 * 0.5);
  col = mix(col, color5, mixFactor3 * 0.3);

  col = mix(col, color4, f*f*f * 0.4);

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  col += grain * 0.05;

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function LiquidMeshGradient() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleMouseMove = (e: MouseEvent) => {
      (material.uniforms.u_mouse.value as THREE.Vector2).set(
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight
      );
    };

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      (material.uniforms.u_resolution.value as THREE.Vector2).set(
        window.innerWidth,
        window.innerHeight
      );
    };

    const animate = (time: number) => {
      animationIdRef.current = requestAnimationFrame(animate);
      material.uniforms.u_time.value = time * 0.001;
      renderer.render(scene, camera);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
