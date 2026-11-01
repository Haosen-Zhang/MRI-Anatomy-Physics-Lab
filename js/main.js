
import * as THREE from "three";
import { MRIScene } from "./scene.js";
import { DisassemblyController } from "./explosion.js";
import { PhysicsLab } from "./physics.js";
import {
  DISPLAY_LABELS, CATEGORY_MAP, LabelOverlay, t, pick, esc,
  renderTree, renderExperiments, renderOverview, renderPart, renderExperiment,
  renderSectionLegend, modalTabs, modalContent,
} from "./ui.js";
import { PARTS, PART_MAP, CATEGORIES, LEVELS, EXPERIMENTS, EXPERIMENT_MAP } from "./componentsData.js";

const $ = (id) => document.getElementById(id);
const state = {
  mode: "anatomy", lang: "zh", field: 3, labels: true, lowPerformance: false,
  projection: "perspective", anatomyDisplayMode: "transparent",
  sectionLegendHidden: false, sectionLegendExpanded: false, modalTab: "guide", modalOpen: false,
  savedAnatomy: null, isolateReturnMode: "transparent",
};
let scene, controller, physics, labels;
let lastDisplayMode = "transparent";
let lastPlayDirection = 1;
let toastTimer = 0;
let resizeTimer = 0;
const collapsedCats = new Set();
const dom = {};
const VIEW_OPTIONS = [
  { value: "iso", zh: "等轴测 / ISOMETRIC", en: "ISOMETRIC" },
  { value: "front", zh: "前视 / FRONT", en: "FRONT" },
  { value: "rear", zh: "后视 / REAR", en: "REAR" },
  { value: "left", zh: "左侧 / LEFT", en: "LEFT" },
  { value: "right", zh: "右侧 / RIGHT", en: "RIGHT" },
  { value: "top", zh: "顶视 / TOP", en: "TOP" },
  { value: "axial", zh: "轴位剖面 / AXIAL", en: "AXIAL CROSS-SECTION" },
  { value: "longitudinal", zh: "纵切 / LONGITUDINAL", en: "LONGITUDINAL CUTAWAY" },
  { value: "systems", zh: "机房布局 / SYSTEMS", en: "SYSTEMS & ROOM" },
];
const LAB_VIEW_OPTIONS = [
  { value: "iso", zh: "系统 / SYSTEM", en: "SYSTEM" },
  { value: "axial", zh: "孔径轴向 / BORE AXIAL", en: "BORE AXIAL" },
  { value: "longitudinal", zh: "侧剖 / CUTAWAY", en: "CUTAWAY" },
  { value: "top", zh: "顶视 / TOP", en: "TOP" },
];

init();

function init() {
  cacheDom();
  try { scene = new MRIScene(dom.stage); }
  catch (error) { showBootError(error); return; }
  controller = new DisassemblyController(scene, {
    onProgressChange: () => {
      updateProgressUI();
      if (controller.state.displayMode !== lastDisplayMode) {
        lastDisplayMode = controller.state.displayMode;
        syncDisplayUI(); labels?.refresh();
      }
    },
    onModeChange: () => {
      if (controller.state.displayMode !== lastDisplayMode) {
        lastDisplayMode = controller.state.displayMode;
        syncDisplayUI(); labels?.refresh();
      }
    },
  });
  physics = new PhysicsLab({
    controls: dom.physicsControls, hud: dom.physicsHud,
    overlay: dom.labOverlay, overlayBody: dom.labOverlayBody,
    overlayTitle: dom.labOverlayTitle, overlayKicker: dom.labOverlayKicker,
  }, scene, controller, state, {
    onFieldChange: (field) => setField(field),
    onExperimentChange: () => {
      if (state.mode !== "physics") return;
      renderLeft(true); renderRight(true);
      updateSceneStatus(); updatePhysicsConsoleName(); syncProjectionUI();
    },
  });
  labels = new LabelOverlay(scene, controller, {
    onSelect: (id) => selectPart(id), getState: () => state,
  });
  controller.dirty = true;
  controller.update(0);
  scene.render();
  bindEvents();
  applyStaticLanguage();
  renderLeft(); renderRight();
  syncDisplayUI(); syncProjectionUI(); syncFieldUI();
  updateProgressUI(); updateSceneStatus(); updateTableButton(); updateShellLabel();
  labels.refresh();
  startBoot();
  requestAnimationFrame(animationLoop);
}

