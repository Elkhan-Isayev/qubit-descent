import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../src/levels.js';
import { FADE_OUT, formatLength, levelAt, levelProgress, levelTransform, progressForSpan, spanAt, stepLevel } from '../../src/zoom.js';

const N = LEVELS.length;
const close = (a, b, rel = 1e-9) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(rel);

describe('span ↔ progress', () => {
  it('hits every level span exactly at its own progress', () => {
    LEVELS.forEach((l, i) => close(spanAt(levelProgress(i)), l.span));
    expect(levelProgress(0)).toBe(0);
    expect(levelProgress(N - 1)).toBe(1);
  });

  it('decreases strictly from the fridge to the atom', () => {
    let prev = Infinity;
    for (let k = 0; k <= 1000; k++) {
      const s = spanAt(k / 1000);
      expect(s).toBeLessThan(prev);
      prev = s;
    }
  });

  it('is log-linear between neighbouring levels', () => {
    const mid = spanAt((levelProgress(2) + levelProgress(3)) / 2);
    close(mid, Math.sqrt(LEVELS[2].span * LEVELS[3].span));
  });

  it('clamps outside [0, 1]', () => {
    expect(spanAt(-3)).toBe(spanAt(0));
    expect(spanAt(7)).toBe(spanAt(1));
    expect(progressForSpan(100)).toBe(0);
    expect(progressForSpan(1e-15)).toBe(1);
  });

  it('progressForSpan inverts spanAt', () => {
    for (let k = 0; k <= 60; k++) {
      const p = k / 60;
      expect(progressForSpan(spanAt(p))).toBeCloseTo(p, 10);
    }
  });
});

describe('levels', () => {
  it('picks the nearest level and steps between them', () => {
    expect(levelAt(0)).toBe(0);
    expect(levelAt(1)).toBe(N - 1);
    expect(levelAt(levelProgress(3) + 0.4 / (N - 1))).toBe(3);
    expect(stepLevel(0, 1)).toBe(levelProgress(1));
    expect(stepLevel(levelProgress(2), 1)).toBe(levelProgress(3));
    expect(stepLevel(levelProgress(2), -1)).toBe(levelProgress(1));
    // from between levels, step to the next one in that direction
    const between = (levelProgress(2) + levelProgress(3)) / 2;
    expect(stepLevel(between, 1)).toBe(levelProgress(3));
    expect(stepLevel(between, -1)).toBe(levelProgress(2));
    expect(stepLevel(1, 1)).toBe(1);
    expect(stepLevel(0, -1)).toBe(0);
  });

  it('draws the centred level at unit scale and full opacity, the others hidden', () => {
    for (let i = 0; i < N; i++) {
      const p = levelProgress(i);
      const own = levelTransform(p, i);
      close(own.scale, 1);
      expect(own.opacity).toBe(1);
      for (let j = 0; j < N; j++) if (j !== i) expect(levelTransform(p, j).opacity).toBe(0);
    }
  });

  it('cross-fades: the level we zoomed past is larger and fades out first', () => {
    const p = levelProgress(1) + (0.5 * FADE_OUT) / (N - 1);
    const outer = levelTransform(p, 1);
    const inner = levelTransform(p, 2);
    expect(outer.scale).toBeGreaterThan(1);
    expect(inner.scale).toBeLessThan(1);
    expect(outer.opacity).toBeCloseTo(0.5, 10);
    expect(inner.opacity).toBeGreaterThan(0);
    expect(levelTransform(levelProgress(1) + FADE_OUT / (N - 1), 1).opacity).toBeCloseTo(0, 12);
  });
});

describe('formatLength', () => {
  it.each([
    [2, '2.00', 'm'],
    [3e-2, '3.00', 'cm'],
    [5e-3, '5.00', 'mm'],
    [6e-4, '600', 'µm'],
    [1e-6, '1.00', 'µm'],
    [1e-8, '10.0', 'nm'],
    [2.5e-9, '2.50', 'nm'],
    [0.999999e-3, '1.00', 'mm'],
    [5e-13, '0.50', 'pm'],
  ])('%s m → %s %s', (m, value, unit) => {
    expect(formatLength(m)).toEqual({ value, unit });
  });
});
