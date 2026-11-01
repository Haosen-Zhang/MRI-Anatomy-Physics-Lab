
import * as THREE from "three";
import {
  addBox, addCylinder, addTorus, addRing, addHollowCylinder, addCoilLoop,
  addTube, addHelix, addCylinderBetween, addMesh, TAU,
} from "../geometryUtils.js";

function saddlePoints(center, spread, radius, halfLength, turn, segments = 16) {
  const points = [];
  const phiA = center - spread - turn * 0.018;
  const phiB = center + spread + turn * 0.018;
  const r = radius + turn * 0.0025;
  for (let i = 0; i <= segments; i += 1) {
    const z = -halfLength + (2 * halfLength * i) / segments;
    points.push([Math.cos(phiA) * r, Math.sin(phiA) * r, z]);
  }
  for (let i = 1; i <= segments; i += 1) {
    const phi = phiA + ((phiB - phiA) * i) / segments;
    points.push([Math.cos(phi) * r, Math.sin(phi) * r, halfLength]);
  }
  for (let i = 1; i <= segments; i += 1) {
    const z = halfLength - (2 * halfLength * i) / segments;
    points.push([Math.cos(phiB) * r, Math.sin(phiB) * r, z]);
  }
  for (let i = 1; i < segments; i += 1) {
    const phi = phiB - ((phiB - phiA) * i) / segments;
    points.push([Math.cos(phi) * r, Math.sin(phi) * r, -halfLength]);
  }
  return points;
}

function addSaddleCoil(group, M, axis, centerA, centerB) {
  const mat = axis === "x" ? M.gradientGx : M.gradientGy;
  const turns = 3;
  for (const center of [centerA, centerB]) {
    for (let turn = 0; turn < turns; turn += 1) {
      const points = saddlePoints(center, 0.34, 0.405, 0.59, turn);
      addTube(group, points, 0.0058, mat, 150, 6, true);
    }
    // terminal block, separate from the continuous saddle loop
    const angle = center;
    addBox(group, 0.035, 0.075, 0.055, M.copper, [Math.cos(angle) * 0.43, Math.sin(angle) * 0.43, 0.66], 0.01, [0, 0, angle]);
  }
  // distributed support strips
  for (let i = 0; i < 8; i += 1) {
    const angle = (TAU * i) / 8;
    addBox(group, 0.016, 0.016, 1.0, M.gradientShield, [Math.cos(angle) * 0.432, Math.sin(angle) * 0.432, 0], 0.004, [0, 0, angle]);
  }
}

function buildGx(M) {
  const group = new THREE.Group();
  addSaddleCoil(group, M, "x", 0, Math.PI);
  return group;
}

function buildGy(M) {
  const group = new THREE.Group();
  addSaddleCoil(group, M, "y", Math.PI / 2, Math.PI * 1.5);
  return group;
}

function buildGz(M) {
  const group = new THREE.Group();
  for (const sign of [-1, 1]) {
    for (let turn = 0; turn < 4; turn += 1) {
      const z = sign * (0.25 + turn * 0.027);
      addCoilLoop(group, 0.405, z, 0.0062, M.gradientGz, 112);
    }
    // axial return bars connect the Maxwell pair in a schematic winding path
    for (let i = 0; i < 4; i += 1) {
      const angle = (TAU * i) / 4 + Math.PI / 4;
      addBox(group, 0.018, 0.016, 0.19, M.gradientGz, [Math.cos(angle) * 0.405, Math.sin(angle) * 0.405, sign * 0.21], 0.004, [0, 0, angle]);
    }
    addTorus(group, 0.419, 0.012, M.trim, [0, 0, sign * 0.33], [0, 0, 0], TAU, 8, 96);
  }
  addBox(group, 0.045, 0.06, 0.075, M.copper, [0.06, 0.42, 0.65], 0.012);
  addBox(group, 0.045, 0.06, 0.075, M.copper, [-0.06, 0.42, 0.65], 0.012);
  return group;
}