function cacheDom() {
  const ids = {
    stage: "stage", boot: "boot-screen", bootFill: "boot-progress-fill", bootPercent: "boot-percent",
    bootStatus: "boot-status-text", leftContent: "left-content", rightContent: "right-content",
    leftKicker: "left-kicker", leftTitle: "left-title", leftSubtitle: "left-subtitle",
    leftFooterNote: "left-footer-note", rightKicker: "right-kicker", rightTitle: "right-title",
    rightSubtitle: "right-subtitle", rightFooterLabel: "right-footer-label", rightFooterAction: "right-footer-action",
    explodeRange: "explode-range", explodeValue: "explode-value", playButton: "play-button",
    reverseButton: "reverse-button", forwardButton: "forward-button", timelineReset: "timeline-reset-button",
    shellRange: "shell-range", viewPreset: "view-preset", labViewPreset: "lab-view-preset",
    tableButton: "table-button", labelsButton: "labels-button", resetViewButton: "camera-reset-button",
    autoRotateButton: "auto-rotate-button", isolateButton: "isolate-button", hideButton: "hide-button",
    lowPerfButton: "low-perf-button", projectionToggle: "projection-toggle", labProjectionToggle: "lab-projection-toggle",
    sectionLegend: "section-legend", sectionLegendContent: "section-legend-content", sectionLegendClose: "section-legend-close",
    interactionHint: "interaction-hint", axisReadout: "axis-readout", isocenterTag: "isocenter-tag", toast: "toast",
    anatomyConsole: "anatomy-console", physicsConsole: "physics-console", physicsControls: "physics-controls",
    physicsHud: "physics-hud", physicsConsoleName: "physics-console-name", labOverlay: "lab-overlay",
    labOverlayBody: "lab-overlay-body", labOverlayTitle: "lab-overlay-title", labOverlayKicker: "lab-overlay-kicker",
    modalRoot: "modal-root", modalTabs: "modal-tabs", modalTitle: "modal-title", modalKicker: "modal-kicker",
    modalContent: "modal-content", modalClose: "modal-close", leftMenuButton: "left-menu-button",
    rightMenuButton: "right-menu-button", leftClose: "left-close", rightClose: "right-close",
    scienceButton: "science-button", helpButton: "help-button", brandSub: "brand-sub",
  };
  Object.entries(ids).forEach(([key, id]) => { dom[key] = $(id); });
  dom.modeTabs = Array.from(document.querySelectorAll(".mode-tab"));
  dom.fieldButtons = Array.from(document.querySelectorAll("[data-field]"));
  dom.langButtons = Array.from(document.querySelectorAll("[data-lang]"));
  dom.displayModes = Array.from(document.querySelectorAll("[data-display]"));
  dom.scrim = $("mobile-scrim");
  dom.sceneStateText = $("scene-state-text");
  dom.sceneStateDetail = document.querySelector(".scene-state__detail");
  dom.labelsButtonText = dom.labelsButton?.querySelector("span");
}

function animationLoop(now) {
  requestAnimationFrame(animationLoop);
  const dt = Math.min(0.05, Math.max(0.001, (now - (animationLoop.last || now)) / 1000));
  animationLoop.last = now;
  if (!scene) return;
  scene.update(dt, now);
  controller.update(dt);
  if (physics && physics.active) physics.update(dt, now);
  labels.update();
  syncPlayButton();
  if (state.mode === "anatomy" && controller.state.displayMode !== lastDisplayMode) {
    lastDisplayMode = controller.state.displayMode;
    syncDisplayUI(); labels.refresh();
  }
  scene.render();
}

function startBoot() {
  const boot = (percent, label) => setBoot(percent, label);
  boot(16, "INITIALISING GEOMETRY");
  setTimeout(() => boot(42, "BUILDING CRYOSTAT & COILS"), 260);
  setTimeout(() => boot(72, "REGISTERING TECHNICAL DOSSIER"), 600);
  setTimeout(() => boot(92, "BUILDING INTERACTION LAYERS"), 920);
  setTimeout(() => boot(100, "READY"), 1240);
  setTimeout(() => {
    dom.boot.classList.add("is-hidden");
    document.body.classList.remove("is-booting");
    document.body.classList.add("is-ready");
    labels.refresh();
    setTimeout(() => { if (dom.boot) dom.boot.style.display = "none"; }, 850);
  }, 1580);
}
function setBoot(percent, label) {
  if (!dom.bootFill) return;
  dom.bootFill.style.width = percent + "%";
  dom.bootPercent.textContent = String(Math.round(percent)).padStart(2, "0") + "%";
  dom.bootStatus.textContent = label;
}
function showBootError(error) {
  console.error(error);
  if (!dom.bootStatus) return;
  dom.bootStatus.textContent = "WEBGL / SCENE INITIALISATION FAILED";
  dom.bootPercent.textContent = "!";
  dom.bootFill.style.width = "2%";
  dom.bootFill.style.background = "rgba(224,111,89,.7)";
  const text = document.createElement("div");
  text.className = "boot-disclaimer";
  text.textContent = String(error?.message || error);
  dom.boot?.querySelector(".boot-core")?.appendChild(text);
}

