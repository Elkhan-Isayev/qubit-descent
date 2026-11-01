// Zoom engine: pure functions mapping scroll progress (0 = fridge, 1 = atom) to a field-of-view
// span in metres. Levels are evenly spaced in progress and log10(span) is linear between them,
// so every level gets the same amount of scrolling however many decades separate it from the next.

import { LEVELS } from './levels.js';

const LAST = LEVELS.length - 1;
const LOG_SPANS = LEVELS.map((l) => Math.log10(l.span));

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smoothstep = (x) => x * x * (3 - 2 * x);

// Progress at which level i is centred.
export const levelProgress = (i) => clamp(i, 0, LAST) / LAST;

export function spanAt(p) {
  const u = clamp(p) * LAST;
  const i = Math.min(Math.floor(u), LAST - 1);
  const f = u - i;
  return 10 ** (LOG_SPANS[i] + (LOG_SPANS[i + 1] - LOG_SPANS[i]) * f);
}

export function progressForSpan(span) {
  const s = Math.log10(span);
  if (s >= LOG_SPANS[0]) return 0;
  if (s <= LOG_SPANS[LAST]) return 1;
  let i = 0;
  while (LOG_SPANS[i + 1] > s) i++;
  return (i + (s - LOG_SPANS[i]) / (LOG_SPANS[i + 1] - LOG_SPANS[i])) / LAST;
}

// Index of the level closest to progress p.
export const levelAt = (p) => Math.round(clamp(p) * LAST);

// Target progress for the previous/next level from p (dir = -1 | +1).
export function stepLevel(p, dir) {
  const u = clamp(p) * LAST;
  const i = dir > 0 ? Math.floor(u + 1e-6) + 1 : Math.ceil(u - 1e-6) - 1;
  return levelProgress(i);
}

// How level i is drawn at progress p: its geometry is authored at unit size for its own span,
// so it is scaled by span_i / span(p); it is fully visible when centred and cross-fades to neighbours.
// A level we have zoomed past grows towards the camera, so it fades out faster than the next one fades in.
export const FADE_OUT = 0.55;

export function levelTransform(p, i) {
  const d = clamp(p) * LAST - i;
  return {
    scale: LEVELS[i].span / spanAt(p),
    opacity: smoothstep(clamp(d > 0 ? 1 - d / FADE_OUT : 1 + d)),
  };
}

const UNITS = [
  ['m', 1],
  ['cm', 1e-2],
  ['mm', 1e-3],
  ['µm', 1e-6],
  ['nm', 1e-9],
  ['pm', 1e-12],
];

// Human-readable length: largest unit in which the value is >= 1, with three significant digits.
export function formatLength(m) {
  const [unit, f] = UNITS.find(([, f]) => m >= f * 0.9995) ?? UNITS[UNITS.length - 1];
  const v = m / f;
  const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return { value: v.toFixed(digits), unit };
}
