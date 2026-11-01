import os

import gdstk
import numpy as np
import pytest

from common import bbox, polygons_by_layer, read_gds, signed_area


def make_lib(unit):
    """A 4 × 4 mm chip with an Xmon-like cross on layer 1 and a pad on layer 2, drawn in `unit`."""
    lib = gdstk.Library(unit=unit, precision=1e-9)
    top = lib.new_cell("TOP")
    s = 1e-3 / unit  # 1 mm in user units
    top.add(gdstk.rectangle((-2 * s, -2 * s), (2 * s, 2 * s), layer=0))
    top.add(gdstk.rectangle((-0.2 * s, -0.015 * s), (0.2 * s, 0.015 * s), layer=1))
    top.add(gdstk.rectangle((-0.015 * s, -0.2 * s), (0.015 * s, 0.2 * s), layer=1))
    sub = lib.new_cell("PAD")
    sub.add(gdstk.rectangle((0, 0), (0.1 * s, 0.1 * s), layer=2, datatype=10))
    top.add(gdstk.Reference(sub, (1 * s, 1 * s)))
    return lib


@pytest.mark.parametrize("unit", [1e-3, 1e-6])  # Qiskit Metal (mm) and KQCircuits (µm)
def test_polygons_are_in_micrometres_whatever_the_gds_unit(unit):
    layers = polygons_by_layer(make_lib(unit))
    assert sorted(layers) == [(0, 0), (1, 0), (2, 10)]
    lo, hi = bbox(layers[(0, 0)])
    assert lo == pytest.approx((-2000, -2000)) and hi == pytest.approx((2000, 2000))
    lo, hi = bbox(layers[(1, 0)])
    assert hi[0] - lo[0] == pytest.approx(400)


def test_references_are_flattened():
    layers = polygons_by_layer(make_lib(1e-3))
    lo, hi = bbox(layers[(2, 10)])
    assert lo == pytest.approx((1000, 1000)) and hi == pytest.approx((1100, 1100))


def test_round_trip_through_a_file(tmp_path):
    path = os.path.join(tmp_path, "chip.gds")
    make_lib(1e-3).write_gds(path)
    layers = polygons_by_layer(read_gds(path))
    assert len(layers[(1, 0)]) == 2


def test_rejects_ambiguous_top_cells():
    lib = make_lib(1e-3)
    lib.new_cell("STRAY")
    with pytest.raises(ValueError, match="one top cell"):
        polygons_by_layer(lib)


def test_signed_area():
    square = np.array([[0, 0], [2, 0], [2, 2], [0, 2]], dtype=float)
    assert signed_area(square) == pytest.approx(4)
    assert signed_area(square[::-1]) == pytest.approx(-4)