function bindEvents() {
  dom.modeTabs.forEach((button) => button.addEventListener("click", () => switchMode(button.dataset.mode)));
  dom.fieldButtons.forEach((button) => button.addEventListener("click", () => setField(Number(button.dataset.field))));
  dom.langButtons.forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.lang)));
  dom.scienceButton.addEventListener("click", () => openModal("sources"));
  dom.helpButton.addEventListener("click", () => openModal("guide"));
  dom.leftMenuButton.addEventListener("click", () => toggleDrawer("left"));
  dom.rightMenuButton.addEventListener("click", () => toggleDrawer("right"));
  dom.leftClose.addEventListener("click", () => closeDrawers());
  dom.rightClose.addEventListener("click", () => closeDrawers());
  dom.scrim.addEventListener("click", () => closeDrawers());
  dom.displayModes.forEach((button) => button.addEventListener("click", () => {
    if (state.mode !== "anatomy") switchMode("anatomy");
    applyDisplayMode(button.dataset.display);
  }));
  dom.playButton.addEventListener("click", () => {
    if (controller.state.playing) { controller.pause(); syncPlayButton(); }
    else { if (controller.state.progress >= 0.999) lastPlayDirection = -1; startPlayback(lastPlayDirection); }
  });
  dom.reverseButton.addEventListener("click", () => { lastPlayDirection = -1; setExplodedCamera(); startPlayback(-1); });
  dom.forwardButton.addEventListener("click", () => { lastPlayDirection = 1; if (controller.state.progress >= 0.999 || controller.state.displayMode !== "exploded") setExplodedCamera(); startPlayback(1); });
  dom.timelineReset.addEventListener("click", () => {
    controller.pause(); controller.setProgress(0); controller.setDisplayMode("transparent");
    updateProgressUI(); syncDisplayUI();
  });
  dom.explodeRange.addEventListener("input", (event) => {
    controller.setProgress(Number(event.target.value) / 100);
    updateProgressUI(); syncDisplayUI(); labels.refresh();
  });
  dom.shellRange.addEventListener("input", (event) => {
    controller.setShellOpacity(Number(event.target.value) / 100);
    dom.shellRange.style.setProperty("--fill", event.target.value + "%");
    updateShellLabel();
  });
  dom.viewPreset.addEventListener("change", (event) => handleViewPreset(event.target.value));
  dom.labViewPreset.addEventListener("change", (event) => { scene.setCameraPreset(event.target.value, 700); labels.refresh(); });
  [dom.projectionToggle, dom.labProjectionToggle].forEach((group) => group?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-projection]");
    if (button) setProjection(button.dataset.projection);
  }));
  dom.tableButton.addEventListener("click", () => {
    controller.setTableDocked(!controller.state.tableDocked); updateTableButton(); labels.refresh();
  });
  dom.autoRotateButton.addEventListener("click", () => {
    const enabled = !dom.autoRotateButton.classList.contains("is-active");
    scene.setAutoRotate(enabled);
    dom.autoRotateButton.classList.toggle("is-active", enabled);
    dom.autoRotateButton.setAttribute("aria-pressed", String(enabled));
    showToast(enabled ? "AUTO ROTATE / ON" : "AUTO ROTATE / OFF");
  });
  dom.labelsButton.addEventListener("click", () => {
    state.labels = !state.labels;
    dom.labelsButton.classList.toggle("is-active", state.labels);
    dom.labelsButton.setAttribute("aria-pressed", String(state.labels));
    labels.refresh();
    showToast(t(state.lang, state.labels ? "部件标注开启" : "部件标注关闭", state.labels ? "Labels on" : "Labels off"));
  });
  dom.resetViewButton.addEventListener("click", resetView);
  dom.isolateButton.addEventListener("click", toggleIsolate);
  dom.hideButton.addEventListener("click", toggleHideSelected);
  dom.lowPerfButton.addEventListener("click", () => setLowPerformance(!state.lowPerformance));
  dom.sectionLegendClose.addEventListener("click", () => { state.sectionLegendHidden = true; dom.sectionLegend.hidden = true; });
  dom.sectionLegend.addEventListener("click", (event) => {
    if (event.target.closest("#section-legend-close")) return;
    if (window.innerWidth <= 760 && !dom.sectionLegend.hidden) {
      state.sectionLegendExpanded = !state.sectionLegendExpanded;
      updateSectionLegend();
    }
  });
  dom.rightFooterAction.addEventListener("click", () => {
    if (state.mode === "physics") openModal("sources");
    else if (controller.state.selectedId) clearSelection();
    else openModal("sources");
  });
  dom.leftContent.addEventListener("click", handleLeftClick);
  dom.leftContent.addEventListener("keydown", handleTreeKeydown);
  dom.rightContent.addEventListener("click", handleRightClick);
  dom.modalRoot.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]") || event.target.closest("#modal-close")) closeModal();
    const tab = event.target.closest("[data-modal-tab]");
    if (tab) { state.modalTab = tab.dataset.modalTab; renderModal(); }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { if (state.modalOpen) closeModal(); else closeDrawers(); }
    if (event.code === "Space" && !state.modalOpen && !event.target.closest("input, button, select, textarea") && state.mode === "anatomy") {
      event.preventDefault(); dom.playButton.click();
    }
  });
  dom.stage.addEventListener("pointermove", handlePointerMove);
  dom.stage.addEventListener("pointerdown", handlePointerDown);
  dom.stage.addEventListener("pointerup", handlePointerUp);
  dom.stage.addEventListener("pointerleave", () => dom.stage.classList.remove("is-part-hover"));
  window.addEventListener("resize", onResize, { passive: true });
}

