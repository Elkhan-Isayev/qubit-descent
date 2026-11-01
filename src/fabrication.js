// Fabrication animation for the Josephson junction (level 5): the Dolan process of dolan.js played
// step by step on the qubit's own junction, ending in exactly the geometry of the finished junction.
// Units and placement are those of junction.js (nanometres, origin on top of the first film).

import * as THREE from 'three';
import { ANGLE, OX, RESIST_BOTTOM, RESIST_TOP, T1, T2, dolanJunction, openings } from './levels/dolan.js';
import { BOTTOM_T, boxMesh, junctionMaterials, leadEnd, seamBox } from './levels/junction.js';
import { glow } from './levels/util.js';

export const STEPS = [
  { id: 'resist', duration: 2.6 },
  { id: 'ebeam', duration: 3.6 },
  { id: 'develop', duration: 2 },
  { id: 'evap1', duration: 3.6 },
  { id: 'oxidise', duration: 2.8 },
  { id: 'evap2', duration: 3.6 },
  { id: 'liftoff', duration: 3 },
  { id: 'done', duration: 3 },
];
export const TOTAL = STEPS.reduce((s, x) => s + x.duration, 0);
// The cutaway view, as the orientation of the chip model: the cut face of the resist (x = 0) faces the
// camera (turned a little left so the resist behind it shows), the junction axis (y) runs across the
// screen and height (z) points up, tipped slightly towards the camera so top surfaces stay visible.
const SIDE = 0.35;
const TIP = 0.3;
export const CUTAWAY_VIEW = new THREE.Quaternion()
  .setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(
      new THREE.Vector3(-Math.sin(SIDE), 0, Math.cos(SIDE)),
      new THREE.Vector3(Math.cos(SIDE), 0, Math.sin(SIDE)),
      new THREE.Vector3(0, 1, 0),
    ),
  )
  .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), TIP));

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

// Step at time t (seconds): { index, id, local ∈ [0, 1] within the step, done }.
export function fabTimeline(t) {
  let acc = 0;
  for (let i = 0; i < STEPS.length; i++) {
    const { id, duration } = STEPS[i];
    if (t < acc + duration) return { index: i, id, local: clamp01((t - acc) / duration), done: false };
    acc += duration;
  }
  const last = STEPS.length - 1;
  return { index: last, id: STEPS[last].id, local: 1, done: true };
}

// how far the view pulls back so the resist stack and both openings fit (× the level's field of view)
export const CUTAWAY_ZOOM = 2.2;

// 0 → 1 → 0 envelope: into the cutaway view at the start, back once the resist is gone.
function cutaway(t) {
  const back = TOTAL - STEPS[STEPS.length - 1].duration;
  return ease(t / 1.6) - ease((t - back) / 2);
}
export const fabBlend = (t) => cutaway(t);
export const fabZoom = (t) => 1 + (CUTAWAY_ZOOM - 1) * cutaway(t);

// Raster path of the electron beam over the openings near the junction (x, y pairs).
export function beamPath(end, reach = 1400, row = 70) {
  const { left, right } = openings(end);
  const rects = [...left, ...right];
  const path = [];
  let flip = false;
  for (let y = -reach; y <= reach; y += row) {
    const r = rects.find(([, , y0, y1]) => y > y0 && y < y1);
    if (!r) continue;
    const [x0, x1] = flip ? [r[1], r[0]] : [r[0], r[1]];
    path.push([x0, y], [x1, y]);
    flip = !flip;
  }
  return path;
}

function along(path, f) {
  const segs = path.length - 1;
  const u = clamp01(f) * segs;
  const i = Math.min(Math.floor(u), segs - 1);
  const k = u - i;
  return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k];
}

const fade = (material, opacity) => {
  material.opacity = opacity;
  material.transparent = true;
  material.depthWrite = opacity > 0.6;
};

// Boxes lifted so their bottom is at z = 0 (to grow them by scaling), and the height they started at.
const rebase = (boxes, z0) => boxes.map(([x0, x1, y0, y1, a, b]) => [x0, x1, y0, y1, a - z0, b - z0]);

