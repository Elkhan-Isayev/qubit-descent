// Josephson junction (level 5), in nanometres: exactly what the Dolan process in dolan.js leaves on
// the substrate after lift-off: the first aluminium film from the ground side (−y), its oxide, the
// second film from the island side (+y), and the shadow copies along both leads. They overlap
// directly only under the former bridge: the junction.
//
// Origin: the top of the first film (the substrate surface is z = −BOTTOM_T), so the oxide spans
// z = 0 … OXIDE_T and the tunnel barrier the descent continues into is centred at BARRIER_CENTRE.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OVERLAP, OX, T1, T2, dolanJunction } from './dolan.js';
import { glow, metal } from './util.js';

export const OVERLAP_NM = OVERLAP;
export const BOTTOM_T = T1;
export const TOP_T = T2;
export const OXIDE_T = OX;
export const BARRIER_CENTRE = [0, 0, OXIDE_T / 2];

// One mesh for a list of boxes [x0, x1, y0, y1, z0, z1].
export function boxMesh(boxes, material) {
  const geoms = boxes.map(([x0, x1, y0, y1, z0, z1]) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return g;
  });
  const mesh = new THREE.Mesh(geoms.length ? mergeGeometries(geoms, false) : new THREE.BufferGeometry(), material);
  for (const g of geoms) g.dispose();
  return mesh;
}

export const leadEnd = (gapNm) => gapNm / 2 + 1500; // leads run under the film edges

export const junctionMaterials = () => ({
  first: metal(0x8f99a8, 0.3),
  second: metal(0x9ba5b3, 0.32),
  // the oxide is a transparent film a few atoms thick: only a faint tint over the first film
  oxide: new THREE.MeshStandardMaterial({ color: 0x9fb4d8, metalness: 0.6, roughness: 0.3, emissive: 0x1b46c9, emissiveIntensity: 0.15 }),
  junction: glow(0x7fd3ff, 4),
});

// The junction is buried under the second film, so it glows a little wider than the overlap and
// shows as two bright seams along its edges.
export const SEAM = 12;
export const seamBox = ([x0, x1, y0, y1, z0, z1]) => [x0 - SEAM, x1 + SEAM, y0, y1, z0, z1];

// The bridge across a gap of `gapNm` between the ground plane (−y) and the qubit island (+y).
export function buildJunction(gapNm = 20000) {
  const g = new THREE.Group();
  g.name = 'junction';
  const d = dolanJunction(leadEnd(gapNm));
  const mat = junctionMaterials();
  const films = new THREE.Group();
  films.position.z = -BOTTOM_T; // substrate surface
  films.add(boxMesh(d.first, mat.first), boxMesh(d.oxide, mat.oxide), boxMesh(d.second, mat.second), boxMesh([seamBox(d.junction)], mat.junction));
  g.add(films);
  return g;
}
