
import * as THREE from "three";
import {
  addBox, addCylinder, addTorus, addTube, addDashedLine, addTextPlane,
  makeTextDecal, TAU,
} from "../geometryUtils.js";

function dashedLine(parent, points, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  parent.add(line);
  return line;
}

function buildRFRoom(M) {
  const group = new THREE.Group();
  const y0 = -1.135;
  const y1 = 2.48;
  const xMin = -1.95;
  const xMax = 1.62;
  const zMin = -2.15;
  const zMax = 3.3;
  const edgeMat = M.roomLineStrong;

  // Low-contrast scan-room envelope: line-work only, so it cannot be mistaken for a solid wall.
  const corners = [
    [xMin, y0, zMin], [xMax, y0, zMin], [xMax, y0, zMax], [xMin, y0, zMax],
  ];
  for (let i = 0; i < 4; i += 1) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    dashedLine(group, [a, b], edgeMat);
    dashedLine(group, [[a[0], y1, a[2]], [b[0], y1, b[2]]], edgeMat);
    dashedLine(group, [a, [a[0], y1, a[2]]], edgeMat);
  }
  // Mid-height girth rails
  for (const y of [y0 + 0.8, y0 + 1.6]) {
    for (let i = 0; i < 4; i += 1) {
      const a = corners[i];
      const b = corners[(i + 1) % 4];
      dashedLine(group, [[a[0], y, a[2]], [b[0], y, b[2]]], M.roomLine);
    }
  }

  // Shielded door frame, kept on the far side wall so it does not occlude the patient table.
  const doorX = xMin;
  const doorZ0 = 0.82;
  const doorZ1 = 1.54;
  addBox(group, 0.09, 1.9, 0.08, M.trim, [doorX, -0.2, doorZ0], 0.015);
  addBox(group, 0.09, 1.9, 0.08, M.trim, [doorX, -0.2, doorZ1], 0.015);
  addBox(group, 0.09, 0.08, doorZ1 - doorZ0, M.trim, [doorX, 0.7, (doorZ0 + doorZ1) / 2], 0.015);
  for (let i = 0; i < 11; i += 1) {
    addBox(group, 0.015, 1.75, 0.008, M.roomLineStrong, [doorX - 0.035, -0.2, doorZ0 + 0.04 + i * 0.058], 0.002);
    addBox(group, 0.015, 0.012, doorZ1 - doorZ0 - 0.06, M.roomLineStrong, [doorX - 0.035, -1.04 + i * 0.15, (doorZ0 + doorZ1) / 2], 0.002);
  }
  addBox(group, 0.025, 0.2, 0.08, M.warningYellow, [doorX - 0.06, 0.41, (doorZ0 + doorZ1) / 2], 0.01);
  addBox(group, 0.026, 0.09, 0.025, M.darkSteel, [doorX - 0.075, -0.74, doorZ0 + 0.02], 0.006);

  // RF penetration panel / waveguide. This is outside the scan-room envelope, near equipment.
  addBox(group, 0.045, 0.7, 0.55, M.electronicsPaint, [xMax + 0.025, -0.24, 0.32], 0.035);
  addBox(group, 0.06, 0.56, 0.42, M.electronicsDark, [xMax + 0.06, -0.24, 0.32], 0.025);
  for (let i = 0; i < 4; i += 1) {
    addCylinder(group, 0.022, 0.022, 0.12, M.steel, [xMax + 0.1, 0.06 - i * 0.12, 0.14 + (i % 2) * 0.31], [0, 0, Math.PI / 2], 18);
    addBox(group, 0.03, 0.04, 0.04, M.cableSignal, [xMax + 0.14, 0.06 - i * 0.12, 0.14 + (i % 2) * 0.31], 0.008);
  }
  addBox(group, 0.24, 0.024, 0.22, M.electronicsFace, [xMax + 0.04, -0.38, 0.27], 0.01);
  const waveguide = makeTextDecal("RF PENETRATION / WAVEGUIDE", 1024, 100, "rgba(144,183,199,.66)", 26, "center");
  addTextPlane(group, waveguide, 0.64, 0.062, [xMax + 0.08, 0.25, 0.3], [0, Math.PI / 2, 0], 0.85);

  // Floor-room labels
  const scanLabel = makeTextDecal("RF-SHIELDED SCAN ROOM", 1500, 180, "rgba(125,158,172,.36)", 56, "center");
  addTextPlane(group, scanLabel, 2.0, 0.24, [-0.15, y0 + 0.003, 1.45], [-Math.PI / 2, 0, 0], 0.8);
  const equipLabel = makeTextDecal("EQUIPMENT ROOM / OUTSIDE RF CAGE", 1600, 180, "rgba(125,158,172,.3)", 50, "center");
  addTextPlane(group, equipLabel, 2.0, 0.22, [2.9, y0 + 0.003, 2.45], [-Math.PI / 2, 0, 0], 0.8);

  // Illustrative 5 G contour on the floor. This is explicitly schematic.
  const radius = 2.55;
  const contourPoints = [];
  for (let i = 0; i <= 96; i += 1) {
    const a = (TAU * i) / 96;
    contourPoints.push([Math.cos(a) * radius, y0 + 0.004, Math.sin(a) * radius]);
  }
  const contourGeo = new THREE.BufferGeometry().setFromPoints(contourPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const contourLine = new THREE.Line(contourGeo, new THREE.LineDashedMaterial({
    color: 0xd4a451,
    transparent: true,
    opacity: 0.3,
    dashSize: 0.1,
    gapSize: 0.12,
  }));
  contourLine.computeLineDistances();
  group.add(contourLine);
  const fiveG = makeTextDecal("5 G CONTOUR · SCHEMATIC — MEASURED MAP REQUIRED", 1800, 100, "rgba(226,181,99,.45)", 24, "center");
  addTextPlane(group, fiveG, 2.2, 0.12, [0.0, y0 + 0.006, 2.47], [-Math.PI / 2, 0, 0], 0.8);

  // Small wall status strips
  for (const z of [-1.5, -0.8, 0.74, 1.32]) {
    addBox(group, 0.025, 0.16, 0.08, M.electronicsDark, [xMax + 0.04, 0.95, z], 0.01);
    addBox(group, 0.012, 0.02, 0.02, M.warningYellow, [xMax + 0.055, 1.0, z], 0.004);
  }
  return group;
}

export function buildRoomSystems(M) {
  return [
    { id: "rf-room", group: buildRFRoom(M), anchor: [1.45, 1.0, 0.7], environment: true },
  ];
}