function handleLeftClick(event) {
  const eye = event.target.closest("[data-eye]");
  if (eye) { event.stopPropagation(); toggleVisibility(eye.dataset.eye); return; }
  const category = event.target.closest("[data-category]");
  if (category) {
    const id = category.dataset.category;
    if (collapsedCats.has(id)) collapsedCats.delete(id); else collapsedCats.add(id);
    renderLeft(true); return;
  }
  const experiment = event.target.closest("[data-experiment]");
  if (experiment) {
    if (state.mode !== "physics") switchMode("physics", { experiment: experiment.dataset.experiment });
    else physics.setExperiment(experiment.dataset.experiment);
    if (window.innerWidth < 1080) closeDrawers();
    return;
  }
  const part = event.target.closest("[data-part]");
  if (part) selectPart(part.dataset.part);
}
function handleTreeKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest("button")) return;
  const row = event.target.closest("[data-part],[data-experiment]");
  if (!row) return;
  event.preventDefault();
  if (row.dataset.part) selectPart(row.dataset.part);
  else if (row.dataset.experiment) {
    if (state.mode !== "physics") switchMode("physics", { experiment: row.dataset.experiment });
    else physics.setExperiment(row.dataset.experiment);
  }
}
function handleRightClick(event) {
  const action = event.target.closest("[data-action]");
  if (action) {
    const kind = action.dataset.action;
    if (kind === "focus") focusSelected();
    else if (kind === "isolate") toggleIsolate();
    else if (kind === "hide") toggleHideSelected();
    else if (kind === "explode-category") explodeCategory(action.dataset.category);
    else if (kind === "clear") clearSelection();
    else if (kind === "lab-panel") {
      if (["sequence", "kspace"].includes(physics.experimentId)) {
        physics.overlayManuallyHidden = false; physics.setupLabOverlay();
      } else showToast(t(state.lang, "本实验没有独立分析面板", "This experiment has no separate analysis panel"));
    } else if (kind === "lab-camera") physics.setExperimentCamera();
    return;
  }
  const related = event.target.closest("[data-related-part]");
  if (related) { selectPart(related.dataset.relatedPart); return; }
  const inspect = event.target.closest("[data-inspect-part]");
  if (inspect) { if (state.mode !== "anatomy") switchMode("anatomy"); selectPart(inspect.dataset.inspectPart); }
}


function renderLeft(preserve = true) {
  if (!dom.leftContent) return;
  const scroll = dom.leftContent.scrollTop;
  if (state.mode === "physics") {
    dom.leftKicker.textContent = "PHYSICS LAB / 06";
    dom.leftTitle.textContent = t(state.lang, "物理实验", "Physics experiments");
    dom.leftSubtitle.textContent = t(state.lang, "B₀ · Larmor · RF · 梯度 · 序列 · k-space", "B0 · Larmor · RF · gradients · sequence · k-space");
    dom.leftContent.innerHTML = renderExperiments(physics, state);
    dom.leftFooterNote.textContent = t(state.lang, "标准关系式 · 定性场线", "analytic relations · qualitative fields");
  } else {
    dom.leftKicker.textContent = "ASSEMBLY TREE / " + String(PARTS.length).padStart(2, "0");
    dom.leftTitle.textContent = t(state.lang, "系统装配树", "Assembly tree");
    dom.leftSubtitle.textContent = t(state.lang, "通用临床 MR 系统 · 选择部件进入技术档案", "Generic clinical MR system · select a component for its dossier");
    dom.leftContent.innerHTML = renderTree(scene, controller, state, collapsedCats);
    dom.leftFooterNote.textContent = t(state.lang, "典型工程架构 · 非厂商 CAD", "typical architecture · not vendor CAD");
  }
  if (preserve) dom.leftContent.scrollTop = scroll;
}

function renderRight(resetScroll = false) {
  if (!dom.rightContent) return;
  let html = "";
  if (state.mode === "physics") {
    const exp = EXPERIMENT_MAP.get(physics.experimentId) || EXPERIMENTS[0];
    dom.rightKicker.textContent = "PHYSICS DOSSIER / " + exp.num;
    dom.rightTitle.textContent = t(state.lang, "实验档案", "Experiment dossier");
    dom.rightSubtitle.textContent = pick(exp.kicker, state.lang);
    html = renderExperiment(exp, state);
    dom.rightFooterLabel.textContent = "EXPERIMENT " + exp.num + " / 06";
    dom.rightFooterAction.textContent = t(state.lang, "科学来源", "SOURCES");
  } else if (controller.state.selectedId) {
    const part = PART_MAP.get(controller.state.selectedId);
    if (part) {
      const cat = CATEGORY_MAP.get(part.cat);
      dom.rightKicker.textContent = "COMPONENT DOSSIER / " + String(part.order).padStart(2, "0");
      dom.rightTitle.textContent = t(state.lang, "部件技术档案", "Component dossier");
      dom.rightSubtitle.textContent = (cat ? pick(cat, state.lang) : "") + " · LEVEL " + part.level;
      html = renderPart(part, controller, state);
      dom.rightFooterLabel.textContent = "SELECTED / " + part.id.toUpperCase();
      dom.rightFooterAction.textContent = t(state.lang, "清除选择", "CLEAR");
    }
  } else {
    dom.rightKicker.textContent = "TECHNICAL DOSSIER / SYSTEM";
    dom.rightTitle.textContent = t(state.lang, "系统总览", "System overview");
    dom.rightSubtitle.textContent = t(state.lang, "工程结构、可信度与成像影响", "Structure, confidence and imaging impact");
    html = renderOverview(state);
    dom.rightFooterLabel.textContent = "SELECTED / NONE";
    dom.rightFooterAction.textContent = t(state.lang, "科学来源", "SOURCES");
  }
  dom.rightContent.innerHTML = html;
  if (resetScroll) dom.rightContent.scrollTop = 0;
}

