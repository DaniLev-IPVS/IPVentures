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

  // Deep blue-black base with a slightly lighter floor
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#05070f");
  base.addColorStop(0.5, "#03040a");
  base.addColorStop(1, "#0a1226");
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

  // Overhead key (top band)
  panel(w * 0.25, h * 0.04, w * 0.5, h * 0.12, "rgba(255,255,255,0.95)", 14);
  // Left and right rim panels (equirect x = azimuth)
  panel(w * 0.05, h * 0.3, w * 0.08, h * 0.4, "rgba(255,255,255,0.9)", 10);
  panel(w * 0.87, h * 0.3, w * 0.08, h * 0.4, "rgba(255,255,255,0.9)", 10);
  // Front cool fill (centre = facing camera)
  panel(w * 0.4, h * 0.38, w * 0.2, h * 0.24, "rgba(120,160,255,0.35)", 30);
  // Faint back light
  panel(w * 0.96, h * 0.42, w * 0.04, h * 0.16, "rgba(200,220,255,0.6)", 12);
  panel(0, h * 0.42, w * 0.04, h * 0.16, "rgba(200,220,255,0.6)", 12);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
