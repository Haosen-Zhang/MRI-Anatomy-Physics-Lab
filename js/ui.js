
import * as THREE from "three";
import {
  PARTS, PART_MAP, CATEGORIES, LEVELS, REFERENCES, EXPERIMENTS,
  SAFETY_NOTES, GLOSSARY, MODEL_NOTES, GYRO_MHZ_PER_T, BORE_RADIUS,
} from "./componentsData.js";

export const t = (lang, zh, en) => (lang === "zh" ? zh : en);
export const pick = (value, lang) => {
  if (value && typeof value === "object" && ("zh" in value || "en" in value)) return value[lang] || value.zh || "";
  return value ?? "";
};
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n, d = 2) => Number(n).toFixed(d);
const pad = (n) => String(n).padStart(2, "0");
const EXTERNAL_LABEL_IDS = new Set(["housing", "patient-table", "cryo-service"]);

export const DISPLAY_LABELS = {
  transparent: { zh: "透明壳", en: "Transparent" },
  complete: { zh: "整机", en: "Complete" },
  longitudinal: { zh: "纵剖", en: "Longitudinal" },
  transverse: { zh: "横剖", en: "Transverse" },
  cutaway: { zh: "局部剖切", en: "Cutaway" },
  exploded: { zh: "拆解", en: "Exploded" },
};

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));
export const REF_MAP = new Map(REFERENCES.map((r) => [r.id, r]));

export function categoryName(cat, lang) {
  return pick(cat, lang);
}

export function levelBadge(level, lang = "zh") {
  const data = LEVELS[level] || LEVELS.B;
  return '<span class="level-badge ' + data.className + '" title="' + esc(pick(data.desc, lang)) + '">' + data.label + "</span>";
}

export function levelDot(level) {
  return '<span class="level-dot" style="--level-color:' + ({ A: "#7cded0", B: "#e2c17a", C: "#d4a57b" }[level] || "#78929f") + '" title="' + (level || "B") + '"></span>';
}

export function sourceLink(refId, lang) {
  const ref = REF_MAP.get(refId);
  if (!ref) return "";
  return '<a class="source-link" href="' + esc(ref.url) + '" target="_blank" rel="noopener"><span>↗</span><b>' + esc(ref.short) + "</b> · " + esc(ref.title) + "</a>";
}

function eyeIcon(visible) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/>' + (visible ? "" : '<path d="M4 4l16 16"/>') + "</svg>";
}

function actionIcon(kind) {
  const icons = {
    focus: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
    isolate: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/></svg>',
    hide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"/><path d="M4 4l16 16"/></svg>',
    explode: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/><circle cx="12" cy="12" r="2.5"/></svg>',
    clear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  };
  return icons[kind] || "";
}

export function renderTree(scene, controller, state, collapsed = new Set()) {
  const lang = state.lang;
  const parts = PARTS.slice().sort((a, b) => a.order - b.order);
  let html = "";
  CATEGORIES.forEach((cat, catIndex) => {
    const catParts = parts.filter((p) => p.cat === cat.id);
    if (!catParts.length) return;
    const isCollapsed = collapsed.has(cat.id);
    html += '<div class="tree-group' + (isCollapsed ? " is-collapsed" : "") + '" data-cat="' + cat.id + '">';
    html += '<button type="button" class="tree-category" data-category="' + cat.id + '"><span class="tree-category__bar" style="--cat-color:' + cat.color + '"></span><span class="tree-category__label">' + pad(catIndex + 1) + " / " + esc(categoryName(cat, lang)) + '</span><span class="tree-category__count">' + pad(catParts.length) + '</span><svg class="tree-category__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>';
    html += '<div class="tree-items">';
    catParts.forEach((part) => {
      const selected = controller.state.selectedId === part.id;
      const hidden = controller.state.hidden.has(part.id);
      const primary = pick(part.name, lang);
      const secondary = (lang === "zh" ? pick(part.name, "en") : pick(part.name, "zh")) + " · L" + part.level;
      html += '<div class="tree-item' + (selected ? " is-active" : "") + (hidden ? " is-hidden" : "") + '" role="button" tabindex="0" data-part="' + part.id + '" aria-pressed="' + selected + '">';
      html += '<span class="tree-item__index">' + pad(part.order) + "</span>";
      html += '<span class="tree-item__copy"><b>' + esc(primary) + "</b><span>" + esc(secondary) + "</span></span>";
      html += '<span class="tree-item__tail">' + levelDot(part.level) + '<button type="button" class="eye-button' + (hidden ? " is-hidden" : "") + '" data-eye="' + part.id + '" aria-label="' + esc(t(lang, hidden ? "显示部件" : "隐藏部件", hidden ? "Show component" : "Hide component")) + '" title="' + esc(t(lang, hidden ? "显示" : "隐藏", hidden ? "Show" : "Hide")) + '">' + eyeIcon(!hidden) + "</button></span>";
      html += "</div>";
    });
    html += "</div></div>";
  });
  html += '<div class="tree-note"><b>' + esc(t(lang, "可信度标注", "Confidence key")) + '</b><br>LEVEL A · ' + esc(pick(LEVELS.A.name, lang)) + "<br>LEVEL B · " + esc(pick(LEVELS.B.name, lang)) + "<br>LEVEL C · " + esc(pick(LEVELS.C.name, lang)) + "</div>";
  html += '<div class="tree-legend"><span><i style="background:var(--magnet)"></i>MAGNET</span><span><i style="background:var(--gradient)"></i>GRADIENT</span><span><i style="background:var(--rfTx)"></i>RF</span><span><i style="background:var(--elec)"></i>CONTROL</span></div>';
  return html;
}