function selectPart(id) {
  const part = PART_MAP.get(id);
  if (!part) return;
  if (controller.state.isolatedId && controller.state.isolatedId !== id) exitIsolate();
  if (controller.state.hidden.has(id)) { controller.state.hidden.delete(id); controller.dirty = true; }
  controller.setSelected(id);
  renderLeft(true);
  renderRight(true);
  labels.refresh();
  if (window.innerWidth < 1080) {
    closeDrawers();
    openDrawer("right");
  }
}
function clearSelection() {
  if (controller.state.isolatedId) exitIsolate();
  controller.setSelected(null);
  renderLeft(true); renderRight(); labels.refresh(); updateSceneStatus();
}
function focusSelected() {
  const id = controller.state.selectedId;
  if (!id) { showToast(t(state.lang, "请先选择一个部件", "Select a component first")); return; }
  if (controller.state.hidden.has(id)) { controller.state.hidden.delete(id); controller.dirty = true; renderLeft(true); }
  scene.focusPart(id);
  labels.refresh();
}
function toggleHideSelected() {
  if (!controller.state.selectedId) { showToast(t(state.lang, "请先选择一个部件", "Select a component first")); return; }
  toggleVisibility(controller.state.selectedId);
}
function explodeCategory(catId) {
  if (!CATEGORY_MAP.has(catId)) return;
  if (state.mode !== "anatomy") switchMode("anatomy");
  const selected = controller.state.selectedId;
  controller.setExplodeCategory(catId);
  state.anatomyDisplayMode = "exploded";
  state.sectionLegendHidden = true;
  lastDisplayMode = "exploded";
  controller.update(0.016);
  scene.fitPartIds(PARTS.filter((part) => part.cat === catId).map((part) => part.id), 900, 1.5);
  updateProgressUI(); syncDisplayUI(); labels.refresh(); renderRight(true); updateSceneStatus();
  const cat = CATEGORY_MAP.get(catId);
  showToast(t(state.lang, "子系统拆解：", "Subsystem exploded: ") + pick(cat, state.lang));
}

function toggleVisibility(id) {
  const visible = controller.toggleVisibility(id);
  if (!visible && controller.state.selectedId === id) controller.setSelected(null);
  renderLeft(true); renderRight(); labels.refresh(); updateSceneStatus();
  const part = PART_MAP.get(id);
  if (part) showToast(t(state.lang, visible ? "显示：" : "隐藏：", visible ? "Shown: " : "Hidden: ") + pick(part.name, state.lang));
}
function toggleIsolate() {
  const id = controller.state.selectedId;
  if (controller.state.isolatedId) { exitIsolate(); return; }
  if (!id) { showToast(t(state.lang, "请先选择一个部件", "Select a component first")); return; }
  state.isolateReturnMode = controller.state.displayMode === "isolated" ? "transparent" : controller.state.displayMode;
  if (controller.state.hidden.has(id)) { controller.state.hidden.delete(id); controller.dirty = true; }
  controller.setIsolate(id);
  scene.focusPart(id);
  labels.refresh(); renderLeft(true); renderRight(); syncDisplayUI(); updateSceneStatus();
  showToast(t(state.lang, "单独显示：", "Isolated: ") + pick(PART_MAP.get(id)?.name, state.lang));
}
function exitIsolate() {
  if (!controller.state.isolatedId) return;
  const id = controller.state.selectedId;
  const returnMode = state.isolateReturnMode || "transparent";
  controller.setIsolate(null);
  controller.setDisplayMode(returnMode);
  if (id) controller.setSelected(id);
  labels.refresh(); renderLeft(true); renderRight(); syncDisplayUI(); updateSceneStatus();
}

function applyDisplayMode(mode, options = {}) {
  if (state.mode !== "anatomy") switchMode("anatomy");
  if (!["complete", "transparent", "longitudinal", "transverse", "cutaway", "exploded"].includes(mode)) return;
  state.sectionLegendHidden = false;
  state.sectionLegendExpanded = false;
  if (mode === "exploded") {
    controller.setDisplayMode("exploded");
    if (options.progress !== undefined) controller.setProgress(options.progress);
  } else controller.setDisplayMode(mode);
  state.anatomyDisplayMode = mode;
  if (options.animateCamera !== false) {
    if (mode === "longitudinal" || mode === "cutaway") scene.setCameraPreset("longitudinal", 850);
    else if (mode === "transverse") scene.setCameraPreset("axial", 850);
    else if (mode === "exploded") setExplodedCamera();
    else if (mode === "complete") scene.setView({ position: [5.0, 2.95, 6.35], target: [0.35, 0.02, 0.22], fov: 32 }, 850);
    else scene.setCameraPreset("iso", 850);
  }
  if (mode === "transverse") dom.viewPreset.value = "axial";
  else if (mode === "longitudinal") dom.viewPreset.value = "longitudinal";
  else dom.viewPreset.value = "iso";
  lastDisplayMode = controller.state.displayMode;
  updateProgressUI(); syncDisplayUI(); labels.refresh();
}
function handleViewPreset(value) {
  if (value === "axial") { applyDisplayMode("transverse"); return; }
  if (value === "longitudinal") { applyDisplayMode("longitudinal"); return; }
  scene.setCameraPreset(value, 850);
  state.sectionLegendHidden = false;
  syncDisplayUI(); labels.refresh();
}
function startPlayback(direction) {
  if (state.mode !== "anatomy") switchMode("anatomy");
  if (controller.state.displayMode !== "exploded" && controller.state.progress < 0.001) setExplodedCamera();
  controller.play(direction);
  lastPlayDirection = direction;
  updateProgressUI(); syncDisplayUI(); labels.refresh();
}
function setExplodedCamera() {
  const s = window.innerWidth < 900 ? 1.22 : 1;
  scene.setView({ position: [7.2 * s, 5.2 * s, 9.2 * s], target: [0.2, 0.95, 0.55], fov: 34 }, 850);
}

