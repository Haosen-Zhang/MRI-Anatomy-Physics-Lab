
import * as THREE from "three";

const SECTION_MODES = new Set(["longitudinal", "transverse", "cutaway"]);
const SECTION_HIDE = new Set(["rf-room", "electronics-racks", "operator-console", "console"]);
const MACHINE_PARTS = new Set([
  "housing", "patient-table", "ovv", "thermal-shield", "helium-vessel",
  "main-coils", "shield-coils", "suspension", "cryo-service", "gradient-assembly",
  "gradient-gx", "gradient-gy", "gradient-gz", "gradient-shield", "shim-system",
  "body-rf-coil", "rf-shield", "head-coil",
]);

export class DisassemblyController {
  constructor(scene, callbacks = {}) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.state = {
      displayMode: "transparent",
      explodeCategory: null,
      progress: 0,
      playing: false,
      direction: 1,
      selectedId: null,
      isolatedId: null,
      hidden: new Set(),
      tableDocked: true,
      shellOpacity: 1,
      physicsActive: false,
      physicsFocus: new Set(["main-coils", "gradient-gx", "gradient-gy", "gradient-gz", "body-rf-coil", "head-coil"]),
    };
    this.speed = 0.22;
    this.dirty = true;
    this.lastAppliedProgress = -1;
    this.partOrder = scene.partList.map((part) => part.id);
    this.n = this.partOrder.length;
  }

  setSelected(id) {
    if (this.state.selectedId === id) return;
    if (this.state.selectedId) {
      const previous = this.scene.parts.get(this.state.selectedId);
      if (previous) this.scene.setSelectionOutline(previous, false);
    }
    this.state.selectedId = id;
    if (id) {
      const next = this.scene.parts.get(id);
      if (next) this.scene.setSelectionOutline(next, true);
    }
    this.dirty = true;
  }

  setDisplayMode(mode, options = {}) {
    this.state.displayMode = mode;
    this.state.isolatedId = null;
    this.state.explodeCategory = null;
    this.state.playing = false;
    if (mode === "complete") this.state.progress = 0;
    else if (mode === "exploded" && !options.keepProgress) this.state.progress = 1;
    else if (!["exploded"].includes(mode)) this.state.progress = 0;
    this.applyClipping();
    this.dirty = true;
    if (this.callbacks.onModeChange) this.callbacks.onModeChange(mode, this.state.progress);
  }

  applyClipping() {
    const mode = this.state.displayMode;
    if (mode === "longitudinal" || mode === "transverse") {
      this.scene.setClipping(mode);
      this.scene.setSectionCaps(mode);
    } else if (mode === "cutaway") {
      const filter = new Set(["housing", "ovv", "thermal-shield", "suspension", "shield-coils"]);
      this.scene.setClipping("cutaway", filter);
      this.scene.setSectionCaps("none");
    } else {
      this.scene.setClipping("none");
      this.scene.setSectionCaps("none");
    }
    const selected = this.state.selectedId ? this.scene.parts.get(this.state.selectedId) : null;
    if (selected) this.scene.setSelectionOutline(selected, true);
  }

  setProgress(value, stop = true) {
    this.state.explodeCategory = null;
    this.state.progress = THREE.MathUtils.clamp(value, 0, 1);
    if (stop) this.state.playing = false;
    if (this.state.displayMode !== "exploded") {
      this.state.displayMode = this.state.progress > 0.001 ? "exploded" : "complete";
      this.applyClipping();
    }
    this.dirty = true;
    if (this.callbacks.onProgressChange) this.callbacks.onProgressChange(this.state.progress);
  }

  play(direction = 1) {
    this.state.displayMode = "exploded";
    this.state.explodeCategory = null;
    this.state.playing = true;
    this.state.direction = direction;
    if (direction < 0 && this.state.progress <= 0.001) this.state.progress = 1;
    if (direction > 0 && this.state.progress >= 0.999) this.state.progress = 0;
    this.applyClipping();
    this.dirty = true;
  }

  pause() {
    this.state.playing = false;
  }

  step(delta) {
    this.state.playing = false;
    this.setProgress(this.state.progress + delta);
  }

  reset() {
    if (this.state.selectedId) {
      const previous = this.scene.parts.get(this.state.selectedId);
      if (previous) this.scene.setSelectionOutline(previous, false);
    }
    this.state.displayMode = "transparent";
    this.state.explodeCategory = null;
    this.state.progress = 0;
    this.state.playing = false;
    this.state.selectedId = null;
    this.state.isolatedId = null;
    this.state.hidden.clear();
    this.state.physicsActive = false;
    this.scene.setSectionCaps("none");
    this.scene.setClipping("none");
    this.scene.parts.forEach((part) => {
      part.pivot.visible = true;
      part.hidden = false;
    });
    this.dirty = true;
  }

  toggleVisibility(id) {
    const part = this.scene.parts.get(id);
    if (!part) return;
    if (this.state.hidden.has(id)) this.state.hidden.delete(id);
    else this.state.hidden.add(id);
    this.dirty = true;
    return !this.state.hidden.has(id);
  }

  setIsolate(id) {
    this.state.explodeCategory = null;
    if (!id) {
      if (this.state.selectedId) {
        const previous = this.scene.parts.get(this.state.selectedId);
        if (previous) this.scene.setSelectionOutline(previous, false);
      }
      this.state.isolatedId = null;
      this.state.displayMode = "transparent";
      this.state.selectedId = null;
      this.applyClipping();
      this.dirty = true;
      return;
    }
    this.state.isolatedId = id;
    this.state.displayMode = "isolated";
    this.setSelected(id);
    this.applyClipping();
    this.dirty = true;
  }

  setExplodeCategory(category) {
    this.state.explodeCategory = category || null;
    this.state.displayMode = "exploded";
    this.state.progress = 1;
    this.state.playing = false;
    this.state.isolatedId = null;
    this.applyClipping();
    this.dirty = true;
    if (this.callbacks.onProgressChange) this.callbacks.onProgressChange(this.state.progress);
  }

  setTableDocked(docked) {
    this.state.tableDocked = docked;
    this.scene.setTablePosition(docked ? 1 : 0);
    this.dirty = true;
  }

  setShellOpacity(value) {
    this.state.shellOpacity = THREE.MathUtils.clamp(value, 0.04, 1);
    this.dirty = true;
  }

  setPhysicsActive(active) {
    this.state.physicsActive = active;
    this.state.explodeCategory = null;
    this.state.playing = false;
    this.state.progress = 0;
    if (active) {
      this.setSelected(null);
      this.state.displayMode = "complete";
      this.scene.setClipping("none");
      this.scene.setSectionCaps("none");
    }
    this.dirty = true;
  }

  setPhysicsFocus(ids) {
    this.state.physicsFocus = new Set(ids);
    this.dirty = true;
  }

  localProgressFor(part, index) {
    if (this.state.explodeCategory && part.meta.cat !== this.state.explodeCategory) return 0;
    const start = (index / Math.max(1, this.n - 1)) * 0.42;
    const end = Math.min(1, start + 0.58);
    const p = THREE.MathUtils.clamp((this.state.progress - start) / Math.max(0.01, end - start), 0, 1);
    return p * p * (3 - 2 * p);
  }

  effectiveVisible(part) {
    if (this.state.hidden.has(part.id)) return false;
    if (this.state.isolatedId && part.id !== this.state.isolatedId) return false;
    if (SECTION_MODES.has(this.state.displayMode) && SECTION_HIDE.has(part.id)) return false;
    if (this.state.displayMode === "exploded" && ["electronics-racks", "operator-console", "rf-room"].includes(part.id)) return false;
    if (this.state.physicsActive && ["electronics-racks", "operator-console", "rf-room"].includes(part.id)) return false;
    return true;
  }

  baseOpacity(part) {
    const mode = this.state.displayMode;
    if (this.state.physicsActive) {
      if (this.state.physicsFocus.has(part.id)) return 0.32;
      if (part.id === "housing" || part.id === "ovv" || part.id === "thermal-shield" || part.id === "helium-vessel") return 0.04;
      if (part.id === "rf-room") return 0;
      return 0.06;
    }
    if (mode === "transparent") {
      if (part.id === "housing") return 0.17;
      if (part.id === "ovv") return 0.25;
      if (part.id === "thermal-shield") return 0.32;
      if (part.id === "helium-vessel") return 0.45;
      if (part.id === "gradient-assembly") return 0.55;
      if (part.id === "rf-shield") return 0.35;
      if (part.id === "rf-room") return 0.5;
      return 1;
    }
    if (mode === "longitudinal" || mode === "transverse") {
      if (part.id === "housing") return 0.18;
      if (part.id === "rf-room") return 0;
      return 1;
    }
    if (mode === "cutaway") {
      if (part.id === "housing") return 0.18;
      if (part.id === "ovv") return 0.5;
      return 1;
    }
    if (mode === "exploded") {
      if (this.state.explodeCategory) {
        if (part.meta.cat === this.state.explodeCategory) return 1;
        if (["housing", "ovv", "thermal-shield", "helium-vessel"].includes(part.id)) return 0.04;
        return 0.08;
      }
      if (part.id === "housing") return 0.2;
      if (part.id === "ovv") return 0.22;
      if (part.id === "thermal-shield") return 0.35;
      if (part.id === "helium-vessel") return 0.5;
      if (part.id === "rf-room") return 0;
      return 1;
    }
    if (mode === "isolated") {
      return this.state.isolatedId === part.id ? 1 : 0;
    }
    return 1;
  }

  applyAppearanceOnly() {
    const selectedId = this.state.selectedId;
    const section = SECTION_MODES.has(this.state.displayMode);
    this.scene.parts.forEach((part) => {
      const visible = this.effectiveVisible(part);
      part.pivot.visible = visible;
      if (!visible) return;
      let opacity = this.baseOpacity(part);
      if (["housing", "ovv", "thermal-shield", "helium-vessel", "gradient-assembly", "rf-shield"].includes(part.id)) {
        opacity *= this.state.shellOpacity;
      }
      if (selectedId && part.id !== selectedId && !this.state.physicsActive && !this.state.explodeCategory) {
        opacity = Math.min(opacity, section ? 0.12 : 0.13);
      }
      part.materials.forEach((material) => {
        const base = material.userData.baseOpacity !== undefined ? material.userData.baseOpacity : 1;
        const target = base * opacity;
        if (Math.abs((material.userData.lastTarget || -1) - target) > 0.004) {
          material.userData.lastTarget = target;
          material.opacity = target;
          const needsTransparency = material.userData.baseTransparent || target < 0.999;
          if (material.transparent !== needsTransparency) {
            material.transparent = needsTransparency;
            material.needsUpdate = true;
          }
          material.depthWrite = target > 0.92 && material.userData.baseDepthWrite !== false;
        }
      });
    });
  }

  applyTransforms() {
    this.partOrder.forEach((id, index) => {
      const part = this.scene.parts.get(id);
      if (!part) return;
      const local = this.localProgressFor(part, index);
      const ex = this.state.progress > 0.001 ? local : 0;
      const p = part.homePosition;
      const offset = part.explodeOffset;
      const spread = 0.68;
      part.pivot.position.set(
        p.x + offset.x * ex * spread,
        p.y + offset.y * ex * spread,
        p.z + offset.z * ex * spread
      );
      if (part.id === "head-coil") {
        part.pivot.position.z += this.scene.getPatientOffset();
      }
      part.pivot.rotation.set(
        part.homeEuler.x + part.explodeRot.x * ex,
        part.homeEuler.y + part.explodeRot.y * ex,
        part.homeEuler.z + part.explodeRot.z * ex
      );
    });
  }

  update(dt) {
    this.scene.updateTable(dt);
    if (this.state.playing) {
      this.state.progress += this.state.direction * this.speed * dt;
      if (this.state.progress >= 1) {
        this.state.progress = 1;
        this.state.playing = false;
      } else if (this.state.progress <= 0) {
        this.state.progress = 0;
        this.state.playing = false;
      }
      this.dirty = true;
      if (this.callbacks.onProgressChange) this.callbacks.onProgressChange(this.state.progress);
    }
    if (this.dirty || this.state.playing || Math.abs(this.scene.tablePosition - this.scene.tableTarget) > 0.001) {
      this.applyTransforms();
      this.applyAppearanceOnly();
      this.lastAppliedProgress = this.state.progress;
      this.dirty = this.state.playing;
    }
  }
}
