"""Shared helpers for the chip-geometry pipeline: GDS → polygons per layer, in micrometres.

Qiskit Metal writes GDS with user unit = 1 mm, KQCircuits with 1 µm, so everything is
normalised to micrometres here before meshing.
"""

from collections import defaultdict

import gdstk
import numpy as np

UM = 1e-6


def polygons_by_layer(lib, cell=None):
    """Flattened polygons of `cell` (default: the single top cell), grouped by (layer, datatype).

    Returns {(layer, datatype): [ndarray (n, 2) in µm, ...]}.
    """
    if cell is None:
        tops = lib.top_level()
        if len(tops) != 1:
            raise ValueError(f"expected one top cell, found {[c.name for c in tops]}")
        cell = tops[0]
    scale = lib.unit / UM
    out = defaultdict(list)
    for poly in cell.get_polygons():
        out[(poly.layer, poly.datatype)].append(np.asarray(poly.points, dtype=np.float64) * scale)
    return dict(out)


def bbox(polygons):
    """((xmin, ymin), (xmax, ymax)) over a list of (n, 2) arrays."""
    pts = np.concatenate(polygons)
    return tuple(pts.min(axis=0)), tuple(pts.max(axis=0))


def signed_area(points):
    """Shoelace area; positive for counter-clockwise rings."""
    x, y = points[:, 0], points[:, 1]
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


def read_gds(path):
    return gdstk.read_gds(path)


def merge_polygons(rings):
    """Union GDS polygons into proper polygons with holes.

    GDS has no holes: gdstk returns them as keyhole cuts, and big areas (the ground plane) as
    strips. Returns [(outer, [hole, ...]), ...] as (n, 2) arrays without the closing vertex,
    outer counter-clockwise and holes clockwise.
    """
    from shapely.geometry import Polygon
    from shapely.geometry.polygon import orient
    from shapely.ops import unary_union

    merged = unary_union([Polygon(r).buffer(0) for r in rings])
    out = []
    for poly in getattr(merged, "geoms", [merged]):
        if poly.is_empty:
            continue
        poly = orient(poly, sign=1.0)
        out.append((np.asarray(poly.exterior.coords)[:-1], [np.asarray(h.coords)[:-1] for h in poly.interiors]))
    return out
