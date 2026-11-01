// Sample holder (level 2), in millimetres: the real chip in a copper holder, wire-bonded to a
// circuit board whose traces fan out to coaxial connectors. The chip's top surface is the z = 0 plane
// and its centre is the origin, matching the chip model so the zoom continues straight into it.
// Holder dimensions are illustrative (not shown as numbers).

import * as THREE from 'three';
import { metal } from './util.js';

export const BLOCK = 20;
const HOLE = 5;
const PCB_T = 0.5;
const CONNECTOR_X = [-7.5, -2.5, 2.5, 7.5];

// Wire-bond pads of the chip: the launch-pad islands near the chip edge (µm in, mm out).
export function bondPads(chip) {
  const island = chip.layers.find((l) => l.role === 'island');
  const half = chip.chip.width / 2;
  const pads = [];
  for (const { outer } of island.polygons) {
    let x = 0;
    let y = 0;
    for (let k = 0; k < outer.length; k += 2) [x, y] = [x + outer[k], y + outer[k + 1]];
    [x, y] = [x / (outer.length / 2), y / (outer.length / 2)];
    if (Math.max(Math.abs(x), Math.abs(y)) > half * 0.8) {
      const side = Math.abs(x) > Math.abs(y) ? [Math.sign(x), 0] : [0, Math.sign(y)];
      pads.push({ x: x / 1000, y: y / 1000, side });
    }
  }
  return pads;
}

function trace(points, material) {
  const g = new THREE.Group();
  for (let k = 1; k < points.length; k++) {
    const [a, b] = [points[k - 1], points[k]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(len + 0.3, 0.3, 0.035), material);
    seg.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.0175);
    seg.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]);
    g.add(seg);
  }
  return g;
}

function connector(material, nut) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5, 24), material);
  body.position.y = 2.5;
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 1.2, 6), nut);
  hex.position.y = 1.2;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 5.6, 12), material);
  pin.position.y = 2.8;
  g.add(body, hex, pin);
  return g;
}

export function buildPackage(chip, chipObject) {
  const g = new THREE.Group();
  g.name = 'package';
  const gold = metal(0xc2862e, 0.42);
  const copper = metal(0xc0764a, 0.35);
  const board = new THREE.MeshStandardMaterial({ color: 0x1d3b33, roughness: 0.55, metalness: 0.1 });
  const wire = metal(0xe6ebf2, 0.2);

  // copper block with a pedestal under the chip
  const block = new THREE.Mesh(new THREE.BoxGeometry(BLOCK, BLOCK, 6), copper);
  block.position.z = -PCB_T - 3;
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(HOLE - 0.4, HOLE - 0.4, PCB_T - 0.25), copper);
  pedestal.position.z = -PCB_T + (PCB_T - 0.25) / 2;
  g.add(block, pedestal);

  // circuit board: a frame around the chip pocket
  const frame = new THREE.Shape([
    new THREE.Vector2(-BLOCK / 2, -BLOCK / 2),
    new THREE.Vector2(BLOCK / 2, -BLOCK / 2),
    new THREE.Vector2(BLOCK / 2, BLOCK / 2),
    new THREE.Vector2(-BLOCK / 2, BLOCK / 2),
  ]);
  frame.holes.push(
    new THREE.Path([
      new THREE.Vector2(-HOLE / 2, -HOLE / 2),
      new THREE.Vector2(-HOLE / 2, HOLE / 2),
      new THREE.Vector2(HOLE / 2, HOLE / 2),
      new THREE.Vector2(HOLE / 2, -HOLE / 2),
    ]),
  );
  const pcb = new THREE.Mesh(new THREE.ExtrudeGeometry(frame, { depth: PCB_T, bevelEnabled: false }), board);
  pcb.position.z = -PCB_T;
  g.add(pcb);

  g.add(chipObject);

  // bonds and traces from every pad to a connector on the matching side
  const pads = bondPads(chip);
  const bottom = pads.filter((p) => p.side[1] === -1).sort((a, b) => a.x - b.x);
  for (const pad of pads) {
    const [sx, sy] = pad.side;
    const end = [sx ? sx * (HOLE / 2 + 0.35) : pad.x, sy ? sy * (HOLE / 2 + 0.35) : pad.y];
    for (const off of [-0.07, 0.07]) {
      const o = sx ? [0, off] : [off, 0];
      const a = new THREE.Vector3(pad.x + o[0], pad.y + o[1], 0.002);
      const b = new THREE.Vector3(end[0] + o[0], end[1] + o[1], 0.035);
      const mid = a.clone().lerp(b, 0.4).setZ(0.35);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, 0.0125, 6), wire));
    }
    let path;
    let conn;
    if (sx) {
      path = [end, [sx * (BLOCK / 2 - 0.4), end[1]]];
      conn = { at: [sx * BLOCK / 2, end[1]], rot: -sx * Math.PI / 2 };
    } else {
      const cx = sy < 0 ? CONNECTOR_X[bottom.indexOf(pad)] : pad.x;
      path = [end, [pad.x, sy * (HOLE / 2 + 1.2)], [cx, sy * (BLOCK / 2 - 2.5)], [cx, sy * (BLOCK / 2 - 0.4)]];
      conn = { at: [cx, sy * BLOCK / 2], rot: sy > 0 ? 0 : Math.PI };
    }
    g.add(trace(path, gold));
    const c = connector(gold, metal(0xb9c0c9, 0.3));
    c.position.set(conn.at[0], conn.at[1], -PCB_T - 2.6);
    c.rotation.z = conn.rot;
    g.add(c);
  }

  // mounting screws
  for (const [x, y] of [[-8, 8], [8, 8], [-8, -8], [8, -8]]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 20), metal(0xb9c0c9, 0.35));
    s.rotation.x = Math.PI / 2;
    s.position.set(x, y, 0.2);
    g.add(s);
  }
  return g;
}
