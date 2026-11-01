
import * as THREE from "three";
import {
  addBox, addCylinder, addTorus, addRing, addHollowCylinder, addCoilLoop,
  addTube, addCylinderBetween, addMesh, addTextPlane, makeTextDecal,
} from "../geometryUtils.js";

function buildOVV(M) {
  const group = new THREE.Group();
  addHollowCylinder(group, 0.785, 0.86, 1.62, M.ovv, [0, 0, 0], { segments: 96 });
  for (const sign of [-1, 1]) {
    addRing(group, 0.4, 0.86, M.ovv, [0, 0, sign * 0.81], [0, 0, 0], 96);
    addRing(group, 0.4, 0.70, M.inset, [0, 0, sign * 0.816], [0, 0, 0], 96);
    addTorus(group, 0.862, 0.021, M.trim, [0, 0, sign * 0.79], [0, 0, 0], Math.PI * 2, 8, 96);
    addTorus(group, 0.78, 0.012, M.darkSteel, [0, 0, sign * 0.70], [0, 0, 0], Math.PI * 2, 8, 96);
  }

  // Room-temperature bore tube and end flanges
  addHollowCylinder(group, 0.365, 0.405, 2.04, M.steel, [0, 0, 0], { segments: 96, caps: false });
  for (const sign of [-1, 1]) {
    addRing(group, 0.365, 0.405, M.boreLiner, [0, 0, sign * 1.021], [0, 0, 0], 96);
  }

  // Vacuum pumping port, relief port and service bosses
  addCylinder(group, 0.055, 0.055, 0.14, M.steel, [0.34, 0.89, -0.48], [0, 0, 0], 32);
  addCylinder(group, 0.08, 0.08, 0.035, M.darkSteel, [0.34, 0.97, -0.48], [0, 0, 0], 32);
  addCylinder(group, 0.035, 0.035, 0.19, M.copper, [-0.42, 0.9, -0.35], [0, 0, 0], 24);
  addCylinder(group, 0.075, 0.075, 0.04, M.trim, [-0.42, 1.0, -0.35], [0, 0, 0], 24);
  addBox(group, 0.36, 0.13, 0.42, M.darkSteel, [0, 0.91, 0.28], 0.035);
  for (const sign of [-1, 1]) {
    addBox(group, 0.24, 0.46, 0.12, M.steel, [sign * 0.68, -0.18, 0.79], 0.035);
  }

  // Port labels and inspection plate
  const plate = makeTextDecal("OVV / VACUUM BOUNDARY", 640, 100, "rgba(203,225,235,.6)", 26, "left");
  addTextPlane(group, plate, 0.64, 0.1, [0.14, 1.018, 0.28], [-Math.PI / 2, 0, 0], 0.7);
  return group;
}

function buildThermalShield(M) {
  const group = new THREE.Group();
  addHollowCylinder(group, 0.705, 0.742, 1.48, M.radiationShield, [0, 0, 0], { segments: 80, caps: false });
  for (const sign of [-1, 1]) {
    addRing(group, 0.43, 0.742, M.radiationShield, [0, 0, sign * 0.74], [0, 0, 0], 80);
    addTorus(group, 0.745, 0.012, M.trim, [0, 0, sign * 0.68], [0, 0, 0], Math.PI * 2, 8, 80);
  }
  for (const [radius, offset] of [[0.755, -0.1], [0.766, 0.06], [0.777, 0.14]]) {
    addHollowCylinder(group, radius, radius + 0.003, 1.32 + offset, M.mli, [0, 0, 0], { segments: 72, caps: false });
  }
  // Seams / support bands
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    addBox(group, 0.045, 0.055, 1.32, M.trim, [Math.cos(angle) * 0.79, Math.sin(angle) * 0.79, 0], 0.012, [0, 0, angle]);
  }
  addBox(group, 0.16, 0.08, 0.3, M.darkSteel, [0.56, 0.54, 0.58], 0.02);
  return group;
}

