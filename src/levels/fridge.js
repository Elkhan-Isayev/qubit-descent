// Dilution refrigerator (level 1), in millimetres, y up, top flange at y = 0.
// Stage temperatures are the level's facts (Krinner et al. 2019, Table 1); the vertical spacing of the
// plates follows the coaxial cable lengths between stages in the same table. Plate diameters, rods and
// lines are illustrative. The sample holder hangs below the mixing chamber.

import * as THREE from 'three';
import { LEVELS } from '../levels.js';
import { glow, metal, strut } from './util.js';

// Krinner et al. (2019), Table 1: coax length to each stage from the one above, mm.
export const STAGE_SPACING_MM = [200, 290, 250, 170, 140];
const PLATE_RADIUS = [270, 250, 228, 200, 178, 160];
const PLATE_T = 12;
const ROOM_K = 300;
const HOLDER_DROP = 190; // from the mixing-chamber plate down to the chip centre

// "882 mK" → 0.882, "2.85 K" → 2.85
export function parseTemperature(s) {
  const m = /^([\d.]+)\s*(mK|K)$/.exec(s.trim());
  if (!m) throw new Error(`not a temperature: ${s}`);
  return Number(m[1]) * (m[2] === 'mK' ? 1e-3 : 1);
}

// Stages from room temperature down: { key, label, kelvin, y }.
export function stages() {
  const facts = LEVELS.find((l) => l.id === 'fridge').facts;
  let y = 0;
  return [
    { key: 'fRoom', label: '300 K', kelvin: ROOM_K, y: 0 },
    ...facts.map(([key, label], i) => {
      y -= STAGE_SPACING_MM[i];
      return { key, label, kelvin: parseTemperature(label), y };
    }),
  ];
}

// Colour for a temperature on a log scale: warm at room temperature, ice-blue at the mixing chamber.
const WARM = new THREE.Color(0xff7a3d);
const MID = new THREE.Color(0xb7d9ff);
const COLD = new THREE.Color(0x2f6bff);
export function temperatureColour(kelvin) {
  const t = THREE.MathUtils.clamp((Math.log10(ROOM_K) - Math.log10(kelvin)) / (Math.log10(ROOM_K) - Math.log10(0.006)), 0, 1);
  return t < 0.5 ? WARM.clone().lerp(MID, t * 2) : MID.clone().lerp(COLD, (t - 0.5) * 2);
}

export function holderPosition() {
  const s = stages();
  return new THREE.Vector3(0, s[s.length - 1].y - HOLDER_DROP, 0);
}

// Builds the fridge around `holder` (the sample holder object, chip centre at its origin).
// `holderTilt` turns the holder so its chip faces the camera like the chip level does.
export function buildFridge(holder, holderTilt) {
  const g = new THREE.Group();
  g.name = 'fridge';
  const gold = metal(0xb5701c, 0.3);
  const steel = metal(0xa3abb5, 0.38);
  const copper = metal(0xc0764a, 0.32);
  const coax = metal(0xb9c3cf, 0.3);
  const st = stages();
  const anchors = [];

  st.forEach((s, i) => {
    const r = PLATE_RADIUS[i];
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(r, r, PLATE_T, 96), i === 0 ? steel : gold);
    plate.position.y = s.y;
    g.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 2, 2.2, 8, 128), glow(temperatureColour(s.kelvin), 3.2));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = s.y;
    g.add(ring);
    anchors.push({ key: s.key, text: s.label, position: new THREE.Vector3(r + 18, s.y, 0) });

    if (i === st.length - 1) return;
    const next = st[i + 1];
    const rn = PLATE_RADIUS[i + 1];
    // support rods
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      const p0 = new THREE.Vector3(Math.cos(a) * r * 0.86, s.y - PLATE_T / 2, Math.sin(a) * r * 0.86);
      const p1 = new THREE.Vector3(Math.cos(a) * rn * 0.86, next.y + PLATE_T / 2, Math.sin(a) * rn * 0.86);
      g.add(strut(p0, p1, 4, steel));
    }
    // coaxial lines converging towards the cold stages, with attenuators on the plates below 4 K
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + 1.1;
      const p0 = new THREE.Vector3(Math.cos(a) * r * 0.55, s.y, Math.sin(a) * r * 0.55);
      const p1 = new THREE.Vector3(Math.cos(a) * rn * 0.55, next.y, Math.sin(a) * rn * 0.55);
      g.add(strut(p0, p1, 1.6, coax, 6));
      if (i >= 1 && k % 2 === 0) {
        const att = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 22, 12), gold);
        att.position.copy(p1).add(new THREE.Vector3(0, PLATE_T / 2 + 11, 0));
        g.add(att);
      }
    }
  });

  // pulse-tube cold head from the top flange to the 4K plate
  g.add(strut(new THREE.Vector3(-150, 60, -40), new THREE.Vector3(-150, st[1].y, -40), 28, steel, 24));
  g.add(strut(new THREE.Vector3(-150, st[1].y, -40), new THREE.Vector3(-150, st[2].y, -40), 18, copper, 24));

  // dilution unit: still pot, heat exchanger coil, mixing chamber
  const still = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 70, 32), copper);
  still.position.y = st[3].y - PLATE_T / 2 - 35;
  g.add(still);
  const top = st[3].y - 75;
  const bottom = st[5].y + PLATE_T / 2 + 60;
  const coil = [];
  for (let k = 0; k <= 160; k++) {
    const t = k / 160;
    const a = t * Math.PI * 2 * 7;
    coil.push(new THREE.Vector3(Math.cos(a) * 30, top + (bottom - top) * t, Math.sin(a) * 30));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 400, 3, 8), copper));
  const mixing = new THREE.Mesh(new THREE.CylinderGeometry(36, 36, 56, 32), copper);
  mixing.position.y = st[5].y + PLATE_T / 2 + 28;
  g.add(mixing);

  // cold finger from the mixing-chamber plate down to the sample holder
  const at = holderPosition();
  holder.position.copy(at);
  holder.rotation.x = holderTilt;
  g.add(holder);
  // The cold finger stops short of the holder: the fridge is seen from slightly above, so anything
  // coming down onto the holder would lean in front of the chip at the sample-holder level.
  const finger = new THREE.Vector3(0, at.y + 70, 0);
  g.add(strut(new THREE.Vector3(0, st[5].y - PLATE_T / 2, 0), finger, 9, copper, 24));
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(46, 10, 30), copper);
  clamp.position.copy(finger);
  g.add(clamp);

  return { object: g, anchors, centre: [0, (60 + at.y) / 2], holder: [at.x, at.y, at.z] };
}