export function renderExperiments(lab, state) {
  const lang = state.lang;
  const current = lab.experimentId;
  let html = '<div class="tree-group"><button type="button" class="tree-category" data-noop="1"><span class="tree-category__bar" style="--cat-color:var(--cyan)"></span><span class="tree-category__label">PHYSICS / 06 EXPERIMENTS</span><span class="tree-category__count">06</span></button><div class="tree-items">';
  EXPERIMENTS.forEach((exp) => {
    const selected = exp.id === current;
    html += '<div class="tree-item' + (selected ? " is-active" : "") + '" role="button" tabindex="0" data-experiment="' + exp.id + '">';
    html += '<span class="tree-item__index">' + exp.num + '</span><span class="tree-item__copy"><b>' + esc(pick(exp.title, lang)) + "</b><span>" + esc(pick(exp.kicker, lang)) + "</span></span>";
    html += '<span class="tree-item__tail">' + levelDot(exp.level) + "</span></div>";
  });
  html += "</div></div>";
  html += '<div class="tree-note"><b>' + esc(t(lang, "实验原则", "Lab principle")) + "</b><br>" + esc(t(lang, "基本关系使用标准解析式；场线、点云与敏感度包络为定性示意。每个实验均列出显式假设。", "Core relations use standard analytic expressions; field lines, point clouds and sensitivity envelopes are qualitative. Every experiment lists explicit assumptions.")) + "</div>";
  html += '<div class="tree-note"><b>' + esc(t(lang, "时间尺度", "Time scale")) + "</b><br>" + esc(t(lang, "动画时间经过严重压缩，不对应真实 Larmor 频率或 TR。", "Animation time is heavily compressed and does not represent the real Larmor frequency or TR.")) + "</div>";
  return html;
}

export function renderOverview(state) {
  const lang = state.lang;
  const f0 = state.field * GYRO_MHZ_PER_T;
  const total = PARTS.length;
  const catRows = CATEGORIES.map((cat) => {
    const count = PARTS.filter((p) => p.cat === cat.id).length;
    return '<div class="arch-row"><span><i style="--row-color:' + cat.color + '"></i>' + esc(categoryName(cat, lang)) + '</span><span>' + pad(count) + " PART" + (count === 1 ? "" : "S") + "</span></div>";
  }).join("");
  return '<div class="dossier-empty">'
    + '<div class="eyebrow empty-kicker">GENERIC SYSTEM / TECHNICAL OVERVIEW</div>'
    + '<h2 class="empty-title">MRI <span>' + esc(t(lang, "系统 · 工程解剖总览", "SYSTEM · ENGINEERING OVERVIEW")) + "</span></h2>"
    + '<p class="empty-copy">' + esc(t(lang,
      "一台水平孔径超导 MRI 是磁体、低温、梯度、射频、电子与机房安全边界的耦合系统。选择左侧部件查看结构、原理、典型材料、工程规格与成像影响。",
      "A horizontal-bore superconducting MRI is a coupled system of magnet, cryogenics, gradients, RF, electronics and room safety boundaries. Select a component at left to inspect its structure, principle, typical materials, engineering specifications and imaging impact.")) + "</p>"
    + '<div class="architecture-summary">' + catRows + "</div>"
    + '<div class="coord-panel"><div class="coord-title">COORDINATE SYSTEM / 坐标系</div><div class="coord-grid">'
    + '<span>Z</span><b class="coord-highlight">BORE AXIS / B₀</b><b>+Z</b>'
    + '<span>Y</span><b>VERTICAL</b><b>+Y = SUPERIOR</b>'
    + '<span>X</span><b>PATIENT L / R</b><b>+X = LEFT</b>'
    + "</div></div>"
    + '<div class="coord-panel"><div class="coord-title">NOMINAL OPERATING POINT</div><div class="coord-grid">'
    + '<span>B₀</span><b class="coord-highlight">' + fmt(state.field, 1) + ' T</b><b>f₀ ≈ ' + fmt(f0) + " MHz</b>"
    + '<span>BORE</span><b>≈ ' + Math.round(BORE_RADIUS * 2 * 100) + ' cm</b><b>' + total + " PARTS</b>"
    + "</div></div>"
    + '<div class="howto-panel"><p><b>' + esc(t(lang, "操作路径", "Workflow")) + '</b> — ' + esc(t(lang, "选择部件 → 查看右侧技术档案 → Focus / Isolate / Hide。", "Select a component → inspect the dossier → Focus / Isolate / Hide.")) + "</p>"
    + "<p>" + esc(t(lang, "底部可切换整机、透明壳、实际裁剪剖面与拆解时间轴；物理实验使用独立工作区。", "Use the bottom console for complete, transparent, true clipped sections and the disassembly timeline; physics experiments use a dedicated workspace.")) + "</p></div>"
    + '<div class="model-note">' + esc(pick(MODEL_NOTES.architecture, lang)) + "</div>"
    + '<div class="model-note">' + esc(t(lang, "本页不复制任何厂商 CAD、不宣称真实线圈图纸或临床性能。", "No vendor CAD is reproduced; no real coil drawing or clinical performance is claimed.")) + "</div>"
    + "</div>";
}

