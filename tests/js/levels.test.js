import { describe, expect, it } from 'vitest';
import { parseChip } from '../../src/data.js';
import { LEVELS } from '../../src/levels.js';
import { AL_LATTICE_NM, HOT_FRACTION, T_MAX, T_MIN, fccSites, thicknessField } from '../../src/levels/barrier.js';
import { STAGE_SPACING_MM, parseTemperature, stages, temperatureColour } from '../../src/levels/fridge.js';
import { OVERLAP_NM } from '../../src/levels/junction.js';
import { bondPads } from '../../src/levels/package.js';
import { readBuffer, readJson } from './helpers.js';

const fact = (level, key) => LEVELS.find((l) => l.id === level).facts.find(([k]) => k === key)[1];

describe('fridge', () => {
  it('parses stage temperatures', () => {
    expect(parseTemperature('882 mK')).toBeCloseTo(0.882, 12);
    expect(parseTemperature('2.85 K')).toBe(2.85);
    expect(() => parseTemperature('cold')).toThrow();
  });

  it('stacks the stages from room temperature down, spaced by the Krinner et al. cable lengths', () => {
    const s = stages();
    expect(s.map((x) => x.key)).toEqual(['fRoom', 'f50k', 'f4k', 'fStill', 'fCp', 'fMxc']);
    expect(s[0].y).toBe(0);
    expect(-s[s.length - 1].y).toBe(STAGE_SPACING_MM.reduce((a, b) => a + b, 0));
    expect(-s[s.length - 1].y).toBe(1050);
    for (let i = 1; i < s.length; i++) {
      expect(s[i].y).toBeLessThan(s[i - 1].y);
      expect(s[i].kelvin).toBeLessThan(s[i - 1].kelvin);
    }
    // the labels are the very strings shown on the level card
    expect(s[5].label).toBe(fact('fridge', 'fMxc'));
  });

  it('colours get colder (bluer) with every stage', () => {
    const cols = stages().map((s) => temperatureColour(s.kelvin));
    for (let i = 1; i < cols.length; i++) expect(cols[i].b - cols[i].r).toBeGreaterThan(cols[i - 1].b - cols[i - 1].r);
  });
});

describe('sample holder', () => {
  it('finds one wire-bond pad per launch pad: two for the feedline, four drive lines', () => {
    const chip = parseChip(readJson('chip.json'), readBuffer('chip.bin'));
    const pads = bondPads(chip);
    expect(pads).toHaveLength(6);
    expect(pads.filter((p) => p.side[0] !== 0)).toHaveLength(2);
    expect(pads.filter((p) => p.side[1] === -1)).toHaveLength(4);
    for (const p of pads) expect(Math.max(Math.abs(p.x), Math.abs(p.y))).toBeLessThan(2); // on the 4 mm chip
  });
});

describe('junction', () => {
  it('has an overlap area inside the range reported by Osman et al. (2021)', () => {
    const areaUm2 = (OVERLAP_NM / 1000) ** 2;
    expect(fact('junction', 'fJjArea')).toBe('0.01–0.16 µm²');
    expect(areaUm2).toBeGreaterThanOrEqual(0.01);
    expect(areaUm2).toBeLessThanOrEqual(0.16);
  });
});

describe('tunnel barrier', () => {
  const { t, hot, samples } = thicknessField();

  it('varies between ~1 and ~2 nm, as measured by Zeng et al. (2015)', () => {
    expect(T_MIN).toBe(1);
    expect(T_MAX).toBe(2);
    expect(samples[0]).toBeCloseTo(T_MIN, 9);
    expect(samples[samples.length - 1]).toBeCloseTo(T_MAX, 9);
    for (let x = -3; x <= 3; x += 0.37) for (let y = -1; y <= 1; y += 0.29) {
      expect(t(x, y)).toBeGreaterThanOrEqual(T_MIN - 1e-9);
      expect(t(x, y)).toBeLessThanOrEqual(T_MAX + 1e-9);
    }
  });

  it('marks less than 10 % of the area as hot spots', () => {
    const fraction = samples.filter((v) => v <= hot).length / samples.length;
    expect(fraction).toBeCloseTo(HOT_FRACTION, 2);
    expect(fraction).toBeLessThan(0.1);
  });

  it('builds aluminium as an fcc crystal (4 atoms per cell, neighbours at a/√2)', () => {
    const a = AL_LATTICE_NM;
    const pts = fccSites([0, 3 * a - 1e-9], [0, 3 * a - 1e-9], [0, 3 * a - 1e-9]);
    expect(pts).toHaveLength(4 * 27);
    const [x, y, z] = pts.find(([px, py, pz]) => px > a && py > a && pz > a);
    const d = pts.map(([px, py, pz]) => Math.hypot(px - x, py - y, pz - z)).filter((v) => v > 1e-9);
    expect(Math.min(...d)).toBeCloseTo(a / Math.SQRT2, 9);
  });
});
