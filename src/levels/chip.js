// Chip, transmon and junction levels: one model built from the real Qiskit Metal mask (public/data/chip.*),
// with the junction geometry (junction.js) placed where Metal marks each qubit's junction.
// Model units are micrometres; the chip lies in the xy plane with its centre at the origin.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BARRIER_CENTRE, BOTTOM_T, buildJunction } from './junction.js';

const NM = 1e-3; // µm

// Thicknesses are exaggerated for visibility (not to scale, never shown as numbers).
const FILM_UM = 2;
const SUBSTRATE_UM = 250;

// The qubit the descent continues into (level 4 centres on it, level 5 on its junction).
export const FOCUS_QUBIT = 'Q2';

const points = (flat) => {
  const pts = [];
  for (let k = 0; k < flat.length; k += 2) pts.push(new THREE.Vector2(flat[k], flat[k + 1]));
  return pts;
};

function polygonShape({ outer, holes }) {
  const shape = new THREE.Shape(points(outer));
  for (const h of holes) shape.holes.push(new THREE.Path(points(h)));
  return shape;
}

function extrudeLayer(polygons, depth) {
  const geoms = polygons.map((p) => new THREE.ExtrudeGeometry(polygonShape(p), { depth, bevelEnabled: false, curveSegments: 1 }));
  const merged = mergeGeometries(geoms, false);
  for (const g of geoms) g.dispose();
  return merged;
}

export function buildChipModel(chip) {
  const g = new THREE.Group();
  g.name = 'chip';

  const substrate = new THREE.Mesh(
    new THREE.BoxGeometry(chip.chip.width, chip.chip.height, SUBSTRATE_UM),
    new THREE.MeshStandardMaterial({ color: 0x141b2a, metalness: 0.35, roughness: 0.35 }),
  );
  substrate.position.z = -SUBSTRATE_UM / 2;
  g.add(substrate);

  // One superconducting film. The ground plane is kept dark (it fills the screen at the transmon level
  // and sits behind the HUD); qubit islands and traces are brighter, with a faint glow on the islands.
  const film = new THREE.MeshStandardMaterial({ color: 0x474d57, metalness: 1, roughness: 0.42, envMapIntensity: 0.3 });
  const trace = new THREE.MeshStandardMaterial({ color: 0xc4ccd8, metalness: 1, roughness: 0.3, envMapIntensity: 0.7 });
  const island = trace.clone();
  island.emissive = new THREE.Color(0x2f7bff);
  island.emissiveIntensity = 0.45;
  const material = { ground: film, trace, island };
  for (const layer of chip.layers) {
    const mesh = new THREE.Mesh(extrudeLayer(layer.polygons, FILM_UM), material[layer.role]);
    mesh.name = layer.role;
    g.add(mesh);
  }

  // Qiskit Metal only marks the junction; draw the real one across the gap, and a glow that shows where
  // it is from afar (shrunk away as the junction itself becomes visible).
  const marker = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb46b, emissiveIntensity: 3 });
  const markers = [];
  const junctions = {};
  for (const q of chip.qubits) {
    if (!q.junction) continue;
    const jj = buildJunction(q.junction.width / NM);
    jj.scale.setScalar(NM);
    jj.position.set(q.junction.x, q.junction.y, BOTTOM_T * NM); // electrode bottoms on the substrate
    g.add(jj);
    junctions[q.name] = jj;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), marker);
    dot.position.set(q.junction.x, q.junction.y, FILM_UM);
    g.add(dot);
    markers.push(dot);
  }
  // marker radius ~0.6 % of the field of view, gone below 40 µm
  const update = (spanUm) => {
    const r = spanUm > 40 ? spanUm * 0.006 * Math.min(1, (spanUm - 40) / 60) : 0;
    for (const d of markers) {
      d.visible = r > 0;
      d.scale.setScalar(Math.max(r, 1e-6));
    }
  };
  return { object: g, update, junctions };
}

// Foci per level id, in µm: the chip centre, the qubit, its junction, and the tunnel barrier in it.
export function chipFoci(chip) {
  const q = chip.qubits.find((x) => x.name === FOCUS_QUBIT);
  const barrier = [q.junction.x, q.junction.y, (BOTTOM_T + BARRIER_CENTRE[2]) * NM];
  return {
    chip: [0, 0, 0],
    transmon: [q.x, q.y, 0],
    junction: barrier,
    barrier,
  };
}