function buildGradientBody(M) {
  const group = new THREE.Group();
  addHollowCylinder(group, 0.37, 0.448, 1.34, M.gradientSupport, [0, 0, 0], { segments: 96, caps: false });
  for (const sign of [-1, 1]) {
    addRing(group, 0.375, 0.448, M.gradientResin, [0, 0, sign * 0.67], [0, 0, 0], 96);
    addRing(group, 0.37, 0.391, M.steel, [0, 0, sign * 0.675], [0, 0, 0], 96);
    addTorus(group, 0.445, 0.014, M.trim, [0, 0, sign * 0.61], [0, 0, 0], TAU, 8, 96);
  }
  // Cooling channels
  for (let i = 0; i < 4; i += 1) {
    const start = (TAU * i) / 4;
    const points = [];
    for (let s = 0; s <= 120; s += 1) {
      const t = s / 120;
      const angle = start + t * Math.PI * 1.5;
      points.push([Math.cos(angle) * 0.454, Math.sin(angle) * 0.454, -0.58 + t * 1.16]);
    }
    addTube(group, points, 0.008, i % 2 ? M.cryoBlue : M.coldCopper, 150, 5);
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = (TAU * i) / 8;
    addBox(group, 0.035, 0.035, 1.18, M.trim, [Math.cos(angle) * 0.458, Math.sin(angle) * 0.458, 0], 0.01, [0, 0, angle]);
  }
  // Coolant manifold, connectors and amplifier feed block
  addBox(group, 0.18, 0.1, 0.22, M.darkSteel, [0.23, 0.41, 0.70], 0.025);
  addCylinder(group, 0.024, 0.024, 0.22, M.cryoBlue, [0.34, 0.28, 0.70], [0, 0, 0], 16);
  addCylinder(group, 0.018, 0.018, 0.28, M.cryoBlue, [0.4, 0.22, 0.72], [0, 0, 0], 16);
  addBox(group, 0.25, 0.17, 0.2, M.electronicsDark, [-0.25, -0.4, 0.72], 0.03);
  addBox(group, 0.22, 0.035, 0.018, M.warningYellow, [-0.25, -0.4, 0.827], 0.006);
  addCylinder(group, 0.035, 0.035, 0.08, M.steel, [-0.48, 0.0, 0.67], [0, 0, Math.PI / 2], 16);
  // Short flexible coolant hoses terminate at a bore-side clamp, not in mid-air.
  addTube(group, [
    [0.32, 0.23, 0.72], [0.44, 0.02, 0.83], [0.47, -0.26, 0.76], [0.38, -0.43, 0.68],
  ], 0.021, M.cable, 28, 6);
  addTube(group, [
    [0.36, 0.18, 0.69], [0.48, -0.02, 0.8], [0.5, -0.28, 0.73], [0.4, -0.44, 0.66],
  ], 0.015, M.cryoBlue, 28, 6);
  addBox(group, 0.18, 0.06, 0.1, M.darkSteel, [0.39, -0.46, 0.66], 0.02);
  return group;
}

function buildGradientShield(M) {
  const group = new THREE.Group();
  for (const sign of [-1, 1]) {
    for (let turn = 0; turn < 4; turn += 1) {
      addCoilLoop(group, 0.458, sign * (0.28 + turn * 0.025), 0.005, M.gradientShield, 112);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = (TAU * i) / 8;
    addBox(group, 0.018, 0.022, 1.0, M.gradientShield, [Math.cos(angle) * 0.463, Math.sin(angle) * 0.463, 0], 0.005, [0, 0, angle]);
  }
  // gradient filter / feed-through block
  addBox(group, 0.2, 0.16, 0.15, M.electronicsDark, [-0.29, 0.4, 0.62], 0.025);
  addBox(group, 0.13, 0.07, 0.1, M.copper, [-0.42, 0.42, 0.65], 0.015);
  addCylinder(group, 0.022, 0.022, 0.13, M.orange || M.warningYellow, [-0.47, 0.31, 0.65], [0, 0, 0], 16);
  return group;
}

function buildShim(M) {
  const group = new THREE.Group();
  const trays = 12;
  for (let i = 0; i < trays; i += 1) {
    const angle = (TAU * i) / trays;
    const x = Math.cos(angle) * 0.465;
    const y = Math.sin(angle) * 0.465;
    addBox(group, 0.022, 0.085, 0.88, M.shimTray, [x, y, 0], 0.01, [0, 0, angle]);
    for (let j = 0; j < 3; j += 1) {
      addBox(group, 0.014, 0.055, 0.056, M.shim, [x * 1.03, y * 1.03, -0.25 + j * 0.25], 0.006, [0, 0, angle]);
    }
  }
  for (let i = 0; i < 6; i += 1) {
    const angle = (TAU * i) / 6;
    addBox(group, 0.018, 0.02, 0.94, M.shimGold, [Math.cos(angle) * 0.493, Math.sin(angle) * 0.493, 0], 0.004, [0, 0, angle]);
  }
  for (let i = 0; i < 4; i += 1) {
    addCoilLoop(group, 0.482, -0.36 + i * 0.24, 0.0035, M.shimGold, 96);
  }
  addBox(group, 0.24, 0.1, 0.14, M.electronicsDark, [0.22, 0.43, 0.6], 0.025);
  addBox(group, 0.03, 0.025, 0.01, M.screenGlow, [0.22, 0.485, 0.6], 0.003);
  return group;
}

export function buildGradientSystems(M) {
  return [
    { id: "gradient-assembly", group: buildGradientBody(M), anchor: [0.32, 0.08, 0.44] },
    { id: "gradient-gx", group: buildGx(M), anchor: [0.4, 0.08, 0.1] },
    { id: "gradient-gy", group: buildGy(M), anchor: [0.02, 0.4, 0.1] },
    { id: "gradient-gz", group: buildGz(M), anchor: [0.0, 0.38, 0.54] },
    { id: "gradient-shield", group: buildGradientShield(M), anchor: [-0.44, 0.3, 0.3] },
    { id: "shim-system", group: buildShim(M), anchor: [0.4, 0.25, -0.2] },
  ];
}
