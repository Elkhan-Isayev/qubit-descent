import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LEVELS } from './levels.js';
import { buildPlaceholder } from './levels/placeholders.js';
import { levelTransform } from './zoom.js';

const FOV = 22;

export class DescentScene {
  constructor(canvas) {
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

    // Every level is authored at unit size; levelTransform() rescales it for the current zoom.
    this.levels = LEVELS.map((level) => {
      // outer group carries the zoom scale; the model keeps its own authored transform
      const group = new THREE.Group().add(buildPlaceholder(level));
      const materials = [];
      group.traverse((o) => {
        if (o.material) for (const m of [o.material].flat()) if (!materials.includes(m)) materials.push(m);
      });
      this.scene.add(group);
      return { group, materials };
    });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.4, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.time = 0;
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = aspect;
    // Fit one world unit to the smaller screen dimension, so "field of view" = the level's span.
    const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    this.distance = aspect >= 1 ? 0.5 / half : 0.5 / (half * aspect);
    this.camera.updateProjectionMatrix();
  }

  update(progress, dt) {
    this.time += dt;
    const sway = 0.12 * Math.sin(this.time * 0.17);
    this.camera.position.set(Math.sin(sway) * this.distance, 0.04 * this.distance * Math.sin(this.time * 0.11), Math.cos(sway) * this.distance);
    this.camera.lookAt(0, 0, 0);

    this.levels.forEach(({ group, materials }, i) => {
      const { scale, opacity } = levelTransform(progress, i);
      group.visible = opacity > 0.004;
      if (!group.visible) return;
      group.scale.setScalar(scale);
      group.rotation.y += dt * 0.05;
      for (const m of materials) m.opacity = opacity;
    });
    this.composer.render();
  }
}
