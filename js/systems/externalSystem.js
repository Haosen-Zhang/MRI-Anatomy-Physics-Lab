
import * as THREE from "three";
import {
  addMesh, addBox, addCylinder, addTorus, addRing, addTube, addChassis,
  addCylinderBetween, addTextPlane, makeTextDecal, makeCanvasTexture, addLine,
} from "../geometryUtils.js";

function housingPart(M) {
  const group = new THREE.Group();
  const W = 2.24;
  const H = 2.08;
  const D = 1.68;
  const bore = 0.375;

  const chassis = addChassis(group, W, H, D, 0.26, bore, M.cover, 0.035, 44);
  chassis.name = "outer-chassis";

  // Structured side shells and service panels
  for (const side of [-1, 1]) {
    addBox(group, 0.055, 1.54, 1.48, M.coverDark, [side * 1.104, 0.03, 0], 0.04);
    addBox(group, 0.06, 0.36, 1.35, M.inset, [side * 1.126, 0.54, -0.02], 0.035);
    for (let i = 0; i < 8; i += 1) {
      addBox(group, 0.012, 0.024, 1.03, M.darkSteel, [side * 1.157, 0.44 + i * 0.03, -0.02], 0.005);
    }
    addBox(group, 0.028, 0.52, 0.16, M.trim, [side * 1.14, -0.34, 0.59], 0.015);
    addBox(group, 0.024, 0.31, 0.13, M.trim, [side * 1.142, -0.34, -0.59], 0.012);
    addBox(group, 0.042, 0.12, 0.42, M.inset, [side * 1.135, -0.88, 0.0], 0.03);
    addBox(group, 0.055, 0.018, 0.96, M.trim, [side * 1.15, 0.78, 0], 0.009);
    // panel fasteners
    for (let i = 0; i < 5; i += 1) {
      addCylinder(group, 0.012, 0.012, 0.012, M.darkSteel, [side * 1.162, -0.45 + i * 0.28, 0.53], [0, 0, Math.PI / 2], 12);
    }
  }

  // Top cover, service hatch and subtle engineering seams
  addBox(group, 2.04, 0.075, 1.45, M.coverDark, [0, 1.052, 0.0], 0.08);
  addBox(group, 1.24, 0.042, 0.73, M.inset, [-0.12, 1.111, -0.22], 0.06);
  addBox(group, 0.95, 0.022, 0.06, M.trim, [-0.12, 1.144, -0.22], 0.009);
  addBox(group, 1.88, 0.018, 0.024, M.trim, [0, 1.09, 0.62], 0.007);
  addTorus(group, 0.33, 0.016, M.trim, [0.68, 1.12, -0.47], [Math.PI / 2, 0, 0]);

  // Large front and rear gantry rings
  for (const z of [D / 2 + 0.012, -D / 2 - 0.012]) {
    addTorus(group, 0.44, 0.045, M.trim, [0, 0, z], [0, 0, 0]);
    addRing(group, bore, 0.39, M.darkSteel, [0, 0, z + (z > 0 ? 0.012 : -0.012)], [0, 0, 0], 96);
    addTorus(group, 0.36, 0.021, M.screenGlow, [0, 0, z + (z > 0 ? 0.08 : -0.08)], [0, 0, 0], Math.PI * 2, 8, 96);
  }

  // Patient bore liner and a subtle inner light ring
  addCylinder(group, 0.36, 0.36, 2.08, M.boreLiner, [0, 0, 0], [Math.PI / 2, 0, 0], 96, true);
  addTorus(group, 0.368, 0.008, M.trim, [0, 0, 1.04], [0, 0, 0], Math.PI * 2, 8, 96);
  addTorus(group, 0.368, 0.008, M.trim, [0, 0, -1.04], [0, 0, 0], Math.PI * 2, 8, 96);
  addRing(group, 0.47, 0.56, M.coverDark, [0, 0, D / 2 + 0.086], [0, 0, 0], 96);

  // Discrete vents and access details
  for (const x of [-0.79, 0.79]) {
    addBox(group, 0.28, 0.12, 0.035, M.inset, [x, -0.87, D / 2 + 0.043], 0.025);
    for (let i = 0; i < 4; i += 1) {
      addBox(group, 0.22, 0.009, 0.012, M.darkSteel, [x, -0.9 + i * 0.023, D / 2 + 0.065], 0.004);
    }
  }

  // Emergency stop and front status placard
  addCylinder(group, 0.055, 0.055, 0.028, M.warningRed, [0.87, -0.77, D / 2 + 0.045], [Math.PI / 2, 0, 0], 32);
  addTorus(group, 0.066, 0.008, M.darkSteel, [0.87, -0.77, D / 2 + 0.062], [Math.PI / 2, 0, 0]);
  const label = makeTextDecal("MR 3.0 T  ·  70 cm BORE", 1024, 128, "rgba(222,235,240,.8)", 34, "center");
  addTextPlane(group, label, 0.88, 0.11, [0, 0.76, D / 2 + 0.048], [0, 0, 0], 0.8);
  const sideLabel = makeTextDecal("CRYOGENIC SERVICE  /  NO FERROMAGNETIC TOOLS", 1536, 128, "rgba(217,232,237,.56)", 30, "center");
  addTextPlane(group, sideLabel, 1.05, 0.088, [1.163, 0.67, 0], [0, Math.PI / 2, 0], 0.75);

  // Feet / plinth
  addBox(group, 2.22, 0.11, 1.6, M.coverDark, [0, -1.06, 0], 0.045);
  for (const x of [-0.92, 0.92]) {
    for (const z of [-0.56, 0.56]) {
      addBox(group, 0.25, 0.075, 0.3, M.darkSteel, [x, -1.13, z], 0.035);
    }
  }

  return group;
}

