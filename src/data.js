// Loading and parsing of the generated geometry in public/data (see scripts/build_chip.py).

export const CHIP_FORMAT_VERSION = 2;

// meta: parsed chip.json; buffer: ArrayBuffer of chip.bin (Float32 x, y pairs in µm).
// Returns layers as lists of polygons { outer, holes }, each ring a flat [x0, y0, x1, y1, …] view.
export function parseChip(meta, buffer) {
  if (meta.version !== CHIP_FORMAT_VERSION) throw new Error(`chip.json: unsupported version ${meta.version}`);
  const xy = new Float32Array(buffer);
  if (xy.length !== meta.vertexCount * 2) throw new Error(`chip.bin: expected ${meta.vertexCount} vertices, got ${xy.length / 2}`);
  const { rings } = meta;
  if (rings[0] !== 0 || rings[rings.length - 1] !== meta.vertexCount) throw new Error('chip.json: ring offsets do not cover chip.bin');

  const ring = (k) => xy.subarray(rings[k] * 2, rings[k + 1] * 2);
  const layers = meta.layers.map((l) => {
    let k = l.ringStart;
    const polygons = l.polygons.map((nHoles) => {
      const outer = ring(k++);
      const holes = Array.from({ length: nHoles }, () => ring(k++));
      return { outer, holes };
    });
    return { role: l.role, polygons };
  });
  return { chip: meta.chip, qubits: meta.qubits, layers };
}

async function fetchOk(url, as) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not load ${url} (${res.status})`);
  return res[as]();
}

export async function loadChip(base = import.meta.env.BASE_URL) {
  const [meta, buffer] = await Promise.all([fetchOk(`${base}data/chip.json`, 'json'), fetchOk(`${base}data/chip.bin`, 'arrayBuffer')]);
  return parseChip(meta, buffer);
}
