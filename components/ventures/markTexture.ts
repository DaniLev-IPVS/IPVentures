import * as THREE from "three";

export type MarkTextures = {
  /** The lockup (mark, or mark over wordmark), cropped tight and centred in a square. */
  mark: THREE.CanvasTexture;
  /** Blurred, accent-tinted copy used as an additive glow behind the mark. */
  glow: THREE.CanvasTexture;
  /** width / height of the cropped artwork. */
  aspect: number;
};

/** One piece of a lockup: an SVG file, or a line of text set in a loaded webfont. */
export type Piece =
  | { kind: "svg"; url: string }
  | {
      kind: "text";
      text: string;
      /** CSS font-family (e.g. a next/font generated family). */
      font: string;
      weight: number;
      color: string;
      /** Extra letter spacing in em. */
      tracking?: number;
      /** Per-character vertical offset in em (positive = down), e.g. a wave. */
      offsets?: number[];
      /** Extra gap in em inserted after the character at each index. */
      gaps?: Record<number, number>;
    };

export type Lockup = {
  mark: Piece;
  /** Drawn centred under the mark. */
  wordmark?: Piece;
  /** Wordmark width as a multiple of the mark's width. */
  wordmarkWidth?: number;
  /** Cap on wordmark height as a share of the mark's height. */
  wordmarkMaxHeight?: number;
  /** Space between mark and wordmark as a share of the mark's height. */
  gap?: number;
};

const RASTER = 1024;
const OUT = 1024;
/** Share of the square the artwork's longest side fills. */
export const FILL = 0.86;

/** Crop a canvas to its painted (non-transparent) bounds. */
function cropToInk(src: HTMLCanvasElement): HTMLCanvasElement {
  const { width: w, height: h } = src;
  const data = src.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return src;
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/**
 * SVGs that only declare a viewBox have no intrinsic size (Firefox refuses to
 * draw them), so the markup is fetched and given explicit pixel dimensions.
 */
async function rasterSvg(url: string): Promise<HTMLCanvasElement> {
  const text = await (await fetch(url)).text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.documentElement;
  const vb = (svg.getAttribute("viewBox") ?? "0 0 100 100").split(/[\s,]+/).map(Number);
  const vw = vb[2] || 100;
  const vh = vb[3] || 100;
  const k = RASTER / Math.max(vw, vh);
  const rw = Math.round(vw * k);
  const rh = Math.round(vh * k);
  svg.setAttribute("width", String(rw));
  svg.setAttribute("height", String(rh));
  svg.querySelectorAll("metadata").forEach((m) => m.remove());

  const blobUrl = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }),
  );
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Could not load ${url}`));
      img.src = blobUrl;
    });
    const c = document.createElement("canvas");
    c.width = rw;
    c.height = rh;
    c.getContext("2d")!.drawImage(img, 0, 0, rw, rh);
    return cropToInk(c);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/** Set text in a webfont, character by character so tracking and waves apply. */
async function rasterText(p: Extract<Piece, { kind: "text" }>): Promise<HTMLCanvasElement> {
  const size = 240;
  const font = `${p.weight} ${size}px ${p.font}`;
  await document.fonts.load(font, p.text);
  const chars = [...p.text];
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const track = (p.tracking ?? 0) * size;
  const widths = chars.map((ch) => measure.measureText(ch).width);
  const total =
    widths.reduce((a, b) => a + b, 0) +
    track * (chars.length - 1) +
    Object.values(p.gaps ?? {}).reduce((a, b) => a + b * size, 0);

  const pad = size * 0.6;
  const c = document.createElement("canvas");
  c.width = Math.ceil(total + pad * 2);
  c.height = Math.ceil(size * 2.2);
  const ctx = c.getContext("2d")!;
  ctx.font = font;
  ctx.fillStyle = p.color;
  ctx.textBaseline = "alphabetic";
  let x = pad;
  const base = size * 1.4;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, base + (p.offsets?.[i] ?? 0) * size);
    x += widths[i] + track + (p.gaps?.[i] ?? 0) * size;
  });
  return cropToInk(c);
}

const rasterPiece = (p: Piece) => (p.kind === "svg" ? rasterSvg(p.url) : rasterText(p));

/** Mark on top, wordmark centred underneath. */
function stack(top: HTMLCanvasElement, bottom: HTMLCanvasElement, l: Lockup): HTMLCanvasElement {
  let bw = top.width * (l.wordmarkWidth ?? 1.3);
  let bh = (bottom.height / bottom.width) * bw;
  const maxH = top.height * (l.wordmarkMaxHeight ?? 0.42);
  if (bh > maxH) {
    bw *= maxH / bh;
    bh = maxH;
  }
  const gap = top.height * (l.gap ?? 0.2);
  const w = Math.ceil(Math.max(top.width, bw));
  const h = Math.ceil(top.height + gap + bh);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(top, (w - top.width) / 2, 0);
  ctx.drawImage(bottom, (w - bw) / 2, top.height + gap, bw, bh);
  return c;
}

/** Centre the artwork in a square and build the mark + glow textures. */
function finish(art: HTMLCanvasElement, accent: string): MarkTextures {
  const cw = art.width;
  const ch = art.height;
  const s = (OUT * FILL) / Math.max(cw, ch);
  const dw = cw * s;
  const dh = ch * s;

  const out = document.createElement("canvas");
  out.width = out.height = OUT;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(art, (OUT - dw) / 2, (OUT - dh) / 2, dw, dh);

  // Glow: silhouette recoloured to the accent, then blurred.
  const G = 512;
  const sil = document.createElement("canvas");
  sil.width = sil.height = G;
  const sctx = sil.getContext("2d")!;
  // Shrunk so the blur has room to fall off inside the quad.
  const inset = G * 0.2;
  sctx.drawImage(out, inset, inset, G - inset * 2, G - inset * 2);
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = accent;
  sctx.fillRect(0, 0, G, G);
  const glow = document.createElement("canvas");
  glow.width = glow.height = G;
  const gctx = glow.getContext("2d")!;
  gctx.filter = `blur(${G * 0.045}px)`;
  gctx.drawImage(sil, 0, 0);
  gctx.filter = `blur(${G * 0.012}px)`;
  gctx.globalAlpha = 0.6;
  gctx.drawImage(sil, 0, 0);

  const mk = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  };
  return { mark: mk(out), glow: mk(glow), aspect: cw / ch };
}

/** A mark with an optional wordmark stacked underneath. */
export async function loadLockupTextures(l: Lockup, accent: string): Promise<MarkTextures> {
  const [top, bottom] = await Promise.all([
    rasterPiece(l.mark),
    l.wordmark ? rasterPiece(l.wordmark) : Promise.resolve(null),
  ]);
  return finish(bottom ? stack(top, bottom, l) : top, accent);
}

/** A single SVG mark. */
export async function loadMarkTextures(url: string, accent: string): Promise<MarkTextures> {
  return finish(await rasterSvg(url), accent);
}

/** Soft radial falloff, tinted at draw time. Used for the halo behind a cube. */
export function makeHaloTexture() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
