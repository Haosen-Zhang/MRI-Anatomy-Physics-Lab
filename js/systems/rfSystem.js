
import * as THREE from "three";
import {
  addBox, addCylinder, addTorus, addRing, addHollowCylinder, addTube, addCoilLoop, TAU,
} from "../geometryUtils.js";

function buildBodyCoil(M) {
  const group = new THREE.Group();
  const radius = 0.317;
  const length = 1.02;
  const rungs = 16;

  for (let i = 0; i < rungs; i += 1) {
    const angle = (TAU * i) / rungs;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const rung = addCylinder(group, 0.0065, 0.0065, length, M.rfBody, [x, y, 0], [Math.PI / 2, 0, 0], 12);
    rung.rotation.z = angle;
    // capacitor / tuning element near each end
    for (const sign of [-1, 1]) {
      addBox(group, 0.03, 0.016, 0.052, i % 2 === 0 ? M.rfCapacitor : M.steel, [x * 0.988, y * 0.988, sign * 0.454], 0.006, [0, 0, angle + Math.PI / 2]);
    }
  }
  for (const sign of [-1, 1]) {
    addTorus(group, radius, 0.009, M.rfBody, [0, 0, sign * length / 2], [0, 0, 0], TAU, 8, 128);
    addTorus(group, radius - 0.042, 0.0045, M.rfCapacitor, [0, 0, sign * (length / 2 - 0.07)], [0, 0, 0], TAU, 6, 96);
    for (let i = 0; i < 4; i += 1) {
      const angle = (TAU * i) / 4 + Math.PI / 4;
      addBox(group, 0.045, 0.02, 0.025, M.steel, [Math.cos(angle) * radius, Math.sin(angle) * radius, sign * length / 2], 0.005, [0, 0, angle + Math.PI / 2]);
    }
  }
  // quadrature feed points and coax leads
  for (const sign of [-1, 1]) {
    addBox(group, 0.05, 0.028, 0.05, M.copper, [sign * 0.2, -0.245, 0.49], 0.01);
    addCylinder(group, 0.014, 0.014, 0.09, M.copper, [sign * 0.2, -0.29, 0.54], [Math.PI / 2, 0, 0], 16);
    addTube(group, [
      [sign * 0.2, -0.3, 0.55], [sign * 0.28, -0.34, 0.66], [sign * 0.4, -0.38, 0.72], [sign * 0.46, -0.44, 0.78],
    ], 0.012, M.cable, 30, 6);
  }
  // non-conductive longitudinal support rails
  for (let i = 0; i < 8; i += 1) {
    const angle = (TAU * i) / 8;
    addBox(group, 0.012, 0.014, 0.98, M.electronicsDark, [Math.cos(angle) * 0.327, Math.sin(angle) * 0.327, 0], 0.003, [0, 0, angle]);
  }
  return group;
}

function buildRFShield(M) {
  const group = new THREE.Group();
  const radius = 0.352;
  const length = 1.03;
  // Segmented shield strips rather than a single continuous cosmetic tube.
  const strips = 24;
  for (let i = 0; i < strips; i += 1) {
    const angle = (TAU * i) / strips;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    addBox(group, 0.008, 0.016, length, M.rfShield, [x, y, 0], 0.003, [0, 0, angle]);
    for (const sign of [-1, 1]) {
      addBox(group, 0.014, 0.025, 0.012, M.steel, [x, y, sign * length * 0.36], 0.003, [0, 0, angle]);
    }
  }
  for (const sign of [-1, 1]) {
    addTorus(group, radius, 0.006, M.rfShield, [0, 0, sign * length / 2], [0, 0, 0], TAU, 6, 96);
  }
  // deliberate seam / service discontinuity
  addBox(group, 0.028, 0.02, 0.86, M.darkSteel, [0.0, radius + 0.015, 0.0], 0.005);
  return group;
}

