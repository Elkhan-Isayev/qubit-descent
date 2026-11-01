// The seven zoom levels, outermost first. `span` is the width of the field of view (metres)
// when the level is centred on screen. Every number shown in the UI comes from docs/DATA_SOURCES.md;
// the texts themselves live in i18n.js under the same ids.

export const SOURCES = {
  krinner2019: {
    label: 'Krinner et al. (2019), EPJ Quantum Technology 6, 2',
    url: 'https://doi.org/10.1140/epjqt/s40507-019-0072-0',
  },
  willowSpec: {
    label: 'Google Quantum AI, Willow spec sheet (2024)',
    url: 'https://quantumai.google/static/site-assets/downloads/willow-spec-sheet.pdf',
  },
  willow2025: {
    label: 'Google Quantum AI (2025), Nature 638, 920–926',
    url: 'https://doi.org/10.1038/s41586-024-08449-y',
  },
  qiskitMetal: {
    label: 'Qiskit Metal (Apache-2.0)',
    url: 'https://github.com/qiskit-community/qiskit-metal',
  },
  osman2021: {
    label: 'Osman et al. (2021), Appl. Phys. Lett. 118, 064002',
    url: 'https://doi.org/10.1063/5.0037093',
  },
  dolan1977: {
    label: 'Dolan (1977), Appl. Phys. Lett. 31, 337',
    url: 'https://doi.org/10.1063/1.89690',
  },
  zeng2015: {
    label: 'Zeng et al. (2015), J. Phys. D 48, 395308',
    url: 'https://doi.org/10.1088/0022-3727/48/39/395308',
  },
  fuechsle2012: {
    label: 'Fuechsle et al. (2012), Nature Nanotechnology 7, 242',
    url: 'https://doi.org/10.1038/nnano.2012.21',
  },
  nistSi: {
    label: 'NIST CODATA: lattice parameter of silicon',
    url: 'https://physics.nist.gov/cgi-bin/cuu/Value?asil',
  },
};

// facts: [i18n key of the label, value]. Values are language-neutral (units are SI symbols).
export const LEVELS = [
  {
    id: 'fridge',
    span: 2,
    facts: [
      ['f50k', '35 K'],
      ['f4k', '2.85 K'],
      ['fStill', '882 mK'],
      ['fCp', '82 mK'],
      ['fMxc', '6 mK'],
    ],
    sources: ['krinner2019'],
  },
  {
    id: 'package',
    span: 3e-2,
    facts: [['fQubitsWillow', '105']],
    sources: ['willowSpec'],
  },
  {
    id: 'chip',
    span: 5e-3,
    facts: [
      ['fD7Qubits', '101'],
      ['fD7Error', '0.143 %'],
    ],
    sources: ['qiskitMetal', 'willow2025'],
  },
  {
    id: 'transmon',
    span: 6e-4,
    facts: [
      ['fT1Osman', '> 50 µs'],
      ['fT1Willow', '68 ± 13 µs'],
    ],
    sources: ['qiskitMetal', 'osman2021', 'willowSpec'],
  },
  {
    id: 'junction',
    span: 1e-6,
    facts: [
      ['fJjArea', '0.01–0.16 µm²'],
      ['fJjStack', 'Al / AlOx / Al'],
    ],
    sources: ['dolan1977', 'osman2021'],
  },
  {
    id: 'barrier',
    span: 1e-8,
    facts: [
      ['fBarrierThick', '~1–2 nm'],
      ['fBarrierHot', '< 10 %'],
    ],
    sources: ['zeng2015'],
  },
  {
    id: 'atom',
    span: 2.5e-9,
    facts: [
      ['fPlacement', '1'],
      ['fSiLattice', '0.543 nm'],
    ],
    sources: ['fuechsle2012', 'nistSi'],
  },
];
