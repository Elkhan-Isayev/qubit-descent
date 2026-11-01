import json
import os

import numpy as np
import pytest

from build_chip import FORMAT_VERSION, build, clean_ring
from conftest import DATA, ROOT
from common import signed_area


@pytest.fixture(scope="module")
def built():
    return build()


def rings_of(meta, xy):
    offs = meta["rings"]
    return [xy[offs[k] : offs[k + 1]] for k in range(len(offs) - 1)]


def test_layers_and_offsets_are_consistent(built):
    meta, xy = built
    assert meta["version"] == FORMAT_VERSION
    assert [l["role"] for l in meta["layers"]] == ["ground", "island", "trace"]
    assert meta["rings"][0] == 0 and meta["rings"][-1] == meta["vertexCount"] == len(xy)
    assert np.all(np.diff(meta["rings"]) >= 3)
    # layers tile the ring list without gaps or overlaps
    k = 0
    for layer in meta["layers"]:
        assert layer["ringStart"] == k
        k += len(layer["polygons"]) + sum(layer["polygons"])
    assert k == len(meta["rings"]) - 1


def test_geometry_lies_on_the_chip_in_micrometres(built):
    meta, xy = built
    assert np.isfinite(xy).all()
    half = meta["chip"]["width"] / 2
    assert half == 2000  # 4 mm chip
    assert np.abs(xy).max() <= half + 1e-3
    assert meta["bbox"] == [[-2000, -2000], [2000, 2000]]


def test_ground_plane_is_merged_with_real_holes(built):
    meta, xy = built
    ground = meta["layers"][0]
    assert len(ground["polygons"]) <= 3  # the GDS strips are unioned
    assert sum(ground["polygons"]) >= 8  # gaps around qubits and resonators are holes


def test_ring_orientation_outer_ccw_holes_cw(built):
    meta, xy = built
    rings = rings_of(meta, xy)
    for layer in meta["layers"]:
        k = layer["ringStart"]
        for n_holes in layer["polygons"]:
            assert signed_area(rings[k].astype(float)) > 0
            for h in range(1, n_holes + 1):
                assert signed_area(rings[k + h].astype(float)) < 0
            k += 1 + n_holes


def test_four_qubits_each_with_a_junction(built):
    meta, _ = built
    qubits = meta["qubits"]
    assert [q["name"] for q in qubits] == ["Q1", "Q2", "Q3", "Q4"]
    for q in qubits:
        j = q["junction"]
        # the junction sits on the qubit's bottom arm, within a few hundred µm of its centre
        assert j["x"] == pytest.approx(q["x"])
        assert 100 < q["y"] - j["y"] < 400
        assert 1 <= j["width"] <= 50


def test_islands_include_the_four_crosses(built):
    meta, xy = built
    rings = rings_of(meta, xy)
    island = meta["layers"][1]
    k = island["ringStart"]
    centres = []
    for n_holes in island["polygons"]:
        r = rings[k]
        centres.append(r.mean(axis=0))
        k += 1 + n_holes
    for q in meta["qubits"]:
        assert min(np.hypot(c[0] - q["x"], c[1] - q["y"]) for c in centres) < 5


def layer_shapes(meta, xy):
    """Each layer of web data as one shapely geometry."""
    from shapely.geometry import Polygon
    from shapely.ops import unary_union

    rings = rings_of(meta, xy)
    out = []
    for layer in meta["layers"]:
        k = layer["ringStart"]
        polys = []
        for n_holes in layer["polygons"]:
            polys.append(Polygon(rings[k], [rings[k + h] for h in range(1, n_holes + 1)]))
            k += 1 + n_holes
        out.append(unary_union(polys))
    return out


def test_committed_web_data_is_up_to_date(built):
    # Compared as geometry, not bytes: shapely/GEOS versions may start rings at a different vertex.
    meta, xy = built
    with open(os.path.join(DATA, "chip.json")) as f:
        committed = json.load(f)
    old = np.fromfile(os.path.join(DATA, "chip.bin"), dtype="<f4")
    assert len(old) == committed["vertexCount"] * 2, "public/data/chip.bin does not match chip.json"
    stale = "public/data is stale: run scripts/build_chip.py"
    for key in ["version", "chip", "qubits", "bbox"]:
        assert committed[key] == meta[key], stale
    assert [(l["role"], l["polygons"]) for l in committed["layers"]] == [(l["role"], l["polygons"]) for l in meta["layers"]], stale
    for new, ref in zip(layer_shapes(meta, xy), layer_shapes(committed, old.reshape(-1, 2))):
        assert new.symmetric_difference(ref).area < 1e-6 * max(ref.area, 1.0), stale


def test_design_json_matches_web_data(built):
    meta, _ = built
    with open(os.path.join(ROOT, "data", "chip_design.json")) as f:
        assert json.load(f)["qubits"] == meta["qubits"]


def test_clean_ring_drops_duplicates_and_collinear_points():
    ring = np.array([[0, 0], [1, 0], [2, 0], [2, 2], [2, 2], [0, 2], [0, 0]], dtype=float)
    out = clean_ring(ring)
    assert out.tolist() == [[0, 0], [2, 0], [2, 2], [0, 2]]