export function renderPart(part, controller, state) {
  const lang = state.lang;
  const cat = CATEGORY_MAP.get(part.cat);
  const level = LEVELS[part.level] || LEVELS.B;
  const hidden = controller.state.hidden.has(part.id);
  const relations = (part.relations || []).map((id) => PART_MAP.get(id)).filter(Boolean).map((rel) => {
    return '<button type="button" class="relation-chip" data-related-part="' + rel.id + '">' + esc(pick(rel.name, lang)) + "<i></i></button>";
  }).join("");
  const specs = (part.specs || []).map((spec) => {
    return '<div class="spec-cell"><span>' + esc(pick(spec.k, lang)) + "</span><strong>" + esc(pick(spec.v, lang)) + "</strong>" + (spec.note ? "<em>" + esc(pick(spec.note, lang)) + "</em>" : "") + "</div>";
  }).join("");
  const sources = (part.refs || []).map((id) => sourceLink(id, lang)).join("");
  return '<div class="dossier-hero">'
    + '<div class="dossier-cat"><span class="dossier-cat__name" style="--part-color:' + part.color + '"><i></i>' + esc(categoryName(cat, lang)) + "</span>" + levelBadge(part.level, lang) + "</div>"
    + '<div class="dossier-index">COMPONENT ' + pad(part.order) + " / " + pad(PARTS.length) + " · ID " + esc(part.id.toUpperCase()) + "</div>"
    + '<h2 class="dossier-title">' + esc(pick(part.name, lang)) + "</h2>"
    + '<p class="dossier-title-en">' + esc(pick(part.name, lang === "zh" ? "en" : "zh")) + "</p>"
    + '<p class="dossier-subtitle">' + esc(pick(part.subtitle, lang)) + "</p>"
    + '<div class="dossier-actions">'
    + '<button type="button" class="action-button" data-action="focus" data-part="' + part.id + '">' + actionIcon("focus") + esc(t(lang, "聚焦", "Focus")) + "</button>"
    + '<button type="button" class="action-button' + (controller.state.isolatedId === part.id ? " is-active" : "") + '" data-action="isolate" data-part="' + part.id + '">' + actionIcon("isolate") + esc(t(lang, "隔离", "Isolate")) + "</button>"
    + '<button type="button" class="action-button' + (hidden ? " is-active" : "") + '" data-action="hide" data-part="' + part.id + '">' + actionIcon("hide") + esc(t(lang, hidden ? "显示" : "隐藏", hidden ? "Show" : "Hide")) + "</button>"
    + '<button type="button" class="action-button" data-action="explode-category" data-category="' + part.cat + '">' + actionIcon("explode") + esc(t(lang, "拆解本系统", "Explode system")) + "</button>"
    + '<button type="button" class="action-button" data-action="clear">' + actionIcon("clear") + esc(t(lang, "清除选择", "Clear")) + "</button>"
    + "</div></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">STRUCTURE / 结构</span></div><p>' + esc(pick(part.structure, lang)) + "</p></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">PRINCIPLE / 原理</span></div><p>' + esc(pick(part.principle, lang)) + "</p></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">TYPICAL SPECIFICATIONS / 典型规格</span></div><div class="spec-grid">' + specs
    + '<div class="spec-cell" style="grid-column:1/-1"><span>' + esc(t(lang, "材料 / MATERIAL", "MATERIAL / 材料")) + "</span><strong style=\"font-family:var(--font-cn);font-size:9px;line-height:1.55\">" + esc(pick(part.material, lang)) + "</strong></div>"
    + "</div></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">SYSTEM RELATIONS / 系统关系</span></div><div class="relation-list">' + relations + "</div></div>"
    + '<div class="impact-note"><p><b>' + esc(t(lang, "对成像的影响", "Imaging impact")) + '</b> · ' + esc(pick(part.impact, lang)) + "</p></div>"
    + '<div class="safety-note"><div class="safety-note__head"><i>!</i>' + esc(t(lang, "安全边界 / SAFETY", "SAFETY BOUNDARY / 安全边界")) + '</div><p>' + esc(pick(part.safety, lang)) + "</p></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">SOURCES / 来源</span></div><div class="source-list">' + sources + "</div></div>"
    + '<div class="level-disclaimer"><b>' + level.label + " · " + esc(pick(level.name, lang)) + "</b><br>" + esc(pick(level.desc, lang)) + "<br>" + esc(pick(MODEL_NOTES.geometry, lang)) + "</div>"
    + '<div class="dossier-footnote">' + esc(t(lang, "本档案为教学级抽象，不代表厂商 CAD、制造尺寸或临床性能。", "This dossier is a teaching abstraction, not vendor CAD, manufacturing dimensions or clinical performance.")) + "</div>";
}

