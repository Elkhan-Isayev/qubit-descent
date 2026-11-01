import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LEVELS } from './levels.js';
import { buildChipModel, chipFoci } from './levels/chip.js';
import { buildPlaceholder } from './levels/placeholders.js';
import { modelOpacity, spanAt, zoomCentre } from './zoom.js';

const FOV = 22;
const CHIP_TILT = -0.62; // radians about x: the chip is seen at an angle, not flat on

const levelIndex = (id) => LEVELS.findIndex((l) => l.id === id);

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
    this.scene.add(key, new THREE.HemisphereLight(0x9fc8ff, 0x0a0d14, 0.4));

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);

    // A model is drawn on one or more levels. `units` is metres per model unit; `foci` (per level index)
    // are the model points centred at each level, so zooming between them flies into the right spot.
    const foci = chipFoci(chip);
    this.models = [
      this.addModel(buildChipModel(chip), {
        levels: ['chip', 'transmon'],
        units: 1e-6,
        foci,
        tilt: CHIP_TILT,
      }),
      ...LEVELS.filter((l) => !['chip', 'transmon'].includes(l.id)).map((l) =>
        this.addModel(buildPlaceholder(l), { levels: [l.id], units: l.span, foci: { [l.id]: [0, 0] }, spin: true }),
      ),
    ];

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.4, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.time = 0;
    this.resize();
  }

  addModel(object, { levels, units, foci, tilt = 0, spin = false }) {
    // outer: fixed tilt about the view centre; inner: zoom scale and offset; object: authored transform
    const outer = new THREE.Group();
    const inner = new THREE.Group().add(object);
    outer.add(inner);
    outer.rotation.x = tilt;
    this.scene.add(outer);
    const materials = [];
    object.traverse((o) => {
      if (o.material) for (const m of [o.material].flat()) if (!materials.includes(m)) materials.push(m);
    });
    return {
      outer,
      inner,
      object,
      materials,
      units,
      spin,
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
      m.outer.visible = opacity > 0.004;
      if (!m.outer.visible) continue;
      const scale = m.units / span;
      const [cx, cy] = zoomCentre(progress, m.foci);
      m.inner.scale.setScalar(scale);
      m.inner.position.set(-cx * scale, -cy * scale, 0);
      if (m.spin) m.object.rotation.y += dt * 0.05;
      for (const mat of m.materials) mat.opacity = opacity;
    }
    this.composer.render();
  }
}
