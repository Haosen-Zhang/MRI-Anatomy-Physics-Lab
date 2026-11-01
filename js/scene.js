
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createMaterials } from "./materials.js";
import { buildAllHardware } from "./hardware.js";
import { PART_MAP } from "./componentsData.js";
import {
  roundedRectShape, roundedRectHole, extrudeShape, addRing, addBox, addMesh,
  makeCanvasTexture, addTextPlane, TAU,
} from "./geometryUtils.js";

const HOME_VIEWS = {
  desktop: {
    position: [4.35, 2.65, 5.65],
    target: [0.65, 0.02, 0.18],
    fov: 31,
  },
  mobile: {
    position: [3.8, 3.0, 7.6],
    target: [0.15, 0.05, 0.22],
    fov: 39,
  },
  systems: {
    position: [7.0, 4.1, 7.6],
    target: [1.4, -0.05, 0.5],
    fov: 34,
  },
};

const PRESETS = {
  iso: { position: [4.35, 2.65, 5.65], target: [0.65, 0.02, 0.18], fov: 31 },
  front: { position: [0.05, 0.8, 5.7], target: [0, -0.02, 0.02], fov: 31 },
  rear: { position: [-0.05, 0.9, -5.7], target: [0, -0.02, 0.02], fov: 31 },
  left: { position: [-5.6, 0.8, 0.2], target: [0, -0.05, 0.02], fov: 31 },
  right: { position: [5.6, 0.8, 0.2], target: [0, -0.05, 0.02], fov: 31 },
  top: { position: [0.01, 5.8, 0.15], target: [0, 0, 0.05], fov: 31 },
  systems: { position: [7.0, 4.1, 7.6], target: [1.4, -0.05, 0.5], fov: 34 },
  axial: { position: [0.02, 0.22, 6.65], target: [0, 0.0, 0.0], fov: 27 },
  longitudinal: { position: [5.0, 2.05, 4.05], target: [0.0, 0.08, 0.12], fov: 31 },
};