const EXPERIMENT_RELATIONS = {
  b0: ["main-coils", "shim-system"],
  larmor: ["main-coils"],
  rf: ["body-rf-coil", "head-coil", "rf-shield"],
  gradient: ["gradient-gx", "gradient-gy", "gradient-gz", "gradient-shield", "shim-system"],
  sequence: ["body-rf-coil", "gradient-gx", "gradient-gy", "gradient-gz", "electronics-racks"],
  kspace: ["gradient-assembly", "electronics-racks", "operator-console"],
};

export function renderExperiment(exp, state) {
  const lang = state.lang;
  const level = LEVELS[exp.level] || LEVELS.B;
  const f0 = state.field * GYRO_MHZ_PER_T;
  const relations = (EXPERIMENT_RELATIONS[exp.id] || []).map((id) => PART_MAP.get(id)).filter(Boolean).map((part) => '<button type="button" class="relation-chip" data-inspect-part="' + part.id + '">' + esc(pick(part.name, lang)) + "<i></i></button>").join("");
  const assumptions = (exp.assumptions || []).map((a) => "<li>" + esc(pick(a, lang)) + "</li>").join("");
  return '<div class="dossier-hero">'
    + '<div class="dossier-cat"><span class="dossier-cat__name" style="--part-color:var(--cyan)"><i></i>PHYSICS LAB / ' + exp.num + "</span>" + levelBadge(exp.level, lang) + "</div>"
    + '<div class="dossier-index">EXPERIMENT ' + exp.num + " / 06 · " + esc(exp.id.toUpperCase()) + "</div>"
    + '<h2 class="dossier-title">' + esc(pick(exp.title, lang)) + "</h2>"
    + '<p class="dossier-title-en">' + esc(pick(exp.title, lang === "zh" ? "en" : "zh")) + "</p>"
    + '<p class="dossier-subtitle">' + esc(pick(exp.kicker, lang)) + "</p>"
    + '<div class="dossier-actions"><button type="button" class="action-button" data-action="lab-panel">' + actionIcon("focus") + esc(t(lang, "显示分析面板", "Show analysis panel")) + "</button>"
    + '<button type="button" class="action-button" data-action="lab-camera">' + actionIcon("isolate") + esc(t(lang, "实验视角", "Experiment view")) + "</button></div>"
    + "</div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">EQUATION / 关系式</span></div><div class="impact-note"><p style="font-family:var(--font-mono);color:var(--text)">' + esc(exp.equation) + "</p></div></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">SUMMARY / 摘要</span></div><p>' + esc(pick(exp.summary, lang)) + "</p></div>"
    + (exp.id === "larmor" ? '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">CURRENT READOUT</span></div><div class="spec-grid"><div class="spec-cell"><span>B₀</span><strong>' + fmt(state.field, 1) + ' T</strong></div><div class="spec-cell"><span>f₀</span><strong>' + fmt(f0) + " MHz</strong></div></div></div>" : "")
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">TEACHING THEORY / 教学解释</span></div><p>' + esc(pick(exp.theory, lang)) + "</p></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">ASSUMPTIONS / 假设与忽略</span></div><ul class="assumption-list">' + assumptions + "</ul></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">HARDWARE CONTEXT / 相关硬件</span></div><div class="relation-list">' + relations + "</div></div>"
    + '<div class="dossier-section"><div class="dossier-section__head"><span class="eyebrow">SOURCES / 来源</span></div><div class="source-list">' + (exp.refs || []).map((id) => sourceLink(id, lang)).join("") + "</div></div>"
    + '<div class="level-disclaimer"><b>' + level.label + " · " + esc(pick(level.name, lang)) + "</b><br>" + esc(pick(level.desc, lang)) + "</div>"
    + '<div class="dossier-footnote">' + esc(pick(MODEL_NOTES.physics, lang)) + "</div>";
}

export function renderSectionLegend(mode, lang) {
  if (mode !== "longitudinal" && mode !== "transverse") return "";
  const rows = mode === "transverse"
    ? [
        ["#2b3d48", "OUTER COVER", "外罩"],
        ["#5f8fbe", "OVV / VACUUM", "外真空容器"],
        ["#d7c288", "MLI / THERMAL", "多层绝热/冷屏"],
        ["#6f9bd1", "HELIUM VESSEL", "氦容器"],
        ["#6f8db0", "COIL FORMER", "线圈骨架"],
        ["#f3a04d", "GRADIENT", "梯度"],
        ["#e3cf7d", "SHIM", "匀场"],
        ["#a38bf2", "RF / BODY COIL", "体线圈"],
        ["#53e3c4", "RECEIVE ARRAY", "接收阵列"],
      ]
    : [
        ["#2b3d48", "OUTER COVER", "外罩"],
        ["#5f8fbe", "OVV / VACUUM", "外真空容器"],
        ["#d7c288", "THERMAL / MLI", "冷屏/多层绝热"],
        ["#6f9bd1", "HELIUM VESSEL", "氦容器"],
        ["#f3a04d", "GRADIENT", "梯度"],
        ["#e3cf7d", "SHIM", "匀场"],
        ["#a38bf2", "RF SHIELD / BODY", "RF 屏蔽/体线圈"],
        ["#53e3c4", "HEAD ARRAY", "头线圈"],
      ];
  return rows.map(([color, en, zh]) => '<div class="section-legend__row"><i style="--row-color:' + color + '"></i><span>' + esc(lang === "zh" ? zh : en) + "</span><span>" + esc(lang === "zh" ? en : zh) + "</span></div>").join("");
}

