import { describe, expect, it } from 'vitest';
import { DIAMOND_BASIS, diamondLattice } from '../../src/levels/placeholders.js';

describe('silicon diamond lattice', () => {
  it('has 8 atoms per conventional cell', () => {
    expect(DIAMOND_BASIS).toHaveLength(8);
    expect(diamondLattice(3)).toHaveLength(8 * 27);
  });

  it('nearest-neighbour distance is a·√3/4 with four neighbours (tetrahedral)', () => {
    const pts = diamondLattice(3);
    const inner = pts.find(([x, y, z]) => x === 1.25 && y === 1.25 && z === 1.25);
    const d = pts.map((p) => Math.hypot(p[0] - inner[0], p[1] - inner[1], p[2] - inner[2])).filter((v) => v > 0);
    const nn = Math.min(...d);
    expect(nn).toBeCloseTo(Math.sqrt(3) / 4, 12);
    expect(d.filter((v) => Math.abs(v - nn) < 1e-9)).toHaveLength(4);
  });
});
