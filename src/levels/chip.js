// Chip and transmon levels: one model built from the real Qiskit Metal mask (public/data/chip.*).
// Model units are micrometres; the chip lies in the xy plane with its centre at the origin.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
    new THREE.MeshStandardMaterial({ color: 0x141b2a, metalness: 0.35, roughness: 0.35, transparent: true }),
  );
  substrate.position.z = -SUBSTRATE_UM / 2;
  g.add(substrate);

  // One superconducting film. The ground plane is kept dark (it fills the screen at the transmon level
  // and sits behind the HUD); qubit islands and traces are brighter, with a faint glow on the islands.
  const film = new THREE.MeshStandardMaterial({ color: 0x474d57, metalness: 1, roughness: 0.42, envMapIntensity: 0.3, transparent: true });
  const trace = new THREE.MeshStandardMaterial({ color: 0xc4ccd8, metalness: 1, roughness: 0.3, envMapIntensity: 0.7, transparent: true });
  const island = trace.clone();
  island.emissive = new THREE.Color(0x2f7bff);
  island.emissiveIntensity = 0.45;
  const material = { ground: film, trace, island };
  for (const layer of chip.layers) {
    const mesh = new THREE.Mesh(extrudeLayer(layer.polygons, FILM_UM), material[layer.role]);
    mesh.name = layer.role;
    g.add(mesh);
  }

  // Qiskit Metal leaves the junction as a placeholder; mark where it sits.
  const marker = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb46b, emissiveIntensity: 3, transparent: true });
  for (const q of chip.qubits) {
    if (!q.junction) continue;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(q.junction.width * 0.35, 20, 12), marker);
    dot.position.set(q.junction.x, q.junction.y, FILM_UM);
    g.add(dot);
  }
  return g;
}

// Foci per level id, in µm.
export function chipFoci(chip) {
  const q = chip.qubits.find((x) => x.name === FOCUS_QUBIT);
  return {
    chip: [0, 0],
    transmon: [q.x, q.y],
    junction: [q.junction.x, q.junction.y],
  };
}