function switchMode(mode, options = {}) {
  if (mode === state.mode) {
    if (mode === "physics" && options.experiment) physics.setExperiment(options.experiment);
    return;
  }
  if (mode === "physics") {
    state.savedAnatomy = {
      mode: controller.state.displayMode, progress: controller.state.progress,
      selection: controller.state.selectedId, tableDocked: controller.state.tableDocked,
      camera: { type: scene.currentCameraType, position: scene.camera.position.toArray(), target: scene.controls.target.toArray(), fov: scene.camera.fov },
    };
    state.mode = "physics";
    closeDrawers();
    controller.setTableDocked(true); updateTableButton();
    controller.setPhysicsActive(true);
    labels.hide();
    dom.labelsButton.hidden = true;
    dom.anatomyConsole.hidden = true;
    dom.physicsConsole.hidden = false;
    dom.interactionHint.hidden = true;
    dom.axisReadout.hidden = true;
    dom.sectionLegend.hidden = true;
    syncModeTabs();
    physics.activate();
    if (options.experiment) physics.setExperiment(options.experiment);
    renderLeft(); renderRight(true);
    updateSceneStatus(); updatePhysicsConsoleName(); syncProjectionUI();
    return;
  }
  physics.deactivate();
  controller.setPhysicsActive(false);
  state.mode = "anatomy";
  dom.physicsConsole.hidden = true;
  dom.anatomyConsole.hidden = false;
  dom.labelsButton.hidden = false;
  dom.interactionHint.hidden = false;
  dom.axisReadout.hidden = false;
  dom.labOverlay.hidden = true;
  const saved = state.savedAnatomy;
  if (saved) {
    if (saved.camera?.type && saved.camera.type !== scene.currentCameraType) {
      scene.setCameraType(saved.camera.type); syncProjectionUI();
    }
    if (saved.camera) scene.setView({ position: saved.camera.position, target: saved.camera.target, fov: saved.camera.fov }, 0);
    if (saved.mode && saved.mode !== "isolated") {
      controller.setDisplayMode(saved.mode);
      if (saved.mode === "exploded") controller.setProgress(saved.progress ?? 1, false);
      state.anatomyDisplayMode = saved.mode;
    }
    if (saved.selection) controller.setSelected(saved.selection);
  }
  syncModeTabs();
  updateProgressUI(); syncDisplayUI(); renderLeft(); renderRight(true); labels.refresh();
  updateSceneStatus(); updateTableButton(); updateShellLabel(); syncProjectionUI();
  state.savedAnatomy = null;
}

function syncModeTabs() {
  dom.modeTabs.forEach((button) => button.classList.toggle("is-active", button.dataset.mode === state.mode));
}
function syncDisplayUI() {
  dom.displayModes.forEach((button) => button.classList.toggle("is-active", button.dataset.display === controller.state.displayMode));
  updateSectionLegend(); updateSceneStatus(); updateProgressUI();
}
function updateSectionLegend() {
  const mode = controller.state.displayMode;
  const show = state.mode === "anatomy" && (mode === "longitudinal" || mode === "transverse") && !state.sectionLegendHidden;
  if (!show) { dom.sectionLegend.hidden = true; return; }
  dom.sectionLegend.hidden = false;
  dom.sectionLegend.classList.toggle("is-collapsed", window.innerWidth <= 760 && !state.sectionLegendExpanded);
  dom.sectionLegendContent.innerHTML = renderSectionLegend(mode, state.lang);
}
function updateSceneStatus() {
  if (!dom.sceneStateText) return;
  if (state.mode === "physics") {
    const exp = EXPERIMENT_MAP.get(physics.experimentId) || EXPERIMENTS[0];
    dom.sceneStateText.textContent = "PHYSICS / " + exp.num + " · " + (state.lang === "zh" ? pick(exp.title, "zh") : pick(exp.title, "en").toUpperCase());
    dom.sceneStateDetail.textContent = "B0 = " + state.field.toFixed(1) + " T · " + t(state.lang, "教学实验", "TEACHING EXPERIMENT");
    return;
  }
  const modeLabels = {
    transparent: ["透明壳", "TRANSPARENT SHELL"], complete: ["整机", "COMPLETE ASSEMBLY"],
    longitudinal: ["纵剖 · x=0", "LONGITUDINAL SECTION · x=0"], transverse: ["横剖 · z=0", "TRANSVERSE SECTION · z=0"],
    cutaway: ["局部剖切", "PARTIAL CUTAWAY"],
    exploded: ["机械拆解 " + Math.round(controller.state.progress * 100) + "%", "EXPLODED " + Math.round(controller.state.progress * 100) + "%"],
    isolated: ["隔离部件", "ISOLATED COMPONENT"],
  };
  if (controller.state.explodeCategory) {
    const cat = CATEGORY_MAP.get(controller.state.explodeCategory);
    dom.sceneStateText.textContent = t(state.lang, "子系统拆解 · ", "SUBSYSTEM EXPLODE · ") + (cat ? pick(cat, state.lang) : "");
    dom.sceneStateDetail.textContent = t(state.lang, "仅该子系统展开 · 其他系统淡出", "SELECTED SUBSYSTEM DEPLOYED · OTHERS FADED");
    return;
  }
  const label = modeLabels[controller.state.displayMode] || modeLabels.transparent;
  dom.sceneStateText.textContent = label[state.lang === "zh" ? 0 : 1];
  let detail = "GENERIC " + state.field.toFixed(1) + " T · 70 cm BORE";
  if (["longitudinal", "transverse"].includes(controller.state.displayMode)) detail = t(state.lang, "实际裁剪平面 · 截面补片为示意", "REAL CLIP PLANE · SCHEMATIC CAPS");
  if (controller.state.displayMode === "isolated") detail = t(state.lang, "单独显示 · 非工程拆解顺序", "ISOLATED VIEW · NOT A SERVICE PROCEDURE");
  dom.sceneStateDetail.textContent = detail;
}
function updateProgressUI() {
  if (!dom.explodeRange) return;
  const percent = Math.round(controller.state.progress * 100);
  dom.explodeRange.value = String(percent);
  dom.explodeRange.style.setProperty("--fill", percent + "%");
  dom.explodeValue.textContent = percent + "%";
  syncPlayButton();
}
function syncPlayButton() {
  if (!dom.playButton || !controller) return;
  dom.playButton.classList.toggle("is-playing", controller.state.playing);
  dom.playButton.setAttribute("aria-pressed", String(controller.state.playing));
  dom.playButton.setAttribute("aria-label", controller.state.playing ? t(state.lang, "暂停拆解", "Pause disassembly") : t(state.lang, "播放拆解", "Play disassembly"));
}
function updateTableButton() {
  if (!dom.tableButton) return;
  const docked = controller.state.tableDocked;
  dom.tableButton.setAttribute("aria-pressed", String(docked));
  dom.tableButton.textContent = docked ? t(state.lang, "扫描位 / TABLE IN", "TABLE IN / 扫描位") : t(state.lang, "退出 / TABLE OUT", "TABLE OUT / 退出");
}
function updateShellLabel() {
  const el = $("shell-value");
  if (el) el.textContent = Number(dom.shellRange.value) >= 99 ? "100%" : dom.shellRange.value + "%";
}
function updatePhysicsConsoleName() {
  const exp = EXPERIMENT_MAP.get(physics.experimentId);
  if (exp && dom.physicsConsoleName) dom.physicsConsoleName.textContent = exp.num + " · " + pick(exp.title, state.lang);
}