export function modalTabs(lang) {
  return [
    { id: "guide", label: t(lang, "操作指南", "Guide") },
    { id: "sources", label: t(lang, "科学来源", "Sources") },
    { id: "safety", label: t(lang, "安全边界", "Safety") },
    { id: "levels", label: t(lang, "可信度", "Confidence") },
    { id: "glossary", label: t(lang, "术语", "Glossary") },
  ];
}

export function modalContent(tab, lang, state) {
  if (tab === "sources") {
    return {
      kicker: "REFERENCES / PRIMARY & REVIEW SOURCES",
      title: t(lang, "科学来源与建模边界", "Scientific sources & model boundary"),
      html: '<p>' + esc(t(lang,
        "页面中的基本物理关系与系统描述引用公开教材、综述和机构资料。三维布局、线圈匝数、层级包络和视觉场线是参数化教学重建，不来自任何厂商 CAD。",
        "Core physical relations and system descriptions draw on public textbooks, reviews and institutional sources. 3D layout, turn counts, layer envelopes and visual field lines are parametric teaching reconstructions, not vendor CAD.")) + "</p>"
        + REFERENCES.map((ref) => '<div class="modal-source"><div class="modal-source__key">' + esc(ref.short) + '</div><div><div class="modal-source__title"><a href="' + esc(ref.url) + '" target="_blank" rel="noopener">' + esc(ref.title) + "</a></div><div class=\"modal-source__meta\">" + esc(ref.authors) + " · " + esc(ref.year) + "</div><p>" + esc(pick(ref.note, lang)) + "</p></div></div>").join("")
        + '<h3>MODEL NOTES / 模型说明</h3>'
        + '<p><b>ARCHITECTURE</b><br>' + esc(pick(MODEL_NOTES.architecture, lang)) + "</p>"
        + '<p><b>GEOMETRY</b><br>' + esc(pick(MODEL_NOTES.geometry, lang)) + "</p>"
        + '<p><b>PHYSICS</b><br>' + esc(pick(MODEL_NOTES.physics, lang)) + "</p>"
        + '<div class="level-disclaimer"><b>NOT A CLINICAL DEVICE.</b> ' + esc(t(lang, "本页面不用于扫描规划、设备选型、临床诊断或安全决策。", "This page is not for scan planning, equipment selection, clinical diagnosis or safety decisions.")) + "</div>",
    };
  }
  if (tab === "safety") {
    return {
      kicker: "MR SAFETY / NON-NEGOTIABLE BOUNDARIES",
      title: t(lang, "MR 安全边界", "MR safety boundaries"),
      html: '<p>' + esc(t(lang, "以下为教学提示，不替代现场 MR 安全培训、厂商手册、植入物标签或场地实测。", "These are teaching reminders, not a substitute for site MR safety training, vendor manuals, implant labelling or measured field maps.")) + "</p>"
        + '<div class="safety-grid">' + SAFETY_NOTES.map((note) => '<div class="safety-card"><h4>' + esc(pick(note.title, lang)) + "</h4><p>" + esc(pick(note.text, lang)) + "</p></div>").join("") + "</div>"
        + '<h3>MODEL-SPECIFIC SAFETY NOTES / 本模型边界</h3>'
        + '<ul><li>' + esc(t(lang, "失超管道只作为示意；正常扫描不通过该管道持续排放氦气。", "The quench line is schematic; normal scanning does not continuously vent helium through it.")) + "</li>"
        + "<li>" + esc(t(lang, "有限元/场图类结果未在本页求解；所有场线、点云与敏感度包络均为定性教学叠加。", "No FEM/field-map solve is performed here; all field lines, point clouds and sensitivity envelopes are qualitative teaching overlays.")) + "</li>"
        + "<li>" + esc(t(lang, "B₀ 在超导磁体中通常持续存在，不能把“扫描开始”理解为“打开 B₀”。", "B0 normally persists in a superconducting magnet; do not interpret 'scan start' as switching B0 on.")) + "</li>"
        + "<li>" + esc(t(lang, "页面不模拟 SAR、PNS、植入物加热、声压或失超动力学。", "The page does not model SAR, PNS, implant heating, acoustic pressure or quench dynamics.")) + "</li></ul>"
        + '<div class="level-disclaimer">' + esc(t(lang, "现场必须执行 MR 安全筛查、5 G 线控制、听力保护、氧监测与应急演练。", "Sites must enforce MR screening, 5 G line control, hearing protection, oxygen monitoring and emergency drills.")) + "</div>",
    };
  }
  if (tab === "levels") {
    return {
      kicker: "EPISTEMIC LABELS / LEVEL A · B · C",
      title: t(lang, "可信度与建模声明", "Confidence & modelling statement"),
      html: '<p>' + esc(t(lang, "每个部件和实验都带有可信度等级。等级描述的是证据类型，不是视觉精细度。", "Every component and experiment carries a confidence level. The level describes evidence type, not visual fidelity.")) + "</p>"
        + Object.entries(LEVELS).map(([key, data]) => '<div class="modal-source"><div class="modal-source__key">' + data.label + '</div><div><div class="modal-source__title">' + esc(pick(data.name, lang)) + "</div><p>" + esc(pick(data.desc, lang)) + "</p></div></div>").join("")
        + '<h3>WHAT IS NOT MODELLED / 未建模内容</h3><ul>'
        + "<li>" + esc(t(lang, "真实线圈电感、涡流、屏蔽效能、B₀ 均匀度、SAR 与 PNS 数值。", "Real coil inductance, eddy currents, shielding effectiveness, B0 homogeneity, SAR and PNS values.")) + "</li>"
        + "<li>" + esc(t(lang, "厂商脉冲序列、梯度波形、重建算法、并行成像校准与噪声统计。", "Vendor pulse sequences, gradient waveforms, reconstruction algorithms, parallel-imaging calibration and noise statistics.")) + "</li>"
        + "<li>" + esc(t(lang, "真实失超传播、低温热传导、真空寿命与机械强度。", "Real quench propagation, cryogenic heat transfer, vacuum lifetime and structural strength.")) + "</li></ul>"
        + '<div class="level-disclaimer">' + esc(t(lang, "页面强调物理层级与工程边界；视觉上简化掉的部件不应被理解为不存在。", "The page prioritises physical hierarchy and engineering boundaries; visually simplified parts should not be read as absent.")) + "</div>",
    };
  }
  if (tab === "glossary") {
    return {
      kicker: "GLOSSARY / MRI SYSTEM TERMS",
      title: t(lang, "关键术语", "Key terms"),
      html: GLOSSARY.map((item) => '<div class="glossary-row"><div class="glossary-term">' + esc(item.term) + '</div><div class="glossary-desc">' + esc(pick(item.desc, lang)) + "</div></div>").join("")
        + '<div class="level-disclaimer">' + esc(t(lang, "缩写：OVV = 外真空容器；RF = 射频；ADC = 模数转换；SAR = 比吸收率；PNS = 外周神经刺激；MLI = 多层绝热。", "OVV = outer vacuum vessel; RF = radiofrequency; ADC = analog-to-digital conversion; SAR = specific absorption rate; PNS = peripheral nerve stimulation; MLI = multilayer insulation.")) + "</div>",
    };
  }
  return {
    kicker: "OPERATING GUIDE / INTERACTION MODEL",
    title: t(lang, "操作指南与阅读方法", "Operating guide & reading method"),
    html: '<p>' + esc(t(lang, "这是一个“系统解剖 + 物理实验”双工作区。装配解剖用于理解硬件层级；物理实验用于理解信号如何形成。", "This is a dual workspace: Anatomy explains hardware hierarchy; Physics explains how the signal is formed.")) + "</p>"
      + '<h3>ANATOMY / 装配解剖</h3><ul>'
      + "<li>" + esc(t(lang, "拖动旋转、滚轮缩放；点击部件或左侧树进入技术档案。", "Drag to orbit, scroll to zoom; select a component or a tree row to open its dossier.")) + "</li>"
      + "<li>" + esc(t(lang, "底部显示方式可切换整机、透明壳、纵剖、横剖、局部剖切和拆解。剖面使用真实裁剪平面，截面补片为示意。", "The bottom modes switch Complete, Transparent, Longitudinal, Transverse, Cutaway and Exploded. Sections use real clipping planes; cap patches are schematic.")) + "</li>"
      + "<li>" + esc(t(lang, "拆解时间轴可播放、暂停、反向和手动定位；部件按顺序展开。", "The disassembly timeline plays, pauses, reverses and scrubs; components deploy in sequence.")) + "</li>"
      + "<li>" + esc(t(lang, "Focus 聚焦当前部件；Isolate 单独显示；Hide 控制可见性；底部的 Shell Opacity 可进一步观察内部。", "Focus frames the selected part; Isolate shows only it; Hide controls visibility; Shell Opacity reveals internals.")) + "</li></ul>"
      + "<h3>PHYSICS / 物理实验</h3><ul>"
      + "<li>" + esc(t(lang, "六个实验分别覆盖 B₀、Larmor、RF 翻转角、梯度编码、GRE 时序与 k-space 重建。", "Six experiments cover B0, Larmor, RF flip angle, gradient encoding, GRE timing and k-space reconstruction.")) + "</li>"
      + "<li>" + esc(t(lang, "顶部 B₀ 切换同时更新 Larmor 频率、翻转角计算和当前读数。", "The B0 switch updates Larmor frequency, flip-angle calculations and current readouts.")) + "</li>"
      + "<li>" + esc(t(lang, "序列表与 k-space 面板可交互；所有动画使用压缩时间尺度。", "The sequence and k-space panels are interactive; all animations use compressed time scales.")) + "</li></ul>"
      + "<h3>READING THE MODEL / 阅读模型</h3><p>" + esc(t(lang, "颜色是系统类别，不是材料属性或场方向。B₀、B₁、梯度和 RF 接收场是不同物理量；页面会用标签明确区分。", "Colours are system categories, not material properties or field directions. B0, B1, gradients and RF receive fields are distinct quantities and are labelled explicitly.")) + "</p>"
      + '<div class="level-disclaimer">' + esc(t(lang, "建议先看整机/透明壳，再选择磁体、梯度、RF 部件，最后进入对应物理实验。", "Suggested path: overview/transparent shell → magnet, gradient and RF components → the corresponding physics experiment.")) + "</div>",
  };
}