export class Fabrication {
  constructor(gapNm) {
    const end = leadEnd(gapNm);
    const d = dolanJunction(end);
    this.object = new THREE.Group();
    this.object.name = 'fabrication';
    this.object.visible = false;
    this.object.userData.noFade = true; // driven here, not by the level cross-fade
    const root = new THREE.Group();
    root.position.z = -BOTTOM_T; // substrate surface, as in junction.js
    this.object.add(root);
    const add = (mesh, z = 0) => {
      mesh.position.z = z;
      root.add(mesh);
      return mesh;
    };

    const resist = (color, opacity) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, transparent: true, opacity });
    const RT = RESIST_BOTTOM + RESIST_TOP;
    this.m = {
      bottom: add(boxMesh(d.resist.bottom, resist(0xc96b8a, 0.82))),
      undercut: add(boxMesh(d.resist.bottomUndercut, resist(0xc96b8a, 0.82))),
      top: add(boxMesh(rebase(d.resist.top, RESIST_BOTTOM), resist(0xe2a64e, 0.9)), RESIST_BOTTOM),
      exposed: add(boxMesh(rebase(d.resist.topExposed, RESIST_BOTTOM), resist(0xe2a64e, 0.9)), RESIST_BOTTOM),
    };
    // aluminium that lands on the resist (removed again at lift-off)
    const cap = rebase(d.resist.top, RESIST_BOTTOM).map(([x0, x1, y0, y1]) => [x0, x1, y0, y1, 0, 1]);
    const mat = junctionMaterials();
    this.m.cap1 = add(boxMesh(cap, mat.first.clone()), RT);
    this.m.cap2 = add(boxMesh(cap, mat.second.clone()), RT + T1 + OX);
    this.m.cap1.scale.z = T1;
    this.m.cap2.scale.z = T2;

    // the films, split by the height they start at so each can grow upwards by scaling
    this.m.first = add(boxMesh(d.first, mat.first));
    this.m.oxide = add(boxMesh(d.oxide, mat.oxide));
    const low = d.second.filter((b) => b[4] === 0);
    const high = d.second.filter((b) => b[4] > 0);
    this.m.secondLow = add(boxMesh(low, mat.second));
    this.m.secondHigh = add(boxMesh(rebase(high, T1 + OX), mat.second), T1 + OX);
    this.m.junction = add(boxMesh([seamBox(d.junction)], mat.junction));

    // electron beam
    this.path = beamPath(end);
    this.m.beam = add(new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 2400, 12), glow(0x9be3ff, 5, { transparent: true })));
    this.m.beam.rotation.x = Math.PI / 2;

    // evaporated aluminium and oxygen, as particles
    const rnd = (a, b) => a + Math.random() * (b - a);
    this.flux = Array.from({ length: 420 }, () => ({ x: rnd(-900, 900), y: rnd(-1500, 1500), phase: Math.random() }));
    this.gas = Array.from({ length: 220 }, () => ({ x: rnd(-900, 900), y: rnd(-1300, 1300), z: rnd(60, 1000), phase: rnd(0, 6.3) }));
    this.m.flux = add(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(7, 1), glow(0xdfe9ff, 3, { transparent: true }), this.flux.length));
    this.m.gas = add(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(9, 1), glow(0xff6b5a, 2.2, { transparent: true }), this.gas.length));

    this.materials = [...new Set(Object.values(this.m).map((x) => x.material))];
    this.base = new Map(this.materials.map((x) => [x, { opacity: x.opacity, transparent: x.transparent, depthWrite: x.depthWrite }]));
    this.t = 0;
    this.playing = false;
    this.apply();
  }

  play() {
    this.t = 0;
    this.playing = true;
    this.object.visible = true;
  }

  stop() {
    this.playing = false;
    this.object.visible = false;
  }

  // 0…1: how far the view has turned into the cutaway (the scene slerps towards CUTAWAY_VIEW)
  get blend() {
    return this.playing ? fabBlend(this.t) : 0;
  }

  get zoom() {
    return this.playing ? fabZoom(this.t) : 1;
  }

  get state() {
    return this.playing ? fabTimeline(this.t) : null;
  }

  update(dt) {
    if (!this.playing) return;
    this.t += dt;
    if (this.t >= TOTAL) return this.stop();
    this.apply();
  }

  apply() {
    const { m } = this;
    const { id, local } = fabTimeline(this.t);
    const at = STEPS.findIndex((s) => s.id === id);
    const past = (step) => STEPS.findIndex((s) => s.id === step) < at;
    const now = (step) => id === step;
    const progress = (step) => (past(step) ? 1 : now(step) ? local : 0);
    for (const [mat, b] of this.base) Object.assign(mat, b);

    // 1 resist: bottom layer, then top layer
    const r = progress('resist');
    fade(m.bottom.material, 0.82 * ease(r * 2));
    fade(m.undercut.material, 0.82 * ease(r * 2) * (1 - progress('develop')));
    const topZ = RESIST_BOTTOM + 400 * (1 - ease(r * 2 - 1));
    m.exposed.position.z = topZ;
    fade(m.top.material, 0.9 * ease(r * 2 - 1));
    // 2 electron beam writes the openings, which light up; 3 development dissolves them
    const e = progress('ebeam');
    m.exposed.material.emissive.set(0x3d7dff);
    m.exposed.material.emissiveIntensity = 1.4 * e;
    fade(m.exposed.material, 0.9 * ease(r * 2 - 1) * (1 - progress('develop')));
    m.beam.visible = now('ebeam');
    if (m.beam.visible) {
      const [x, y] = along(this.path, local);
      m.beam.position.set(x, y, RESIST_BOTTOM + RESIST_TOP + 1200);
    }
    // 4 first evaporation, 5 oxidation, 6 second evaporation
    const e1 = progress('evap1');
    const e2 = progress('evap2');
    m.first.visible = e1 > 0;
    m.first.scale.z = Math.max(e1, 1e-3);
    m.cap1.visible = e1 > 0;
    m.cap1.scale.z = T1 * Math.max(e1, 1e-3);
    m.oxide.visible = past('evap1') && progress('oxidise') > 0;
    fade(m.oxide.material, progress('oxidise'));
    m.oxide.material.emissiveIntensity = 0.15 + (now('oxidise') ? 1.2 * Math.sin(local * Math.PI) : 0);
    for (const s of [m.secondLow, m.secondHigh]) {
      s.visible = e2 > 0;
      s.scale.z = Math.max(e2, 1e-3);
    }
    m.cap2.visible = e2 > 0;
    m.cap2.scale.z = T2 * Math.max(e2, 1e-3);
    this.particles(now('evap1') ? 1 : now('evap2') ? -1 : 0, local, now('oxidise') ? local : -1);
    // 7 lift-off: resist and the metal on it float away
    const l = ease(progress('liftoff'));
    const RT = RESIST_BOTTOM + RESIST_TOP;
    const lifted = { bottom: [0, 0.82], top: [topZ, 0.9], cap1: [RT, 1], cap2: [RT + T1 + OX, 1] };
    for (const [k, [z, opacity]] of Object.entries(lifted)) {
      m[k].position.z = z + 1600 * l;
      if (l > 0) fade(m[k].material, opacity * (1 - l));
    }
    // 8 the junction lights up
    m.junction.visible = past('oxidise') && e2 > 0.5;
    m.junction.material.emissiveIntensity = 4 + (now('done') ? 6 * Math.sin(local * Math.PI) : 0);
  }

  // Aluminium flux at ±ANGLE (dir ≠ 0) and oxygen molecules (gasLocal ≥ 0).
  particles(dir, local, gasLocal) {
    const { flux, gas } = this.m;
    const mx = new THREE.Matrix4();
    const H = 1700;
    const L = H / Math.cos(ANGLE);
    const s = Math.sin(ANGLE) * dir;
    const strength = dir ? Math.sin(Math.min(1, local * 1.15) * Math.PI) : 0;
    flux.visible = strength > 0.01;
    if (flux.visible) {
      fade(flux.material, strength);
      this.flux.forEach((p, i) => {
        // each atom flies in a straight line along the beam direction and lands at (p.x, p.y)
        const f = (this.t * 0.9 + p.phase) % 1;
        flux.setMatrixAt(i, mx.makeTranslation(p.x, p.y + s * L * (f - 1), H * (1 - f)));
      });
      flux.instanceMatrix.needsUpdate = true;
    }
    gas.visible = gasLocal >= 0;
    if (gas.visible) {
      fade(gas.material, Math.sin(gasLocal * Math.PI));
      this.gas.forEach((p, i) => {
        const w = this.t * 2 + p.phase;
        gas.setMatrixAt(i, mx.makeTranslation(p.x + 60 * Math.sin(w), p.y + 60 * Math.cos(w * 1.3), p.z * (1 - 0.6 * gasLocal) + 40 * Math.sin(w * 0.7)));
      });
      gas.instanceMatrix.needsUpdate = true;
    }
  }
}