function glowTexture() {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(0,0,0,.5)");
    g.addColorStop(0.4, "rgba(0,0,0,.28)");
    g.addColorStop(0.75, "rgba(0,0,0,.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeFloorTexture() {
  return makeCanvasTexture(2048, 2048, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, w * 0.65);
    bg.addColorStop(0, "rgba(18, 35, 45, .36)");
    bg.addColorStop(0.46, "rgba(7, 15, 21, .18)");
    bg.addColorStop(1, "rgba(2, 5, 8, 0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(105, 142, 158, .07)";
    ctx.lineWidth = 1.2;
    const step = 64;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(119, 163, 181, .13)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += step * 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step * 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Stage rings
    for (const [r, alpha, width] of [[w * 0.23, 0.19, 2], [w * 0.33, 0.08, 1.2], [w * 0.41, 0.11, 1.4]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.strokeStyle = "rgba(119, 174, 193, " + alpha + ")";
      ctx.lineWidth = width;
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(152, 196, 211, .14)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 64; i += 1) {
      const a = (TAU * i) / 64;
      const inner = w * 0.412;
      const outer = inner + (i % 8 === 0 ? 24 : 10);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
    }
    // Coordinate cross
    ctx.strokeStyle = "rgba(136, 180, 197, .12)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - w * 0.45);
    ctx.lineTo(cx, cy + w * 0.45);
    ctx.moveTo(cx - w * 0.45, cy);
    ctx.lineTo(cx + w * 0.45, cy);
    ctx.stroke();
  }, { linear: false });
}

function capRoundedSquareFrame(outerW, outerH, innerW, innerH, radius, material, z) {
  const shape = roundedRectShape(outerW, outerH, radius);
  shape.holes.push(roundedRectHole(innerW, innerH, Math.max(0.02, radius - 0.03), 0, 0));
  const mesh = extrudeShape(shape, 0.012, material, 0.004, 32);
  mesh.position.z = z;
  return mesh;
}

export class MRIScene {
  constructor(host) {
    this.host = host;
    this.parts = new Map();
    this.partList = [];
    this.pickMeshes = [];
    this.clipMaterials = [];
    this.clock = 0;
    this.cameraTween = null;
    this.currentCameraType = "perspective";
    this.tableTarget = 1;
    this.tablePosition = 1;
    this.patientOffset = 0;
    this.autoRotateEnabled = false;
    this.clipPlane = null;
    this.selectionOutline = null;
    this.selectedId = null;
    this.hiddenIds = new Set();
    this.lowPerformance = false;
    this.disposables = [];
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initControls();
    this.materials = createMaterials(this.renderer);
    this.scene.environment = this.materials.environment;
    this.scene.environmentIntensity = 0.72;
    this.initLights();
    this.buildHardware();
    this.buildStage();
    this.buildSectionCaps();
    this.initEvents();
    this.applyHomeView(false);
    this.resize();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.localClippingEnabled = true;
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.host.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x03070b, 0.012);
    this.root = new THREE.Group();
    this.root.name = "MRIteachingRoot";
    this.scene.add(this.root);
    this.machineRoot = new THREE.Group();
    this.machineRoot.name = "machine";
    this.root.add(this.machineRoot);
    this.physicsGroup = new THREE.Group();
    this.physicsGroup.name = "physicsOverlay";
    this.root.add(this.physicsGroup);
    this.sectionCaps = new THREE.Group();
    this.sectionCaps.name = "sectionCaps";
    this.root.add(this.sectionCaps);
  }

  initCamera() {
    const home = window.innerWidth < 900 ? HOME_VIEWS.mobile : HOME_VIEWS.desktop;
    this.perspCamera = new THREE.PerspectiveCamera(home.fov, window.innerWidth / window.innerHeight, 0.05, 80);
    this.perspCamera.position.set(home.position[0], home.position[1], home.position[2]);
    this.orthoCamera = new THREE.OrthographicCamera(-2.4, 2.4, 2.4, -2.4, 0.05, 80);
    this.orthoCamera.position.copy(this.perspCamera.position);
    this.orthoCamera.zoom = 1;
    this.camera = this.perspCamera;
    this.cameraTarget = new THREE.Vector3(home.target[0], home.target[1], home.target[2]);
    this.perspCamera.lookAt(this.cameraTarget);
    this.orthoCamera.lookAt(this.cameraTarget);
    this.orthoCamera.updateProjectionMatrix();
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.cameraTarget);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.8;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.3;
    this.controls.maxDistance = 18;
    this.controls.minPolarAngle = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 5;
    this.controls.autoRotate = this.autoRotateEnabled;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.update();
  }

  setAutoRotate(enabled) {
    this.autoRotateEnabled = Boolean(enabled);
    if (this.controls) this.controls.autoRotate = this.autoRotateEnabled;
  }

  initLights() {
    this.scene.add(new THREE.HemisphereLight(0x93b5ca, 0x020508, 0.48));
    const key = new THREE.DirectionalLight(0xe4f4ff, 2.4);
    key.position.set(5.5, 7.2, 5.5);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x65a2c5, 1.25);
    fill.position.set(-5.5, 3.5, 4.0);
    this.scene.add(fill);
    const back = new THREE.DirectionalLight(0x6fb8d5, 0.9);
    back.position.set(0.6, 3.8, -7.0);
    this.scene.add(back);
    const warm = new THREE.PointLight(0xf3a36a, 6.5, 10, 2);
    warm.position.set(4.8, 1.1, 2.5);
    this.scene.add(warm);
    const cool = new THREE.PointLight(0x72d8ff, 3.2, 8, 2);
    cool.position.set(-2.2, 1.4, 2.8);
    this.scene.add(cool);
  }

  buildHardware() {
    const descriptors = buildAllHardware(this.materials);
    descriptors.forEach((descriptor) => {
      const meta = PART_MAP.get(descriptor.id);
      if (!meta) return;
      const pivot = new THREE.Group();
      pivot.name = descriptor.id;
      const home = meta.home || [0, 0, 0];
      pivot.position.set(home[0], home[1], home[2]);
      pivot.add(descriptor.group);
      this.machineRoot.add(pivot);

      const cloneMap = new Map();
      const part = {
        id: descriptor.id,
        meta,
        pivot,
        group: descriptor.group,
        anchorLocal: new THREE.Vector3(...(descriptor.anchor || meta.anchor || [0, 0, 0])),
        homePosition: pivot.position.clone(),
        homeQuaternion: pivot.quaternion.clone(),
        homeEuler: pivot.rotation.clone(),
        explodeOffset: new THREE.Vector3(...(meta.explode || [0, 0, 0])),
        explodeRot: new THREE.Euler(...(meta.explodeRot || [0, 0, 0])),
        materials: [],
        pickMeshes: [],
        box: new THREE.Box3(),
        sphere: new THREE.Sphere(),
        hidden: false,
        offsetVisibility: 1,
      };

      descriptor.group.traverse((object) => {
        if (object.isMesh) {
          object.userData.partId = descriptor.id;
          part.pickMeshes.push(object);
          this.pickMeshes.push(object);
          this.applyPartMaterial(object, cloneMap, part, descriptor.id);
          if (object.geometry) object.geometry.computeBoundingSphere();
        } else if (object.isLine || object.isLineSegments || object.isLineLoop) {
          this.applyPartMaterial(object, cloneMap, part, descriptor.id);
          object.userData.partId = descriptor.id;
        }
      });

      pivot.updateMatrixWorld(true);
      part.box.setFromObject(descriptor.group);
      part.box.getBoundingSphere(part.sphere);
      this.parts.set(descriptor.id, part);
      this.partList.push(part);
    });
  }

  applyPartMaterial(object, cloneMap, part, partId) {
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const clones = source.map((original) => {
      if (!original) return original;
      if (cloneMap.has(original)) return cloneMap.get(original);
      const material = original.clone();
      material.userData = Object.assign({}, material.userData, {
        baseOpacity: original.opacity,
        baseTransparent: original.transparent,
        baseDepthWrite: original.depthWrite,
        baseColor: original.color ? original.color.clone() : null,
        baseEmissive: original.emissive ? original.emissive.clone() : null,
        baseEmissiveIntensity: original.emissiveIntensity !== undefined ? original.emissiveIntensity : 0,
        partId,
      });
      cloneMap.set(original, material);
      part.materials.push(material);
      this.clipMaterials.push(material);
      return material;
    });
    object.material = Array.isArray(object.material) ? clones : clones[0];
  }

  buildStage() {
    const stage = new THREE.Group();
    stage.name = "stage";
    this.scene.add(stage);

    const floorMaterial = new THREE.MeshBasicMaterial({
      map: makeFloorTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.145;
    stage.add(floor);

    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 4.8),
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        toneMapped: false,
      })
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = -1.139;
    stage.add(contact);

    // isocenter floor marker, small and technical
    const isoRing = new THREE.Mesh(
      new THREE.RingGeometry(0.095, 0.105, 64),
      new THREE.MeshBasicMaterial({ color: 0x638797, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
    );
    isoRing.rotation.x = -Math.PI / 2;
    isoRing.position.set(0, -1.136, 0);
    stage.add(isoRing);

    this.stage = stage;
  }

  buildSectionCaps() {
    const M = this.materials;
    const transverse = new THREE.Group();
    const longitudinal = new THREE.Group();
    transverse.name = "transverseSectionCaps";
    longitudinal.name = "longitudinalSectionCaps";

    const z = 0.026;
    const y = 0;
    // Outer cover / chassis rim, represented as a thin rounded-square shell cross-section.
    const housingFrame = capRoundedSquareFrame(2.24, 2.08, 2.08, 1.92, 0.25, M.sectionHousing, z);
    transverse.add(housingFrame);
    // OVV, thermal shield, MLI, helium vessel
    addRing(transverse, 0.785, 0.86, M.sectionOVV, [0, 0, z + 0.002], [0, 0, 0], 128);
    addRing(transverse, 0.705, 0.742, M.sectionThermal, [0, 0, z + 0.004], [0, 0, 0], 128);
    addRing(transverse, 0.755, 0.78, M.sectionThermal, [0, 0, z + 0.003], [0, 0, 0], 128);
    addRing(transverse, 0.555, 0.618, M.sectionHelium, [0, 0, z + 0.005], [0, 0, 0], 128);
    addRing(transverse, 0.505, 0.55, M.sectionShield, [0, 0, z + 0.006], [0, 0, 0], 128);
    addRing(transverse, 0.699, 0.714, M.sectionShield, [0, 0, z + 0.005], [0, 0, 0], 128);
    // gradient support and shims
    addRing(transverse, 0.37, 0.458, M.sectionGradient, [0, 0, z + 0.008], [0, 0, 0], 128);
    addRing(transverse, 0.462, 0.476, M.sectionShim, [0, 0, z + 0.009], [0, 0, 0], 128);
    // RF shield, body coil, head array and bore
    addRing(transverse, 0.348, 0.358, M.sectionShield, [0, 0, z + 0.011], [0, 0, 0], 128);
    addRing(transverse, 0.307, 0.325, M.sectionRF, [0, 0, z + 0.012], [0, 0, 0], 128);
    addRing(transverse, 0.158, 0.183, M.sectionReceive, [0, 0, z + 0.013], [0, 0, 0], 96);
    addRing(transverse, 0.366, 0.405, M.sectionBore, [0, 0, z + 0.007], [0, 0, 0], 128);
    // conductor cross-sections at z=0 (dots, not volumes)
    const dotGeo = new THREE.CircleGeometry(0.006, 16);
    for (let i = 0; i < 16; i += 1) {
      const a = (TAU * i) / 16;
      addMesh(transverse, dotGeo, M.sectionRF, [Math.cos(a) * 0.317, Math.sin(a) * 0.317, z + 0.018]);
    }
    for (let i = 0; i < 8; i += 1) {
      const a = (TAU * i) / 8;
      addMesh(transverse, new THREE.CircleGeometry(0.005, 16), M.sectionGradient, [Math.cos(a) * 0.405, Math.sin(a) * 0.405, z + 0.019]);
    }

    // Central air / bore area marker
    addRing(transverse, 0.012, 0.016, M.sectionBore, [0, 0, z + 0.02], [0, 0, 0], 64);

    // Longitudinal section: a dark cut-plane card plus wall bands and an explicit envelope.
    const sectionShape = roundedRectShape(1.72, 2.06, 0.23);
    const sectionPlate = new THREE.Mesh(
      new THREE.ShapeGeometry(sectionShape, 40),
      new THREE.MeshBasicMaterial({ color: 0x061018, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
    );
    sectionPlate.rotation.y = Math.PI / 2;
    sectionPlate.position.x = 0.006;
    longitudinal.add(sectionPlate);
    const outlinePoints = sectionShape.getPoints(80).map((point) => new THREE.Vector3(0.03, point.y, -point.x));
    const sectionOutline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(outlinePoints),
      new THREE.LineBasicMaterial({ color: 0x7daec2, transparent: true, opacity: 0.55, depthTest: false })
    );
    sectionOutline.renderOrder = 22;
    longitudinal.add(sectionOutline);
    for (const z of [-0.845, 0.845]) {
      addBox(longitudinal, 0.018, 2.02, 0.026, M.sectionHousing, [0.028, 0, z], 0.004);
    }
    for (const y of [-0.36, 0.36]) {
      addBox(longitudinal, 0.018, 0.012, 1.68, M.sectionBore, [0.03, y, 0], 0.003);
    }

    // Longitude section at x=0: top/bottom wall bands along Z.
    const addBand = (inner, outer, length, material, zOff = 0, yOff = 0) => {
      const thickness = outer - inner;
      for (const sign of [-1, 1]) {
        addBox(longitudinal, 0.014, thickness, length, material, [0.014, sign * (inner + thickness / 2) + yOff, zOff], 0.003);
      }
    };
    addBand(0.98, 1.04, 1.7, M.sectionHousing);
    addBand(0.785, 0.86, 1.62, M.sectionOVV);
    addBand(0.705, 0.742, 1.48, M.sectionThermal);
    addBand(0.755, 0.78, 1.36, M.sectionThermal);
    addBand(0.555, 0.618, 1.24, M.sectionHelium);
    addBand(0.505, 0.55, 1.18, M.sectionShield);
    addBand(0.699, 0.714, 1.16, M.sectionShield);
    addBand(0.37, 0.458, 1.34, M.sectionGradient);
    addBand(0.462, 0.476, 1.08, M.sectionShim);
    addBand(0.348, 0.358, 1.03, M.sectionShield);
    addBand(0.307, 0.325, 1.02, M.sectionRF);
    addBand(0.158, 0.183, 0.43, M.sectionReceive, -0.01);
    addBand(0.366, 0.405, 2.04, M.sectionBore);
    // Patient table strip
    addBox(longitudinal, 0.018, 0.07, 2.9, M.sectionHousing, [0.014, -0.32, 0.97], 0.005);
    addBox(longitudinal, 0.018, 0.025, 2.75, M.sectionReceive, [0.014, -0.263, 0.97], 0.004);
    // Signal axis / center line
    for (const sign of [-1, 1]) {
      addBox(longitudinal, 0.008, 0.002, 1.95, M.sectionBore, [0.022, sign * 0.006, 0], 0.001);
    }

    transverse.visible = false;
    longitudinal.visible = false;
    this.sectionCaps.add(transverse, longitudinal);
    this.transverseCaps = transverse;
    this.longitudinalCaps = longitudinal;
  }

  setSectionCaps(kind) {
    this.transverseCaps.visible = kind === "transverse";
    this.longitudinalCaps.visible = kind === "longitudinal";
  }

  setClipping(mode, partFilter = null) {
    let plane = null;
    if (mode === "longitudinal") plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    if (mode === "transverse") plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    if (mode === "cutaway") plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    this.clipPlane = plane;
    this.parts.forEach((part) => {
      const apply = plane && (!partFilter || partFilter.has(part.id));
      part.materials.forEach((material) => {
        material.clippingPlanes = apply ? [plane] : [];
        material.clipShadows = true;
        material.needsUpdate = true;
      });
    });
  }

  setTablePosition(value) {
    this.tableTarget = value;
  }

  updateTable(dt) {
    this.tablePosition = THREE.MathUtils.damp(this.tablePosition, this.tableTarget, 3.2, dt);
    const table = this.parts.get("patient-table");
    if (table && table.group.userData.tablePallet) {
      const pallet = table.group.userData.tablePallet;
      pallet.position.z = (1 - this.tablePosition) * 1.05;
    }
  }

  getPatientOffset() {
    return (1 - this.tablePosition) * 1.05;
  }

  setHomeViewForViewport(animate = true) {
    const view = window.innerWidth < 900 ? HOME_VIEWS.mobile : HOME_VIEWS.desktop;
    this.setView(view, animate ? 750 : 0);
  }

  applyHomeView(animate = false) {
    this.setHomeViewForViewport(animate);
  }

  setView(view, duration = 760) {
    if (!view) return;
    const currentCam = this.camera;
    const target = new THREE.Vector3(view.target[0], view.target[1], view.target[2]);
    if (this.currentCameraType === "perspective" && view.fov) {
      currentCam.fov = view.fov;
      currentCam.updateProjectionMatrix();
    }
    const position = new THREE.Vector3(view.position[0], view.position[1], view.position[2]);
    if (duration <= 0) {
      currentCam.position.copy(position);
      this.controls.target.copy(target);
      this.cameraTarget.copy(target);
      currentCam.lookAt(target);
      this.controls.update();
      return;
    }
    this.cameraTween = {
      startPos: currentCam.position.clone(),
      endPos: position.clone(),
      startTarget: this.controls.target.clone(),
      endTarget: target.clone(),
      startTime: performance.now(),
      duration,
    };
    this.controls.enabled = false;
  }

  setCameraPreset(name, duration = 760) {
    const preset = PRESETS[name];
    if (!preset) return;
    if (window.innerWidth < 760) {
      const factor = name === "axial" ? 1.85 : name === "longitudinal" ? 1.55 : name === "systems" ? 1.0 : name === "top" ? 1.35 : 1.3;
      const target = new THREE.Vector3(preset.target[0], preset.target[1], preset.target[2]);
      const position = new THREE.Vector3(preset.position[0], preset.position[1], preset.position[2]);
      position.sub(target).multiplyScalar(factor).add(target);
      this.setView({ position: position.toArray(), target: preset.target, fov: preset.fov }, duration);
      return;
    }
    this.setView(preset, duration);
  }

  focusPart(id, duration = 760) {
    const part = this.parts.get(id);
    if (!part) return;
    const box = new THREE.Box3().setFromObject(part.group);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(0.18, sphere.radius);
    const currentDirection = this.camera.position.clone().sub(this.controls.target).normalize();
    const desiredDistance = THREE.MathUtils.clamp(radius * 3.2, 2.5, 8.4);
    const position = center.clone().add(currentDirection.multiplyScalar(desiredDistance));
    if (this.currentCameraType === "perspective") {
      this.setView({ position: position.toArray(), target: center.toArray(), fov: this.camera.fov }, duration);
    } else {
      this.setView({ position: position.toArray(), target: center.toArray() }, duration);
    }
  }

  setCameraType(type) {
    if (type === this.currentCameraType) return;
    const target = this.controls.target.clone();
    const direction = this.camera.position.clone().sub(target).normalize();
    const oldZoom = type === "orthographic" ? 1 : this.camera.zoom;
    this.currentCameraType = type;
    if (type === "orthographic") {
      const aspect = window.innerWidth / window.innerHeight;
      this.orthoCamera.left = -2.2 * aspect;
      this.orthoCamera.right = 2.2 * aspect;
      this.orthoCamera.top = 2.2;
      this.orthoCamera.bottom = -2.2;
      this.orthoCamera.zoom = 1;
      this.orthoCamera.position.copy(target.clone().add(direction.multiplyScalar(8.5)));
      this.orthoCamera.lookAt(target);
      this.orthoCamera.updateProjectionMatrix();
      this.camera = this.orthoCamera;
    } else {
      this.perspCamera.position.copy(target.clone().add(direction.multiplyScalar(7.5)));
      this.perspCamera.lookAt(target);
      this.perspCamera.updateProjectionMatrix();
      this.camera = this.perspCamera;
    }
    this.replaceControls(target);
  }

  replaceControls(target) {
    if (this.controls) {
      this.controls.dispose();
    }
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.8;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.3;
    this.controls.maxDistance = 18;
    this.controls.minPolarAngle = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 5;
    this.controls.autoRotate = this.autoRotateEnabled;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.update();
  }

  setVisibility(id, visible) {
    const part = this.parts.get(id);
    if (!part) return;
    part.pivot.visible = visible;
    if (visible) part.hidden = false;
    else part.hidden = true;
  }

  setAllVisibility(visible) {
    this.parts.forEach((part) => {
      part.pivot.visible = visible;
      part.hidden = !visible;
    });
  }

  isolatePart(id) {
    this.parts.forEach((part) => {
      part.pivot.visible = part.id === id;
    });
  }

  resetVisibility() {
    this.parts.forEach((part) => {
      part.pivot.visible = !part.hidden;
    });
  }

  setPartOpacity(part, opacity, options = {}) {
    const base = options.baseOpacity !== undefined ? options.baseOpacity : 1;
    part.materials.forEach((material) => {
      const orig = material.userData.baseOpacity !== undefined ? material.userData.baseOpacity : 1;
      const targetOpacity = orig * base * opacity;
      material.opacity = targetOpacity;
      const needsTransparency = material.userData.baseTransparent || targetOpacity < 0.999;
      if (material.transparent !== needsTransparency) {
        material.transparent = needsTransparency;
        material.needsUpdate = true;
      }
      material.depthWrite = targetOpacity > 0.92 && material.userData.baseDepthWrite !== false;
    });
  }

  restorePartMaterials(part) {
    part.materials.forEach((material) => {
      material.opacity = material.userData.baseOpacity;
      material.transparent = material.userData.baseTransparent;
      material.depthWrite = material.userData.baseDepthWrite;
      if (material.emissive && material.userData.baseEmissive) {
        material.emissive.copy(material.userData.baseEmissive);
        material.emissiveIntensity = material.userData.baseEmissiveIntensity;
      }
      material.needsUpdate = true;
    });
  }

  highlightPart(part, selected = true) {
    part.materials.forEach((material) => {
      if (!material.emissive) return;
      if (!material.userData.baseEmissive) material.userData.baseEmissive = material.emissive.clone();
      if (!material.userData.baseEmissiveIntensity && material.emissiveIntensity !== undefined) {
        material.userData.baseEmissiveIntensity = material.emissiveIntensity;
      }
      if (selected) {
        material.emissive.setHex(0x10353f);
        material.emissiveIntensity = Math.max(material.userData.baseEmissiveIntensity || 0, 0.45);
      } else {
        material.emissive.copy(material.userData.baseEmissive);
        material.emissiveIntensity = material.userData.baseEmissiveIntensity || 0;
      }
    });
  }

  buildOutline(part) {
    if (part.outlineMeshes) return part.outlineMeshes;
    const material = new THREE.MeshBasicMaterial({
      color: 0x8dd9ec,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const meshes = [];
    part.group.traverse((object) => {
      if (!object.isMesh) return;
      if (object.material && object.material.transparent) return;
      if (!object.geometry) return;
      const ghost = new THREE.Mesh(object.geometry, material);
      ghost.position.copy(object.position);
      ghost.quaternion.copy(object.quaternion);
      ghost.scale.copy(object.scale).multiplyScalar(1.017);
      ghost.visible = false;
      ghost.renderOrder = 20;
      ghost.userData.noRaycast = true;
      object.parent.add(ghost);
      meshes.push(ghost);
    });
    part.outlineMeshes = meshes;
    part.outlineMaterial = material;
    return meshes;
  }

  setSelectionOutline(part, visible) {
    if (!part) return;
    const meshes = this.buildOutline(part);
    part.outlineMaterial.clippingPlanes = this.clipPlane && visible ? [this.clipPlane] : [];
    part.outlineMaterial.needsUpdate = true;
    meshes.forEach((mesh) => { mesh.visible = visible; });
  }

  fitPartIds(ids, duration = 850, margin = 1.35) {
    const box = new THREE.Box3();
    ids.forEach((id) => {
      const part = this.parts.get(id);
      if (!part) return;
      const partBox = new THREE.Box3().setFromObject(part.group);
      if (!partBox.isEmpty()) box.union(partBox);
    });
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(0.25, sphere.radius);
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    if (this.currentCameraType === "perspective") {
      const verticalFov = (this.camera.fov * Math.PI) / 180;
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
      const fitFov = Math.min(verticalFov, horizontalFov);
      const distance = radius / Math.sin(fitFov / 2) * margin;
      this.setView({ position: center.clone().add(direction.multiplyScalar(distance)).toArray(), target: center.toArray(), fov: this.camera.fov }, duration);
    } else {
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const desiredHeight = radius * 2 * margin;
      const zoomHeight = 4.4 / desiredHeight;
      const zoomWidth = (4.4 * aspect) / (radius * 2 * margin);
      this.orthoCamera.zoom = Math.max(0.3, Math.min(zoomHeight, zoomWidth));
      this.orthoCamera.updateProjectionMatrix();
      this.setView({ position: center.clone().add(direction.multiplyScalar(radius * 6)).toArray(), target: center.toArray() }, duration);
    }
  }

  getPartAnchor(id) {
    const part = this.parts.get(id);
    if (!part) return null;
    const vector = part.anchorLocal.clone();
    part.pivot.localToWorld(vector);
    return vector;
  }

  getPartCenter(id) {
    const part = this.parts.get(id);
    if (!part) return null;
    const box = new THREE.Box3().setFromObject(part.group);
    return box.getCenter(new THREE.Vector3());
  }

  projectPosition(position) {
    const p = position.clone().project(this.camera);
    return {
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
      z: p.z,
    };
  }

  initEvents() {
    this.onResize = this.resize.bind(this);
    window.addEventListener("resize", this.onResize, { passive: true });
    this.onPointerDown = () => {
      if (this.cameraTween) {
        this.cameraTween = null;
        this.controls.enabled = true;
      }
    };
    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown, { passive: true });
  }

  update(dt, now) {
    if (this.cameraTween) {
      const t = THREE.MathUtils.clamp((now - this.cameraTween.startTime) / this.cameraTween.duration, 0, 1);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, e);
      this.controls.target.lerpVectors(this.cameraTween.startTarget, this.cameraTween.endTarget, e);
      this.camera.lookAt(this.controls.target);
      if (t >= 1) {
        this.cameraTween = null;
        this.controls.enabled = true;
        this.controls.update();
      }
    } else {
      this.controls.update();
    }
    this.updateTable(dt);
    this.cameraTarget.copy(this.controls.target);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(this.lowPerformance ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    const aspect = w / h;
    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();
    const half = 2.2;
    this.orthoCamera.left = -half * aspect;
    this.orthoCamera.right = half * aspect;
    this.orthoCamera.top = half;
    this.orthoCamera.bottom = -half;
    this.orthoCamera.updateProjectionMatrix();
  }

  dispose() {
    window.removeEventListener("resize", this.onResize);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.controls.dispose();
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const mats = Array.isArray(object.material) ? object.material : [object.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
