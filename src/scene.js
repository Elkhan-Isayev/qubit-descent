import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LEVELS } from './levels.js';
import { buildAtom } from './levels/atom.js';
import { buildBarrier } from './levels/barrier.js';
import { buildChipModel, chipFoci } from './levels/chip.js';
import { buildFridge } from './levels/fridge.js';
import { buildPackage } from './levels/package.js';
import { collectMaterials, nestedCopy } from './levels/util.js';
import { modelOpacity, spanAt, tiltBetween, zoomCentre } from './zoom.js';

const FOV = 22;
// Viewing angles (radians about x): the fridge seen slightly from above, the chip from above-front,
// and the tunnel barrier side-on like a TEM cross-section.
const FRIDGE_TILT = 0.28;
const CHIP_TILT = -0.62;
const SIDE_TILT = -1.32;

const levelIndex = (id) => LEVELS.findIndex((l) => l.id === id);
const descentTilt = (p) => tiltBetween(p, levelIndex('junction'), levelIndex('barrier'), CHIP_TILT, SIDE_TILT);

export class DescentScene {
  constructor(canvas, chip) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040a);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environmentIntensity = 0.45;

    const key = new THREE.DirectionalLight(0xdfeaff, 1.6);
    key.position.set(2, 3, 4);
    const rim = new THREE.DirectionalLight(0x6fa8ff, 0.8);
    rim.position.set(-3, 1, -2);
    this.scene.add(key, rim, new THREE.HemisphereLight(0x9fc8ff, 0x0a0d14, 0.4));

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);

    // A model is drawn on a run of levels. `units` is metres per model unit; `foci` are the model points
    // centred at each level, so the zoom flies into the right spot; nested copies of the next model sit
    // at its focus so the hand-over between models is seamless.
    const chipModel = buildChipModel(chip);
    const chipInHolder = nestedCopy(chipModel.object);
    chipInHolder.scale.setScalar(1e-3); // µm → mm
    const fridge = buildFridge(buildPackage(chip, chipInHolder), CHIP_TILT - FRIDGE_TILT);
    const barrier = buildBarrier();
    const atom = buildAtom();

    this.models = [
      this.addModel(fridge.object, {
        levels: ['fridge', 'package'],
        units: 1e-3,
        foci: { fridge: fridge.centre, package: fridge.holder, chip: fridge.holder },
        tilt: () => FRIDGE_TILT,
        anchors: fridge.anchors,
      }),
      this.addModel(chipModel.object, {
        levels: ['chip', 'transmon', 'junction'],
        units: 1e-6,
        foci: chipFoci(chip),
        tilt: descentTilt,
        update: ({ span }) => chipModel.update(span),
      }),
      this.addModel(barrier.object, {
        levels: ['barrier'],
        units: 1e-9,
        foci: { barrier: [0, 0, 0] },
        tilt: descentTilt,
        update: ({ dt }) => barrier.update(dt),
      }),
      this.addModel(atom.object, {
        levels: ['atom'],
        units: 1e-9,
        foci: { atom: [0, 0, 0] },
        tilt: () => 0,
        update: ({ dt }) => atom.update(dt),
      }),
    ];

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.4, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.time = 0;
    this.resize();
  }

  addModel(object, { levels, units, foci, tilt, update = null, anchors = [] }) {
    // outer: tilt about the view centre; inner: zoom scale and offset; object: authored transform
    const outer = new THREE.Group();
    const inner = new THREE.Group().add(object);
    outer.add(inner);
    this.scene.add(outer);
    // remember each material's own opacity; fading multiplies it, and a material only becomes
    // transparent while it fades (so solid models keep correct depth sorting)
    const materials = collectMaterials(object);
    for (const m of materials) m.userData.fade = { opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite };
    return {
      outer,
      inner,
      object,
      materials,
      units,
      tilt,
      update,
      anchors,
      opacity: 0,
      levels: levels.map(levelIndex),
      foci: LEVELS.map((l) => foci[l.id] ?? null),
    };
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = aspect;
    // Fit one world unit to the smaller screen dimension, so "field of view" = the current span.
    const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    this.distance = aspect >= 1 ? 0.5 / half : 0.5 / (half * aspect);
    // On portrait screens the level card covers the lower part: centre the subject in the upper half.
    if (aspect < 0.8) this.camera.setViewOffset(w, h, 0, h * 0.2, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  update(progress, dt) {
    this.time += dt;
    const sway = 0.12 * Math.sin(this.time * 0.17);
    this.camera.position.set(Math.sin(sway) * this.distance, 0.04 * this.distance * Math.sin(this.time * 0.11), Math.cos(sway) * this.distance);
    this.camera.lookAt(0, 0, 0);

    const span = spanAt(progress);
    for (const m of this.models) {
      const opacity = modelOpacity(progress, m.levels);
      m.opacity = opacity;
      m.outer.visible = opacity > 0.004;
      if (!m.outer.visible) continue;
      const scale = m.units / span;
      const [cx, cy, cz] = zoomCentre(progress, m.foci);
      m.outer.rotation.x = m.tilt(progress);
      m.inner.scale.setScalar(scale);
      m.inner.position.set(-cx * scale, -cy * scale, -cz * scale);
      m.update?.({ dt, span: span / m.units });
      for (const mat of m.materials) {
        const { opacity: base, transparent, depthWrite } = mat.userData.fade;
        mat.opacity = base * opacity;
        mat.transparent = transparent || opacity < 0.999;
        // a model fading away stops hiding what is behind (or inside) it, e.g. the barrier under the electrode
        mat.depthWrite = depthWrite && opacity > 0.6;
      }
    }
    this.composer.render();
  }

  // Screen positions of the labelled 3D anchors (CSS pixels), with the opacity of their model.
  labels() {
    const out = [];
    const v = new THREE.Vector3();
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (const m of this.models) {
      if (!m.anchors.length) continue;
      for (const a of m.anchors) {
        v.copy(a.position);
        m.object.localToWorld(v).project(this.camera);
        const onScreen = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
        out.push({ key: a.key, text: a.text, x: (v.x + 1) * 0.5 * w, y: (1 - v.y) * 0.5 * h, opacity: onScreen ? m.opacity : 0 });
      }
    }
    return out;
  }
}
