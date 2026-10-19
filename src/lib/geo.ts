import { Vector3 } from 'three';

/**
 * Lat/lon (degrees) → point on a sphere, matching the UV layout of THREE.SphereGeometry
 * so equirectangular textures line up.
 */
export function latLonToVec3(lat: number, lon: number, r = 1, out = new Vector3()): Vector3 {
  const phi = ((lon + 180) * Math.PI) / 180;
  const theta = ((90 - lat) * Math.PI) / 180;
  return out.set(-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta));
}
