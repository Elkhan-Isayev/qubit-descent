import { describe, expect, it } from 'vitest';
import { CHIP_FORMAT_VERSION, parseChip } from '../../src/data.js';
import { readBuffer, readJson } from './helpers.js';

const meta = readJson('chip.json');
const buffer = readBuffer('chip.bin');

// shoelace area of a flat [x0, y0, x1, y1, …] ring
const area = (r) => {
  let a = 0;
  for (let k = 0; k < r.length; k += 2) {
    const j = (k + 2) % r.length;
    a += r[k] * r[j + 1] - r[j] * r[k + 1];
  }
  return a / 2;
};

describe('chip data', () => {
  const chip = parseChip(meta, buffer);

  it('parses the committed chip into ground, island and trace layers', () => {
    expect(meta.version).toBe(CHIP_FORMAT_VERSION);
    expect(chip.layers.map((l) => l.role)).toEqual(['ground', 'island', 'trace']);
    for (const l of chip.layers) expect(l.polygons.length).toBeGreaterThan(0);
  });

  it('uses every vertex exactly once', () => {
    let n = 0;
    for (const l of chip.layers) for (const p of l.polygons) for (const r of [p.outer, ...p.holes]) n += r.length / 2;
    expect(n).toBe(meta.vertexCount);
  });

  it('keeps outer rings counter-clockwise and holes clockwise, all on the 4 mm chip', () => {
    for (const l of chip.layers)
      for (const p of l.polygons) {
        expect(area(p.outer)).toBeGreaterThan(0);
        for (const h of p.holes) expect(area(h)).toBeLessThan(0);
        for (const v of p.outer) expect(Math.abs(v)).toBeLessThanOrEqual(2000.001);
      }
    expect(chip.chip).toEqual({ width: 4000, height: 4000 });
  });

  it('exposes qubits with junction positions', () => {
    expect(chip.qubits.map((q) => q.name)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    for (const q of chip.qubits) expect(q.junction.y).toBeLessThan(q.y);
  });

  it('rejects mismatched or unknown data', () => {
    expect(() => parseChip({ ...meta, version: 99 }, buffer)).toThrow(/version/);
    expect(() => parseChip(meta, buffer.slice(0, 64))).toThrow(/vertices/);
    expect(() => parseChip({ ...meta, rings: [1, ...meta.rings.slice(1)] }, buffer)).toThrow(/ring offsets/);
  });
});
