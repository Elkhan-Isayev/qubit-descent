// A phosphorus donor in silicon (level 7), in nanometres. Silicon's diamond lattice (a = 0.543 nm,
// NIST CODATA) with one phosphorus atom substituted at the centre (Fuechsle et al. 2012 placed it to
// one lattice site). The bound electron's cloud and its spin, the qubit, are stylised.

import * as THREE from 'three';
import { glow, metal } from './util.js';

export const SI_LATTICE_NM = 0.543;
const CELLS = 3;

export const DIAMOND_BASIS = [
  [0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0],
  [0.25, 0.25, 0.25], [0.25, 0.75, 0.75], [0.75, 0.25, 0.75], [0.75, 0.75, 0.25],
];

// Diamond lattice sites in units of the lattice constant, `cells` conventional cells per side.
export function diamondLattice(cells) {
  const pts = [];
  for (let i = 0; i < cells; i++)
    for (let j = 0; j < cells; j++)
      for (let k = 0; k < cells; k++) for (const [x, y, z] of DIAMOND_BASIS) pts.push([i + x, j + y, k + z]);
  return pts;
}

// Nearest-neighbour pairs (tetrahedral bonds, length a·√3/4) among the given sites.
export function bonds(pts) {
  const nn = Math.sqrt(3) / 4;
  const out = [];
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (Math.abs(d - nn) < 1e-6) out.push([i, j]);
    }
  return out;
}

export function buildAtom() {
  const g = new THREE.Group();
  g.name = 'atom';
  const a = SI_LATTICE_NM;
  const sites = diamondLattice(CELLS);
  const c = (CELLS * a) / 2;
  const pos = sites.map(([x, y, z]) => new THREE.Vector3(x * a - c, y * a - c, z * a - c));

  // the donor replaces the silicon atom nearest the centre
  let centre = 0;
  pos.forEach((p, i) => {
    if (p.length() < pos[centre].length()) centre = i;
  });

  const si = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075, 2), metal(0x8fa3c4, 0.35, { metalness: 0.55 }), pos.length - 1);
  const m = new THREE.Matrix4();
  let n = 0;
  pos.forEach((p, i) => i !== centre && si.setMatrixAt(n++, m.makeTranslation(p.x, p.y, p.z)));
  g.add(si);

  const pairs = bonds(sites);
  const bond = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), metal(0x6f7f99, 0.5, { metalness: 0.4 }), pairs.length);
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  pairs.forEach(([i, j], k) => {
    const d = pos[j].clone().sub(pos[i]);
    q.setFromUnitVectors(up, d.clone().normalize());
    m.compose(pos[i].clone().addScaledVector(d, 0.5), q, new THREE.Vector3(1, d.length(), 1));
    bond.setMatrixAt(k, m);
  });
  g.add(bond);

  // The donor, its electron and its spin sit inside the lattice; they are drawn on top of it
  // (no depth test) so the qubit stays visible through the silicon atoms in front.
  const onTop = (o, order) => {
    o.renderOrder = order;
    o.traverse((x) => x.material && Object.assign(x.material, { depthTest: false, depthWrite: false }));
    return o;
  };
  const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 3), glow(0xffb46b, 4));
  p.position.copy(pos[centre]);

  // the donor electron: a soft glowing cloud spread over many lattice sites (stylised)
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x3d7dff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  cloud.position.copy(pos[centre]);
  g.add(onTop(cloud, 10), onTop(p, 11));

  // its spin: the qubit, precessing slowly
  const spin = new THREE.Group();
  const arrowMat = glow(0x9be3ff, 3);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 12), arrowMat);
  shaft.position.y = 0.21;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 20), arrowMat);
  head.position.y = 0.46;
  spin.add(shaft, head);
  spin.position.copy(pos[centre]);
  g.add(onTop(spin, 12));

  g.rotation.set(0.45, 0.6, 0);
  let time = 0;
  const update = (dt) => {
    time += dt;
    g.rotation.y += dt * 0.06;
    spin.rotation.set(0.35 * Math.cos(time * 1.3), 0, 0.35 * Math.sin(time * 1.3));
    cloud.scale.setScalar(1 + 0.04 * Math.sin(time * 1.7));
  };
  return { object: g, update };
}
