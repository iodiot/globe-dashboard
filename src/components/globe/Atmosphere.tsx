import { useEffect, useMemo } from 'react';
import { AdditiveBlending, BackSide, Color, NormalBlending, ShaderMaterial } from 'three';

/** Fresnel rim glow on a slightly larger back-faced sphere. */
export function Atmosphere({ color, light = false }: { color: string; light?: boolean }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: new Color() }, uLight: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uLight;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            // Back faces: 0 at the halo's outer edge, 1 where it meets the planet's silhouette.
            float rim = pow(clamp(-dot(vNormal, vView) / 0.46, 0.0, 1.0), 3.0);
            // Additive glow on dark backgrounds, alpha-blended halo on light ones. Alpha carries the
            // falloff so the transparent canvas never turns opaque around the halo.
            gl_FragColor = vec4(uColor, rim * mix(0.9, 0.85, uLight));
            #include <colorspace_fragment>
          }`,
        side: BackSide,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => {
    const m = material;
    m.uniforms.uColor.value.set(color);
    m.uniforms.uLight.value = light ? 1 : 0;
    m.blending = light ? NormalBlending : AdditiveBlending;
    m.needsUpdate = true;
  }, [material, color, light]);
  return (
    <mesh scale={1.12} raycast={() => null}>
      <sphereGeometry args={[1, 64, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
