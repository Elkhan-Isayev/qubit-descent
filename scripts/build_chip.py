"""Convert the chip mask (data/chip.gds) into compact polygon data for the browser.

Output (public/data/):
  chip.json  layers, ring offsets, chip size and qubit/junction positions
  chip.bin   Float32 little-endian x, y pairs in µm, chip centre at the origin

Polygons are merged per layer and rebuilt with real holes (GDS stores holes as keyhole cuts,
which triangulate badly). A layer is a list of polygons; each polygon is stored as consecutive
rings, outer first (counter-clockwise) then its holes (clockwise). The browser extrudes each layer
into a thin metal film.

Usage: python scripts/build_chip.py   (needs gdstk, numpy, shapely)
"""

import json
import os

import numpy as np

from common import merge_polygons, polygons_by_layer, read_gds

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GDS = os.path.join(ROOT, "data", "chip.gds")
DESIGN = os.path.join(ROOT, "data", "chip_design.json")
OUT = os.path.join(ROOT, "public", "data")

# Qiskit Metal's GDS renderer: datatype 0 = ground plane with the gaps already subtracted,
# 10 = metal of component polygons (qubit crosses, claws, launch pads), 11 = CPW centre traces.
ROLES = {(1, 0): "ground", (1, 10): "island", (1, 11): "trace"}

FORMAT_VERSION = 2


def clean_ring(points, tol=1e-3):
    """Drop the closing duplicate, repeated vertices and collinear points (tolerance in µm)."""
    pts = np.asarray(points, dtype=np.float64)
    if len(pts) > 1 and np.allclose(pts[0], pts[-1]):
        pts = pts[:-1]
    # repeated vertices first: a duplicate would make both copies look collinear and drop the corner
    pts = pts[np.hypot(*(pts - np.roll(pts, 1, axis=0)).T) > tol]
    keep = np.ones(len(pts), dtype=bool)
    for _ in range(2):  # a second pass catches points made collinear by the first
        idx = np.flatnonzero(keep)
        p = pts[idx]
        prev, nxt = np.roll(p, 1, axis=0), np.roll(p, -1, axis=0)
        cross = (p[:, 0] - prev[:, 0]) * (nxt[:, 1] - prev[:, 1]) - (p[:, 1] - prev[:, 1]) * (nxt[:, 0] - prev[:, 0])
        seg = np.hypot(*(nxt - prev).T)
        dist = np.abs(cross) / np.where(seg > 0, seg, 1)
        keep[idx[dist < tol]] = False
    return pts[keep]


def build(gds_path=GDS, design_path=DESIGN):
    layers = polygons_by_layer(read_gds(gds_path))
    unknown = set(layers) - set(ROLES)
    if unknown:
        raise ValueError(f"unexpected GDS layers {sorted(unknown)}")

    coords, ring_offsets, out_layers = [], [0], []
    for key in sorted(ROLES):
        start = len(ring_offsets) - 1
        holes_per_polygon = []
        for outer, holes in merge_polygons(layers.get(key, [])):
            rings = [clean_ring(r) for r in [outer, *holes]]
            if len(rings[0]) < 3:
                continue
            rings = [rings[0], *(h for h in rings[1:] if len(h) >= 3)]
            holes_per_polygon.append(len(rings) - 1)
            for r in rings:
                coords.append(r)
                ring_offsets.append(ring_offsets[-1] + len(r))
        out_layers.append(dict(role=ROLES[key], gds=list(key), ringStart=start, polygons=holes_per_polygon))

    xy = np.concatenate(coords).astype("<f4")
    with open(design_path) as f:
        design = json.load(f)
    lo, hi = xy.min(axis=0), xy.max(axis=0)
    meta = dict(
        version=FORMAT_VERSION,
        source="data/chip.gds, generated with Qiskit Metal (scripts/design_chip.py)",
        units="um",
        chip=dict(width=design["chip_um"], height=design["chip_um"]),
        bbox=[[round(float(lo[0]), 3), round(float(lo[1]), 3)], [round(float(hi[0]), 3), round(float(hi[1]), 3)]],
        vertexCount=int(len(xy)),
        rings=ring_offsets,
        layers=out_layers,
        qubits=design["qubits"],
    )
    return meta, xy


def write(meta, xy, out_dir=OUT):
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "chip.json"), "w") as f:
        json.dump(meta, f, separators=(",", ":"))
    xy.tofile(os.path.join(out_dir, "chip.bin"))


def main():
    meta, xy = build()
    write(meta, xy)
    per = ", ".join(f"{l['role']} {len(l['polygons'])} polygons / {sum(l['polygons'])} holes" for l in meta["layers"])
    print(f"chip: {meta['vertexCount']} vertices, {len(meta['rings']) - 1} rings ({per}), {xy.nbytes / 1024:.0f} KiB")


if __name__ == "__main__":
    main()
