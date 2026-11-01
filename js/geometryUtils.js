
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export { THREE };
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const clamp = THREE.MathUtils.clamp;

export function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  parent.add(mesh);
  return mesh;
}

export function addBox(parent, width, height, depth, material, position = [0, 0, 0], radius = 0.03, rotation = [0, 0, 0], segments = 3) {
  const safeRadius = Math.max(0.0001, Math.min(radius, width / 2, height / 2, depth / 2));
  const geometry = new RoundedBoxGeometry(width, height, depth, segments, safeRadius);
  return addMesh(parent, geometry, material, position, rotation);
}

export function addCylinder(parent, radiusTop, radiusBottom, height, material, position = [0, 0, 0], rotation = [0, 0, 0], segments = 48, openEnded = false) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, openEnded);
  return addMesh(parent, geometry, material, position, rotation);
}

export function addTorus(parent, radius, tube, material, position = [0, 0, 0], rotation = [0, 0, 0], arc = TAU, radialSegments = 12, tubularSegments = 64) {
  const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
  return addMesh(parent, geometry, material, position, rotation);
}

export function addRing(parent, innerRadius, outerRadius, material, position = [0, 0, 0], rotation = [0, 0, 0], segments = 96) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments, 1);
  return addMesh(parent, geometry, material, position, rotation);
}

export function addDisc(parent, radius, material, position = [0, 0, 0], rotation = [0, 0, 0], segments = 64) {
  return addMesh(parent, new THREE.CircleGeometry(radius, segments), material, position, rotation);
}

export function addTube(parent, points, radius, material, tubularSegments = 96, radialSegments = 8, closed = false) {
  const vecs = points.map((p) => (p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2])));
  const curve = new THREE.CatmullRomCurve3(vecs, closed, "centripetal", 0.3);
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
  return addMesh(parent, geometry, material);
}

export function addCurve(parent, curve, material, tubularSegments = 48, radialSegments = 6) {
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, 0.005, radialSegments, false);
  return addMesh(parent, geometry, material);
}

export function addCylinderBetween(parent, start, end, radius, material, segments = 12) {
  const a = new THREE.Vector3(start[0], start[1], start[2]);
  const b = new THREE.Vector3(end[0], end[1], end[2]);
  const direction = b.clone().sub(a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments, 1, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(mesh);
  return mesh;
}

export function addLine(parent, points, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const line = new THREE.Line(geometry, material);
  parent.add(line);
  return line;
}

export function addDashedLine(parent, points, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  parent.add(line);
  return line;
}

export function makeCirclePoints(radius, z = 0, segments = 96, start = 0, end = TAU) {
  const points = [];
  const count = segments + 1;
  for (let index = 0; index < count; index += 1) {
    const angle = start + ((end - start) * index) / segments;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius, z]);
  }
  return points;
}

export function addCoilLoop(parent, radius, z, tubeRadius, material, segments = 96) {
  return addTube(parent, makeCirclePoints(radius, z, segments), tubeRadius, material, segments, 6, true);
}

export function addHelix(parent, radius, zStart, zEnd, turns, tubeRadius, material, segments = 180) {
  const points = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const angle = TAU * turns * t;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius, zStart + (zEnd - zStart) * t]);
  }
  return addTube(parent, points, tubeRadius, material, segments, 5);
}

export function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  shape.closePath();
  return shape;
}

export function circleHole(radius, x = 0, y = 0) {
  const path = new THREE.Path();
  path.absarc(x, y, radius, 0, TAU, true);
  return path;
}

export function roundedRectHole(width, height, radius, x = 0, y = 0) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const path = new THREE.Path();
  path.moveTo(x - hw + r, y - hh);
  path.quadraticCurveTo(x - hw, y - hh, x - hw, y - hh + r);
  path.lineTo(x - hw, y + hh - r);
  path.quadraticCurveTo(x - hw, y + hh, x - hw + r, y + hh);
  path.lineTo(x + hw - r, y + hh);
  path.quadraticCurveTo(x + hw, y + hh, x + hw, y + hh - r);
  path.lineTo(x + hw, y - hh + r);
  path.quadraticCurveTo(x + hw, y - hh, x + hw - r, y - hh);
  path.lineTo(x - hw + r, y - hh);
  path.closePath();
  return path;
}

