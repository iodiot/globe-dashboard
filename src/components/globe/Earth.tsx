import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Color, SRGBColorSpace } from 'three';
import { useStore } from '../../state/store';

const base = import.meta.env.BASE_URL;

export function Earth() {
  const [map, bump, water] = useTexture([
    `${base}textures/earth-blue-marble.jpg`,
    `${base}textures/earth-topology.png`,
    `${base}textures/earth-water.png`,
  ]);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  useEffect(() => {
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = Math.min(8, maxAniso);
    map.needsUpdate = true;
  }, [map, maxAniso]);
  const specular = useMemo(() => new Color('#1f3046'), []);

  return (
    <mesh
      name="earth"
      // Occlude markers on the far side and clear hover when over bare globe.
      onPointerMove={(e) => {
        e.stopPropagation();
        if (useStore.getState().hover) useStore.getState().setHover(null);
      }}
    >
      <sphereGeometry args={[1, 128, 96]} />
      <meshPhongMaterial map={map} bumpMap={bump} bumpScale={4} specularMap={water} specular={specular} shininess={35} />
    </mesh>
  );
}