function buildHeliumVessel(M) {
  const group = new THREE.Group();
  addHollowCylinder(group, 0.555, 0.618, 1.24, M.heliumVessel, [0, 0, 0], { segments: 80, caps: false });
  for (const sign of [-1, 1]) {
    addRing(group, 0.39, 0.618, M.heliumVessel, [0, 0, sign * 0.62], [0, 0, 0], 80);
    addTorus(group, 0.62, 0.025, M.trim, [0, 0, sign * 0.58], [0, 0, 0], Math.PI * 2, 8, 80);
    addTorus(group, 0.565, 0.015, M.cryoBlue, [0, 0, sign * 0.54], [0, 0, 0], Math.PI * 2, 8, 80);
  }
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10;
    addBox(group, 0.035, 0.05, 1.06, M.trim, [Math.cos(angle) * 0.625, Math.sin(angle) * 0.625, 0], 0.01, [0, 0, angle]);
  }
  // Cryogen fill and gas-return necks
  addCylinder(group, 0.075, 0.075, 0.26, M.cryoBlue, [0.18, 0.65, -0.28], [0, 0, 0], 24);
  addCylinder(group, 0.055, 0.055, 0.31, M.steel, [-0.18, 0.66, 0.26], [0, 0, 0], 24);
  addTorus(group, 0.082, 0.009, M.coldCopper, [0.18, 0.78, -0.28], [Math.PI / 2, 0, 0]);
  addBox(group, 0.24, 0.13, 0.14, M.steel, [0.18, 0.7, -0.28], 0.03);
  const plate = makeTextDecal("4 K COLD MASS", 512, 90, "rgba(137,220,248,.65)", 24, "center");
  addTextPlane(group, plate, 0.46, 0.08, [0, 0.085, 0.655], [0, 0, 0], 0.8);
  return group;
}

function buildMainCoils(M) {
  const group = new THREE.Group();
  addHollowCylinder(group, 0.505, 0.548, 1.18, M.darkSteel, [0, 0, 0], { segments: 80, caps: false });
  const packs = [-0.46, -0.3, -0.13, 0.13, 0.3, 0.46];
  packs.forEach((z, packIndex) => {
    for (let turn = 0; turn < 5; turn += 1) {
      const zOffset = z + (turn - 2) * 0.011;
      addCoilLoop(group, 0.505 + (turn % 2) * 0.004, zOffset, 0.0065, turn === 2 ? M.superconductorSecondary : M.superconductor, 96);
    }
    addTorus(group, 0.515, 0.019, M.trim, [0, 0, z], [0, 0, 0], Math.PI * 2, 8, 64);
    const leadAngle = packIndex % 2 === 0 ? 0.18 : -0.18;
    addBox(group, 0.035, 0.11, 0.09, M.copper, [Math.cos(leadAngle) * 0.56, Math.sin(leadAngle) * 0.56, z], 0.01);
  });
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    addBox(group, 0.06, 0.035, 1.1, M.trim, [Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0], 0.012, [0, 0, angle]);
  }
  // Current leads toward the service turret
  addCylinderBetween(group, [0.08, 0.55, -0.22], [0.08, 0.82, -0.22], 0.011, M.copper, 12);
  addCylinderBetween(group, [-0.08, 0.55, -0.22], [-0.08, 0.82, -0.22], 0.011, M.copper, 12);
  return group;
}

function buildShieldCoils(M) {
  const group = new THREE.Group();
  const packs = [-0.58, -0.46, 0.46, 0.58];
  packs.forEach((z) => {
    for (let turn = 0; turn < 5; turn += 1) {
      addCoilLoop(group, 0.705, z + (turn - 2) * 0.013, 0.006, M.superconductorSecondary, 96);
    }
    addTorus(group, 0.714, 0.011, M.trim, [0, 0, z], [0, 0, 0], Math.PI * 2, 8, 72);
  });
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    addBox(group, 0.022, 0.045, 1.12, M.darkSteel, [Math.cos(angle) * 0.716, Math.sin(angle) * 0.716, 0], 0.008, [0, 0, angle]);
  }
  addCylinderBetween(group, [0.36, 0.63, 0.02], [0.22, 0.88, -0.06], 0.014, M.copper, 10);
  addCylinderBetween(group, [-0.36, 0.63, 0.02], [-0.22, 0.88, -0.06], 0.014, M.copper, 10);
  return group;
}

function buildSuspension(M) {
  const group = new THREE.Group();
  const positions = [
    [0.58, 0.53, -0.52], [-0.58, 0.53, -0.52], [0.58, -0.53, -0.52], [-0.58, -0.53, -0.52],
    [0.58, 0.53, 0.52], [-0.58, 0.53, 0.52], [0.58, -0.53, 0.52], [-0.58, -0.53, 0.52],
  ];
  positions.forEach(([x, y, z]) => {
    const outer = new THREE.Vector3(x, y, z);
    const inner = outer.clone().multiplyScalar(0.78);
    addCylinderBetween(group, outer.toArray(), inner.toArray(), 0.017, M.steel, 12);
    addCylinder(group, 0.04, 0.04, 0.035, M.trim, inner.toArray(), [0, 0, 0], 16);
    addCylinder(group, 0.045, 0.045, 0.018, M.darkSteel, outer.toArray(), [0, 0, 0], 16);
  });
  // End hoops / low-conductance support bands
  for (const z of [-0.58, 0.58]) {
    addTorus(group, 0.73, 0.013, M.trim, [0, 0, z], [0, 0, 0], Math.PI * 2, 8, 80);
  }
  return group;
}

