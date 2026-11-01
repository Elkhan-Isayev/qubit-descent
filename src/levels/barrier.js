// AlOx tunnel barrier (level 6), in nanometres, origin at the barrier centre, layers stacked along z.
// Zeng et al. (2015) measured a barrier thickness varying between ~1 and ~2 nm, with less than 10 % of
// the junction area carrying the tunnelling current. The thickness field below is a smooth random
// surface scaled to exactly that range; its thinnest HOT_FRACTION of the area are the "hot spots".
// The aluminium electrodes are fcc crystals (a = 0.405 nm); the oxide is amorphous at the density of
// alumina. Cooper pairs crossing the hot spots are stylised.

import * as THREE from 'three';
import { glow, metal, rng } from './util.js';

export const T_MIN = 1;
export const T_MAX = 2;
export const HOT_FRACTION = 0.07;
export const AL_LATTICE_NM = 0.405;
const OXIDE_DENSITY = 88; // atoms per nm³ (amorphous Al2O3, ~3 g/cm³)
const HALF = [3.6, 1.25]; // footprint half-widths x, y
const ELECTRODE_T = 2.4;
const Z0 = -(T_MIN + T_MAX) / 4; // bottom of the oxide, so its mean mid-plane is z = 0

// Smooth thickness field t(x, y) in [T_MIN, T_MAX] and the threshold below which a point is "hot".
// Seed 46 gives three separate hot spots inside the slab (none cut off by its edges).
export function thicknessField(seed = 46) {
  const r = rng(seed);
  const waves = Array.from({ length: 7 }, () => {
    const a = r() * Math.PI * 2;
    const k = 0.9 + r() * 2.2; // wavelengths ~2–7 nm
    return { kx: Math.cos(a) * k, ky: Math.sin(a) * k, phase: r() * Math.PI * 2, amp: 0.5 + r() };
  });
  const raw = (x, y) => waves.reduce((s, w) => s + w.amp * Math.cos(w.kx * x + w.ky * y + w.phase), 0);
  const samples = [];
  for (let x = -HALF[0]; x <= HALF[0]; x += 0.05) for (let y = -HALF[1]; y <= HALF[1]; y += 0.05) samples.push(raw(x, y));
  const lo = Math.min(...samples);
  const hi = Math.max(...samples);
  const t = (x, y) => T_MIN + ((raw(x, y) - lo) / (hi - lo)) * (T_MAX - T_MIN);
  const sorted = samples.map((v) => T_MIN + ((v - lo) / (hi - lo)) * (T_MAX - T_MIN)).sort((a, b) => a - b);
  const hot = sorted[Math.floor(sorted.length * HOT_FRACTION)];
  return { t, hot, samples: sorted };
}

// fcc lattice sites inside an axis-aligned box [x0, x1] × [y0, y1] × [z0, z1].
export function fccSites([x0, x1], [y0, y1], [z0, z1], a = AL_LATTICE_NM) {
  const basis = [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
  const out = [];
  for (let i = Math.floor(x0 / a); i * a <= x1; i++)
    for (let j = Math.floor(y0 / a); j * a <= y1; j++)
      for (let k = Math.floor(z0 / a); k * a <= z1; k++)
        for (const [bx, by, bz] of basis) {
          const p = [(i + bx) * a, (j + by) * a, (k + bz) * a];
          if (p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1) out.push(p);
        }
  return out;
}

function instanced(points, radius, material, detail = 1) {
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(radius, detail), material, Math.max(points.length, 1));
  const m = new THREE.Matrix4();
  points.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(p[0], p[1], p[2])));
  mesh.count = points.length;
  return mesh;
}

