# Data sources — Step 0 verification

Checked on 2026-11-01. Every number shown in the UI must trace back to a row here.
Anything marked **unverified** is not shown; in code it gets `// TODO: source`.

## 1. Geometry tools

| Tool | License | Status | Headless GDS export | Verdict |
|---|---|---|---|---|
| **Qiskit Metal** (IBM → Qiskit community / QDC), PyPI `quantum-metal` 0.9.0 | Apache-2.0 | Maintained by the community; CI on Python 3.10–3.14. A rename of the import path to `quantum_metal` is planned; 0.9.0 still imports as `qiskit_metal` (with a `FutureWarning`) | **Yes, tested.** `pip install --only-binary=:all: quantum-metal` on Python 3.13 (macOS arm64). Built TransmonCross (Xmon) + TransmonPocket + RouteMeander readout resonator → `export_to_gds` → read back with gdstk: 51 polygons on layer 1 (datatypes 0/10/11), 4 × 4 mm chip. Ansys not needed | **Primary source for levels 3–4.** Permissive license, safe to ship the generated mesh |
| **KQCircuits** (IQM), PyPI `kqcircuits` 4.9.14 + `klayout` 0.30.12 | **GPL-3.0** (KLayout GPL-3.0-or-later). "KQCircuits" is an IQM trademark, use is governed by IQM's open-source trademark policy | Active | **Yes, tested.** Standalone, no GUI: `Swissmon.create(layout)` → `layout.write(...gds)`, bbox ≈ 638 × 664 µm | **Optional, build time only** (same approach as pygplates in pangaea-drift). Use it only for an "IQM-style" comparison qubit. Credit IQM without implying endorsement |
| **gdstk** 1.0.2 | Boost Software License 1.0 | Active | Reads GDS → polygons per layer | GDS → JSON/bin converter |

Notes:
- Qiskit Metal draws the Josephson junction as a **placeholder line**, not real geometry. Level 5 is therefore built procedurally from the paper numbers below, not from GDS.
- `scipy` failed to build from source under plain `pip install`; `--only-binary=:all:` fixes it. Pin Python 3.13 for `.venv-metal` (the package requires `<3.15`, and the system Python is 3.15).

## 2. Numbers per level

