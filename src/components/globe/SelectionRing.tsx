import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Quaternion, Vector3 } from 'three';
import { useStore } from '../../state/store';
import { selectSelected } from '../../state/selectors';
import { magRadius } from '../../data/filters';
import { latLonToVec3 } from '../../lib/geo';

const Z = new Vector3(0, 0, 1);
const p = new Vector3();
const q = new Quaternion();

export function SelectionRing() {
  const sel = useStore(selectSelected);
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh || !sel) return;
    latLonToVec3(sel.lat, sel.lon, 1.005, p);
    mesh.position.copy(p);
    mesh.quaternion.copy(q.setFromUnitVectors(Z, p.clone().normalize()));
    const r = magRadius(sel.mag) * (2.3 + Math.sin(clock.elapsedTime * 3) * 0.2);
    mesh.scale.setScalar(r);
  });
  if (!sel) return null;
  return (
    <mesh ref={ref} raycast={() => null} renderOrder={2}>
      <ringGeometry args={[0.82, 1, 48]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
