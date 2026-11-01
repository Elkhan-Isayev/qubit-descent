import { describe, expect, it } from 'vitest';
import { STEPS, TOTAL, beamPath, fabBlend, fabTimeline, fabZoom } from '../../src/fabrication.js';
import { ANGLE, BRIDGE, OVERLAP, RESIST_BOTTOM, SHIFT, T1, OX, UNDERCUT, deposits, dolanJunction, openings } from '../../src/levels/dolan.js';

const END = 11500;
const inside = (rects, x, y) => rects.some(([x0, x1, y0, y1]) => x > x0 && x < x1 && y > y0 && y < y1);
const area = (boxes) => boxes.reduce((s, [x0, x1, y0, y1]) => s + (x1 - x0) * (y1 - y0), 0);

describe('Dolan process geometry', () => {
  it('shifts each deposit by h·tan θ, half a bridge plus half an overlap', () => {
    expect(RESIST_BOTTOM * Math.tan(ANGLE)).toBeCloseTo(SHIFT, 9);
    expect(SHIFT).toBe(BRIDGE / 2 + OVERLAP / 2);
    expect(ANGLE).toBeGreaterThan(0);
    expect(ANGLE).toBeLessThan(Math.PI / 4);
  });

  it('keeps the bridge free of the top openings and fully undercut below', () => {
    const { left, right } = openings(END);
    for (let y = -BRIDGE / 2 + 1; y < BRIDGE / 2; y += 20) expect(inside([...left, ...right], 0, y)).toBe(false);
    const d = dolanJunction(END);
    // nothing of the bottom resist remains under the bridge
    for (let y = -BRIDGE / 2 + 1; y < BRIDGE / 2; y += 20) expect(inside(d.resist.bottom, -1, y)).toBe(false);
    expect(UNDERCUT).toBeGreaterThanOrEqual(SHIFT); // shifted deposits are never shadowed by the lower layer
  });

  it('the two films overlap directly only in the 200 × 200 nm junction near the bridge', () => {
    const d = dolanJunction(END);
    const [x0, x1, y0, y1] = d.junction;
    expect((x1 - x0) * (y1 - y0)).toBe(OVERLAP * OVERLAP);
    expect(((x1 - x0) * (y1 - y0)) / 1e6).toBeGreaterThanOrEqual(0.01); // µm², Osman et al. range
    expect(((x1 - x0) * (y1 - y0)) / 1e6).toBeLessThanOrEqual(0.16);
    // near the bridge, second-film cells lying on the first film are exactly the junction
    const raised = d.second.filter((b) => b[4] > 0 && Math.abs(b[2]) < 1000 && Math.abs(b[3]) < 1000);
    expect(area(raised.filter((b) => b[3] <= OVERLAP / 2 && b[2] >= -OVERLAP / 2))).toBe(OVERLAP * OVERLAP);
  });

  it('stacks first film, oxide and second film without gaps', () => {
    const d = dolanJunction(END);
    for (const b of d.first) expect([b[4], b[5]]).toEqual([0, T1]);
    for (const b of d.oxide) expect([b[4], b[5]]).toEqual([T1, T1 + OX]);
    for (const b of d.second) expect([0, T1 + OX]).toContain(b[4]);
    expect(area(d.oxide)).toBe(area(d.first));
  });

  it('leaves the ghost copies of a real Dolan junction along both leads', () => {
    const dep = deposits(END);
    // the first evaporation also passes the right opening, the second the left one
    expect(inside(dep.first, 0, BRIDGE / 2 + SHIFT + 10)).toBe(true);
    expect(inside(dep.second, 0, -(BRIDGE / 2 + SHIFT + 10))).toBe(true);
  });
});

describe('fabrication timeline', () => {
  it('runs eight steps in order and ends done', () => {
    expect(STEPS.map((s) => s.id)).toEqual(['resist', 'ebeam', 'develop', 'evap1', 'oxidise', 'evap2', 'liftoff', 'done']);
    let prev = -1;
    for (let t = 0; t < TOTAL; t += 0.1) {
      const s = fabTimeline(t);
      expect(s.index).toBeGreaterThanOrEqual(prev);
      expect(s.local).toBeGreaterThanOrEqual(0);
      expect(s.local).toBeLessThanOrEqual(1);
      expect(s.done).toBe(false);
      prev = s.index;
    }
    expect(fabTimeline(TOTAL + 1)).toMatchObject({ index: STEPS.length - 1, done: true });
    expect(fabTimeline(STEPS[0].duration + 0.01).id).toBe('ebeam');
  });

  it('turns into the cutaway view and back, pulling the camera out meanwhile', () => {
    expect(fabBlend(0)).toBe(0);
    expect(fabBlend(TOTAL / 2)).toBe(1);
    expect(fabBlend(TOTAL)).toBeCloseTo(0, 9);
    expect(fabZoom(0)).toBe(1);
    expect(fabZoom(TOTAL / 2)).toBeGreaterThan(1.5);
  });

  it('the electron beam only writes inside the openings', () => {
    const { left, right } = openings(END);
    const grow = [...left, ...right].map(([x0, x1, y0, y1]) => [x0 - 1, x1 + 1, y0 - 1, y1 + 1]);
    const path = beamPath(END);
    expect(path.length).toBeGreaterThan(20);
    for (const [x, y] of path) expect(inside(grow, x, y)).toBe(true);
  });
});