### Level 1 — Dilution refrigerator
Source: Krinner, S. et al. (2019). *Engineering cryogenic setups for 100-qubit scale superconducting circuit systems.* **EPJ Quantum Technology** 6, 2. [doi:10.1140/epjqt/s40507-019-0072-0](https://doi.org/10.1140/epjqt/s40507-019-0072-0) (open access, CC BY 4.0), Table 1, Bluefors XLD400, empty fridge:

| Stage | Temperature | Coax length to this stage |
|---|---|---|
| Room temperature | 300 K | — |
| 50K plate | **35 K** | 200 mm |
| 4K plate | **2.85 K** | 290 mm |
| Still | **882 mK** | 250 mm |
| Cold plate (CP) | **82 mK** | 170 mm |
| Mixing chamber (MXC) | **6 mK** | 140 mm |

Cable lengths give realistic plate spacing for the procedural model. The same paper operates qubits at 14 mK with a loaded setup.
- **Unverified:** "~3 m tall". The paper gives only stage-to-stage spacing (≈1 m total from 50K plate to MXC). Proposal: the HUD shows "≈1 m from the 50K plate to the MXC", taken from the cable lengths, instead of "3 m".

### Level 2–3 — Chip (reference: Google Willow)
- Acharya, R. et al. (Google Quantum AI) (2025). *Quantum error correction below the surface code threshold.* **Nature** 638, 920–926. [doi:10.1038/s41586-024-08449-y](https://doi.org/10.1038/s41586-024-08449-y); arXiv:2408.13687 (CC BY 4.0). Distance-7 surface code on **101 qubits** (49 data + 48 measure + 4 leakage-removal), **0.143 % ± 0.003 %** logical error per cycle, Λ = 2.14 ± 0.02.
- Google Quantum AI, *Willow spec sheet* (2024-12-09), [PDF](https://quantumai.google/static/site-assets/downloads/willow-spec-sheet.pdf): **105 qubits**; mean T1 **68 ± 13 µs** (QEC chip), **98 ± 32 µs** (RCS chip). The caption must name the chip.
- The Willow layout is **not** public. The chip we render is a Qiskit Metal design and is labeled "representative layout", not "Willow".

#### Generated chip (levels 3–4)
- `scripts/design_chip.py` builds our own 4 × 4 mm layout from Qiskit Metal library components: 4 × `TransmonCross` (Xmon), quarter-wave readout resonators (`RouteMeander`, 3.70–4.15 mm) coupled to a feedline via `CoupledLineTee`, nearest-neighbour buses, a drive line per qubit, and wire-bond launch pads. CPW: 10 µm trace, 6 µm gap.
- Output: `data/chip.gds` (committed) and `data/chip_design.json` (qubit and junction positions). `scripts/build_chip.py` (gdstk + shapely, no Metal needed) merges each GDS layer into polygons with real holes and writes `public/data/chip.json` + `chip.bin` (~19 KiB).
- Metal does not draw the junction itself, so its position is marked with a glow and the junction geometry comes from level 5.
- Film and substrate thicknesses in 3D are exaggerated for visibility and never shown as numbers.

### Level 4 — Transmon
- Geometry: the Qiskit Metal `TransmonCross` from section 1 (real parametric design).
- Osman, A. et al. (2021). *Simplified Josephson-junction fabrication process for reproducibly high-performance superconducting qubits.* **Appl. Phys. Lett.** 118, 064002. [doi:10.1063/5.0037093](https://doi.org/10.1063/5.0037093); arXiv:2011.05230. Xmon qubits, mean T1 > 50 µs.

### Level 5 — Josephson junction (MVP animation)
- Dolan, G. J. (1977). *Offset masks for lift-off photoprocessing.* **Appl. Phys. Lett.** 31(5), 337–339. [doi:10.1063/1.89690](https://doi.org/10.1063/1.89690) (DOI resolved). The suspended-bridge resist mask + oblique-angle evaporation (the Niemeyer–Dolan technique).
- Osman et al. 2021 (above): junction areas **0.01–0.16 µm²**, single lithography step, one vacuum cycle (cross-type junction).
- **Unverified:** the specific evaporation angles (e.g. ±X°) and electrode thicknesses. The animation shows "two angles" with no numbers until a source is found.

### Level 6 — AlOx barrier
- Zeng, L. J. et al. (2015). *Direct observation of the thickness distribution of ultra thin AlOx barriers in Al/AlOx/Al Josephson junctions.* **J. Phys. D: Appl. Phys.** 48, 395308. [doi:10.1088/0022-3727/48/39/395308](https://doi.org/10.1088/0022-3727/48/39/395308) (open access). TEM: barrier thickness varies **~1 to ~2 nm** (Gaussian). **< 10 %** of the junction area dominates tunnelling. Both figures make good caption material.

### Level 7 — Single phosphorus atom
- Fuechsle, M. et al. (2012). *A single-atom transistor.* **Nature Nanotechnology** 7, 242–246. [doi:10.1038/nnano.2012.21](https://doi.org/10.1038/nnano.2012.21) (DOI resolved). STM hydrogen-resist lithography; one P atom placed with an accuracy of **one lattice site**; operates at liquid-helium temperature, measured at mK.
- Silicon lattice constant **a = 0.543 nm** (NIST CODATA, [physics.nist.gov](https://physics.nist.gov/cgi-bin/cuu/Value?asil)) for the diamond-lattice reconstruction.
- **Unverified:** device dimensions (not in the abstract; the full text is paywalled). Not shown.

### v2 — "Three ways to print a qubit"
- Intel Tunnel Falls, 12-qubit silicon spin chip, 300 mm wafers, EUV, 95 % yield, per [Intel newsroom (2023)](https://www.intel.com/content/www/us/en/newsroom/news/quantum-computing-chip-to-advance-research.html); preprint: *12-spin-qubit arrays fabricated on a 300 mm semiconductor manufacturing line*, arXiv:2410.16583.
- imec: Elsayed, A. et al. (2024). *Low charge noise quantum dots with industrial CMOS manufacturing.* **npj Quantum Information** 10. [doi:10.1038/s41534-024-00864-3](https://doi.org/10.1038/s41534-024-00864-3); arXiv:2212.06464. 300 mm line, mean charge noise **0.61 µeV/√Hz** at 1 Hz.

## 3. Rules carried forward
- No figures or images copied from papers: numbers only, plus our own 3D reconstruction.
- Labels name the organization of the *source*. A representative chip is never labeled as a vendor's product.