function patientTablePart(M) {
  const group = new THREE.Group();
  const pallet = new THREE.Group();
  group.add(pallet);
  group.userData.tablePallet = pallet;

  // Fixed base, longitudinal rails and drive
  addBox(group, 0.82, 0.32, 1.18, M.electronicsPaint, [0, -0.92, 1.35], 0.08);
  addBox(group, 0.65, 0.11, 1.02, M.electronicsDark, [0, -0.75, 1.35], 0.04);
  for (const x of [-0.34, 0.34]) {
    addBox(group, 0.07, 0.055, 2.72, M.steel, [x, -0.56, 1.22], 0.022);
    addBox(group, 0.025, 0.085, 2.32, M.darkSteel, [x * 0.9, -0.61, 1.22], 0.012);
  }
  addBox(group, 0.84, 0.18, 0.76, M.coverDark, [0, -0.8, 2.05], 0.045);
  for (let i = 0; i < 5; i += 1) {
    addBox(group, 0.64, 0.012, 0.03, M.inset, [0, -0.83, 1.74 + i * 0.1], 0.004);
  }
  addCylinder(group, 0.055, 0.055, 0.028, M.warningRed, [0.29, -0.77, 2.18], [Math.PI / 2, 0, 0], 24);
  addBox(group, 0.18, 0.16, 0.32, M.electronicsDark, [-0.38, -0.8, 1.62], 0.03);
  addBox(group, 0.06, 0.05, 0.2, M.screenGlow, [-0.472, -0.77, 1.62], 0.01);

  // Moving pallet / patient surface. Local origin is the isocentre plane.
  const deckY = -0.32;
  addBox(pallet, 0.64, 0.065, 2.9, M.tableTop, [0, deckY, 0.97], 0.035);
  addBox(pallet, 0.58, 0.045, 2.76, M.tablePad, [0, deckY + 0.047, 0.97], 0.04);
  for (let i = 0; i < 6; i += 1) {
    addBox(pallet, 0.51, 0.012, 0.06, M.darkSteel, [0, deckY + 0.074, 0.12 + i * 0.42], 0.008);
  }
  // Head cradle and shoulder pad
  addBox(pallet, 0.42, 0.045, 0.38, M.tablePad, [0, deckY + 0.084, -0.03], 0.045);
  addBox(pallet, 0.76, 0.055, 0.33, M.tableTop, [0, deckY - 0.02, 0.55], 0.03);
  // Side rails
  for (const x of [-0.34, 0.34]) {
    addBox(pallet, 0.028, 0.075, 2.38, M.darkSteel, [x, deckY + 0.015, 0.93], 0.012);
  }
  // Coil / patient cable connector on the right side
  addBox(pallet, 0.1, 0.08, 0.18, M.darkSteel, [0.38, deckY + 0.06, 0.27], 0.025);
  for (const y of [-0.02, 0.02]) {
    addCylinder(pallet, 0.013, 0.013, 0.05, M.copper, [0.43, deckY + y + 0.06, 0.27], [0, 0, Math.PI / 2], 16);
  }
  // Alignment laser line at isocentre plane
  const laserPoints = [new THREE.Vector3(-0.42, deckY + 0.08, -0.01), new THREE.Vector3(0.42, deckY + 0.08, -0.01)];
  const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
  const laser = new THREE.Line(laserGeo, new THREE.LineBasicMaterial({ color: 0xff6a5d, transparent: true, opacity: 0.45 }));
  pallet.add(laser);
  addLine(pallet, [[0, deckY + 0.08, -0.01], [0, deckY + 0.2, -0.01]], new THREE.LineBasicMaterial({ color: 0xff6a5d, transparent: true, opacity: 0.3 }));

  return group;
}

export function buildExternalSystems(M) {
  return [
    { id: "housing", group: housingPart(M), anchor: [0, 1.14, 0.85] },
    { id: "patient-table", group: patientTablePart(M), anchor: [0, -0.23, 1.2] },
  ];
}
