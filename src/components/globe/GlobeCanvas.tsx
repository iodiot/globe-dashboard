import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { useStore } from '../../state/store';
import { latLonToVec3 } from '../../lib/geo';
import { Earth } from './Earth';
import { Atmosphere } from './Atmosphere';
import { Markers } from './Markers';
import { Pulses } from './Pulses';
import { SelectionRing } from './SelectionRing';
import { CameraRig } from './CameraRig';
import { SunLight } from './SunLight';

const START = latLonToVec3(22, 165, 3.0).toArray();

export default function GlobeCanvas() {
  const theme = useStore((s) => s.theme);
  return (
    <Canvas
      className="globe-canvas"
      camera={{ position: START, fov: 38, near: 0.01, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => useStore.getState().setHover(null)}
      aria-label="Interactive 3D globe of earthquakes. Use the event list to navigate with the keyboard."
      role="img"
    >
      <ambientLight intensity={theme === 'dark' ? 1.5 : 1.7} />
      <SunLight />
      {theme === 'dark' && <Stars radius={60} depth={40} count={4000} factor={2.4} saturation={0} fade speed={0.4} />}
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <Atmosphere color={theme === 'dark' ? '#4da3ff' : '#5aa8f0'} light={theme === 'light'} />
      <Markers />
      <Pulses />
      <SelectionRing />
      <CameraRig />
    </Canvas>
  );
}
