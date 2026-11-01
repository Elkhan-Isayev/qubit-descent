// Small helpers shared by the level models.

import * as THREE from 'three';

// Materials of an object and its descendants, skipping subtrees marked userData.noFade.
export function collectMaterials(object, out = []) {
  if (object.userData.noFade) return out;
  if (object.material) for (const m of [object.material].flat()) if (!out.includes(m)) out.push(m);
  for (const child of object.children) collectMaterials(child, out);
  return out;
}

// Deep copy that shares geometry but owns its materials, so it can fade independently of the original.
// A nested copy (e.g. the chip inside the sample holder) sits exactly where the next level's model will
// be drawn; polygon offset pushes it back so the two never z-fight while they cross-fade.
export function nestedCopy(object) {
  const copy = object.clone(true);
  const map = new Map();
  const own = (m) => {
    if (!map.has(m)) {
      const c = m.clone();
      c.polygonOffset = true;
      c.polygonOffsetFactor = 2;
      c.polygonOffsetUnits = 2;
      map.set(m, c);
    }
    return map.get(m);
  };
  copy.traverse((o) => {
    if (o.material) o.material = Array.isArray(o.material) ? o.material.map(own) : own(o.material);
  });
  return copy;
}

export const metal = (color, roughness = 0.3, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness, ...extra });

export const glow = (color, intensity = 2, extra = {}) =>
  new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, ...extra });

// A straight cylinder (or box, with `box`) between two points.
export function strut(a, b, radius, material, radialSegments = 10) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), radialSegments), material);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

// Deterministic pseudo-random numbers (mulberry32), so geometry is identical on every load and in tests.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
