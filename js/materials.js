
import * as THREE from "three";
import { makeCanvasTexture, noiseTexture } from "./geometryUtils.js";

export const PALETTE = {
  bg: "#04080d",
  patient: "#9eb2bf",
  magnet: "#5f9fe8",
  cryo: "#91e4ff",
  gradient: "#f3a04d",
  gradientDeep: "#d37b2f",
  shim: "#e3cf7d",
  rfTx: "#a38bf2",
  rfRx: "#53e3c4",
  electronics: "#aab7c3",
  room: "#6e7f8c",
  warn: "#ffb04d",
  danger: "#ff6b5e",
};

function makeEnvironment(renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#0a121a");
  gradient.addColorStop(0.34, "#102230");
  gradient.addColorStop(0.58, "#071019");
  gradient.addColorStop(1, "#020508");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);

  ctx.globalCompositeOperation = "screen";
  const overhead = ctx.createRadialGradient(470, 38, 4, 470, 38, 330);
  overhead.addColorStop(0, "rgba(236, 251, 255, .95)");
  overhead.addColorStop(0.08, "rgba(155, 212, 232, .5)");
  overhead.addColorStop(0.4, "rgba(48, 100, 125, .13)");
  overhead.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = overhead;
  ctx.fillRect(0, 0, 1024, 320);

  const left = ctx.createRadialGradient(125, 280, 0, 125, 280, 240);
  left.addColorStop(0, "rgba(94, 171, 219, .36)");
  left.addColorStop(0.3, "rgba(38, 88, 121, .11)");
  left.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, 500, 512);

  const right = ctx.createRadialGradient(880, 300, 0, 880, 300, 180);
  right.addColorStop(0, "rgba(243, 164, 87, .26)");
  right.addColorStop(0.35, "rgba(117, 72, 37, .08)");
  right.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = right;
  ctx.fillRect(620, 0, 404, 512);

  // Vertical light panels simulate a clinical MR room, without external imagery.
  for (const [x, width, alpha] of [[162, 9, 0.3], [844, 12, 0.22], [846, 28, 0.08]]) {
    const strip = ctx.createLinearGradient(0, 0, 0, 512);
    strip.addColorStop(0, "rgba(200,240,250,0)");
    strip.addColorStop(0.4, "rgba(200,240,250," + alpha + ")");
    strip.addColorStop(0.8, "rgba(200,240,250,0)");
    ctx.fillStyle = strip;
    ctx.fillRect(x, 0, width, 512);
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(2, 4, 6, .72)";
  ctx.fillRect(0, 350, 1024, 162);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(texture).texture;
  texture.dispose();
  pmrem.dispose();
  return target;
}