function setField(field) {
  if (![1.5, 3].includes(field)) return;
  state.field = field;
  syncFieldUI();
  if (state.mode === "physics") {
    physics.setField(field); renderRight(true); updateSceneStatus();
  } else if (!controller.state.selectedId) renderRight(true);
  labels.refresh();
  showToast(t(state.lang, "B₀ = ", "B0 = ") + field.toFixed(1) + " T · " + (field * 42.577478).toFixed(2) + " MHz");
}
function syncFieldUI() {
  dom.fieldButtons.forEach((button) => button.classList.toggle("is-active", Number(button.dataset.field) === state.field));
  if (state.mode === "anatomy") updateSceneStatus();
}
function setLanguage(lang) {
  if (!["zh", "en"].includes(lang) || lang === state.lang) return;
  state.lang = lang;
  applyStaticLanguage(); syncModeTabs(); renderLeft(true); renderRight(true);
  labels.refresh(); updateSceneStatus();
  if (state.mode === "physics") { physics.setLanguage(lang); updatePhysicsConsoleName(); }
  if (state.modalOpen) renderModal();
}
function applyStaticLanguage() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  dom.langButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.lang === state.lang));
  dom.fieldButtons.forEach((button) => button.classList.toggle("is-active", Number(button.dataset.field) === state.field));
  if (dom.brandSub) dom.brandSub.textContent = t(state.lang, "通用 3.0 T 水平孔径超导 MRI · 教学数字孪生", "Generic 3.0 T horizontal-bore superconducting MRI · teaching digital twin");
  const i18n = { modeAnatomy: t(state.lang, "装配解剖", "ANATOMY"), modePhysics: t(state.lang, "物理实验", "PHYSICS"), labels: t(state.lang, "标注", "LABELS"), resetView: t(state.lang, "复位", "RESET") };
  document.querySelectorAll("[data-i18n]").forEach((el) => { if (i18n[el.dataset.i18n]) el.textContent = i18n[el.dataset.i18n]; });
  dom.displayModes.forEach((button) => {
    const info = DISPLAY_LABELS[button.dataset.display];
    if (info) button.innerHTML = "<span>" + String(["transparent", "complete", "longitudinal", "transverse", "cutaway", "exploded"].indexOf(button.dataset.display) + 1).padStart(2, "0") + "</span>" + esc(pick(info, state.lang));
  });
  const displayLabel = document.querySelector(".display-block .console-label");
  if (displayLabel) displayLabel.innerHTML = "DISPLAY MODE <b>/</b> " + t(state.lang, "显示方式", "VIEW");
  const timelineLabel = document.querySelector(".transport-block .console-label");
  if (timelineLabel) timelineLabel.innerHTML = "DISASSEMBLY TIMELINE <b>/</b> " + t(state.lang, "拆解时间轴", "EXPLODE");
  if (dom.labelsButtonText) dom.labelsButtonText.textContent = t(state.lang, "标注", "LABELS");
  const resetSpan = dom.resetViewButton?.querySelector("span");
  if (resetSpan) resetSpan.textContent = t(state.lang, "复位", "RESET");
  dom.interactionHint.querySelector("#interaction-hint-text").textContent = t(state.lang, "拖动旋转 · 滚轮缩放 · 点击部件查看技术档案", "DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A COMPONENT");
  updateTableButton(); updateShellLabel();
  fillSelect(dom.viewPreset, VIEW_OPTIONS, state.lang);
  fillSelect(dom.labViewPreset, LAB_VIEW_OPTIONS, state.lang);
  dom.scienceButton.title = t(state.lang, "科学来源与建模声明", "Scientific sources & modelling notes");
  dom.helpButton.title = t(state.lang, "操作指南与术语", "Guide & glossary");
  if (state.mode === "anatomy") updateSectionLegend();
}
function fillSelect(select, options, lang) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = options.map((option) => '<option value="' + option.value + '">' + esc(lang === "zh" ? option.zh : option.en) + "</option>").join("");
  if (options.some((option) => option.value === current)) select.value = current;
}
function setProjection(type) {
  if (!["perspective", "orthographic"].includes(type)) return;
  scene.setCameraType(type); state.projection = type;
  syncProjectionUI(); labels.refresh();
}
function syncProjectionUI() {
  [dom.projectionToggle, dom.labProjectionToggle].forEach((group) => {
    if (!group) return;
    group.querySelectorAll("[data-projection]").forEach((button) => button.classList.toggle("is-active", button.dataset.projection === state.projection));
  });
}
function resetView() {
  if (state.mode === "physics") physics.setExperimentCamera();
  else { scene.setHomeViewForViewport(); labels.refresh(); }
}
function setLowPerformance(enabled) {
  state.lowPerformance = enabled; scene.lowPerformance = enabled; scene.resize();
  dom.lowPerfButton.classList.toggle("is-active", enabled);
  showToast(t(state.lang, enabled ? "低性能模式开启" : "低性能模式关闭", enabled ? "Low-performance mode on" : "Low-performance mode off"));
}

