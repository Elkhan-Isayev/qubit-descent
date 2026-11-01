// Stand-in geometry for each level until the real models land (fridge.js, chip.js, … — see docs/SPEC.md).
// Each group is authored at unit size: 1 world unit = the level's span, the object fills ~0.8 of it.

import * as THREE from 'three';

const metal = (color, roughness = 0.3, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness: 1, roughness, transparent: true, ...extra });
const glow = (color, intensity = 2) =>
  new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, transparent: true });

const GOLD = 0xd4a64a;
const ALUMINIUM = 0xc9ced6;
const SILICON = 0x1a2233;

// Stage colours from warm (300 K) to icy (mixing chamber), placeholders for the temperature glow.
const STAGE_COLOURS = [0xff7a3d, 0xffb46b, 0x9fd8ff, 0x7fc4ff, 0x5aa6ff, 0x3d7dff];

function fridge() {
  const g = new THREE.Group();
  const n = STAGE_COLOURS.length;
  for (let i = 0; i < n; i++) {
    const y = 0.42 - (i * 0.84) / (n - 1);
    const r = 0.3 - i * 0.032;
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.022, 64), metal(GOLD, 0.25));
    plate.position.y = y;
    g.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.004, 0.003, 8, 96), glow(STAGE_COLOURS[i], 3));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
    if (i < n - 1) {
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + i * 0.4;
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.84 / (n - 1), 8), metal(0x9aa3ad, 0.4));
        rod.position.set(Math.cos(a) * r * 0.8, y - 0.42 / (n - 1), Math.sin(a) * r * 0.8);
        g.add(rod);
      }
    }
  }
  return g;
}

function samplePackage() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.62), metal(0xc87f4f, 0.35));
  g.add(body);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.2), metal(SILICON, 0.2, { metalness: 0.2 }));
  chip.position.y = 0.056;
  g.add(chip);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const sma = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 24), metal(GOLD, 0.2));
    sma.rotation.z = Math.PI / 2;
    sma.rotation.y = -a;
    sma.position.set(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34);
    g.add(sma);
  }
  g.rotation.x = 0.5;
  return g;
}

function chipLayout() {
  const g = new THREE.Group();
  const sub = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.02), metal(SILICON, 0.3, { metalness: 0.3 }));
  g.add(sub);
  const line = glow(0x7fd3ff, 1.4);
  for (const [x, y] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.2], [0.2, 0.2]]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.004), line);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.12, 0.004), line);
    a.position.set(x, y, 0.012);
    b.position.set(x, y, 0.012);
    g.add(a, b);
    for (let k = 0; k < 5; k++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.004, 0.004), line);
      m.position.set(x + 0.04 * (k % 2 ? 1 : -1) * 0.3, y + 0.09 + k * 0.012, 0.012);
      g.add(m);
    }
  }
  g.rotation.x = -0.55;
  return g;
}

function transmon() {
  const g = new THREE.Group();
  const al = metal(ALUMINIUM, 0.25);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.02), al));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.7, 0.02), al));
  const jj = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 16), glow(0xffb46b, 4));
  jj.position.set(0, -0.38, 0.02);
  g.add(jj);
  g.rotation.x = -0.6;
  return g;
}

function junction() {
  const g = new THREE.Group();
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.05), metal(ALUMINIUM, 0.3));
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.05), metal(ALUMINIUM, 0.3));
  b.position.z = 0.055;
  const overlap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.008), glow(0x7fd3ff, 1.5));
  overlap.position.z = 0.028;
  g.add(a, b, overlap);
  g.scale.setScalar(0.75);
  g.rotation.set(-0.7, 0, 0.5);
  return g;
}

function barrier() {
  const g = new THREE.Group();
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.4), metal(ALUMINIUM, 0.35));
  bottom.position.y = -0.12;
  const oxide = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.06, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x3d7dff, emissive: 0x1a3d99, emissiveIntensity: 0.8, transparent: true, roughness: 0.6 }),
  );
  const top = bottom.clone();
  top.position.y = 0.12;
  g.add(bottom, oxide, top);
  g.rotation.set(0.35, -0.6, 0);
  return g;
}

// Silicon diamond lattice (a = 0.543 nm) at the atom level's span, with the phosphorus donor at the centre.
export const DIAMOND_BASIS = [
  [0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0],
  [0.25, 0.25, 0.25], [0.25, 0.75, 0.75], [0.75, 0.25, 0.75], [0.75, 0.75, 0.25],
];

export function diamondLattice(cells) {
  const pts = [];
  for (let i = 0; i < cells; i++)
    for (let j = 0; j < cells; j++)
      for (let k = 0; k < cells; k++) for (const [x, y, z] of DIAMOND_BASIS) pts.push([i + x, j + y, k + z]);
  return pts;
}

function atom(span) {
  const g = new THREE.Group();
  const a = 0.543e-9 / span; // lattice constant in level units
  const cells = 3;
  const pts = diamondLattice(cells);
  const c = (cells * a) / 2;
  const si = new THREE.InstancedMesh(new THREE.SphereGeometry(a * 0.13, 20, 20), metal(0x8fa3c4, 0.35, { metalness: 0.5 }), pts.length);
  const m = new THREE.Matrix4();
  let centre = 0;
  let best = Infinity;
  pts.forEach(([x, y, z], idx) => {
    const p = [x * a - c, y * a - c, z * a - c];
    const d = Math.hypot(...p);
    if (d < best) [best, centre] = [d, idx];
    si.setMatrixAt(idx, m.makeTranslation(...p));
  });
  // the donor replaces the silicon atom nearest the centre
  const [px, py, pz] = pts[centre].map((v) => v * a - c);
  si.setMatrixAt(centre, m.makeScale(0, 0, 0));
  const p = new THREE.Mesh(new THREE.SphereGeometry(a * 0.17, 32, 32), glow(0xffb46b, 4));
  p.position.set(px, py, pz);
  g.add(si, p);
  g.rotation.set(0.5, 0.6, 0);
  return g;
}

const BUILDERS = { fridge, package: samplePackage, chip: chipLayout, transmon, junction, barrier, atom };

export function buildPlaceholder(level) {
  const g = BUILDERS[level.id](level.span);
  g.name = level.id;
  return g;
}
