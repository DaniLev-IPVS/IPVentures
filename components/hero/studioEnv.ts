import * as THREE from "three";

/**
 * Paints a dark studio environment (equirectangular) with a few bright soft
 * panels. Gives the glass crisp white rims and cool fill without downloading
 * an HDR.
 */
export function makeStudioEnvTexture() {
  const w = 1024;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Deep navy sky to a near-black horizon, lighter floor bounce
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#070a16");
  base.addColorStop(0.5, "#020308");
  base.addColorStop(1, "#080c1a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const panel = (
    x: number,
    y: number,
    pw: number,
    ph: number,
    color: string,
    blur: number,
  ) => {
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, pw, ph);
    ctx.restore();
  };

  // Three.js equirect azimuths: u=0.5 → +x (right), u=0/1 → -x (left),
  // u=0.75 → +z (behind the camera), u=0.25 → -z (behind the logo).
  // Faces that look straight at the camera mirror u≈0.75, which is left
  // dark on purpose so they fall into the black background.
  const strip = (u: number, halfW: number, v0: number, v1: number, color: string, blur: number) =>
    panel(w * (u - halfW), h * v0, w * halfW * 2, h * (v1 - v0), color, blur);

  // Overhead key band (all azimuths)
  panel(0, h * 0.02, w, h * 0.12, "rgba(255,255,255,0.95)", 16);
  // Side panels: right (+x) and left (-x, wraps the seam)
  strip(0.5, 0.06, 0.22, 0.78, "rgba(255,255,255,0.9)", 12);
  panel(0, h * 0.22, w * 0.06, h * 0.56, "rgba(255,255,255,0.9)", 12);
  panel(w * 0.94, h * 0.22, w * 0.06, h * 0.56, "rgba(255,255,255,0.9)", 12);
  // Broad panels between the camera and each side: a face tilted more than
  // ~12° mirrors one of these and lights up; straight-on it stays dark.
  strip(0.63, 0.07, 0.18, 0.82, "rgba(235,242,255,0.9)", 8);
  strip(0.87, 0.07, 0.18, 0.82, "rgba(235,242,255,0.9)", 8);
  // Faint cool sheen behind the camera so the rest pose never fully vanishes
  strip(0.75, 0.05, 0.3, 0.7, "rgba(90,120,200,0.3)", 26);
  // Dim back light behind the logo (seen only through refraction)
  strip(0.25, 0.08, 0.35, 0.65, "rgba(120,160,255,0.3)", 30);
  // Floor bounce
  panel(0, h * 0.86, w, h * 0.14, "rgba(60,80,140,0.45)", 24);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