function toggleDrawer(side) {
  const isOpen = document.body.classList.contains(side + "-open");
  closeDrawers();
  if (!isOpen) openDrawer(side);
}
function openDrawer(side) {
  closeDrawers();
  document.body.classList.add(side + "-open");
  if (side === "left") dom.leftMenuButton.setAttribute("aria-expanded", "true");
  if (side === "right") dom.rightMenuButton.setAttribute("aria-expanded", "true");
}
function closeDrawers() {
  document.body.classList.remove("left-open", "right-open");
  dom.leftMenuButton.setAttribute("aria-expanded", "false");
  dom.rightMenuButton.setAttribute("aria-expanded", "false");
}
function onResize() {
  if (window.innerWidth > 1080) closeDrawers();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (labels) labels.refresh(); }, 160);
}

function openModal(tab) {
  state.modalOpen = true;
  state.modalTab = tab || "guide";
  dom.modalRoot.hidden = false;
  renderModal();
}
function closeModal() {
  state.modalOpen = false;
  dom.modalRoot.hidden = true;
}
function renderModal() {
  const tabs = modalTabs(state.lang);
  if (!tabs.some((tab) => tab.id === state.modalTab)) state.modalTab = "guide";
  dom.modalTabs.innerHTML = tabs.map((tab) => '<button type="button" class="modal-tab' + (tab.id === state.modalTab ? " is-active" : "") + '" data-modal-tab="' + tab.id + '" role="tab" aria-selected="' + (tab.id === state.modalTab) + '">' + esc(tab.label) + "</button>").join("");
  const data = modalContent(state.modalTab, state.lang, state);
  dom.modalKicker.textContent = data.kicker;
  dom.modalTitle.textContent = data.title;
  dom.modalContent.innerHTML = data.html;
  dom.modalContent.scrollTop = 0;
}
function showToast(message) {
  clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 2100);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;
function pointerNdc(event) {
  const rect = scene.renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}
function partFromEvent(event) {
  if (!scene || state.mode !== "anatomy") return null;
  pointerNdc(event);
  raycaster.setFromCamera(pointer, scene.camera);
  const hits = raycaster.intersectObjects(scene.pickMeshes, false);
  if (!hits.length) return null;
  const valid = [];
  for (const hit of hits) {
    const id = hit.object.userData.partId;
    if (!id) continue;
    const part = scene.parts.get(id);
    if (!part || !controller.effectiveVisible(part)) continue;
    const mode = controller.state.displayMode;
    if ((mode === "longitudinal" || mode === "cutaway") && hit.point.x > 0.015) {
      if (mode === "longitudinal") continue;
      if (["housing", "ovv", "thermal-shield", "suspension", "shield-coils"].includes(id)) continue;
    }
    if (mode === "transverse" && hit.point.z > 0.015) continue;
    const opacity = part.materials.reduce((max, mat) => Math.max(max, mat.opacity ?? 1), 0);
    valid.push({ id, opacity });
  }
  if (!valid.length) return null;
  const solid = valid.filter((entry) => entry.opacity > 0.28);
  return (solid.length ? solid : valid)[0].id;
}
function handlePointerMove(event) {
  if (event.pointerType === "touch" || !scene) return;
  const id = partFromEvent(event);
  dom.stage.classList.toggle("is-part-hover", Boolean(id));
  if (pointerDown) {
    const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    if (distance > 4) dom.stage.classList.add("is-dragging");
  }
}
function handlePointerDown(event) {
  pointerDown = { x: event.clientX, y: event.clientY };
  dom.stage.classList.add("is-dragging");
}
function handlePointerUp(event) {
  dom.stage.classList.remove("is-dragging");
  if (!pointerDown) return;
  const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (distance > 5 || state.mode !== "anatomy") return;
  const id = partFromEvent(event);
  if (id) selectPart(id);
  else if (controller.state.selectedId) clearSelection();
}

window.__MRI__ = { scene, controller, physics, state, labels, THREE };
