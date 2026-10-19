import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedBufferAttribute, InstancedMesh, Matrix4, Quaternion, ShaderMaterial, Vector3 } from 'three';
import { useStore } from '../../state/store';
import { selectRecent } from '../../state/selectors';
import { magColor, magRadius } from '../../data/filters';
import { latLonToVec3 } from '../../lib/geo';

const MAX = 512;
const Z = new Vector3(0, 0, 1);
const m = new Matrix4();
const p = new Vector3();
const n = new Vector3();
const s = new Vector3();
const q = new Quaternion();
const c = new Color();

/** Expanding rings for recent events. Animation runs entirely in the vertex shader (no per-frame CPU work). */
export function Pulses() {
  const recent = useStore(selectRecent);
  const reduced = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);
  const ref = useRef<InstancedMesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          attribute float aPhase;
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            float t = fract(uTime * 0.5 + aPhase);
            vAlpha = (1.0 - t) * (1.0 - t);
            #ifdef USE_INSTANCING_COLOR
              vColor = instanceColor;
            #else
              vColor = vec3(1.0);
            #endif
            vec3 pos = position * (0.5 + t * 2.6);
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, vAlpha * 0.95);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  // Random per-ring phase so pulses don't beat in sync.
  const [phase] = useState(() => new InstancedBufferAttribute(new Float32Array(MAX).map(() => Math.random()), 1));

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const list = recent.slice(0, MAX);
    list.forEach((e, i) => {
      latLonToVec3(e.lat, e.lon, 1.004, p);
      n.copy(p).normalize();
      q.setFromUnitVectors(Z, n);
      s.setScalar(magRadius(e.mag) * 2.2);
      mesh.setMatrixAt(i, m.compose(p, q, s));
      mesh.setColorAt(i, c.set(magColor(e.mag)));
    });
    mesh.count = list.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [recent]);

  useFrame(({ clock }) => {
    if (!reduced && ref.current) (ref.current.material as ShaderMaterial).uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX]} frustumCulled={false} raycast={() => null}>
      <ringGeometry args={[0.78, 1, 40]}>
        <instancedBufferAttribute attach="attributes-aPhase" args={[phase.array, 1]} />
      </ringGeometry>
      <primitive object={material} attach="material" />
    </instancedMesh>
  );
}
