
import * as THREE from "three";
import {
  addBox, addCylinder, addTorus, addTube, addTextPlane, addRing,
  makeTextDecal, makeCanvasTexture, TAU,
} from "../geometryUtils.js";
import { makeScreenTexture, makeCabinetLabel } from "../materials.js";

const EQUIPMENT_FLOOR = -1.14;

function screenMaterial(kind) {
  return new THREE.MeshBasicMaterial({
    map: makeScreenTexture(kind, 512, 320),
    toneMapped: false,
    transparent: false,
  });
}

function addCabinet(group, M, z, width, label, screenKind) {
  const h = 1.8;
  const cx = 0;
  const cy = EQUIPMENT_FLOOR + h / 2;
  addBox(group, 0.62, h, width, M.electronicsPaint, [cx, cy, z], 0.035);
  addBox(group, 0.026, h - 0.1, width - 0.05, M.electronicsFace, [0.325, cy, z], 0.008);
  addBox(group, 0.018, 0.18, width - 0.12, M.electronicsDark, [0.35, cy + 0.69, z], 0.01);
  addBox(group, 0.02, 0.22, width - 0.12, M.electronicsDark, [0.35, cy - 0.72, z], 0.01);
  for (let i = 0; i < 10; i += 1) {
    addBox(group, 0.009, 0.008, width - 0.2, M.darkSteel, [0.349, cy - 0.58 + i * 0.028, z], 0.002);
  }
  addBox(group, 0.025, 0.3, 0.025, M.trim, [0.355, cy + 0.34, z - width * 0.32], 0.006);
  addBox(group, 0.025, 0.3, 0.025, M.trim, [0.355, cy + 0.34, z + width * 0.32], 0.006);
  // status LEDs
  for (let i = 0; i < 4; i += 1) {
    const mat = i === 0 ? M.screenGlow : i === 3 ? M.warningRed : M.cryoBlue;
    addBox(group, 0.011, 0.011, 0.011, mat, [0.36, cy + 0.77, z - 0.17 + i * 0.035], 0.003);
  }
  const labelTex = makeCabinetLabel(label, "rgba(177, 204, 217, .78)");
  addTextPlane(group, labelTex, 0.42, 0.078, [0.363, cy + 0.58, z], [0, Math.PI / 2, 0], 0.9);
  if (screenKind) {
    const screen = screenMaterial(screenKind);
    addTextPlane(group, screen.map, 0.3, 0.19, [0.366, cy + 0.17, z], [0, Math.PI / 2, 0], 1);
  }
  // feet
  for (const zz of [z - width / 2 + 0.05, z + width / 2 - 0.05]) {
    addBox(group, 0.1, 0.08, 0.08, M.darkSteel, [0, EQUIPMENT_FLOOR + 0.04, zz], 0.015);
    addBox(group, 0.1, 0.08, 0.08, M.darkSteel, [0.22, EQUIPMENT_FLOOR + 0.04, zz], 0.015);
  }
}

function buildRacks(M) {
  const group = new THREE.Group();
  addCabinet(group, M, -1.28, 0.58, "GPA / Gx-Gy-Gz", "gradient");
  addCabinet(group, M, -0.62, 0.58, "RF POWER / T-R", "rf");
  addCabinet(group, M, 0.04, 0.58, "SPECTROMETER / ADC", "spectrometer");
  addCabinet(group, M, 0.7, 0.58, "COOLING / SERVICES", "chiller");

  // Top cable tray and service conduits
  addBox(group, 0.34, 0.055, 2.62, M.darkSteel, [0.02, EQUIPMENT_FLOOR + 1.9, -0.29], 0.02);
  for (let i = 0; i < 7; i += 1) {
    addBox(group, 0.03, 0.03, 2.4, M.cable, [-0.1, EQUIPMENT_FLOOR + 1.96, -0.29 + (i - 3) * 0.026], 0.006);
  }
  // Cooling chiller unit
  addBox(group, 0.78, 1.12, 0.72, M.electronicsPaint, [-0.17, EQUIPMENT_FLOOR + 0.57, 1.58], 0.05);
  addBox(group, 0.82, 0.06, 0.76, M.darkSteel, [-0.17, EQUIPMENT_FLOOR + 1.14, 1.58], 0.02);
  addCylinder(group, 0.23, 0.23, 0.03, M.electronicsFace, [0.225, EQUIPMENT_FLOOR + 0.67, 1.58], [0, 0, Math.PI / 2], 32);
  for (let i = 0; i < 12; i += 1) {
    const angle = (TAU * i) / 12;
    addBox(group, 0.035, 0.16, 0.035, M.darkSteel, [0.228, EQUIPMENT_FLOOR + 0.67 + Math.sin(angle) * 0.16, 1.58 + Math.cos(angle) * 0.16], 0.008);
  }
  addBox(group, 0.03, 0.04, 0.04, M.screenGlow, [0.235, EQUIPMENT_FLOOR + 0.94, 1.37], 0.008);
  // Chiller hoses to a floor trench / wall
  addTube(group, [
    [-0.48, EQUIPMENT_FLOOR + 0.18, 1.52], [-0.85, EQUIPMENT_FLOOR + 0.16, 1.23], [-1.2, EQUIPMENT_FLOOR + 0.3, 0.84], [-1.52, EQUIPMENT_FLOOR + 0.4, 0.55],
  ], 0.032, M.cable, 36, 7);
  addTube(group, [
    [-0.48, EQUIPMENT_FLOOR + 0.25, 1.62], [-0.9, EQUIPMENT_FLOOR + 0.2, 1.34], [-1.25, EQUIPMENT_FLOOR + 0.34, 0.92], [-1.5, EQUIPMENT_FLOOR + 0.43, 0.62],
  ], 0.021, M.cryoBlue, 36, 6);

  // Signal / power conduits crossing the RF penetration wall
  const cableSpecs = [
    { start: [0.0, EQUIPMENT_FLOOR + 1.45, -0.7], end: [-1.5, EQUIPMENT_FLOOR + 1.1, 0.4], color: "data" },
    { start: [0.0, EQUIPMENT_FLOOR + 1.22, 0.05], end: [-1.52, EQUIPMENT_FLOOR + 0.75, 0.5], color: "data" },
    { start: [0.0, EQUIPMENT_FLOOR + 0.98, 0.7], end: [-1.5, EQUIPMENT_FLOOR + 0.45, 0.7], color: "power" },
    { start: [0.0, EQUIPMENT_FLOOR + 1.67, -0.9], end: [-1.48, EQUIPMENT_FLOOR + 1.52, -0.6], color: "data" },
  ];
  cableSpecs.forEach((cable, index) => {
    const points = [
      cable.start,
      [cable.start[0] - 0.24, cable.start[1] - 0.14, cable.start[2] + 0.08],
      [cable.end[0] + 0.32, cable.end[1] + 0.06, cable.end[2] - 0.08],
      cable.end,
    ];
    addTube(group, points, index < 2 ? 0.018 : 0.025, M.cable, 40, 6);
    if (index < 3) {
      addTube(group, points.map((p) => [p[0], p[1] + 0.005, p[2]]), 0.0035, M.cableSignal, 40, 4);
    }
  });
  // floor cable tray
  addBox(group, 1.5, 0.035, 0.22, M.darkSteel, [-0.7, EQUIPMENT_FLOOR + 0.02, 0.5], 0.02);
  return group;
}