export class LabelOverlay {
  constructor(scene, controller, options = {}) {
    this.scene = scene;
    this.controller = controller;
    this.layer = document.getElementById("callout-layer");
    this.leaderGroup = document.getElementById("leader-lines");
    this.reticle = document.getElementById("focus-reticle");
    this.reticleCaption = document.getElementById("reticle-caption");
    this.onSelect = options.onSelect || (() => {});
    this.getState = options.getState || (() => ({ mode: "anatomy" }));
    this.callouts = [];
    this.active = false;
    this.labelCount = 8;
  }

  hide() {
    this.active = false;
    this.layer.innerHTML = "";
    this.leaderGroup.innerHTML = "";
    this.callouts = [];
    this.reticle.classList.remove("is-visible");
  }

  refresh() {
    const state = this.getState();
    if (state.mode !== "anatomy" || !state.labels || ["longitudinal", "transverse"].includes(this.controller.state.displayMode)) {
      this.hide();
      return;
    }
    this.active = true;
    const width = window.innerWidth;
    this.labelCount = width < 700 ? 2 : width < 1080 ? 4 : 5;
    const completeMode = this.controller.state.displayMode === "complete";
    const explodeCategory = this.controller.state.explodeCategory;
    const candidates = PARTS.slice()
      .filter((part) => (!completeMode || EXTERNAL_LABEL_IDS.has(part.id)) && (!explodeCategory || part.cat === explodeCategory))
      .sort((a, b) => (b.labelPriority || 0) - (a.labelPriority || 0));
    const selected = this.controller.state.selectedId;
    const visible = [];
    const seen = new Set();
    if (selected) {
      const part = PART_MAP.get(selected);
      const selectedEntry = this.scene.parts.get(selected);
      if (part && selectedEntry && this.controller.effectiveVisible(selectedEntry) && (!completeMode || EXTERNAL_LABEL_IDS.has(part.id)) && (!explodeCategory || part.cat === explodeCategory)) {
        visible.push(part); seen.add(part.id);
      }
    }
    for (const part of candidates) {
      if (visible.length >= this.labelCount + (selected ? 1 : 0)) break;
      if (seen.has(part.id)) continue;
      const entry = this.scene.parts.get(part.id);
      if (!entry || !this.controller.effectiveVisible(entry)) continue;
      if (part.id === "rf-room") continue;
      visible.push(part); seen.add(part.id);
    }
    this.layer.innerHTML = "";
    this.leaderGroup.innerHTML = "";
    this.callouts = visible.map((part) => {
      const lang = state.lang;
      const el = document.createElement("div");
      el.className = "callout";
      el.dataset.part = part.id;
      el.dataset.side = "right";
      el.innerHTML = '<div class="callout__row"><span class="callout__index">' + pad(part.order) + '</span><span class="callout__name">' + esc(pick(part.name, lang)) + '</span></div><div class="callout__en">' + esc(pick(part.name, lang === "zh" ? "en" : "zh")) + '</div><div class="callout__meta">' + esc(pick(part.subtitle, lang)) + "</div>";
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onSelect(part.id);
      });
      this.layer.appendChild(el);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("r", "2.3");
      g.appendChild(path);
      g.appendChild(dot);
      this.leaderGroup.appendChild(g);
      return { part, el, g, path, dot };
    });
  }

  safeRect() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const consoleEl = document.getElementById("anatomy-console");
    const consoleTop = consoleEl ? consoleEl.getBoundingClientRect().top : height - 150;
    let left = 12;
    let right = width - 12;
    let top = width < 760 ? 132 : 116;
    const leftPanel = document.querySelector(".left-panel");
    const rightPanel = document.querySelector(".right-panel");
    const body = document.body;
    if (!body.classList.contains("left-open") && !body.classList.contains("right-open")) {
      if (leftPanel) {
        const r = leftPanel.getBoundingClientRect();
        if (r.width > 0 && r.right > 0 && r.right < width) left = Math.max(left, r.right + 12);
      }
      if (rightPanel) {
        const r = rightPanel.getBoundingClientRect();
        if (r.width > 0 && r.left > 0 && r.left < width) right = Math.min(right, r.left - 12);
      }
    }
    return { left, right, top, bottom: consoleTop - 26, width, height };
  }

  update() {
    if (!this.active || !this.callouts.length) {
      if (this.reticle) this.reticle.classList.remove("is-visible");
      return;
    }
    const state = this.getState();
    if (state.mode !== "anatomy" || !state.labels) {
      this.hide();
      return;
    }
    const open = document.body.classList.contains("left-open") || document.body.classList.contains("right-open");
    if (open) {
      this.callouts.forEach((c) => c.el.classList.remove("is-visible"));
      this.leaderGroup.style.opacity = "0";
      this.reticle.classList.remove("is-visible");
      return;
    }
    this.leaderGroup.style.opacity = "1";
    const safe = this.safeRect();
    const width = window.innerWidth < 760 ? 146 : 162;
    const height = 43;
    const gap = 7;
    const singleColumn = window.innerWidth < 760;
    const centerX = (safe.left + safe.right) / 2;
    const sorted = this.callouts.map((c) => {
      const anchor = this.scene.getPartAnchor(c.part.id);
      const projected = anchor ? this.scene.projectPosition(anchor) : null;
      return { ...c, anchor, projected };
    }).filter((c) => c.projected && c.projected.z < 1 && c.projected.z > -1 &&
      c.projected.x > -120 && c.projected.x < safe.width + 120 &&
      c.projected.y > safe.top - 80 && c.projected.y < safe.bottom + 80
    ).sort((a, b) => a.projected.y - b.projected.y);

    const columns = { left: [], right: [] };
    if (singleColumn) {
      sorted.forEach((c) => columns.left.push(c));
    } else {
      const byX = sorted.slice().sort((a, b) => a.projected.x - b.projected.x);
      const split = Math.ceil(byX.length * 0.55);
      byX.forEach((c, index) => columns[index < split ? "left" : "right"].push(c));
      columns.left.sort((a, b) => a.projected.y - b.projected.y);
      columns.right.sort((a, b) => a.projected.y - b.projected.y);
    }

    const allPlaced = [];
    Object.entries(columns).forEach(([side, rows]) => {
      let cursor = safe.top + 6;
      rows.forEach((row) => {
        const desired = Math.max(cursor, Math.min(safe.bottom - height, row.projected.y - height / 2));
        row.y = desired;
        cursor = desired + height + gap;
      });
      const last = rows.length ? rows[rows.length - 1].y + height : safe.top;
      if (last > safe.bottom) {
        let reverseCursor = safe.bottom - height;
        for (let i = rows.length - 1; i >= 0; i -= 1) {
          rows[i].y = Math.min(rows[i].y, reverseCursor);
          reverseCursor = rows[i].y - gap - height;
        }
      }
      rows.forEach((row) => {
        const x = side === "left" ? safe.left + 12 : safe.right - width - 12;
        row.x = x;
        row.side = side;
        const el = row.el;
        el.style.width = width + "px";
        el.dataset.side = side;
        el.style.left = x + "px";
        el.style.top = row.y + "px";
        el.classList.add("is-visible");
        const startX = side === "left" ? x + width : x;
        const startY = row.y + 19;
        const endX = row.projected.x;
        const endY = row.projected.y;
        const elbow = side === "left" ? startX + 18 : startX - 18;
        row.path.setAttribute("d", "M " + startX + " " + startY + " L " + elbow + " " + startY + " L " + endX + " " + endY);
        row.dot.setAttribute("cx", endX);
        row.dot.setAttribute("cy", endY);
        row.g.classList.toggle("is-active", this.controller.state.selectedId === row.part.id);
        el.classList.toggle("is-active", this.controller.state.selectedId === row.part.id);
        allPlaced.push(row);
      });
    });

    this.callouts.forEach((c) => {
      if (!allPlaced.some((s) => s.part.id === c.part.id)) c.el.classList.remove("is-visible");
    });
    this.updateReticle(safe);
  }

  updateReticle(safe) {
    const id = this.controller.state.selectedId;
    if (!id || this.getState().mode !== "anatomy") {
      this.reticle.classList.remove("is-visible");
      return;
    }
    if (this.controller.state.displayMode === "complete" && !EXTERNAL_LABEL_IDS.has(id)) {
      this.reticle.classList.remove("is-visible");
      return;
    }
    const part = PART_MAP.get(id);
    const entry = this.scene.parts.get(id);
    if (!part || !entry) {
      this.reticle.classList.remove("is-visible");
      return;
    }
    const box = new THREE.Box3().setFromObject(entry.group);
    entry.box.copy(box);
    if (!box.isEmpty()) {
      const min = box.min, max = box.max;
      const points = [
        [min.x, min.y, min.z], [max.x, min.y, min.z], [min.x, max.y, min.z], [max.x, max.y, min.z],
        [min.x, min.y, max.z], [max.x, min.y, max.z], [min.x, max.y, max.z], [max.x, max.y, max.z],
      ].map((p) => this.scene.projectPosition(new THREE.Vector3(p[0], p[1], p[2])));
      const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
      const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
      if (w < 600 && h < 600) {
        this.reticle.style.left = (x + w / 2) + "px";
        this.reticle.style.top = (y + h / 2) + "px";
        this.reticle.style.width = Math.max(48, Math.min(220, w + 26)) + "px";
        this.reticle.style.height = Math.max(48, Math.min(220, h + 26)) + "px";
        this.reticleCaption.textContent = pick(part.name, this.getState().lang).toUpperCase();
        this.reticle.classList.add("is-visible");
        return;
      }
    }
    this.reticle.classList.remove("is-visible");
  }
}