export function extrudeShape(shape, depth, material, bevel = 0.02, curveSegments = 24) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSegments: 2,
    bevelSize: bevel,
    bevelThickness: bevel,
    steps: 1,
    curveSegments,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

export function addChassis(parent, width, height, depth, cornerRadius, boreRadius, material, bevel = 0.025, curveSegments = 40) {
  const shape = roundedRectShape(width, height, cornerRadius);
  shape.holes.push(circleHole(boreRadius));
  const mesh = extrudeShape(shape, depth, material, bevel, curveSegments);
  parent.add(mesh);
  return mesh;
}

export function addHollowCylinder(parent, innerRadius, outerRadius, length, material, position = [0, 0, 0], options = {}) {
  const group = new THREE.Group();
  group.position.set(position[0], position[1], position[2]);
  const segments = options.segments || 64;
  const sideMat = options.sideMaterial || material;
  const capMat = options.capMaterial || material;
  const outer = addCylinder(group, outerRadius, outerRadius, length, sideMat, [0, 0, 0], [Math.PI / 2, 0, 0], segments, true);
  outer.material = sideMat;
  const inner = addCylinder(group, innerRadius, innerRadius, length, sideMat, [0, 0, 0], [Math.PI / 2, 0, 0], segments, true);
  inner.material = sideMat;
  if (options.caps !== false) {
    addRing(group, innerRadius, outerRadius, capMat, [0, 0, length / 2], [0, 0, 0], segments);
    addRing(group, innerRadius, outerRadius, capMat, [0, 0, -length / 2], [Math.PI, 0, 0], segments);
  }
  parent.add(group);
  return group;
}

export function makeCanvasTexture(width, height, draw, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = options.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = options.wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = options.wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  if (options.repeat) texture.repeat.set(options.repeat[0], options.repeat[1]);
  texture.needsUpdate = true;
  return texture;
}

export function noiseTexture(size = 256, seed = 5) {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return makeCanvasTexture(size, size, (ctx, w, h) => {
    const image = ctx.createImageData(w, h);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = 100 + random() * 100;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, { linear: true, wrap: true, repeat: [6, 6] });
}

export function makeRoundedLabelTexture(text, width = 512, height = 160, options = {}) {
  return makeCanvasTexture(width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (options.background !== false) {
      ctx.fillStyle = options.background || "rgba(8, 15, 20, .8)";
      ctx.beginPath();
      ctx.roundRect(1, 1, w - 2, h - 2, 10);
      ctx.fill();
      ctx.strokeStyle = options.border || "rgba(166, 205, 223, .25)";
      ctx.stroke();
    }
    ctx.fillStyle = options.color || "#dfeef3";
    ctx.font = (options.fontSize || 42) + "px " + (options.font || "Arial, sans-serif");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2);
  });
}

export function makeTextDecal(text, width = 768, height = 128, color = "#dbe9ee", size = 40, align = "center") {
  return makeCanvasTexture(width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = "600 " + size + "px 'Helvetica Neue', Arial, sans-serif";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, align === "center" ? w / 2 : 24, h / 2);
  });
}

export function addTextPlane(parent, texture, width, height, position, rotation = [0, 0, 0], opacity = 1) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const mesh = addMesh(parent, new THREE.PlaneGeometry(width, height), material, position, rotation);
  return mesh;
}

export function createSectionRing(parent, inner, outer, z, material, segments = 96) {
  return addRing(parent, inner, outer, material, [0, 0, z], [0, 0, 0], segments);
}

export function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat) => {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
    }
  });
}
