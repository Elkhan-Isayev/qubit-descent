"""Design the representative 4-qubit chip in Qiskit Metal and export it as GDS.

Four Xmon-style transmons (TransmonCross), each with a quarter-wave readout resonator
inductively coupled to a common feedline, nearest-neighbour bus couplers and a drive line.
This is our own layout built from Qiskit Metal's component library (Apache-2.0); it is
representative of the architecture, not a copy of any vendor's chip.

Needs .venv-metal (see requirements-pipeline.txt). Writes:
  data/chip.gds         the mask layout (committed, so build_chip.py runs without Metal)
  data/chip_design.json component positions in µm (qubit and junction centres)

Usage: .venv-metal/bin/python scripts/design_chip.py
"""

import json
import os
import warnings

warnings.filterwarnings("ignore")

from qiskit_metal import designs  # noqa: E402
from qiskit_metal.qlibrary.couplers.coupled_line_tee import CoupledLineTee  # noqa: E402
from qiskit_metal.qlibrary.qubits.transmon_cross import TransmonCross  # noqa: E402
from qiskit_metal.qlibrary.terminations.launchpad_wb import LaunchpadWirebond  # noqa: E402
from qiskit_metal.qlibrary.terminations.open_to_ground import OpenToGround  # noqa: E402
from qiskit_metal.qlibrary.tlines.meandered import RouteMeander  # noqa: E402
from qiskit_metal.qlibrary.tlines.straight_path import RouteStraight  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "data")

CHIP_MM = 4.0
QUBIT_X_MM = [-1.2, -0.4, 0.4, 1.2]
QUBIT_Y_MM = -0.55
FEED_Y_MM = 0.9
DRIVE_Y_MM = -1.75
# Slightly different resonator lengths give each qubit its own readout frequency.
READOUT_LENGTH_MM = [3.7, 3.85, 4.0, 4.15]


def pin(component, name):
    return dict(component=component, pin=name)


def build():
    design = designs.DesignPlanar({}, overwrite_enabled=True)
    design.chips.main.size["size_x"] = f"{CHIP_MM}mm"
    design.chips.main.size["size_y"] = f"{CHIP_MM}mm"
    design.variables["cpw_width"] = "10um"
    design.variables["cpw_gap"] = "6um"

    for i, x in enumerate(QUBIT_X_MM):
        pads = dict(readout=dict(connector_location="90"))
        if i > 0:
            pads["bus_w"] = dict(connector_location="0")
        if i < len(QUBIT_X_MM) - 1:
            pads["bus_e"] = dict(connector_location="180")
        TransmonCross(design, f"Q{i + 1}", options=dict(pos_x=f"{x}mm", pos_y=f"{QUBIT_Y_MM}mm", connection_pads=pads))

    # feedline with one coupled-line tee per resonator
    half = CHIP_MM / 2 - 0.25
    LaunchpadWirebond(design, "LP_in", options=dict(pos_x=f"{-half}mm", pos_y=f"{FEED_Y_MM}mm", orientation="0"))
    LaunchpadWirebond(design, "LP_out", options=dict(pos_x=f"{half}mm", pos_y=f"{FEED_Y_MM}mm", orientation="180"))
    prev = pin("LP_in", "tie")
    for i, x in enumerate(QUBIT_X_MM):
        CoupledLineTee(design, f"T{i + 1}", options=dict(pos_x=f"{x}mm", pos_y=f"{FEED_Y_MM}mm", coupling_length="180um", mirror=True))
        RouteStraight(design, f"feed{i}", options=dict(pin_inputs=dict(start_pin=prev, end_pin=pin(f"T{i + 1}", "prime_start"))))
        prev = pin(f"T{i + 1}", "prime_end")
        RouteMeander(
            design,
            f"R{i + 1}",
            options=dict(
                total_length=f"{READOUT_LENGTH_MM[i]}mm",
                fillet="49um",
                lead=dict(start_straight="120um", end_straight="80um"),
                meander=dict(spacing="90um", asymmetry="0um"),
                pin_inputs=dict(start_pin=pin(f"T{i + 1}", "second_end"), end_pin=pin(f"Q{i + 1}", "readout")),
            ),
        )
    RouteStraight(design, "feed4", options=dict(pin_inputs=dict(start_pin=prev, end_pin=pin("LP_out", "tie"))))

    # nearest-neighbour bus couplers
    for i in range(len(QUBIT_X_MM) - 1):
        RouteStraight(design, f"bus{i + 1}", options=dict(pin_inputs=dict(start_pin=pin(f"Q{i + 1}", "bus_e"), end_pin=pin(f"Q{i + 2}", "bus_w"))))

    # drive lines from the bottom edge, ending in an open just below each qubit (the junction arm)
    for i, x in enumerate(QUBIT_X_MM):
        LaunchpadWirebond(design, f"LP_d{i + 1}", options=dict(pos_x=f"{x}mm", pos_y=f"{DRIVE_Y_MM}mm", orientation="90"))
        OpenToGround(design, f"open_d{i + 1}", options=dict(pos_x=f"{x}mm", pos_y=f"{QUBIT_Y_MM - 0.42}mm", orientation="270"))
        RouteStraight(design, f"drive{i + 1}", options=dict(pin_inputs=dict(start_pin=pin(f"LP_d{i + 1}", "tie"), end_pin=pin(f"open_d{i + 1}", "open"))))

    design.rebuild()
    return design


def component_positions(design):
    """Qubit centres and junction midpoints in µm (design units are mm)."""
    qubits = []
    for name, comp in design.components.items():
        if not name.startswith("Q"):
            continue
        q = dict(name=name, x=float(comp.options.pos_x.rstrip("mm")) * 1000, y=float(comp.options.pos_y.rstrip("mm")) * 1000)
        jj = design.qgeometry.tables["junction"]
        rows = jj[jj.component == comp.id]
        if len(rows):
            (x0, y0), (x1, y1) = list(rows.iloc[0].geometry.coords)[:2]
            q["junction"] = dict(x=(x0 + x1) / 2 * 1000, y=(y0 + y1) / 2 * 1000, width=float(rows.iloc[0].width) * 1000)
        qubits.append(q)
    return dict(chip_um=CHIP_MM * 1000, qubits=qubits)


def export(design, gds_path):
    gds = design.renderers.gds
    gds.options["no_cheese"]["view_in_file"] = {"main": {1: False}}
    gds.options["cheese"]["view_in_file"] = {"main": {1: False}}
    gds.export_to_gds(gds_path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    design = build()
    export(design, os.path.join(OUT_DIR, "chip.gds"))
    with open(os.path.join(OUT_DIR, "chip_design.json"), "w") as f:
        json.dump(component_positions(design), f, indent=1)
    print("wrote data/chip.gds and data/chip_design.json")


if __name__ == "__main__":
    main()
