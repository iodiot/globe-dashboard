import { useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { useStore } from '../../state/store';
import { selectSelected } from '../../state/selectors';
import { latLonToVec3 } from '../../lib/geo';

interface Flight { fromDir: Vector3; rot: Quaternion; fromLen: number; toLen: number; t: number }

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const qa = new Quaternion();
const IDENT = new Quaternion();

/** Orbit controls + a "fly to" animation that slerps the camera around the globe to the selected event. */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const fitted = useRef(false);

  // Initial framing: fit the globe (plus atmosphere) to the canvas, whatever its aspect ratio.
  useEffect(() => {
    if (fitted.current || !size.width || !size.height || !('fov' in camera)) return;
    fitted.current = true;
    const vfov = ((camera as PerspectiveCamera).fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (size.width / size.height));
    const dist = 1.22 / Math.sin(Math.min(vfov, hfov) / 2);
    camera.position.setLength(Math.min(5.5, Math.max(2.2, dist)));
  }, [camera, size]);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const flight = useRef<Flight | null>(null);
  const sel = useStore(selectSelected);
  const nonce = useStore((s) => s.flyNonce);
  const reduced = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);

  useEffect(() => {
    if (!sel) return;
    const fromLen = camera.position.length();
    const fromDir = camera.position.clone().normalize();
    const toDir = latLonToVec3(sel.lat, sel.lon, 1).normalize();
    flight.current = {
      fromDir,
      rot: new Quaternion().setFromUnitVectors(fromDir, toDir),
      fromLen,
      toLen: Math.min(Math.max(fromLen * 0.8, 2.0), 3.0),
      t: reduced ? 0.999 : 0,
    };
    // Only re-fly when the selected id or fly request changes, not on every camera move.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.id, nonce]);

  useFrame((_, dt) => {
    const f = flight.current;
    if (!f) return;
    f.t = Math.min(1, f.t + dt / 1.5);
    const k = ease(f.t);
    qa.slerpQuaternions(IDENT, f.rot, k);
    const len = f.fromLen + (f.toLen - f.fromLen) * k;
    camera.position.copy(f.fromDir).applyQuaternion(qa).multiplyScalar(len);
    camera.lookAt(0, 0, 0);
    controls.current?.update();
    if (f.t >= 1) flight.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      zoomSpeed={0.7}
      minDistance={1.35}
      maxDistance={6}
      autoRotate={!sel && !reduced}
      autoRotateSpeed={0.3}
      onStart={() => (flight.current = null)}
    />
  );
}