function buildConsole(M) {
  const group = new THREE.Group();
  // Desk
  addBox(group, 1.12, 0.07, 1.23, M.electronicsPaint, [0, EQUIPMENT_FLOOR + 0.8, 0], 0.055);
  for (const x of [-0.43, 0.43]) {
    for (const z of [-0.48, 0.48]) {
      addBox(group, 0.07, 0.72, 0.07, M.darkSteel, [x, EQUIPMENT_FLOOR + 0.42, z], 0.015);
    }
  }
  addBox(group, 0.86, 0.1, 0.5, M.electronicsDark, [0, EQUIPMENT_FLOOR + 0.55, 0.1], 0.03);
  // Monitor stands and two displays
  for (const [z, rot] of [[-0.26, -0.18], [0.29, 0.2]]) {
    addCylinder(group, 0.02, 0.02, 0.24, M.darkSteel, [0.12, EQUIPMENT_FLOOR + 0.95, z], [0, 0, 0], 16);
    addBox(group, 0.18, 0.025, 0.18, M.darkSteel, [0.12, EQUIPMENT_FLOOR + 1.06, z], 0.02);
    addBox(group, 0.035, 0.52, 0.67, M.electronicsDark, [0.08, EQUIPMENT_FLOOR + 1.32, z], 0.04, [0, 0, rot]);
    const screen = screenMaterial("reconstruction");
    addTextPlane(group, screen.map, 0.59, 0.45, [0.061, EQUIPMENT_FLOOR + 1.33, z], [0, Math.PI * 0.5 + rot, 0], 1);
  }
  addBox(group, 0.54, 0.025, 0.19, M.darkSteel, [0.2, EQUIPMENT_FLOOR + 0.85, -0.02], 0.015);
  addBox(group, 0.39, 0.016, 0.14, M.electronicsFace, [0.2, EQUIPMENT_FLOOR + 0.87, -0.02], 0.008);
  for (let i = 0; i < 7; i += 1) {
    addBox(group, 0.26, 0.007, 0.012, M.trim, [0.2, EQUIPMENT_FLOOR + 0.88, -0.06 + i * 0.012], 0.002);
  }
  // Chair
  addBox(group, 0.52, 0.06, 0.52, M.tableTop, [0.55, EQUIPMENT_FLOOR + 0.48, 0.12], 0.07);
  addCylinder(group, 0.025, 0.025, 0.35, M.darkSteel, [0.55, EQUIPMENT_FLOOR + 0.28, 0.12], [0, 0, 0], 16);
  addBox(group, 0.5, 0.66, 0.06, M.electronicsDark, [0.82, EQUIPMENT_FLOOR + 0.83, 0.12], 0.06);
  addBox(group, 0.04, 0.04, 0.05, M.screenGlow, [0.82, EQUIPMENT_FLOOR + 1.13, 0.12], 0.008);
  // small task light / plant-like sterile equipment readout
  addBox(group, 0.2, 0.14, 0.3, M.electronicsDark, [-0.35, EQUIPMENT_FLOOR + 0.95, -0.35], 0.025);
  addBox(group, 0.12, 0.03, 0.2, M.screenGlow, [-0.35, EQUIPMENT_FLOOR + 1.02, -0.35], 0.01);
  return group;
}

export function buildElectronicsSystems(M) {
  return [
    { id: "electronics-racks", group: buildRacks(M), anchor: [0.1, 0.42, 0.3] },
    { id: "operator-console", group: buildConsole(M), anchor: [0.15, 0.45, 0.1] },
  ];
}
