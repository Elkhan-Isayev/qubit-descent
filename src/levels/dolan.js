// Geometry of a Dolan-bridge junction (Dolan 1977), in nanometres, as pure data shared by the
// finished junction (junction.js) and its fabrication animation (fabrication.js).
//
// A resist bilayer is patterned so that the top layer has two openings separated by a narrow
// bridge, and the bottom layer is cut back (undercut) far enough that the bridge is suspended.
// Aluminium evaporated at an angle lands shifted by Δ = h·tan θ (h: bottom-resist thickness). With
// Δ = BRIDGE/2 + OVERLAP/2 the first film, through the left opening, ends exactly OVERLAP beyond the
// bridge centre; the second film, from the opposite angle through the right opening, starts there:
// the two overlap only under the bridge. Each evaporation also passes through the *other* opening,
// leaving the shifted "ghost" copies that real Dolan junctions have along their leads.
//
// Coordinates: x across the junction, y along it (left opening at −y), z up from the substrate.
// Boxes are [x0, x1, y0, y1, z0, z1]. Thicknesses, resist and angle are illustrative.

export const OVERLAP = 200; // junction width and length (0.04 µm², inside Osman et al. 2021's range)
export const BRIDGE = 200; // width of the suspended resist bridge
export const SHIFT = BRIDGE / 2 + OVERLAP / 2; // Δ
export const RESIST_BOTTOM = 400; // h
export const RESIST_TOP = 150;
export const ANGLE = Math.atan(SHIFT / RESIST_BOTTOM); // θ from the vertical
export const UNDERCUT = 350;
export const T1 = 30; // first aluminium film
export const OX = 2; // oxide
export const T2 = 50; // second aluminium film
export const NARROW = 600; // length of the narrow part of each lead
export const WIDE = 600; // half-width of the wide lead
export const RESIST_X = 2500; // resist drawn for −RESIST_X ≤ x ≤ 0 only: a cutaway that shows the bridge
export const RESIST_Y = 2500;

const B = BRIDGE / 2;
const W = OVERLAP / 2;

// The two openings in the top resist as rectangles [x0, x1, y0, y1]; `end` is the far end of the leads.
export function openings(end) {
  const left = [
    [-W, W, -(B + NARROW), -B],
    [-WIDE, WIDE, -end, -(B + NARROW)],
  ];
  const right = left.map(([x0, x1, y0, y1]) => [x0, x1, -y1, -y0]);
  return { left, right };
}

const shift = (rects, dy) => rects.map(([x0, x1, y0, y1]) => [x0, x1, y0 + dy, y1 + dy]);
const grow = (rects, d) => rects.map(([x0, x1, y0, y1]) => [x0 - d, x1 + d, y0 - d, y1 + d]);
const inside = (rects, x, y) => rects.some(([x0, x1, y0, y1]) => x > x0 && x < x1 && y > y0 && y < y1);

// Evaporation through both openings: the first angle shifts the deposit by +Δ, the second by −Δ.
export function deposits(end) {
  const { left, right } = openings(end);
  return {
    first: [...shift(left, SHIFT), ...shift(right, SHIFT)],
    second: [...shift(left, -SHIFT), ...shift(right, -SHIFT)],
  };
}

// Cells of the grid spanned by all rectangle edges (plus extra cuts), kept where keep(x, y) holds.
function cells(rectSets, keep, extraX = [], extraY = []) {
  const xs = new Set(extraX);
  const ys = new Set(extraY);
  for (const set of rectSets)
    for (const [x0, x1, y0, y1] of set) {
      xs.add(x0).add(x1);
      ys.add(y0).add(y1);
    }
  const X = [...xs].sort((a, b) => a - b);
  const Y = [...ys].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < X.length - 1; i++)
    for (let j = 0; j < Y.length - 1; j++) {
      const cx = (X[i] + X[i + 1]) / 2;
      const cy = (Y[j] + Y[j + 1]) / 2;
      if (keep(cx, cy)) out.push([X[i], X[i + 1], Y[j], Y[j + 1]]);
    }
  return out;
}

// Everything the process leaves behind, and the resist it uses on the way.
export function dolanJunction(end) {
  const { left, right } = openings(end);
  const open = [...left, ...right];
  const dep = deposits(end);
  const all = [open, dep.first, dep.second];

  const first = cells(all, (x, y) => inside(dep.first, x, y)).map((r) => [...r, 0, T1]);
  const oxide = first.map(([x0, x1, y0, y1]) => [x0, x1, y0, y1, T1, T1 + OX]);
  // the second film lies on the oxidised first film where they overlap, on the substrate elsewhere
  const second = cells(all, (x, y) => inside(dep.second, x, y)).map((r) => {
    const z0 = inside(dep.first, (r[0] + r[1]) / 2, (r[2] + r[3]) / 2) ? T1 + OX : 0;
    return [...r, z0, z0 + T2];
  });
  // the junction: where the first film from the left opening meets the second from the right one
  const junction = [-W, W, -W, W, T1, T1 + OX];

  // resist (cutaway half, x ≤ 0): the top layer minus the openings (the bridge stays), the bottom
  // layer minus the openings grown by the undercut (which clears the space under the bridge)
  const frame = [[-RESIST_X, 0, -RESIST_Y, RESIST_Y]];
  const inFrame = (x, y) => x < 0 && x > -RESIST_X && Math.abs(y) < RESIST_Y;
  const cut = grow(open, UNDERCUT);
  const bottomKeep = cells([frame, cut], (x, y) => inFrame(x, y) && !inside(cut, x, y), [0]);
  const bottomGone = cells([frame, cut], (x, y) => inFrame(x, y) && inside(cut, x, y), [0]);
  const topKeep = cells([frame, open], (x, y) => inFrame(x, y) && !inside(open, x, y), [0]);
  const topGone = cells([frame, open], (x, y) => inFrame(x, y) && inside(open, x, y), [0]);
  const zb = [0, RESIST_BOTTOM];
  const zt = [RESIST_BOTTOM, RESIST_BOTTOM + RESIST_TOP];
  return {
    first,
    oxide,
    second,
    junction,
    resist: {
      bottom: bottomKeep.map((r) => [...r, ...zb]),
      bottomUndercut: bottomGone.map((r) => [...r, ...zb]),
      top: topKeep.map((r) => [...r, ...zt]),
      topExposed: topGone.map((r) => [...r, ...zt]),
    },
  };
}
