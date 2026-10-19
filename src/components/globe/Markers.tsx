import { useLayoutEffect, useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Color, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { useStore } from '../../state/store';
import { selectVisible } from '../../state/selectors';
import { magColor, magRadius } from '../../data/filters';
import { latLonToVec3 } from '../../lib/geo';

const m = new Matrix4();
const p = new Vector3();
const s = new Vector3();
const q = new Quaternion();
const c = new Color();

/** One draw call for every event: an InstancedMesh of low-poly spheres, sized and coloured by magnitude. */
export function Markers() {
  const visible = useStore(selectVisible);
  const capacity = useStore((st) => st.dataset?.quakes.length ?? 0);
  const selectedId = useStore((st) => st.selectedId);
  const hoverId = useStore((st) => st.hover?.id ?? null);
  const ref = useRef<InstancedMesh>(null);
  const visibleRef = useRef(visible);

  useLayoutEffect(() => {
    visibleRef.current = visible;
    const mesh = ref.current;
    if (!mesh) return;
    visible.forEach((e, i) => {
      latLonToVec3(e.lat, e.lon, 1.002, p);
      const k = e.id === selectedId ? 1.25 : e.id === hoverId ? 1.45 : 1;
      s.setScalar(magRadius(e.mag) * k);
      mesh.setMatrixAt(i, m.compose(p, q, s));
      mesh.setColorAt(i, c.set(e.id === selectedId ? '#ffffff' : magColor(e.mag)));
    });
    mesh.count = visible.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [visible, selectedId, hoverId, capacity]);

  const handlers = useMemo(
    () => ({
      onPointerMove(e: ThreeEvent<PointerEvent>) {
        e.stopPropagation();
        const ev = e.instanceId != null ? visibleRef.current[e.instanceId] : undefined;
        if (!ev) return;
        useStore.getState().setHover({ id: ev.id, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
        document.body.style.cursor = 'pointer';
      },
      onPointerOut() {
        useStore.getState().setHover(null);
        document.body.style.cursor = '';
      },
      onClick(e: ThreeEvent<MouseEvent>) {
        if (e.delta > 6) return; // was a drag
        e.stopPropagation();
        const ev = e.instanceId != null ? visibleRef.current[e.instanceId] : undefined;
        if (ev) useStore.getState().select(ev.id);
      },
    }),
    [],
  );

  if (capacity === 0) return null;
  return (
    <instancedMesh key={capacity} ref={ref} args={[undefined, undefined, capacity]} frustumCulled={false} {...handlers}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