function loopPath(phi, zCenter, radius, axial, circum) {
  const points = [];
  const segments = 40;
  for (let i = 0; i < segments; i += 1) {
    const u = (TAU * i) / segments;
    const dz = Math.cos(u) * axial;
    const dt = Math.sin(u) * circum;
    const x = Math.cos(phi) * radius - Math.sin(phi) * dt;
    const y = Math.sin(phi) * radius + Math.cos(phi) * dt;
    points.push([x, y, zCenter + dz]);
  }
  return points;
}

function buildHeadCoil(M) {
  const group = new THREE.Group();
  const supportRadius = 0.172;
  const axialHalf = 0.21;
  // open close-fitting support shell
  addHollowCylinder(group, 0.158, 0.181, 0.43, M.rfReceiveShell, [0, 0, -0.01], { segments: 64, caps: false });
  addTorus(group, 0.18, 0.012, M.rfReceive, [0, 0, -0.225], [0, 0, 0], TAU, 8, 64);
  addTorus(group, 0.17, 0.008, M.electronicsDark, [0, 0, 0.205], [0, 0, 0], TAU, 6, 64);
  addBox(group, 0.43, 0.045, 0.11, M.electronicsDark, [0, -0.165, 0.08], 0.025);
  addBox(group, 0.23, 0.035, 0.08, M.steel, [0, -0.18, 0.12], 0.02);

  const loops = [];
  const rowData = [
    { z: 0.085, radius: 0.178, axial: 0.088, circum: 0.075, offset: 0 },
    { z: -0.09, radius: 0.176, axial: 0.082, circum: 0.071, offset: Math.PI / 4 },
  ];
  let channel = 1;
  rowData.forEach((row) => {
    for (let i = 0; i < 4; i += 1) {
      const phi = row.offset + (TAU * i) / 4;
      const points = loopPath(phi, row.z, row.radius, row.axial, row.circum);
      const tube = addTube(group, points, 0.0046, M.rfReceive, 96, 6, true);
      tube.userData.channel = channel;
      tube.userData.baseColor = 0x4fd9b9;
      loops.push(tube);
      // small tuning/preamp pad near each element
      addBox(group, 0.028, 0.022, 0.045, M.electronicsDark, [
        Math.cos(phi) * (supportRadius - 0.005),
        Math.sin(phi) * (supportRadius - 0.005),
        row.z + 0.01,
      ], 0.006, [0, 0, phi]);
      addBox(group, 0.006, 0.006, 0.016, M.screenGlow, [
        Math.cos(phi) * (supportRadius + 0.014),
        Math.sin(phi) * (supportRadius + 0.014),
        row.z + 0.012,
      ], 0.002, [0, 0, phi]);
      channel += 1;
    }
  });
  // preamp / combiner box at the back of the array
  addBox(group, 0.24, 0.09, 0.13, M.electronicsDark, [0, -0.08, -0.32], 0.025);
  addBox(group, 0.17, 0.035, 0.08, M.electronicsFace, [0, -0.06, -0.39], 0.015);
  for (let i = 0; i < 4; i += 1) {
    addBox(group, 0.012, 0.012, 0.012, M.screenGlow, [-0.05 + i * 0.033, -0.055, -0.433], 0.003);
  }
  addTube(group, [
    [0.18, -0.16, -0.2], [0.27, -0.22, -0.05], [0.38, -0.25, 0.15], [0.46, -0.3, 0.3],
  ], 0.012, M.cable, 36, 6);
  // interior patient-position marker (not a patient model)
  const marker = new THREE.Group();
  addRing(marker, 0.032, 0.04, M.screenGlow, [0, 0, 0.205], [0, 0, 0], 32);
  marker.rotation.y = 0;
  group.add(marker);
  group.userData.channelLoops = loops;
  return group;
}

export function buildRFSystems(M) {
  return [
    { id: "body-rf-coil", group: buildBodyCoil(M), anchor: [0.27, 0.2, 0.34] },
    { id: "rf-shield", group: buildRFShield(M), anchor: [0.33, -0.2, 0.28] },
    { id: "head-coil", group: buildHeadCoil(M), anchor: [0.18, 0.12, 0.08] },
  ];
}