function buildCryoService(M) {
  const group = new THREE.Group();
  // Service turret / top plate
  addBox(group, 0.48, 0.19, 0.44, M.coverDark, [0.18, 1.0, -0.2], 0.055);
  addBox(group, 0.36, 0.07, 0.34, M.darkSteel, [0.18, 1.12, -0.2], 0.03);
  addCylinder(group, 0.09, 0.09, 0.06, M.trim, [0.3, 1.18, -0.29], [0, 0, 0], 24);
  addCylinder(group, 0.05, 0.05, 0.08, M.copper, [0.3, 1.23, -0.29], [0, 0, 0], 20);

  // Two-stage cold head
  addCylinder(group, 0.21, 0.21, 0.07, M.trim, [0.3, 1.08, -0.29], [0, 0, 0], 32);
  addCylinder(group, 0.145, 0.145, 0.24, M.coldCopper, [0.3, 1.22, -0.29], [0, 0, 0], 32);
  addTorus(group, 0.155, 0.018, M.trim, [0.3, 1.34, -0.29], [Math.PI / 2, 0, 0]);
  addCylinder(group, 0.092, 0.092, 0.22, M.coldCopper, [0.3, 1.45, -0.29], [0, 0, 0], 24);
  addBox(group, 0.25, 0.2, 0.23, M.coverDark, [0.3, 1.58, -0.29], 0.04);
  addCylinder(group, 0.07, 0.07, 0.1, M.inset, [0.3, 1.7, -0.29], [0, 0, 0], 24);
  for (let i = 0; i < 7; i += 1) {
    addBox(group, 0.28, 0.006, 0.02, M.darkSteel, [0.3, 1.54 + i * 0.018, -0.405], 0.002);
  }
  // Flexible compressor lines
  addTube(group, [
    [0.45, 1.49, -0.29], [0.57, 1.42, -0.24], [0.64, 1.1, -0.22], [0.55, 0.83, -0.32],
  ], 0.026, M.cable, 32, 6);
  addTube(group, [
    [0.42, 1.35, -0.25], [0.58, 1.2, -0.15], [0.63, 0.94, -0.12], [0.55, 0.8, -0.3],
  ], 0.021, M.cable, 32, 6);

  // Quench vent: a clearly separate emergency path, not a normal scan exhaust
  addCylinder(group, 0.065, 0.075, 0.78, M.steel, [-0.18, 1.43, -0.3], [0, 0, 0], 24);
  addTube(group, [
    [-0.18, 1.82, -0.3], [-0.18, 2.05, -0.3], [-0.02, 2.23, -0.5], [0.3, 2.32, -0.72],
  ], 0.072, M.steel, 28, 10);
  addCylinder(group, 0.1, 0.12, 0.14, M.warningYellow, [0.3, 2.36, -0.75], [0, 0, 0], 24);
  addCylinder(group, 0.13, 0.13, 0.04, M.warningRed, [0.3, 2.13, -0.73], [0, Math.PI / 2, Math.PI / 2], 24);
  addTorus(group, 0.078, 0.012, M.warningYellow, [0.3, 2.3, -0.72], [Math.PI / 2, 0, 0]);
  const ventLabel = makeTextDecal("QUENCH VENT / OUTDOOR DISCHARGE", 1024, 100, "rgba(232,188,101,.78)", 25, "left");
  addTextPlane(group, ventLabel, 0.68, 0.066, [0.03, 1.97, -0.285], [0, 0, 0], 0.9);
  const normalLabel = makeTextDecal("NORMAL OPERATION: SEALED / RECONDENSING", 1024, 90, "rgba(177,207,219,.6)", 20, "left");
  addTextPlane(group, normalLabel, 0.74, 0.065, [0.03, 0.82, -0.26], [0, 0, 0], 0.8);

  // Cold-head status/service light
  addBox(group, 0.03, 0.03, 0.012, M.screenGlow, [0.29, 1.56, -0.17], 0.005);
  return group;
}

export function buildMagnetSystems(M) {
  return [
    { id: "ovv", group: buildOVV(M), anchor: [0, 0.87, 0] },
    { id: "thermal-shield", group: buildThermalShield(M), anchor: [0.68, 0.34, 0.18] },
    { id: "helium-vessel", group: buildHeliumVessel(M), anchor: [0.55, 0.25, 0.18] },
    { id: "main-coils", group: buildMainCoils(M), anchor: [0, 0.5, 0.26] },
    { id: "shield-coils", group: buildShieldCoils(M), anchor: [0.64, 0.3, 0.28] },
    { id: "suspension", group: buildSuspension(M), anchor: [-0.55, 0.5, -0.48] },
    { id: "cryo-service", group: buildCryoService(M), anchor: [0.3, 1.45, -0.3] },
  ];
}
