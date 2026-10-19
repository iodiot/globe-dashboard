import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { DirectionalLight } from 'three';
import { Vector3 } from 'three';

const offset = new Vector3();

/** Key light that follows the camera (slightly up-left), so the visible hemisphere is always lit. */
export function SunLight() {
  const ref = useRef<DirectionalLight>(null);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    offset.set(-1.6, 1.2, 0).applyQuaternion(camera.quaternion);
    ref.current.position.copy(camera.position).add(offset);
  });
  return <directionalLight ref={ref} intensity={2.8} />;
}