export function buildBarrier() {
  const g = new THREE.Group();
  g.name = 'barrier';
  const { t, hot } = thicknessField();
  const r = rng(11);
  const X = [-HALF[0], HALF[0]];
  const Y = [-HALF[1], HALF[1]];

  // bottom electrode: below the flat oxide floor; top electrode: above the rough oxide surface,
  // rotated a little (a different grain) so its rows do not line up with the bottom ones
  const bottom = fccSites(X, Y, [Z0 - ELECTRODE_T, Z0 - 0.12]);
  const top = fccSites([-5, 5], [-5, 5], [Z0 + T_MIN - 0.5, Z0 + T_MAX + ELECTRODE_T])
    .map(([x, y, z]) => {
      const c = Math.cos(0.5);
      const s = Math.sin(0.5);
      return [c * x - s * y, s * x + c * y, z];
    })
    .filter(([x, y, z]) => x >= X[0] && x <= X[1] && y >= Y[0] && y <= Y[1] && z > Z0 + t(x, y) + 0.12 && z <= Z0 + T_MAX + ELECTRODE_T);

  // amorphous oxide: jittered grid at alumina density, Al : O = 2 : 3; atoms in thin spots glow
  const d = OXIDE_DENSITY ** (-1 / 3);
  const oxAl = [];
  const oxO = [];
  const hotAtoms = [];
  for (let x = X[0]; x <= X[1]; x += d)
    for (let y = Y[0]; y <= Y[1]; y += d)
      for (let z = Z0; z <= Z0 + T_MAX; z += d) {
        const p = [x + (r() - 0.5) * d * 0.7, y + (r() - 0.5) * d * 0.7, z + (r() - 0.5) * d * 0.7];
        const th = t(p[0], p[1]);
        if (p[2] < Z0 || p[2] > Z0 + th) continue;
        if (th <= hot) hotAtoms.push(p);
        else (r() < 0.4 ? oxAl : oxO).push(p);
      }

  g.add(instanced(bottom, 0.12, metal(0x7d8a9e, 0.45, { metalness: 0.5 })));
  g.add(instanced(top, 0.12, metal(0x8794a8, 0.42, { metalness: 0.5 })));
  g.add(instanced(oxAl, 0.11, new THREE.MeshStandardMaterial({ color: 0x6f86ad, roughness: 0.5, metalness: 0.2 })));
  g.add(instanced(oxO, 0.085, new THREE.MeshStandardMaterial({ color: 0xb4483f, roughness: 0.45, metalness: 0.05 })));
  // hot spots and the pairs crossing them lie inside the slab; draw them through the atoms in front
  const seeThrough = { depthTest: false, depthWrite: false };
  const hotMesh = instanced(hotAtoms, 0.1, glow(0x7fd3ff, 1.1, seeThrough));
  hotMesh.renderOrder = 10;
  g.add(hotMesh);

  // hot-spot centres: local minima of the thickness on a coarse grid
  const spots = [];
  const step = 0.3;
  for (let x = X[0] + step; x < X[1] - step; x += step)
    for (let y = Y[0] + step; y < Y[1] - step; y += step) {
      const v = t(x, y);
      if (v > hot) continue;
      const nb = [[step, 0], [-step, 0], [0, step], [0, -step]].every(([dx, dy]) => t(x + dx, y + dy) >= v);
      if (nb) spots.push([x, y]);
    }

  // Cooper pairs (stylised): two bright points crossing each hot spot, staggered in time
  const pairs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 1), glow(0xbfe9ff, 5, seeThrough), Math.max(spots.length * 2, 1));
  pairs.renderOrder = 11;
  pairs.count = spots.length * 2;
  g.add(pairs);
  const m = new THREE.Matrix4();
  let time = 0;
  const update = (dt) => {
    time += dt;
    spots.forEach(([x, y], i) => {
      const f = (time * 0.35 + i * 0.37) % 1;
      const z = Z0 - 1.6 + f * (T_MAX + 3.2);
      const a = time * 3 + i;
      for (const k of [0, 1]) {
        const s = k ? 1 : -1;
        pairs.setMatrixAt(i * 2 + k, m.makeTranslation(x + s * 0.12 * Math.cos(a), y + s * 0.12 * Math.sin(a), z));
      }
    });
    pairs.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return { object: g, update, spots };
}