export function createMaterials(renderer) {
  const fineNoise = noiseTexture(256, 21);
  const coarseNoise = noiseTexture(256, 43);
  const environment = makeEnvironment(renderer);

  const physical = (config) => new THREE.MeshPhysicalMaterial(config);
  const standard = (config) => new THREE.MeshStandardMaterial(config);

  const materials = {
    environment,
    cover: physical({
      color: 0x687a85,
      metalness: 0.58,
      roughness: 0.37,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
      bumpMap: fineNoise,
      bumpScale: 0.006,
    }),
    coverDark: physical({
      color: 0x303e48,
      metalness: 0.56,
      roughness: 0.42,
      clearcoat: 0.18,
      bumpMap: fineNoise,
      bumpScale: 0.005,
    }),
    inset: physical({
      color: 0x0a1116,
      metalness: 0.38,
      roughness: 0.56,
      clearcoat: 0.12,
    }),
    trim: physical({
      color: 0xa5b1b7,
      metalness: 0.92,
      roughness: 0.25,
      clearcoat: 0.18,
    }),
    steel: standard({
      color: 0x7b878e,
      metalness: 0.88,
      roughness: 0.31,
    }),
    darkSteel: standard({
      color: 0x29343c,
      metalness: 0.78,
      roughness: 0.43,
    }),
    blackMetal: standard({
      color: 0x0a0f12,
      metalness: 0.62,
      roughness: 0.52,
    }),
    boreLiner: physical({
      color: 0xb6c4c9,
      metalness: 0.08,
      roughness: 0.7,
      clearcoat: 0.12,
      side: THREE.DoubleSide,
    }),
    coverGlass: physical({
      color: 0x1a2d3b,
      metalness: 0.25,
      roughness: 0.06,
      transparent: true,
      opacity: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    ovv: physical({
      color: 0x425d70,
      metalness: 0.77,
      roughness: 0.34,
      clearcoat: 0.18,
      bumpMap: fineNoise,
      bumpScale: 0.004,
      side: THREE.DoubleSide,
    }),
    radiationShield: physical({
      color: 0x93aebd,
      metalness: 0.94,
      roughness: 0.28,
      clearcoat: 0.18,
      side: THREE.DoubleSide,
    }),
    mli: physical({
      color: 0xc4c9c1,
      metalness: 0.92,
      roughness: 0.35,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    heliumVessel: physical({
      color: 0x4c88a3,
      metalness: 0.86,
      roughness: 0.27,
      clearcoat: 0.2,
      side: THREE.DoubleSide,
    }),
    superconductor: physical({
      color: 0x4f7eb4,
      metalness: 0.8,
      roughness: 0.28,
      emissive: 0x0b1a2e,
      emissiveIntensity: 0.35,
      clearcoat: 0.3,
    }),
    superconductorSecondary: physical({
      color: 0x6e99c9,
      metalness: 0.84,
      roughness: 0.24,
      emissive: 0x0a192a,
      emissiveIntensity: 0.28,
      clearcoat: 0.25,
    }),
    copper: physical({
      color: 0xa65c38,
      metalness: 0.9,
      roughness: 0.34,
      clearcoat: 0.12,
    }),
    coldCopper: physical({
      color: 0x8d9ba4,
      metalness: 0.88,
      roughness: 0.26,
      clearcoat: 0.2,
    }),
    cryoBlue: physical({
      color: 0x62a7c5,
      metalness: 0.62,
      roughness: 0.32,
      emissive: 0x071923,
      emissiveIntensity: 0.2,
    }),
    cryoTransparent: physical({
      color: 0x6ecdf1,
      metalness: 0.12,
      roughness: 0.1,
      transparent: true,
      opacity: 0.17,
      clearcoat: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    gradientSupport: physical({
      color: 0xb48c5e,
      metalness: 0.36,
      roughness: 0.54,
      clearcoat: 0.2,
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide,
    }),
    gradientResin: physical({
      color: 0x8c6b42,
      metalness: 0.16,
      roughness: 0.43,
      transparent: true,
      opacity: 0.35,
      clearcoat: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    gradientGx: physical({
      color: 0xf08c46,
      metalness: 0.72,
      roughness: 0.3,
      clearcoat: 0.25,
      emissive: 0x211106,
      emissiveIntensity: 0.25,
    }),
    gradientGy: physical({
      color: 0xffc169,
      metalness: 0.72,
      roughness: 0.28,
      clearcoat: 0.25,
      emissive: 0x251b08,
      emissiveIntensity: 0.2,
    }),
    gradientGz: physical({
      color: 0xff9a42,
      metalness: 0.75,
      roughness: 0.27,
      clearcoat: 0.25,
      emissive: 0x241306,
      emissiveIntensity: 0.24,
    }),
    gradientShield: physical({
      color: 0xd0aa7c,
      metalness: 0.66,
      roughness: 0.39,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    }),
    shim: physical({
      color: 0xd9c685,
      metalness: 0.7,
      roughness: 0.38,
      clearcoat: 0.15,
    }),
    shimTray: physical({
      color: 0x8a754d,
      metalness: 0.45,
      roughness: 0.54,
    }),
    rfBody: physical({
      color: 0xa88cf0,
      metalness: 0.7,
      roughness: 0.3,
      clearcoat: 0.28,
      emissive: 0x180b2d,
      emissiveIntensity: 0.26,
    }),
    rfCapacitor: physical({
      color: 0xd9d6ec,
      metalness: 0.3,
      roughness: 0.32,
      clearcoat: 0.5,
    }),
    rfShield: physical({
      color: 0x655aa3,
      metalness: 0.7,
      roughness: 0.34,
      transparent: true,
      opacity: 0.43,
      side: THREE.DoubleSide,
      depthWrite: false,
      emissive: 0x0d0820,
      emissiveIntensity: 0.2,
    }),
    rfReceive: physical({
      color: 0x4fd9b9,
      metalness: 0.66,
      roughness: 0.29,
      clearcoat: 0.3,
      emissive: 0x05231e,
      emissiveIntensity: 0.3,
    }),
    rfReceiveShell: physical({
      color: 0x6adfc7,
      metalness: 0.15,
      roughness: 0.14,
      transparent: true,
      opacity: 0.13,
      clearcoat: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    shimGold: physical({
      color: 0xbeaa68,
      metalness: 0.84,
      roughness: 0.32,
    }),
    electronicsPaint: physical({
      color: 0x3d4a54,
      metalness: 0.52,
      roughness: 0.42,
      clearcoat: 0.18,
      bumpMap: fineNoise,
      bumpScale: 0.004,
    }),
    electronicsDark: physical({
      color: 0x10171c,
      metalness: 0.55,
      roughness: 0.45,
    }),
    electronicsFace: physical({
      color: 0x1c262e,
      metalness: 0.42,
      roughness: 0.38,
      clearcoat: 0.2,
    }),
    screenGlow: new THREE.MeshBasicMaterial({
      color: 0x8ddff4,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      toneMapped: false,
    }),
    cable: physical({
      color: 0x0b1013,
      metalness: 0.12,
      roughness: 0.72,
    }),
    cableSignal: new THREE.MeshBasicMaterial({
      color: 0x73c7dd,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      toneMapped: false,
    }),
    roomLine: new THREE.LineBasicMaterial({
      color: 0x435463,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
    roomLineStrong: new THREE.LineDashedMaterial({
      color: 0x738793,
      transparent: true,
      opacity: 0.42,
      dashSize: 0.08,
      gapSize: 0.06,
    }),
    warningYellow: physical({
      color: 0xd7a33a,
      metalness: 0.2,
      roughness: 0.52,
      emissive: 0x261804,
      emissiveIntensity: 0.2,
    }),
    warningRed: physical({
      color: 0xc95247,
      metalness: 0.2,
      roughness: 0.45,
      emissive: 0x2e0703,
      emissiveIntensity: 0.25,
    }),
    tableTop: physical({
      color: 0x26333a,
      metalness: 0.32,
      roughness: 0.54,
      clearcoat: 0.25,
    }),
    tablePad: physical({
      color: 0x72848e,
      metalness: 0.05,
      roughness: 0.8,
      clearcoat: 0.12,
      bumpMap: coarseNoise,
      bumpScale: 0.01,
    }),
    phantom: physical({
      color: 0xb98f78,
      metalness: 0.03,
      roughness: 0.68,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    warningStripe: new THREE.MeshBasicMaterial({
      color: 0xf0ad4c,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    sectionAir: new THREE.MeshBasicMaterial({
      color: 0x0a1014,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionBore: new THREE.MeshBasicMaterial({
      color: 0xb8c6ca,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionHousing: new THREE.MeshBasicMaterial({
      color: 0x738792,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionOVV: new THREE.MeshBasicMaterial({
      color: 0x57778b,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionThermal: new THREE.MeshBasicMaterial({
      color: 0xa9c1ce,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionHelium: new THREE.MeshBasicMaterial({
      color: 0x7cd0ea,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionGradient: new THREE.MeshBasicMaterial({
      color: 0xdc9145,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionShim: new THREE.MeshBasicMaterial({
      color: 0xd1bd75,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionRF: new THREE.MeshBasicMaterial({
      color: 0x9d87ea,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionReceive: new THREE.MeshBasicMaterial({
      color: 0x52d9ba,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    sectionShield: new THREE.MeshBasicMaterial({
      color: 0x6f62ad,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
  };

  return materials;
}

export function makeScreenTexture(kind = "spectrometer", width = 512, height = 320) {
  return makeCanvasTexture(width, height, (ctx, w, h) => {
    ctx.fillStyle = "#061118";
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(33, 78, 95, .34)");
    g.addColorStop(1, "rgba(2, 9, 13, .22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(132, 194, 209, .16)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#a5e1ef";
    ctx.font = '600 16px "SFMono-Regular", Menlo, monospace';
    ctx.textAlign = "left";
    const titleMap = {
      spectrometer: "SPECTROMETER / SEQUENCE",
      gradient: "GRADIENT AMPLIFIER",
      rf: "RF POWER / T-R SWITCH",
      reconstruction: "RECONSTRUCTION / WORKSPACE",
      chiller: "COOLING / CHILLER",
    };
    ctx.fillText(titleMap[kind] || "MR SYSTEM", 20, 28);
    ctx.fillStyle = "rgba(114, 191, 203, .8)";
    ctx.font = '500 11px "SFMono-Regular", Menlo, monospace';
    if (kind === "reconstruction") {
      const cx = w * 0.62;
      const cy = h * 0.56;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 105);
      grad.addColorStop(0, "rgba(188, 222, 215, .6)");
      grad.addColorStop(0.5, "rgba(82, 126, 132, .26)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 105, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(130, 194, 205, .36)";
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 92 - i * 15, 68 - i * 12, -0.12 * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(165, 224, 233, .9)";
      ctx.font = '500 10px "SFMono-Regular", Menlo, monospace';
      ctx.fillText("FFT / PHASE CORRECT", 20, h - 54);
      ctx.fillText("FOV 240 mm  MAT 256", 20, h - 36);
      ctx.fillText("SNR 34.1", 20, h - 18);
    } else {
      ctx.strokeStyle = "rgba(126, 210, 222, .76)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x += 6) {
        const y = h * 0.55 + Math.sin(x * 0.032) * 20 + Math.sin(x * 0.097) * 7;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(154, 178, 196, .4)";
      ctx.beginPath();
      ctx.moveTo(20, h * 0.72);
      ctx.lineTo(w - 20, h * 0.72);
      ctx.stroke();
      ctx.fillStyle = "rgba(132, 183, 200, .6)";
      ctx.fillText("TR 4.8 ms   TE 2.2 ms   BW 250 kHz", 20, h - 34);
      ctx.fillText("SYNC  10 MHz   LOCKED", 20, h - 18);
    }
    ctx.fillStyle = "rgba(104, 198, 215, .8)";
    ctx.fillRect(w - 22, 18, 5, 5);
  });
}

export function makeCabinetLabel(text, color = "#aab7c3") {
  return makeCanvasTexture(512, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = '600 23px "SFMono-Regular", Menlo, monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 16, h / 2);
    ctx.fillStyle = "rgba(154, 190, 206, .35)";
    ctx.fillRect(16, h / 2 + 18, w - 50, 1);
  });
}

export function makeWarningDecal(text) {
  return makeCanvasTexture(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(7, 14, 17, .72)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(243, 174, 77, .45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = "#e6b55e";
    ctx.font = '600 28px "SFMono-Regular", Menlo, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2);
  });
}
