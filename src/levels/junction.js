// Josephson junction (level 5), in nanometres. Dolan-style geometry: the bottom aluminium electrode
// (first evaporation) comes in from −y, is oxidised, and the top electrode (second evaporation, from
// +y) climbs onto it. Their overlap is the junction. The substrate surface is z = −BOTTOM_T; the oxide
// sits on the bottom electrode between z = 0 and OXIDE_T.
//
// Overlap 200 × 200 nm = 0.04 µm², inside the 0.01–0.16 µm² range of Osman et al. (2021).
// Electrode and oxide thicknesses are illustrative and never shown as numbers.

import * as THREE from 'three';
import { glow, metal } from './util.js';

export const OVERLAP_NM = 200;
export const BOTTOM_T = 30;
export const TOP_T = 50;
export const OXIDE_T = 2;
// Centre of the tunnel barrier, the point the descent continues into.
export const BARRIER_CENTRE = [0, 0, OXIDE_T / 2];

const W = OVERLAP_NM / 2;

// Electrode footprint along +y from y0: narrow strip to y1, taper to a wide lead at y2, lead to y3.
function lead(y0, y1, y2, y3, wide) {
  return [
    [-W, y0], [W, y0], [W, y1], [wide, y2], [wide, y3], [-wide, y3], [-wide, y2], [-W, y1],
  ];
}

const shape = (pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
const mirrorY = (pts) => pts.map(([x, y]) => [x, -y]).reverse();

function slab(pts, z0, z1, material) {
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape(pts), { depth: z1 - z0, bevelEnabled: false }), material);
  mesh.position.z = z0;
  return mesh;
}

// The bridge across a gap of `gapNm` between the ground plane (−y) and the qubit island (+y).
export function buildJunction(gapNm = 20000) {
  const g = new THREE.Group();
  g.name = 'junction';
  const al = metal(0x8f99a8, 0.3);
  const alTop = metal(0x9ba5b3, 0.32);
  // the oxide is a transparent film a few atoms thick: only a faint tint over the bottom electrode
  const oxide = new THREE.MeshStandardMaterial({ color: 0x9fb4d8, metalness: 0.6, roughness: 0.3, emissive: 0x1b46c9, emissiveIntensity: 0.15 });
  const end = gapNm / 2 + 1500; // leads run under the film edges

  // first evaporation: bottom electrode from the ground side, ending at the far edge of the overlap
  const bottom = mirrorY(lead(-W, 700, 2500, end, 600));
  g.add(slab(bottom, -BOTTOM_T, 0, al));
  g.add(slab(bottom, 0, OXIDE_T, oxide));

  // second evaporation: on top of the oxide over the overlap, then down the step onto the substrate
  g.add(slab([[-W, -W], [W, -W], [W, W + 40], [-W, W + 40]], OXIDE_T, OXIDE_T + TOP_T, alTop));
  g.add(slab(lead(W, 700, 2500, end, 600), -BOTTOM_T, -BOTTOM_T + TOP_T, alTop));

  // the junction itself: the oxide where both electrodes overlap. It is buried under the top electrode,
  // so it glows a little wider than the overlap and shows as two bright seams along its edges.
  const seam = 12;
  g.add(slab([[-W - seam, -W], [W + seam, -W], [W + seam, W], [-W - seam, W]], 0, OXIDE_T, glow(0x7fd3ff, 4)));
  return g;
}
