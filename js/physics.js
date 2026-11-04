
import * as THREE from "three";
import { EXPERIMENTS, EXPERIMENT_MAP, GYRO_MHZ_PER_T, PARTS } from "./componentsData.js";
import { t, pick, esc, levelBadge } from "./ui.js";

const COIL_PALETTE = {
  "body-rf-coil": 0xb493ff,
  "gradient-gz": 0xf3a04d,
  "gradient-gy": 0xe3cf7d,
  "gradient-gx": 0xff8448,
  "head-coil": 0x53e3c4,
};

const COLORS = {
  b0: 0x6aa7ff,
  b0Soft: 0x4a7fba,
  rf: 0xb493ff,
  m: 0xff775e,
  gradient: 0xf3a04d,
  gx: 0xff8448,
  gy: 0xe5d27e,
  gz: 0xefa24e,
  acquire: 0x53e3c4,
  head: 0x53e3c4,
};

const KSPACE_N = 128;
const PHANTOM_RADIUS = 0.58;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function deg(rad) { return (rad * 180) / Math.PI; }

function canvasLabel(text, color = "#dceaeF", width = 768, height = 144) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.font = '500 46px "SFMono-Regular", Menlo, monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(3,9,13,.82)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(125,201,223,.28)";
  ctx.strokeRect(1, 1, width - 2, height - 2);
  ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function fft1d(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let tr = re[i]; re[i] = re[j]; re[j] = tr;
      let ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / len;
    const wlenR = Math.cos(angle);
    const wlenI = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let wr = 1, wi = 0;
      for (let j = 0; j < len / 2; j += 1) {
        const uR = re[i + j], uI = im[i + j];
        const vR = re[i + j + len / 2] * wr - im[i + j + len / 2] * wi;
        const vI = re[i + j + len / 2] * wi + im[i + j + len / 2] * wr;
        re[i + j] = uR + vR; im[i + j] = uI + vI;
        re[i + j + len / 2] = uR - vR; im[i + j + len / 2] = uI - vI;
        const nextWr = wr * wlenR - wi * wlenI;
        wi = wr * wlenI + wi * wlenR;
        wr = nextWr;
      }
    }
  }
}

function fft2d(re, im, inverse) {
  const n = Math.sqrt(re.length);
  const rowR = new Float64Array(n), rowI = new Float64Array(n);
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) { rowR[x] = re[y * n + x]; rowI[x] = im[y * n + x]; }
    fft1d(rowR, rowI, inverse);
    for (let x = 0; x < n; x += 1) { re[y * n + x] = rowR[x]; im[y * n + x] = rowI[x]; }
  }
  const colR = new Float64Array(n), colI = new Float64Array(n);
  for (let x = 0; x < n; x += 1) {
    for (let y = 0; y < n; y += 1) { colR[y] = re[y * n + x]; colI[y] = im[y * n + x]; }
    fft1d(colR, colI, inverse);
    for (let y = 0; y < n; y += 1) { re[y * n + x] = colR[y]; im[y * n + x] = colI[y]; }
  }
  if (inverse) {
    const scale = 1 / (n * n);
    for (let i = 0; i < re.length; i += 1) { re[i] *= scale; im[i] *= scale; }
  }
}

function makePhantom(n = KSPACE_N) {
  const data = new Float64Array(n * n);
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const u = (x + 0.5 - n / 2) / (n / 2);
      const v = (y + 0.5 - n / 2) / (n / 2);
      const radial = Math.sqrt((u * u) / (0.58 * 0.58) + (v * v) / (0.81 * 0.81));
      let value = 0.012 + 0.004 * Math.sin(u * 19 + v * 7);
      if (radial < 1.06) {
        const angle = Math.atan2(v / 0.81, u / 0.58);
        const scalp = Math.exp(-Math.pow((radial - 0.975) / 0.032, 2));
        value = 0.06 + scalp * 0.86;
        if (radial < 0.925) {
          value = 0.5;
          value += 0.055 * Math.cos(15 * angle + 2.2 * radial * 10) * (0.55 + 0.45 * Math.exp(-Math.pow((radial - 0.68) / 0.2, 2)));
          value += 0.09 * Math.exp(-Math.pow(radial / 0.46, 2));
          value += 0.035 * Math.sin(34 * u + 13 * v) * Math.sin(27 * v + 9 * u);
          // lateral ventricles
          const ventL = Math.pow((u + 0.11) / 0.085, 2) + Math.pow((v - 0.03) / 0.17, 2);
          const ventR = Math.pow((u - 0.11) / 0.085, 2) + Math.pow((v - 0.03) / 0.17, 2);
          if (ventL < 1) value -= 0.42 * (1 - ventL);
          if (ventR < 1) value -= 0.42 * (1 - ventR);
          // third ventricle / falx
          if (Math.abs(u) < 0.014 && Math.abs(v) < 0.42) value -= 0.12;
          // basal structures and a small lesion
          if (Math.pow((u - 0.23) / 0.09, 2) + Math.pow((v + 0.17) / 0.08, 2) < 1) value += 0.13;
          if (Math.pow((u + 0.23) / 0.09, 2) + Math.pow((v + 0.17) / 0.08, 2) < 1) value += 0.13;
          if (Math.pow((u - 0.26) / 0.06, 2) + Math.pow((v + 0.31) / 0.07, 2) < 1) value += 0.42;
          // cortical sulci near the periphery
          value -= 0.05 * Math.max(0, 1 - Math.abs(radial - 0.85) / 0.08) * (0.5 + 0.5 * Math.sin(26 * angle));
        } else if (radial < 0.945) {
          value = 0.16;
        }
      }
      data[y * n + x] = clamp(value, 0, 1.4);
    }
  }
  return data;
}

function faviconPlay(playing) {
  return playing
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>';
}

export class PhysicsLab {
  constructor(elements, scene, controller, state, callbacks = {}) {
    this.controlsEl = elements.controls;
    this.hud = elements.hud;
    this.hudKicker = document.getElementById("physics-kicker");
    this.hudLevel = document.getElementById("physics-level");
    this.hudFormula = document.getElementById("physics-formula");
    this.hudCaption = document.getElementById("physics-caption");
    this.hudLegend = document.getElementById("physics-legend");
    this.labOverlay = elements.overlay;
    this.labOverlayBody = elements.overlayBody;
    this.labOverlayTitle = elements.overlayTitle;
    this.labOverlayKicker = elements.overlayKicker;
    this.scene = scene;
    this.controller = controller;
    this.state = state;
    this.callbacks = callbacks;
    this.overlay = scene.physicsGroup;
    this.experimentId = "b0";
    this.active = false;
    this.time = 0;
    this.larmorAngle = 0;
    this.seqTime = 0;
    this.seqPhaseKey = "";
    this.overlayManuallyHidden = false;
    this.channelObjects = [];
    this.activeCoilKey = "";
    this.kspaceData = null;
    this.lastKspaceDraw = 0;
    this.lastKspaceCoverage = -1;
    this.animated = {};
    this.params = {
      b1: 12,
      tau: 0.49,
      rfMode: "transmit",
      channel: 1,
      gradientAxis: "x",
      gradientAmplitude: 24,
      gradientPolarity: 1,
      kspaceAccel: 2,
      kspaceCoverage: 0.55,
      kspacePlaying: true,
      sequencePlaying: true,
      sequenceSpeed: 1,
      larmorPlaying: true,
      larmorSpeed: 1,
    };
    this.close = this.close.bind(this);
    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize, { passive: true });
    document.getElementById("lab-overlay-close")?.addEventListener("click", () => {
      this.overlayManuallyHidden = true;
      if (this.labOverlay) this.labOverlay.hidden = true;
    });
    this.controlsEl.addEventListener("click", (event) => this.handleControlClick(event));
    this.controlsEl.addEventListener("input", (event) => this.handleControlInput(event));
    this.hud.hidden = true;
  }

  get lang() { return this.state.lang; }
  get field() { return this.state.field; }

  activate() {
    this.active = true;
    this.setExperiment(this.experimentId, { initial: true, keepCamera: false });
  }

  deactivate() {
    this.active = false;
    this.restoreCoilHighlights();
    this.clearCoilGlows();
    this.clearOverlay();
    this.hud.hidden = true;
    this.labOverlay.hidden = true;
    this.channelObjects = [];
    this.animated = {};
    this.overlayManuallyHidden = false;
  }

  setLanguage(lang) {
    if (!this.active) return;
    this.rebuildCurrent({ keepCamera: true, keepOverlay: false });
  }

  setField(field) {
    if (!this.active) return;
    this.updateHud();
    this.updateReadouts();
    if (["b0", "larmor", "rf"].includes(this.experimentId)) {
      this.rebuildCurrent({ keepCamera: true, keepOverlay: false });
    }
  }

  setExperiment(id, options = {}) {
    if (!EXPERIMENT_MAP.has(id)) return;
    if (!this.active && !options.initial) this.active = true;
    if (this.experimentId !== id) {
      this.params.sequencePlaying = true;
      this.params.kspacePlaying = true;
      this.seqTime = 0;
      this.larmorAngle = 0;
      this.overlayManuallyHidden = false;
    }
    this.experimentId = id;
    this.restoreCoilHighlights();
    this.clearCoilGlows();
    this.clearOverlay();
    this.channelObjects = [];
    this.animated = {};
    this.seqPhaseKey = "";
    this.lastKspaceSignature = "";
    this.setFocus();
    this.buildOverlay();
    this.renderControls();
    this.updateHud();
    this.updateHardwareFocus();
    this.setupLabOverlay();
    if (!options.keepCamera) this.setExperimentCamera();
    if (this.callbacks.onExperimentChange) this.callbacks.onExperimentChange(id);
  }

  rebuildCurrent(options = {}) {
    this.restoreCoilHighlights();
    this.clearCoilGlows();
    this.clearOverlay();
    this.channelObjects = [];
    this.animated = {};
    this.seqPhaseKey = "";
    this.buildOverlay();
    this.renderControls();
    this.updateHud();
    this.setupLabOverlay(options);
    if (!options.keepCamera) this.setExperimentCamera();
  }

  setFocus() {
    const map = {
      b0: ["main-coils", "shim-system"],
      larmor: ["main-coils"],
      rf: this.params.rfMode === "receive"
        ? ["head-coil", "rf-shield", "body-rf-coil"]
        : ["body-rf-coil", "rf-shield", "head-coil"],
      gradient: ["gradient-gx", "gradient-gy", "gradient-gz", "gradient-shield"],
      sequence: ["body-rf-coil", "gradient-gx", "gradient-gy", "gradient-gz", "head-coil"],
      kspace: ["gradient-gx", "gradient-gy", "gradient-gz", "gradient-shield", "shim-system"],
    };
    this.controller.setPhysicsFocus(map[this.experimentId] || []);
  }

  updateHardwareFocus() {
    if (this.experimentId === "rf") this.setFocus();
  }

  setExperimentCamera() {
    const width = window.innerWidth;
    const factors = { b0: 1.9, larmor: 1.4, rf: 1.8, gradient: 1.5, sequence: 1.28, kspace: 1.28 };
    const s = width < 760 ? (factors[this.experimentId] || 1.4) : width < 900 ? 1.12 : 1;
    const views = {
      b0: { position: [4.3 * s, 1.3 * s, 1.65 * s], target: [0, 0.05, 0.05], fov: 30 },
      larmor: { position: [0.35 * s, 0.55 * s, 3.55 * s], target: [0, 0.01, 0.02], fov: 27 },
      rf: { position: [0.35 * s, 4.0 * s, 2.4 * s], target: [0, 0.01, 0.03], fov: 29 },
      gradient: { position: [2.6 * s, 3.0 * s, 3.3 * s], target: [0, 0.01, 0.04], fov: 30 },
      sequence: { position: [4.3 * s, 2.4 * s, 5.2 * s], target: [0, 0.02, 0.12], fov: 31 },
      kspace: { position: [4.0 * s, 2.25 * s, 4.8 * s], target: [0, 0.02, 0.1], fov: 31 },
    };
    this.scene.setView(views[this.experimentId] || views.b0, 780);
  }

  setExperimentById(id) {
    this.setExperiment(id);
  }

  clearOverlay() {
    const children = this.overlay.children.slice();
    children.forEach((child) => {
      child.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      this.overlay.remove(child);
    });
  }

  label(text, color = "#dbeef4", position = [0, 0, 0], scale = 0.22) {
    const texture = canvasLabel(text, color);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, toneMapped: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(position[0], position[1], position[2]);
    sprite.scale.set(scale * 1.38, scale * 0.1875 * 1.38, 1);
    sprite.renderOrder = 40;
    this.overlay.add(sprite);
    return sprite;
  }

  addArrow(direction, origin, length, color, headLength = 0.05, headWidth = 0.025) {
    const dir = new THREE.Vector3(...direction).normalize();
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.97, depthTest: false, depthWrite: false, toneMapped: false,
    });
    const shaftLength = Math.max(0.005, length - headLength);
    const shaftRadius = Math.max(0.0035, headWidth * 0.5);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 12), material);
    shaft.position.y = shaftLength / 2;
    group.add(shaft);
    const head = new THREE.Mesh(new THREE.ConeGeometry(headWidth, headLength, 16), material);
    head.position.y = shaftLength + headLength / 2;
    group.add(head);
    group.position.set(origin[0], origin[1], origin[2]);
    group.renderOrder = 32;
    group.traverse((object) => { object.renderOrder = 32; });
    const setDirection = (next) => {
      const d = next && next.isVector3 ? next.clone().normalize() : new THREE.Vector3(next[0], next[1], next[2]).normalize();
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    };
    setDirection(dir);
    this.overlay.add(group);
    return { group, setDirection, material };
  }

  buildOverlay() {
    switch (this.experimentId) {
      case "b0": this.buildB0(); break;
      case "larmor": this.buildLarmor(); break;
      case "rf": this.buildRF(); break;
      case "gradient": this.buildGradient(); break;
      case "sequence": this.buildSequence(); break;
      case "kspace": this.buildKspace(); break;
      default: this.buildB0();
    }
  }

  buildB0() {
    const group = new THREE.Group();
    const ringMaterial = new THREE.MeshBasicMaterial({ color: COLORS.b0, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false });
    const region = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.82, 48, 1, true), ringMaterial);
    region.rotation.x = Math.PI / 2;
    this.overlay.add(region);
    const fieldRing = [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25], [0.18, 0.18], [-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18]];
    fieldRing.forEach(([x, y]) => {
      this.addArrow([0, 0, 1], [x, y, -0.55], 1.1, COLORS.b0, 0.06, 0.024);
    });
    this.label("B0  +Z", "#9dd1ff", [0, 0.29, 0.15], 0.38);
    this.label("NOMINAL HOMOGENEOUS REGION", "#7d9db2", [0, -0.24, 0.32], 0.55);
    this.label(this.field.toFixed(1) + " T", "#e2f2ff", [0.22, 0.1, -0.48], 0.2);
    const rings = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x7eb9e9, transparent: true, opacity: 0.5 });
    for (const z of [-0.4, 0.4]) {
      const pts = [];
      for (let i = 0; i <= 72; i += 1) { const a = (Math.PI * 2 * i) / 72; pts.push(new THREE.Vector3(Math.cos(a) * 0.23, Math.sin(a) * 0.23, z)); }
      rings.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
    this.overlay.add(rings);
    this.overlay.add(group);
  }

  buildLarmor() {
    const b0Ring = new THREE.Mesh(
      new THREE.RingGeometry(0.052, 0.067, 48),
      new THREE.MeshBasicMaterial({ color: COLORS.b0, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false })
    );
    b0Ring.position.z = 0.002;
    b0Ring.renderOrder = 31;
    this.overlay.add(b0Ring);
    const b0Dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.012, 24),
      new THREE.MeshBasicMaterial({ color: COLORS.b0, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false })
    );
    b0Dot.position.z = 0.003;
    b0Dot.renderOrder = 32;
    this.overlay.add(b0Dot);
    this.label("B0 out of plane · +Z", "#9dd1ff", [0.19, 0.13, 0.03], 0.33);
    const orbit = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 80 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 80;
        return new THREE.Vector3(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0.006);
      })),
      new THREE.LineDashedMaterial({ color: 0xff8b72, transparent: true, opacity: 0.62, depthTest: false, dashSize: 0.018, gapSize: 0.015 })
    );
    orbit.computeLineDistances();
    orbit.renderOrder = 30;
    this.overlay.add(orbit);
    const mArrow = this.addArrow([1, 0, 0], [0, 0, 0], 0.28, COLORS.m, 0.055, 0.025);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd8c5, toneMapped: false, depthTest: false }));
    this.overlay.add(dot);
    this.animated = { mArrow, dot, orbit };
    this.label("M(t)", "#ff9d83", [0.06, 0.29, 0.02], 0.18);
    this.label("PRECESSION IN XY", "#b18e9b", [0, -0.28, 0.05], 0.32);
  }

  flipAngleDeg() {
    return 15.3276 * this.params.b1 * this.params.tau;
  }

  buildRF() {
    if (this.params.rfMode === "receive") {
      this.buildRFReceive();
      return;
    }
    const alpha = (this.flipAngleDeg() * Math.PI) / 180;
    const b0 = this.addArrow([0, 0, 1], [-0.03, 0.0, -0.3], 0.62, COLORS.b0, 0.075, 0.03);
    this.label("B0", "#9dd1ff", [-0.16, 0.02, 0.26], 0.17);
    const b1 = this.addArrow([1, 0, 0], [0, 0, 0], 0.45, COLORS.rf, 0.075, 0.034);
    this.label("B1+  (rotating frame)", "#d1b8ff", [0.3, 0.07, 0.08], 0.4);
    const mScene = new THREE.Group();
    const mArrow = this.addArrow([Math.sin(alpha), 0, Math.cos(alpha)], [0, 0, 0], 0.38, COLORS.m, 0.065, 0.034);
    const arcPts = [];
    const arcSegments = 64;
    for (let i = 0; i <= arcSegments; i += 1) {
      const a = (alpha * i) / arcSegments;
      arcPts.push(new THREE.Vector3(Math.sin(a) * 0.38, 0, Math.cos(a) * 0.38));
    }
    const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), new THREE.LineDashedMaterial({ color: 0xff9b7d, transparent: true, opacity: 0.55, dashSize: 0.016, gapSize: 0.012 }));
    arc.computeLineDistances();
    this.overlay.add(arc);
    this.label("M / transverse tip", "#ffa085", [0.25, 0.08, 0.0], 0.3);
    this.animated = { rfM: mArrow, rfArc: arc, rfAlpha: alpha, b1 };
    this.overlay.add(mScene);
  }

  buildRFReceive() {
    const head = this.scene.parts.get("head-coil");
    const loops = head?.group?.userData?.channelLoops || [];
    this.channelObjects = [];
    loops.forEach((loop, index) => {
      loop.updateWorldMatrix(true, false);
      const geometry = loop.geometry.clone();
      geometry.computeBoundingSphere();
      const mat = new THREE.MeshBasicMaterial({ color: 0x53e3c4, transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false });
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(loop.matrixWorld);
      mesh.renderOrder = 11;
      this.overlay.add(mesh);
      const center = new THREE.Vector3();
      if (geometry.boundingSphere) center.copy(geometry.boundingSphere.center).applyMatrix4(loop.matrixWorld);
      const lobeMat = new THREE.MeshBasicMaterial({ color: 0x53e3c4, transparent: true, opacity: 0.035, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), lobeMat);
      lobe.position.copy(center);
      lobe.scale.set(1.3, 1.1, 1.5);
      this.overlay.add(lobe);
      this.channelObjects.push({ channel: index + 1, mesh, mat, lobe, lobeMat });
    });
    this.updateReceiveChannels();
  }

  buildGradient() {
    const axis = this.params.gradientAxis;
    const group = new THREE.Group();
    const box = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, 0.34, 0.28)),
      new THREE.LineBasicMaterial({ color: 0x8eacba, transparent: true, opacity: 0.3 })
    );
    this.overlay.add(box);
    const count = 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    let seed = 7919;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < count; i += 1) {
      const x = (rand() - 0.5) * 0.3;
      const y = (rand() - 0.5) * 0.3;
      const z = (rand() - 0.5) * 0.24;
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 0.012, vertexColors: true, transparent: true, opacity: 0.96, depthWrite: false, depthTest: false, toneMapped: false });
    const points = new THREE.Points(geometry, material);
    points.renderOrder = 31;
    this.overlay.add(points);
    const planes = [];
    for (let i = -2; i <= 2; i += 1) {
      const geo = new THREE.PlaneGeometry(0.34, 0.34);
      const pmat = new THREE.MeshBasicMaterial({ color: axis === "x" ? COLORS.gx : axis === "y" ? COLORS.gy : COLORS.gz, transparent: true, opacity: i === 0 ? 0.16 : 0.055, side: THREE.DoubleSide, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
      const plane = new THREE.Mesh(geo, pmat);
      plane.renderOrder = 29;
      if (axis === "x") { plane.rotation.y = Math.PI / 2; plane.position.x = i * 0.07; }
      else if (axis === "y") { plane.rotation.x = -Math.PI / 2; plane.position.y = i * 0.07; }
      else { plane.position.z = i * 0.055; }
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: axis === "x" ? COLORS.gx : axis === "y" ? COLORS.gy : COLORS.gz, transparent: true, opacity: 0.32, depthTest: false, depthWrite: false })
      );
      edge.renderOrder = 30;
      edge.rotation.copy(plane.rotation);
      edge.position.copy(plane.position);
      this.overlay.add(edge);
      this.overlay.add(plane);
      planes.push(plane);
    }
    this.animated = { positions, colors, geometry, points, planes, axis };
    this.updateGradientColors();
    const arrowDir = axis === "x" ? [1, 0, 0] : axis === "y" ? [0, 1, 0] : [0, 0, 1];
    this.addArrow(arrowDir, [0, 0, 0], 0.45, axis === "x" ? COLORS.gx : axis === "y" ? COLORS.gy : COLORS.gz, 0.075, 0.032);
    this.label("G" + axis.toUpperCase() + " · ISO-FREQUENCY PLANES", "#f0ca8a", [0, 0.31, -0.02], 0.48);
    this.label("Bz = B0 + G" + axis + "·" + axis, "#c6dbe3", [0, -0.31, 0.06], 0.38);
  }

  buildSequence() {
    const group = new THREE.Group();
    this.overlay.add(group);
    this.label("GRE SEQUENCE / COIL SYNCHRONY", "#b6d5e2", [0, 0.28, 0.22], 0.36);
    this.label("RF", "#bea4ff", [-0.28, 0.17, 0.65], 0.08);
    this.label("Gz", "#f3a04d", [-0.28, 0.1, 0.65], 0.08);
    this.label("Gy", "#e3cf7d", [-0.28, 0.03, 0.65], 0.08);
    this.label("Gx / ADC", "#ff8f5d", [-0.28, -0.04, 0.65], 0.1);
    this.buildSequenceCoilGlow();
    this.animated = { coils: true };
  }

  buildSequenceCoilGlow() {
    this.coilGlow = {};
    Object.entries(COIL_PALETTE).forEach(([id, color]) => {
      const part = this.scene.parts.get(id);
      if (!part) return;
      const material = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending,
        depthWrite: false, depthTest: false, toneMapped: false,
      });
      const ghosts = [];
      part.group.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        if (object.material && object.material.transparent) return;
        const ghost = new THREE.Mesh(object.geometry, material);
        ghost.position.copy(object.position);
        ghost.quaternion.copy(object.quaternion);
        ghost.scale.copy(object.scale).multiplyScalar(1.012);
        ghost.visible = false;
        ghost.renderOrder = 33;
        object.parent.add(ghost);
        ghosts.push(ghost);
      });
      this.coilGlow[id] = { material, ghosts };
    });
  }

  clearCoilGlows() {
    if (!this.coilGlow) return;
    Object.values(this.coilGlow).forEach(({ material, ghosts }) => {
      ghosts.forEach((ghost) => {
        if (ghost.parent) ghost.parent.remove(ghost);
      });
      material.dispose();
    });
    this.coilGlow = {};
    this.activeCoilKey = "";
  }

  buildKspace() {
    this.label("CARTESIAN K-SPACE / 2D FFT", "#9bd9e8", [0, 0.28, 0.34], 0.36);
    this.label("RF COIL RECEIVES s(t) → k-space", "#7d9fab", [0, -0.27, 0.25], 0.34);
    this.ensureKspaceData();
  }

  updateGradientColors() {
    if (!this.animated || !this.animated.colors) return;
    const axis = this.params.gradientAxis;
    const amp = this.params.gradientAmplitude * this.params.gradientPolarity;
    const positions = this.animated.positions;
    const colors = this.animated.colors;
    const negative = new THREE.Color(0x5b8fff);
    const zero = new THREE.Color(0xddebf1);
    const positive = new THREE.Color(0xff9b54);
    for (let i = 0; i < positions.length / 3; i += 1) {
      const coord = axis === "x" ? positions[i * 3] : axis === "y" ? positions[i * 3 + 1] : positions[i * 3 + 2];
      const tNorm = clamp((coord / 0.17) * this.params.gradientPolarity * (amp === 0 ? 0 : 1), -1, 1);
      const c = tNorm < 0 ? zero.clone().lerp(negative, Math.abs(tNorm) * 0.85) : zero.clone().lerp(positive, tNorm * 0.85);
      const brightness = 0.35 + 0.65 * Math.min(1, this.params.gradientAmplitude / 32);
      colors[i * 3] = c.r * brightness;
      colors[i * 3 + 1] = c.g * brightness;
      colors[i * 3 + 2] = c.b * brightness;
    }
    if (this.animated.geometry) this.animated.geometry.attributes.color.needsUpdate = true;
    if (this.animated.planes) {
      const color = axis === "x" ? COLORS.gx : axis === "y" ? COLORS.gy : COLORS.gz;
      this.animated.planes.forEach((plane) => {
        plane.material.color.setHex(color);
        plane.visible = this.params.gradientAmplitude > 0;
      });
    }
  }

  updateRFVisual() {
    if (this.experimentId !== "rf" || this.params.rfMode !== "transmit" || !this.animated.rfM) return;
    const alpha = (this.flipAngleDeg() * Math.PI) / 180;
    const direction = new THREE.Vector3(Math.sin(alpha), 0, Math.cos(alpha));
    this.animated.rfM.setDirection(direction);
    const pts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i += 1) {
      const a = (alpha * i) / segments;
      pts.push(new THREE.Vector3(Math.sin(a) * 0.38, 0, Math.cos(a) * 0.38));
    }
    this.animated.rfArc.geometry.dispose();
    this.animated.rfArc.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    this.animated.rfArc.computeLineDistances();
  }

  updateReceiveChannels() {
    const selected = this.params.channel;
    this.channelObjects.forEach((obj) => {
      const active = obj.channel === selected;
      obj.mat.opacity = active ? 0.95 : 0.12;
      obj.mat.color.setHex(active ? 0xffd27d : 0x53e3c4);
      obj.lobeMat.opacity = active ? 0.14 : 0.018;
      obj.lobeMat.color.setHex(active ? 0x53e3c4 : 0x2d9788);
      obj.lobe.scale.set(active ? 1.35 : 1.05, active ? 1.15 : 0.9, active ? 1.55 : 1.2);
    });
  }

  setActiveCoils(activeIds) {
    const key = activeIds.slice().sort().join("|");
    if (key === this.activeCoilKey) return;
    this.activeCoilKey = key;
    if (this.coilGlow) {
      Object.entries(this.coilGlow).forEach(([id, glow]) => {
        const active = activeIds.includes(id);
        glow.material.opacity = active ? 1 : 0;
        glow.ghosts.forEach((ghost) => { ghost.visible = active; });
      });
    }
    Object.keys(COIL_PALETTE).forEach((id) => {
      const part = this.scene.parts.get(id);
      if (!part) return;
      part.materials.forEach((mat) => {
        if (!mat.emissive) return;
        if (!mat.userData.physicsBaseEmissive) mat.userData.physicsBaseEmissive = mat.emissive.clone();
        if (mat.userData.physicsBaseIntensity === undefined) mat.userData.physicsBaseIntensity = mat.emissiveIntensity || 0;
        if (activeIds.includes(id)) {
          mat.emissive.setHex(COIL_PALETTE[id]);
          mat.emissiveIntensity = 2.4;
        } else {
          mat.emissive.copy(mat.userData.physicsBaseEmissive);
          mat.emissiveIntensity = mat.userData.physicsBaseIntensity;
        }
      });
    });
  }

  restoreCoilHighlights() {
    const ids = ["body-rf-coil", "gradient-gz", "gradient-gy", "gradient-gx", "head-coil"];
    ids.forEach((id) => {
      const part = this.scene.parts.get(id);
      if (!part) return;
      part.materials.forEach((mat) => {
        if (!mat.emissive) return;
        const base = mat.userData.physicsBaseEmissive || mat.userData.baseEmissive;
        if (base) mat.emissive.copy(base);
        mat.emissiveIntensity = mat.userData.physicsBaseIntensity !== undefined ? mat.userData.physicsBaseIntensity : (mat.userData.baseEmissiveIntensity || 0);
      });
    });
    this.activeCoilKey = "";
  }

  update(dt, now) {
    if (!this.active) return;
    this.time += dt;
    if (this.experimentId === "larmor") {
      if (this.params.larmorPlaying) {
        const speed = this.params.larmorSpeed * (this.field / 1.5) * 1.5;
        this.larmorAngle += dt * speed;
      }
      if (this.animated.mArrow) {
        const x = Math.cos(this.larmorAngle);
        const y = Math.sin(this.larmorAngle);
        this.animated.mArrow.setDirection(new THREE.Vector3(x, y, 0));
        this.animated.dot.position.set(x * 0.28, y * 0.28, 0.006);
      }
    }
    if (this.experimentId === "sequence") {
      if (this.params.sequencePlaying) this.seqTime = (this.seqTime + dt * 0.38 * this.params.sequenceSpeed) % 2;
      this.drawSequence();
      this.updateSequencePhase();
    }
    if (this.experimentId === "kspace") {
      if (this.params.kspacePlaying) {
        this.params.kspaceCoverage += dt * 0.13;
        if (this.params.kspaceCoverage > 1) this.params.kspaceCoverage = 0.02;
      }
      if (now - this.lastKspaceDraw > 110) {
        this.lastKspaceDraw = now;
        this.drawKspace();
        this.syncKspaceControls();
      }
    }
    this.updateLiveHud(now);
  }

  setupLabOverlay(options = {}) {
    const id = this.experimentId;
    if (!["sequence", "kspace"].includes(id)) {
      this.labOverlay.hidden = true;
      return;
    }
    if (!options.keepOverlay) this.overlayManuallyHidden = false;
    if (this.overlayManuallyHidden) {
      this.labOverlay.hidden = true;
      return;
    }
    this.labOverlay.hidden = false;
    this.labOverlayKicker.textContent = id === "sequence" ? "SEQUENCE / TIMING" : "K-SPACE / RECONSTRUCTION";
    this.labOverlayTitle.textContent = id === "sequence" ? "GRE teaching timeline" : "Cartesian sampling → inverse FFT";
    this.labOverlayBody.innerHTML = id === "sequence" ? this.sequencePanelHTML() : this.kspacePanelHTML();
    if (id === "sequence") {
      this.seqCanvas = this.labOverlayBody.querySelector("#sequence-canvas");
      this.bindSequenceCanvas();
      this.drawSequence();
    } else {
      this.kspaceCanvas = this.labOverlayBody.querySelector("#kspace-canvas");
      this.reconCanvas = this.labOverlayBody.querySelector("#recon-canvas");
      this.kspaceMetrics = this.labOverlayBody.querySelector("#kspace-metrics");
      this.kspaceWarning = this.labOverlayBody.querySelector("#kspace-warning");
      this.lastKspaceCoverage = -1;
      this.drawKspace(true);
    }
  }

  sequencePanelHTML() {
    return '<div class="sequence-layout"><div class="sequence-labels"><span>RF</span><span>Gz</span><span>Gy</span><span>Gx</span><span>ADC</span></div><canvas id="sequence-canvas" class="sequence-canvas" aria-label="Idealised GRE sequence timing diagram"></canvas></div>';
  }

  kspacePanelHTML() {
    return '<div class="kspace-layout">'
      + '<div class="kspace-panel"><div class="kspace-panel__label"><span>K-SPACE |s(kx,ky)| · LOG</span><span>128 × 128</span></div><canvas id="kspace-canvas" class="kspace-canvas" width="128" height="128" aria-label="Log magnitude of k-space with sampled Cartesian rows"></canvas></div>'
      + '<div class="kspace-panel"><div class="kspace-panel__label"><span>ZERO-FILLED |IFFT|</span><span>MAGNITUDE</span></div><canvas id="recon-canvas" class="kspace-canvas" width="128" height="128" aria-label="Reconstructed image from sampled k-space"></canvas></div>'
      + '<div class="kspace-info"><div><h4>CARTESIAN SAMPLING</h4><p>' + esc(t(this.lang, "每个 TR 填充一条 ky 线；欠采样时未采集行置零后进行逆 FFT。出现混叠是预期结果，不是重建“补全”。", "Each TR fills one ky line; unsampled lines are zero-filled before inverse FFT. Aliasing is expected, not a reconstruction that silently ‘fills in’ data.")) + '</p><p style="margin-top:5px;color:var(--deep)">' + esc(t(this.lang, "数值体模 · 二维 FFT · 非临床数据", "NUMERICAL PHANTOM · 2D FFT · NOT CLINICAL DATA")) + '</p></div><div id="kspace-metrics" class="kspace-metrics"></div><div id="kspace-warning" class="kspace-warning"></div></div></div>';
  }

  bindSequenceCanvas() {
    if (!this.seqCanvas) return;
    const scrub = (event) => {
      const rect = this.seqCanvas.getBoundingClientRect();
      const frac = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      this.seqTime = frac * 2;
      this.params.sequencePlaying = false;
      this.renderControls();
      this.drawSequence();
      this.updateSequencePhase(true);
    };
    this.seqCanvas.addEventListener("pointerdown", (event) => {
      this.seqCanvas.setPointerCapture(event.pointerId);
      scrub(event);
    });
    this.seqCanvas.addEventListener("pointermove", (event) => {
      if (event.buttons & 1) scrub(event);
    });
  }

  drawSequence() {
    const canvas = this.seqCanvas;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const cssW = Math.max(160, canvas.clientWidth || 600);
    const cssH = Math.max(100, canvas.clientHeight || 160);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const padL = 4, padR = 8, padT = 7, padB = 36;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;
    const xFor = (t) => padL + (t / 2) * plotW;
    const rowH = plotH / 5;
    const rows = ["RF", "Gz", "Gy", "Gx", "ADC"];
    const colors = ["#b493ff", "#f3a04d", "#e3cf7d", "#ff8448", "#53e3c4"];
    ctx.strokeStyle = "rgba(119,161,179,.12)";
    ctx.lineWidth = 1;
    for (let t = 0; t <= 2; t += 0.25) {
      const x = xFor(t);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    }
    for (let i = 0; i < 5; i += 1) {
      const y = padT + rowH * i + rowH * 0.72;
      ctx.strokeStyle = "rgba(112,151,168,.14)";
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      // row label
      ctx.fillStyle = colors[i];
      ctx.font = '12px "SFMono-Regular", Menlo, monospace';
      ctx.globalAlpha = 0.8;
    }
    const drawBlock = (row, t0, t1, height, color, alpha = 0.65) => {
      const x0 = xFor(t0), x1 = xFor(t1);
      const base = padT + rowH * (row + 0.72);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x0, base - rowH * height, Math.max(1, x1 - x0), rowH * height);
      ctx.globalAlpha = 1;
    };
    const drawLine = (row, t0, t1, height, color) => {
      const base = padT + rowH * (row + 0.72);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(xFor(t0), base); ctx.lineTo(xFor(t1), base - rowH * height); ctx.lineTo(xFor(t1), base); ctx.stroke();
      ctx.globalAlpha = 1;
    };
    for (const offset of [0, 1]) {
      drawBlock(0, offset + 0.02, offset + 0.12, 0.7, "#b493ff", 0.7);
      drawBlock(1, offset + 0.02, offset + 0.18, 0.55, "#f3a04d", 0.58);
      drawBlock(1, offset + 0.27, offset + 0.31, 0.26, "#f3a04d", 0.4);
      drawBlock(2, offset + 0.2, offset + 0.28, 0.38, "#e3cf7d", 0.58);
      drawBlock(3, offset + 0.33, offset + 0.38, 0.2, "#ff8448", 0.35);
      drawBlock(3, offset + 0.38, offset + 0.68, 0.48, "#ff8448", 0.55);
      for (let i = 0; i < 18; i += 1) {
        const t = offset + 0.41 + i * 0.0135;
        drawBlock(4, t, t + 0.006, 0.22 + (i % 3) * 0.05, "#53e3c4", 0.85);
      }
    }
    const cursorX = xFor(this.seqTime);
    ctx.strokeStyle = "rgba(159,226,242,.6)";
    ctx.beginPath(); ctx.moveTo(cursorX, padT); ctx.lineTo(cursorX, padT + plotH); ctx.stroke();
    ctx.fillStyle = "rgba(159,226,242,.85)";
    ctx.beginPath(); ctx.arc(cursorX, padT, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#aebfcb";
    ctx.font = '12px "SFMono-Regular", Menlo, monospace';
    ctx.fillText("TR", xFor(0) + 4, cssH - 21);
    ctx.fillText("TR", xFor(1) + 4, cssH - 21);
    ctx.fillText("TE", xFor(0.48) - 6, cssH - 21);
    ctx.textAlign = "right";
    ctx.fillText("2 TR · NOT TO SCALE", cssW - padR, cssH - 4);
    ctx.textAlign = "left";
  }

  sequenceState() {
    const u = ((this.seqTime % 1) + 1) % 1;
    return {
      rf: u >= 0.02 && u <= 0.12,
      gz: u >= 0.02 && u <= 0.18,
      gy: u >= 0.2 && u <= 0.28,
      gx: u >= 0.33 && u <= 0.68,
      adc: u >= 0.41 && u <= 0.64,
      u,
    };
  }

  updateSequencePhase(force = false) {
    const s = this.sequenceState();
    const active = [];
    if (s.rf) active.push("body-rf-coil");
    if (s.gz) active.push("gradient-gz");
    if (s.gy) active.push("gradient-gy");
    if (s.gx) active.push("gradient-gx");
    if (s.adc) active.push("head-coil");
    this.setActiveCoils(active);
    const key = active.join("|");
    if (force || key !== this.seqPhaseKey) {
      this.seqPhaseKey = key;
      const names = [];
      if (s.rf) names.push("RF");
      if (s.gz) names.push("Gz");
      if (s.gy) names.push("Gy");
      if (s.gx) names.push("Gx");
      if (s.adc) names.push("ADC");
      const phaseEl = this.controlsEl.querySelector("#sequence-phase");
      if (phaseEl) phaseEl.textContent = names.join(" · ") || t(this.lang, "等待", "idle");
      this.updateHud();
      this.updateReadouts();
    }
  }

  updateLiveHud(now) {
    if (!this.active) return;
    if (this.experimentId === "sequence" && this.hudCaption) {
      const phase = ["RF excitation", "Gz slice select", "Gy phase encode", "Gx readout", "ADC receive"].filter((_, i) => {
        const s = this.sequenceState();
        return [s.rf, s.gz, s.gy, s.gx, s.adc][i];
      }).join(" · ");
      this.hudCaption.textContent = phase || t(this.lang, "等待下一个 TR", "Waiting for next TR");
    }
    if (this.experimentId === "kspace" && this.hudFormula) {
      this.hudFormula.textContent = "ky coverage " + (this.params.kspaceCoverage * 100).toFixed(0) + "% · R=" + this.params.kspaceAccel;
    }
  }

  ensureKspaceData() {
    if (this.kspaceData) return;
    const n = KSPACE_N;
    const phantom = makePhantom(n);
    const kRe = Float64Array.from(phantom);
    const kIm = new Float64Array(n * n);
    fft2d(kRe, kIm, false);
    this.kspaceData = { n, phantom, kRe, kIm, workingRe: new Float64Array(n * n), workingIm: new Float64Array(n * n), recon: new Float64Array(n * n) };
  }

  kspaceRows() {
    const n = KSPACE_N;
    const rows = [];
    for (let i = 0; i < n; i += this.params.kspaceAccel) rows.push(i);
    const center = n / 2;
    if (!rows.includes(center)) rows.push(center);
    rows.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
    return rows;
  }

  drawKspace(force = false) {
    if (!this.kspaceCanvas || !this.reconCanvas) return;
    this.ensureKspaceData();
    const n = KSPACE_N;
    const data = this.kspaceData;
    const rows = this.kspaceRows();
    const count = Math.max(1, Math.floor(rows.length * clamp(this.params.kspaceCoverage, 0, 1)));
    const sampled = rows.slice(0, count);
    const sampledSet = new Set(sampled);
    const signature = sampled.join(",") + "|" + this.params.kspaceAccel;
    if (!force && signature === this.lastKspaceSignature) {
      this.syncKspaceMetrics(sampled.length, rows.length);
      return;
    }
    this.lastKspaceSignature = signature;

    // Magnitude image, log scale, shifted.
    let max = 0;
    for (let i = 0; i < n * n; i += 1) {
      const m = Math.hypot(data.kRe[i], data.kIm[i]);
      if (m > max) max = m;
    }
    const kctx = this.kspaceCanvas.getContext("2d");
    const kimg = kctx.createImageData(n, n);
    const logMax = Math.log(1 + max / Math.max(1e-9, max) * 400);
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        const sx = (x + n / 2) % n;
        const sy = (y + n / 2) % n;
        const idx = sy * n + sx;
        const m = Math.hypot(data.kRe[idx], data.kIm[idx]);
        const v = Math.log(1 + 400 * (m / Math.max(1e-9, max))) / Math.log(401);
        const c = v * Math.min(1, logMax / 2);
        const k = y * n + x;
        kimg.data[k * 4] = Math.round(16 + c * 208);
        kimg.data[k * 4 + 1] = Math.round(32 + c * 189);
        kimg.data[k * 4 + 2] = Math.round(44 + c * 175);
        kimg.data[k * 4 + 3] = 255;
      }
    }
    kctx.putImageData(kimg, 0, 0);
    kctx.fillStyle = "rgba(2, 7, 10, .73)";
    for (let ky = 0; ky < n; ky += 1) {
      if (!sampledSet.has(ky)) {
        const sy = (ky + n / 2) % n;
        kctx.fillRect(0, sy, n, 1);
      }
    }
    kctx.fillStyle = "rgba(125, 232, 255, .24)";
    sampled.forEach((ky) => {
      const sy = (ky + n / 2) % n;
      kctx.fillRect(0, sy, n, 1);
    });
    kctx.fillStyle = "rgba(159, 236, 255, .75)";
    kctx.font = '10px "SFMono-Regular", Menlo, monospace';
    kctx.fillText("ky", n - 16, 13);
    kctx.strokeStyle = "rgba(125,201,223,.22)";
    kctx.strokeRect(0.5, 0.5, n - 1, n - 1);

    // Reconstruction
    const re = data.workingRe;
    const im = data.workingIm;
    re.fill(0); im.fill(0);
    sampled.forEach((ky) => {
      for (let kx = 0; kx < n; kx += 1) {
        const idx = ky * n + kx;
        re[idx] = data.kRe[idx];
        im[idx] = data.kIm[idx];
      }
    });
    fft2d(re, im, true);
    let maxImg = 0;
    for (let i = 0; i < n * n; i += 1) {
      const m = Math.hypot(re[i], im[i]);
      data.recon[i] = m;
      if (m > maxImg) maxImg = m;
    }
    const rctx = this.reconCanvas.getContext("2d");
    const rimg = rctx.createImageData(n, n);
    const windowLo = maxImg * 0.15;
    const windowHi = maxImg * 0.92;
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        const m = data.recon[y * n + x];
        const v = Math.pow(clamp((m - windowLo) / Math.max(1e-9, windowHi - windowLo), 0, 1), 1.12);
        const k = (y * n + x) * 4;
        rimg.data[k] = Math.round(8 + v * 208);
        rimg.data[k + 1] = Math.round(20 + v * 219);
        rimg.data[k + 2] = Math.round(27 + v * 216);
        rimg.data[k + 3] = 255;
      }
    }
    rctx.putImageData(rimg, 0, 0);
    const vignette = rctx.createRadialGradient(n / 2, n / 2, n * 0.28, n / 2, n / 2, n * 0.7);
    vignette.addColorStop(0, "rgba(3,9,13,0)");
    vignette.addColorStop(1, "rgba(3,9,13,.42)");
    rctx.fillStyle = vignette;
    rctx.fillRect(0, 0, n, n);
    this.syncKspaceMetrics(sampled.length, rows.length);
  }

  syncKspaceMetrics(count, total) {
    if (!this.kspaceMetrics) return;
    const R = this.params.kspaceAccel;
    const pct = ((count / total) * 100).toFixed(0);
    this.kspaceMetrics.innerHTML = '<div><span>ACCELERATION</span><b>' + R + '×</b></div><div><span>SAMPLED</span><b>' + pct + '%</b></div><div><span>ROWS</span><b>' + count + " / " + total + '</b></div><div><span>COVERAGE</span><b>' + ((this.params.kspaceCoverage) * 100).toFixed(0) + '%</b></div>';
    if (this.kspaceWarning) {
      this.kspaceWarning.textContent = R > 1 && count >= total ? t(this.lang, "⚠ 欠采样：未采样行按零处理，可能出现混叠/卷褶；教学示意而非临床重建。", "⚠ Undersampled: missing rows are zero-filled; aliasing/wraparound may appear. Teaching schematic, not clinical reconstruction.") : t(this.lang, "理想 Cartesian 采样 · 无运动、T1/T2、线圈敏感度或噪声建模。", "Ideal Cartesian sampling · no motion, T1/T2, coil sensitivity or noise modelling.");
      this.kspaceWarning.style.color = R > 1 && count >= total ? "var(--orange)" : "var(--deep)";
    }
    this.syncKspaceControls();
  }

  syncKspaceControls() {
    if (!this.controlsEl) return;
    const coverage = this.controlsEl.querySelector('[data-param="kspaceCoverage"]');
    if (coverage) {
      coverage.value = String(Math.round(this.params.kspaceCoverage * 100));
      coverage.style.setProperty("--fill", Math.round(this.params.kspaceCoverage * 100) + "%");
    }
    const label = this.controlsEl.querySelector("#kspace-coverage-value");
    if (label) label.textContent = Math.round(this.params.kspaceCoverage * 100) + "%";
    this.updateHud();
  }

  updateHud() {
    if (!this.active) return;
    const exp = EXPERIMENT_MAP.get(this.experimentId);
    if (!exp) return;
    this.hud.hidden = false;
    this.hudKicker.textContent = "EXPERIMENT " + exp.num + " / " + exp.id.toUpperCase();
    this.hudLevel.textContent = "LEVEL " + exp.level;
    this.hudLevel.className = "level-badge level-" + exp.level.toLowerCase();
    const field = this.field.toFixed(1);
    if (this.experimentId === "b0") {
      this.hudFormula.textContent = "B₀ = " + field + " T · along +Z";
      this.hudCaption.textContent = t(this.lang, "主磁场使自旋产生净磁化；它本身不进行空间编码。场线为定性示意。", "B0 polarises the spin system; it does not itself spatially encode. Field marks are qualitative.");
      this.hudLegend.innerHTML = '<span><i style="--legend-color:#6aa7ff"></i>B₀ +Z</span><span><i style="--legend-color:#4f7899"></i>nominal homogeneous region</span>';
    } else if (this.experimentId === "larmor") {
      this.hudFormula.textContent = "f₀ = 42.577478 × " + field + " = " + (this.field * GYRO_MHZ_PER_T).toFixed(2) + " MHz";
      this.hudCaption.textContent = t(this.lang, "进动动画为严重压缩的时间尺度；M 是净磁化，不是单个自旋。", "Precession animation uses a heavily compressed timescale; M is net magnetisation, not one spin.");
      this.hudLegend.innerHTML = '<span><i style="--legend-color:#ff775e"></i>M(t)</span><span><i style="--legend-color:#6aa7ff"></i>B₀ +Z</span><span><i style="--legend-color:#7d8791"></i>qualitative orbit</span>';
    } else if (this.experimentId === "rf") {
      const a = this.flipAngleDeg();
      if (this.params.rfMode === "transmit") {
        this.hudFormula.textContent = "α = γ B₁ τ = " + a.toFixed(1) + "°";
        this.hudCaption.textContent = t(this.lang, "理想矩形、共振、无弛豫脉冲。B1 只在横向；实际 B1 分布与 SAR 未建模。", "Ideal rectangular on-resonance pulse without relaxation. B1 is transverse; real B1 maps and SAR are not modelled.");
        this.hudLegend.innerHTML = '<span><i style="--legend-color:#b493ff"></i>B₁⁺</span><span><i style="--legend-color:#ff775e"></i>M</span><span><i style="--legend-color:#6aa7ff"></i>B₀</span>';
      } else {
        this.hudFormula.textContent = "8-channel receive array · B₁⁻";
        this.hudCaption.textContent = t(this.lang, "每个接收环路的空间敏感度不同；选中通道的包络为定性示意，非电磁求解。", "Each receive loop has a different spatial sensitivity; the selected envelope is qualitative, not an EM solve.");
        this.hudLegend.innerHTML = '<span><i style="--legend-color:#53e3c4"></i>B₁⁻ receive loops</span><span><i style="--legend-color:#ffd27d"></i>selected channel</span>';
      }
    } else if (this.experimentId === "gradient") {
      this.hudFormula.textContent = "Bz = B₀ + G" + this.params.gradientAxis + " · " + this.params.gradientAxis + "   |   G = " + this.params.gradientAmplitude.toFixed(0) + " mT/m";
      this.hudCaption.textContent = t(this.lang, "颜色表示 ΔBz 的正负与大小；平面为理想等频率面，不是线圈电磁场求解。", "Colour indicates sign and magnitude of ΔBz; planes are ideal isofrequency surfaces, not an EM coil solve.");
      this.hudLegend.innerHTML = '<span><i style="--legend-color:#5b8fff"></i>−ΔBz</span><span><i style="--legend-color:#ddebf1"></i>0</span><span><i style="--legend-color:#ff9b54"></i>+ΔBz</span><span><i class="legend-gradient"></i></span>';
    } else if (this.experimentId === "sequence") {
      this.hudFormula.textContent = "GRE · RF / Gz / Gy / Gx / ADC";
      this.hudLegend.innerHTML = '<span><i style="--legend-color:#b493ff"></i>RF</span><span><i style="--legend-color:#f3a04d"></i>Gz</span><span><i style="--legend-color:#e3cf7d"></i>Gy</span><span><i style="--legend-color:#ff8448"></i>Gx</span><span><i style="--legend-color:#53e3c4"></i>ADC</span>';
      this.hudCaption.textContent = t(this.lang, "三维线圈高亮与时序游标同步。时间轴为逻辑教学示意，不按真实 TE/TR 比例。", "3D coil highlights track the sequence cursor. Timing is a logic teaching diagram, not to real TE/TR scale.");
    } else if (this.experimentId === "kspace") {
      this.hudFormula.textContent = "s(kx,ky) → zero-filled IFFT";
      this.hudCaption.textContent = t(this.lang, "k-space 行采样与图像重建在右侧/下方分析面板中实时更新。欠采样会产生混叠。", "k-space row sampling and image reconstruction update in the analysis panel. Undersampling produces aliasing.");
      this.hudLegend.innerHTML = '<span><i style="--legend-color:#9fe2ff"></i>sampled ky</span><span><i style="--legend-color:#53e3c4"></i>reconstruction</span><span><i style="--legend-color:#e6a056"></i>zero-filled rows</span>';
    }
  }

  updateReadouts() {
    if (!this.controlsEl) return;
    const f0 = this.controlsEl.querySelector("#larmor-f0");
    if (f0) f0.textContent = (this.field * GYRO_MHZ_PER_T).toFixed(2) + " MHz";
    const alpha = this.controlsEl.querySelector("#rf-alpha");
    if (alpha) alpha.textContent = this.flipAngleDeg().toFixed(1) + "°";
    const amp = this.controlsEl.querySelector("#gradient-db");
    if (amp) amp.textContent = (this.params.gradientAmplitude * 0.15).toFixed(1) + " mT";
    const axis = this.controlsEl.querySelector("#gradient-axis-readout");
    if (axis) axis.textContent = "G" + this.params.gradientAxis.toUpperCase() + " · polarity " + (this.params.gradientPolarity > 0 ? "+" : "−");
    const seq = this.controlsEl.querySelector("#sequence-time");
    if (seq) seq.textContent = this.seqTime.toFixed(2) + " / 2.00";
    this.updateHud();
  }

  handleControlClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.physicsField) {
      if (this.callbacks.onFieldChange) this.callbacks.onFieldChange(Number(button.dataset.physicsField));
      return;
    }
    const action = button.dataset.action;
    if (!action) return;
    if (action === "rf-mode") {
      this.params.rfMode = button.dataset.mode;
      this.setFocus();
      this.rebuildCurrent({ keepCamera: true });
      return;
    }
    if (action === "rf-preset") {
      const preset = Number(button.dataset.angle);
      this.params.b1 = 12;
      this.params.tau = preset === 180 ? 0.979 : 0.49;
      this.updateRFVisual();
      this.renderControls();
      this.updateHud();
      return;
    }
    if (action === "channel") {
      this.params.channel = Number(button.dataset.channel);
      this.updateReceiveChannels();
      this.renderControls();
      return;
    }
    if (action === "gradient-axis") {
      this.params.gradientAxis = button.dataset.axis;
      this.rebuildCurrent({ keepCamera: true });
      return;
    }
    if (action === "gradient-polarity") {
      this.params.gradientPolarity *= -1;
      this.rebuildCurrent({ keepCamera: true });
      return;
    }
    if (action === "larmor-toggle") {
      this.params.larmorPlaying = !this.params.larmorPlaying;
      this.renderControls();
      return;
    }
    if (action === "seq-play") {
      this.params.sequencePlaying = !this.params.sequencePlaying;
      this.renderControls();
      return;
    }
    if (action === "kspace-play") {
      this.params.kspacePlaying = !this.params.kspacePlaying;
      this.renderControls();
      return;
    }
    if (action === "kspace-reset") {
      this.params.kspaceCoverage = 0.02;
      this.lastKspaceSignature = "";
      this.drawKspace(true);
      return;
    }
    if (action === "kspace-accel") {
      this.params.kspaceAccel = Number(button.dataset.accel);
      this.params.kspaceCoverage = 0.55;
      this.lastKspaceSignature = "";
      this.drawKspace(true);
      this.renderControls();
      return;
    }
    if (action === "show-overlay") {
      this.overlayManuallyHidden = false;
      this.setupLabOverlay();
      return;
    }
  }

  handleControlInput(event) {
    const input = event.target.closest("input[data-param]");
    if (!input) return;
    const key = input.dataset.param;
    const value = Number(input.value);
    if (key === "larmorSpeed") {
      this.params.larmorSpeed = value / 100;
      const label = this.controlsEl.querySelector("#larmor-speed-value");
      if (label) label.textContent = value + "%";
    } else if (key === "b1") {
      this.params.b1 = value / 10;
      const label = this.controlsEl.querySelector("#rf-b1-value");
      if (label) label.textContent = (value / 10).toFixed(1) + " µT";
    } else if (key === "tau") {
      this.params.tau = value / 100;
      const label = this.controlsEl.querySelector("#rf-tau-value");
      if (label) label.textContent = (value / 100).toFixed(2) + " ms";
    } else if (key === "gradientAmplitude") {
      this.params.gradientAmplitude = value;
      const ampLabel = this.controlsEl.querySelector("#gradient-amp-value");
      if (ampLabel) ampLabel.textContent = value + " mT/m";
    } else if (key === "sequenceSpeed") {
      this.params.sequenceSpeed = value / 100;
      const label = this.controlsEl.querySelector("#sequence-speed-value");
      if (label) label.textContent = value + "%";
    } else if (key === "kspaceCoverage") {
      this.params.kspaceCoverage = value / 100;
      this.params.kspacePlaying = false;
      this.lastKspaceSignature = "";
      this.drawKspace(true);
    }
    input.style.setProperty("--fill", ((value - Number(input.min || 0)) / (Number(input.max || 100) - Number(input.min || 0))) * 100 + "%");
    if (key === "b1" || key === "tau") {
      this.updateRFVisual();
      const alpha = this.controlsEl.querySelector("#rf-alpha");
      if (alpha) alpha.textContent = this.flipAngleDeg().toFixed(1) + "°";
      this.updateHud();
      return;
    }
    if (key === "gradientAmplitude") {
      this.updateGradientColors();
      this.updateReadouts();
      return;
    }
    if (key === "larmorSpeed" || key === "sequenceSpeed") return;
    this.updateHud();
  }

  controlSlider(label, id, param, min, max, value, step = 1, unit = "") {
    const fill = ((value - min) / (max - min)) * 100;
    return '<div class="lab-control"><div class="lab-control__label"><span>' + esc(label) + '</span><b id="' + id + '">' + (param === "b1" ? (value / 10).toFixed(1) : param === "tau" ? (value / 100).toFixed(2) : value) + esc(unit) + '</b></div><input class="lab-slider" type="range" data-param="' + param + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '" style="--fill:' + fill + '%" aria-label="' + esc(label) + '" /></div>';
  }

  renderControls() {
    const lang = this.lang;
    const field = this.field;
    let html = "";
    if (this.experimentId === "b0") {
      html += '<div class="lab-control"><div class="lab-control__label"><span>STATIC FIELD / 静态场</span><b>' + field.toFixed(1) + ' T</b></div><div class="lab-choice-row"><button type="button" class="lab-choice' + (field === 1.5 ? " is-active" : "") + '" data-physics-field="1.5">1.5 T</button><button type="button" class="lab-choice' + (field === 3 ? " is-active" : "") + '" data-physics-field="3">3.0 T</button></div><span class="lab-control__hint">B₀ ∥ +Z · bore axis</span></div>';
      html += '<div class="lab-readout-inline"><span>NOMINAL BORE</span><b>70 cm</b></div><div class="lab-readout-inline"><span>f₀</span><b>' + (field * GYRO_MHZ_PER_T).toFixed(2) + ' MHz</b></div>';
      html += '<div class="lab-control"><span class="lab-control__hint">' + esc(t(lang, "等长箭头与半透明区为定性示意；未求解场图。", "Equal-length arrows and the translucent region are qualitative; no field-map solve.")) + '</span></div>';
    } else if (this.experimentId === "larmor") {
      html += '<div class="lab-control"><div class="lab-control__label"><span>B₀ / FIELD</span><b>' + field.toFixed(1) + ' T</b></div><div class="lab-choice-row"><button type="button" class="lab-choice' + (field === 1.5 ? " is-active" : "") + '" data-physics-field="1.5">1.5 T</button><button type="button" class="lab-choice' + (field === 3 ? " is-active" : "") + '" data-physics-field="3">3.0 T</button></div></div>';
      html += this.controlSlider("VISUAL SPEED", "larmor-speed-value", "larmorSpeed", 25, 200, Math.round(this.params.larmorSpeed * 100), 1, "%");
      html += '<button type="button" class="lab-play" data-action="larmor-toggle" aria-label="' + esc(t(lang, this.params.larmorPlaying ? "暂停" : "播放", this.params.larmorPlaying ? "Pause" : "Play")) + '">' + faviconPlay(this.params.larmorPlaying) + "</button>";
      html += '<div class="lab-readout-inline"><span>f₀</span><b id="larmor-f0">' + (field * GYRO_MHZ_PER_T).toFixed(2) + ' MHz</b></div>';
    } else if (this.experimentId === "rf") {
      html += '<div class="lab-control"><div class="lab-control__label"><span>RF MODE / 模式</span><b>' + (this.params.rfMode === "transmit" ? "B₁⁺ TX" : "B₁⁻ RX") + '</b></div><div class="lab-choice-row"><button type="button" class="lab-choice' + (this.params.rfMode === "transmit" ? " is-active" : "") + '" data-action="rf-mode" data-mode="transmit">TRANSMIT</button><button type="button" class="lab-choice' + (this.params.rfMode === "receive" ? " is-active" : "") + '" data-action="rf-mode" data-mode="receive">RECEIVE</button></div></div>';
      if (this.params.rfMode === "transmit") {
        html += this.controlSlider("B₁ AMPLITUDE (µT)", "rf-b1-value", "b1", 40, 200, Math.round(this.params.b1 * 10), 1, " µT");
        html += this.controlSlider("PULSE DURATION (ms)", "rf-tau-value", "tau", 10, 150, Math.round(this.params.tau * 100), 1, " ms");
        html += '<div class="lab-choice-row"><button type="button" class="lab-choice" data-action="rf-preset" data-angle="90">90°</button><button type="button" class="lab-choice" data-action="rf-preset" data-angle="180">180°</button></div>';
        html += '<div class="lab-readout-inline"><span>FLIP ANGLE</span><b id="rf-alpha">' + this.flipAngleDeg().toFixed(1) + '°</b></div>';
      } else {
        html += '<div class="lab-choice-row">' + Array.from({ length: 8 }, (_, i) => '<button type="button" class="lab-choice' + (this.params.channel === i + 1 ? " is-active" : "") + '" data-action="channel" data-channel="' + (i + 1) + '">CH ' + (i + 1) + "</button>").join("") + "</div>";
        html += '<div class="lab-readout-inline"><span>SELECTED</span><b>CH ' + this.params.channel + "</b></div>";
        html += '<div class="lab-control"><span class="lab-control__hint">' + esc(t(lang, "接收敏感度包络为定性示意，不是电磁求解。", "Receive sensitivity envelope is qualitative, not an EM solve.")) + "</span></div>";
      }
    } else if (this.experimentId === "gradient") {
      html += '<div class="lab-control"><div class="lab-control__label"><span>GRADIENT AXIS</span><b>G' + this.params.gradientAxis.toUpperCase() + '</b></div><div class="lab-choice-row"><button type="button" class="lab-choice' + (this.params.gradientAxis === "x" ? " is-active" : "") + '" data-action="gradient-axis" data-axis="x">Gx</button><button type="button" class="lab-choice' + (this.params.gradientAxis === "y" ? " is-active" : "") + '" data-action="gradient-axis" data-axis="y">Gy</button><button type="button" class="lab-choice' + (this.params.gradientAxis === "z" ? " is-active" : "") + '" data-action="gradient-axis" data-axis="z">Gz</button></div></div>';
      html += this.controlSlider("AMPLITUDE (mT/m)", "gradient-amp-value", "gradientAmplitude", 0, 40, Math.round(this.params.gradientAmplitude), 1, " mT/m");
      html += '<button type="button" class="lab-choice" data-action="gradient-polarity">POLARITY ' + (this.params.gradientPolarity > 0 ? "+" : "−") + "</button>";
      html += '<div class="lab-readout-inline"><span>ΔBz / 150 mm</span><b id="gradient-db">' + (this.params.gradientAmplitude * 0.15).toFixed(1) + ' mT</b></div>';
      html += '<div class="lab-readout-inline"><span>AXIS / POLARITY</span><b id="gradient-axis-readout">G' + this.params.gradientAxis.toUpperCase() + ' · polarity ' + (this.params.gradientPolarity > 0 ? "+" : "−") + '</b></div>';
    } else if (this.experimentId === "sequence") {
      html += '<button type="button" class="lab-play" data-action="seq-play" aria-label="' + esc(t(lang, this.params.sequencePlaying ? "暂停" : "播放", this.params.sequencePlaying ? "Pause" : "Play")) + '">' + faviconPlay(this.params.sequencePlaying) + "</button>";
      html += '<div class="lab-control"><div class="lab-control__label"><span>CURSOR / TIME</span><b id="sequence-time">' + this.seqTime.toFixed(2) + ' / 2.00</b></div><span class="lab-control__hint">' + esc(t(lang, "单击/拖动时间轴可定位；时间被严重压缩。", "Click/drag the timeline to scrub; time is heavily compressed.")) + "</span></div>";
      html += this.controlSlider("PLAYBACK SPEED", "sequence-speed-value", "sequenceSpeed", 25, 200, Math.round(this.params.sequenceSpeed * 100), 1, "%");
      html += '<button type="button" class="lab-choice" data-action="show-overlay">TIMELINE PANEL</button>';
      html += '<div class="lab-readout-inline"><span>ACTIVE PHASE</span><b id="sequence-phase">' + esc(t(lang, "扫描中", "running")) + "</b></div>";
    } else if (this.experimentId === "kspace") {
      html += '<div class="lab-control"><div class="lab-control__label"><span>UNDERSAMPLING</span><b>R = ' + this.params.kspaceAccel + '×</b></div><div class="lab-choice-row"><button type="button" class="lab-choice' + (this.params.kspaceAccel === 1 ? " is-active" : "") + '" data-action="kspace-accel" data-accel="1">1×</button><button type="button" class="lab-choice' + (this.params.kspaceAccel === 2 ? " is-active" : "") + '" data-action="kspace-accel" data-accel="2">2×</button><button type="button" class="lab-choice' + (this.params.kspaceAccel === 3 ? " is-active" : "") + '" data-action="kspace-accel" data-accel="3">3×</button><button type="button" class="lab-choice' + (this.params.kspaceAccel === 4 ? " is-active" : "") + '" data-action="kspace-accel" data-accel="4">4×</button></div></div>';
      html += '<div class="lab-control"><div class="lab-control__label"><span>KY COVERAGE</span><b id="kspace-coverage-value">' + Math.round(this.params.kspaceCoverage * 100) + '%</b></div><input class="lab-slider" type="range" data-param="kspaceCoverage" min="1" max="100" step="1" value="' + Math.round(this.params.kspaceCoverage * 100) + '" style="--fill:' + Math.round(this.params.kspaceCoverage * 100) + '%" aria-label="ky coverage" /></div>';
      html += '<button type="button" class="lab-play" data-action="kspace-play" aria-label="' + esc(t(lang, this.params.kspacePlaying ? "暂停" : "播放", this.params.kspacePlaying ? "Pause" : "Play")) + '">' + faviconPlay(this.params.kspacePlaying) + "</button>";
      html += '<button type="button" class="lab-choice" data-action="kspace-reset">RESTART</button><button type="button" class="lab-choice" data-action="show-overlay">ANALYSIS</button>';
      html += '<div class="lab-readout-inline"><span>KY ROWS</span><b>' + this.kspaceRows().length + '</b></div>';
    }
    html += '<div class="lab-readout-inline"><span>MODEL</span><b>GENERIC</b></div>';
    this.controlsEl.innerHTML = html;
  }

  onResize() {
    if (!this.active) return;
    if (this.experimentId === "sequence") this.drawSequence();
    if (this.experimentId === "kspace") this.drawKspace(true);
  }

  close() {
    this.deactivate();
  }
}
