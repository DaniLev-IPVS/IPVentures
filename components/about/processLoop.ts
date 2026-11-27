/**
 * The "how an IP gets built" loop, drawn procedurally on a 2D canvas with a
 * transparent background (no video), so it can sit in the page or become a
 * texture inside a glass cube.
 *
 *   message → character → character walks → zoom out: it's a reel on a phone
 *   → the phone becomes a "Post" button → click → it becomes a node that
 *   blooms into a network → the network folds back into the message → loop.
 *
 * Everything is authored in a 200 × 200 unit box.
 */

export const LOOP_SECONDS = 13.8;

/* ------------------------------------------------------------------ */
/* Easing + helpers                                                    */
/* ------------------------------------------------------------------ */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 progress of t across [a, b]. */
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

type Pt = [number, number];

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

const BUBBLE =
  "M72 64 H128 Q140 64 140 76 V112 Q140 124 128 124 H94 L76 140 L79 124 H72 Q60 124 60 112 V76 Q60 64 72 64 Z";

/** The mascot: one soft capsule (head and body in one), so it can morph. */
const BODY =
  "M100 46 C114 46 125 57 125 71 L125 115 Q125 128 112 128 L88 128 Q75 128 75 115 L75 71 C75 57 86 46 100 46 Z";

const CURSOR = "M0 0 L0 22 L6 16.5 L10.5 26 L14.5 24.2 L10 15 L18 15 Z";

const N_SAMPLES = 120;

function samplePath(d: string, n: number): Pt[] {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", d);
  const len = el.getTotalLength();
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = el.getPointAtLength((i / n) * len);
    out.push([p.x, p.y]);
  }
  return out;
}

/** Rotate b so its points line up with a (least total travel). */
function align(a: Pt[], b: Pt[]): Pt[] {
  let best = 0;
  let bestCost = Infinity;
  for (let off = 0; off < b.length; off++) {
    let cost = 0;
    for (let i = 0; i < a.length; i += 3) {
      const q = b[(i + off) % b.length];
      cost += (a[i][0] - q[0]) ** 2 + (a[i][1] - q[1]) ** 2;
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = off;
    }
  }
  return a.map((_, i) => b[(i + best) % b.length]);
}

/* Network: a radial tree. The centre splits three ways, then every node
   splits in two, three more times; each generation is fainter. */
type TreeNode = { p: Pt; parent: number; level: number };

const LEVEL_RADIUS = [0, 26, 48, 68, 86];
const LEVEL_SPREAD = [0, 0, 32, 17, 9].map((d) => (d * Math.PI) / 180);
export const LEVEL_SIZE = [6, 4.6, 3.5, 2.6, 1.8];
export const LEVEL_ALPHA = [1, 0.9, 0.7, 0.48, 0.3];

const TREE: TreeNode[] = (() => {
  const nodes: (TreeNode & { a: number })[] = [{ p: [100, 100], parent: -1, level: 0, a: 0 }];
  const jitter = (i: number) => Math.sin(i * 12.9898) * 43758.5453 % 1;
  const add = (parent: number, level: number, a: number) => {
    const r = LEVEL_RADIUS[level] + jitter(nodes.length) * 3;
    nodes.push({ p: [100 + Math.cos(a) * r, 100 + Math.sin(a) * r], parent, level, a });
  };
  [-90, 30, 150].forEach((d) => add(0, 1, (d * Math.PI) / 180));
  for (let level = 2; level < LEVEL_RADIUS.length; level++) {
    nodes
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => n.level === level - 1)
      .forEach(({ n, i }) => {
        add(i, level, n.a - LEVEL_SPREAD[level]);
        add(i, level, n.a + LEVEL_SPREAD[level]);
      });
  }
  return nodes.map(({ p, parent, level }) => ({ p, parent, level }));
})();

type Geometry = {
  bubble: Pt[];
  body: Pt[];
  bubblePath: Path2D;
  cursor: Path2D;
  /** Where each node lands on the bubble outline when the tree folds. */
  foldTargets: Pt[];
};

let geometry: Geometry | null = null;

function getGeometry(): Geometry {
  if (geometry) return geometry;
  const bubble = samplePath(BUBBLE, N_SAMPLES);
  const body = align(bubble, samplePath(BODY, N_SAMPLES));
  // Spread the outer nodes around the bubble outline by angle.
  const angle = ([x, y]: Pt) => Math.atan2(y - 94, x - 100);
  const outline = samplePath(BUBBLE, TREE.length - 1).sort((p, q) => angle(p) - angle(q));
  const outer = TREE.slice(1)
    .map((n, i) => ({ i: i + 1, a: angle(n.p) }))
    .sort((p, q) => p.a - q.a);
  const foldTargets: Pt[] = TREE.map(() => [100, 94] as Pt);
  outer.forEach((o, k) => (foldTargets[o.i] = outline[k]));
  geometry = {
    bubble,
    body,
    bubblePath: new Path2D(BUBBLE),
    cursor: new Path2D(CURSOR),
    foldTargets,
  };
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Drawing primitives                                                  */
/* ------------------------------------------------------------------ */

type Ctx = CanvasRenderingContext2D;

type Style = {
  fill: CanvasGradient;
  /** device pixels per unit — shadowBlur ignores transforms. */
  px: number;
};

function glow(ctx: Ctx, s: Style, amount = 1) {
  ctx.shadowColor = "rgba(170, 200, 255, 0.55)";
  ctx.shadowBlur = 9 * s.px * amount;
}
function noGlow(ctx: Ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function polyPath(pts: Pt[]) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

function roundRect(x: number, y: number, w: number, h: number, r: number) {
  const p = new Path2D();
  const rr = Math.min(r, w / 2, h / 2);
  p.roundRect(x, y, w, h, rr);
  return p;
}

/** Cut a shape out of everything drawn so far (true transparency). */
function cut(ctx: Ctx, draw: () => void, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  noGlow(ctx);
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  draw();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function drawTypingDots(ctx: Ctx, t: number, alpha: number) {
  cut(ctx, () => {
    for (let i = 0; i < 3; i++) {
      const bob = Math.max(0, Math.sin(t * 6 - i * 0.9)) * 4;
      ctx.beginPath();
      ctx.arc(84 + i * 16, 94 - bob, 5.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, alpha);
}

type Pose = {
  /** walk cycle phase in radians */
  phase: number;
  /** 0..1 how far the limbs have grown in */
  limbs: number;
  /** 0..1 face visible */
  face: number;
  blink: number;
  /** seconds, drives the ground marks */
  t: number;
};

/**
 * The mascot in profile, walking left → right. Body occupies roughly
 * 75..125 × 46..128; legs hang from a hip at (100, 124).
 */
function drawCharacter(ctx: Ctx, s: Style, body: Path2D, pose: Pose, alpha: number) {
  if (alpha <= 0) return;
  const L = pose.limbs;
  const sw = Math.sin(pose.phase);
  const cw = Math.cos(pose.phase);
  // The body dips while the legs are spread, rises as they pass.
  const bob = Math.abs(sw) * 2.4 * L;
  const STRIDE = 0.55;

  const leg = (angle: number, lift: number) => {
    const len = 25 * L;
    const fx = 100 + Math.sin(angle) * len;
    const fy = 124 + Math.cos(angle) * len - lift;
    ctx.beginPath();
    ctx.moveTo(100, 122);
    ctx.lineTo(fx, fy);
    ctx.lineTo(fx + 7 * L, fy); // foot points the way it walks
    ctx.stroke();
  };

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = s.fill;
  ctx.strokeStyle = s.fill;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Ground marks sliding back under the feet.
  if (L > 0) {
    noGlow(ctx);
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const x = 62 + ((((i * 19 - pose.t * 34) % 76) + 76) % 76);
      const edge = Math.min(1, (x - 62) / 12, (138 - x) / 12);
      ctx.globalAlpha = alpha * 0.32 * clamp01(L) * Math.max(0, edge);
      ctx.beginPath();
      ctx.moveTo(x, 153);
      ctx.lineTo(x + 8, 153);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
  }

  ctx.translate(0, bob);
  glow(ctx, s, 0.8);

  if (L > 0) {
    // Far leg first, dimmed for depth.
    ctx.lineWidth = 9.5;
    ctx.globalAlpha = alpha * 0.5;
    leg(-sw * STRIDE, Math.max(0, -cw) * 5);
    ctx.globalAlpha = alpha;
    leg(sw * STRIDE, Math.max(0, cw) * 5);
  }

  // A little lean into the walk and a squash on each step.
  const lean = 0.06 * clamp01(L);
  const squash = 1 - Math.abs(sw) * 0.035 * clamp01(L);
  const bodyTransform = () => {
    ctx.translate(100, 124);
    ctx.rotate(lean);
    ctx.scale(1 / squash, squash);
    ctx.translate(-100, -124);
  };
  ctx.save();
  bodyTransform();
  ctx.fill(body);
  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.translate(0, bob);
  bodyTransform();
  // Face, looking the way it walks.
  cut(ctx, () => {
    const eyeH = 4.4 * (1 - pose.blink * 0.85);
    ctx.beginPath();
    ctx.ellipse(106, 70, 3.1, eyeH, 0, 0, Math.PI * 2);
    ctx.ellipse(117, 70, 2.8, eyeH * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(112.5, 78, 4.6, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
  }, pose.face * alpha);
  ctx.restore();
}

function drawReelUI(ctx: Ctx, s: Style, t: number, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = s.fill;
  ctx.strokeStyle = s.fill;
  noGlow(ctx);
  // Side actions: heart (pops), comment, share.
  const pop = seg(t, 6.9, 7.15) - seg(t, 7.15, 7.5);
  const hs = 1 + easeOut(clamp01(pop)) * 0.45;
  ctx.save();
  ctx.translate(121, 106);
  ctx.scale(hs, hs);
  ctx.beginPath();
  ctx.moveTo(0, 3.2);
  ctx.bezierCurveTo(-5.5, -1, -3.2, -6, 0, -2.8);
  ctx.bezierCurveTo(3.2, -6, 5.5, -1, 0, 3.2);
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(121, 118, 3.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(117.5, 132);
  ctx.lineTo(124.5, 128.5);
  ctx.lineTo(121.5, 135.5);
  ctx.closePath();
  ctx.stroke();
  // Caption lines + progress bar.
  ctx.globalAlpha *= 0.7;
  ctx.fill(roundRect(78, 140, 26, 2.6, 1.3));
  ctx.fill(roundRect(78, 145, 17, 2.6, 1.3));
  ctx.globalAlpha /= 0.7;
  ctx.globalAlpha *= 0.3;
  ctx.fill(roundRect(77, 152, 46, 1.8, 0.9));
  ctx.globalAlpha /= 0.3;
  ctx.fill(roundRect(77, 152, 46 * seg(t, 5.8, 8.4), 1.8, 0.9));
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Frame                                                               */
/* ------------------------------------------------------------------ */

const PHONE = { x: 70, y: 38, w: 60, h: 124, r: 13 };
const PILL = { x: 58, y: 82, w: 84, h: 36, r: 18 };
const DOT = { x: 93, y: 93, w: 14, h: 14, r: 7 };

type Box = typeof PHONE;
const lerpBox = (a: Box, b: Box, k: number): Box => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  w: lerp(a.w, b.w, k),
  h: lerp(a.h, b.h, k),
  r: lerp(a.r, b.r, k),
});

/**
 * Draw the loop at time t (seconds, wraps) into a canvas of `size` device
 * pixels. Clears to transparent first.
 */
export function drawProcessLoop(ctx: Ctx, tRaw: number, size: number) {
  const g = getGeometry();
  const t = ((tRaw % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
  const px = size / 200;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.setTransform(px, 0, 0, px, 0, 0);
  ctx.lineJoin = "round";

  const fill = ctx.createLinearGradient(40, 30, 160, 170);
  fill.addColorStop(0, "#ffffff");
  fill.addColorStop(0.55, "#e2eaff");
  fill.addColorStop(1, "#f4dcff");
  const s: Style = { fill, px };

  const walkPhase = Math.max(0, t - 2.5) * Math.PI * 2 * 1.5;
  const blink = (() => {
    const b = t % 3.1;
    return b > 2.95 ? Math.sin(((b - 2.95) / 0.15) * Math.PI) : 0;
  })();

  /* 1 — message bubble (and its return at the end of the loop) */
  const morph = easeInOut(seg(t, 1.65, 2.5));
  const foldIn = seg(t, 13.1, 13.8);
  if (t < 2.5 || t >= 13.1) {
    const shape = t >= 13.1 ? g.bubble : g.bubble.map((p, i): Pt => [
      lerp(p[0], g.body[i][0], morph),
      lerp(p[1], g.body[i][1], morph),
    ]);
    const a = t >= 13.1 ? easeOut(foldIn) : 1;
    const sc = t >= 13.1 ? lerp(0.9, 1, easeOutBack(foldIn)) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(100, 100);
    ctx.scale(sc, sc);
    ctx.translate(-100, -100);
    ctx.fillStyle = fill;
    glow(ctx, s);
    ctx.fill(t >= 13.1 ? g.bubblePath : polyPath(shape));
    ctx.restore();
    if (t < 2.5) {
      const dots = (t < 0.35 ? seg(t, 0, 0.35) : 1) * (1 - seg(t, 1.45, 1.75));
      drawTypingDots(ctx, t, dots);
    } else {
      drawTypingDots(ctx, t, seg(t, 13.4, 13.8));
    }
  }

  /* 2 — the character walks, then the camera pulls back to a phone */
  if (t >= 2.5 && t < 8.6) {
    const zoom = easeInOut(seg(t, 5.2, 6.4));
    const out = 1 - seg(t, 8.2, 8.5);
    const sc = lerp(1, 0.52, zoom);
    const cy = lerp(0, 4, zoom);
    ctx.save();
    ctx.translate(lerp(100, 95, zoom), 100 + cy);
    ctx.scale(sc, sc);
    ctx.translate(-100, -100);
    drawCharacter(ctx, s, polyPath(g.body), {
      phase: walkPhase,
      limbs: easeOutBack(seg(t, 2.5, 3.0)),
      face: seg(t, 2.35, 2.7),
      blink,
      t,
    }, out);
    ctx.restore();

    // Phone frame flies in from "behind the camera".
    if (zoom > 0) {
      const fs = lerp(2.4, 1, zoom);
      ctx.save();
      ctx.globalAlpha = clamp01(zoom * 1.6);
      ctx.translate(100, 100);
      ctx.scale(fs, fs);
      ctx.translate(-100, -100);
      ctx.strokeStyle = fill;
      ctx.lineWidth = 3.4;
      glow(ctx, s, 0.9);
      ctx.stroke(roundRect(PHONE.x, PHONE.y, PHONE.w, PHONE.h, PHONE.r));
      noGlow(ctx);
      ctx.fillStyle = fill;
      ctx.fill(roundRect(92, 43, 16, 3.6, 1.8));
      ctx.restore();
      drawReelUI(ctx, s, t, seg(t, 6.0, 6.5) * out);
    }
  }

  /* 3 — the phone becomes a Post button, gets clicked, becomes a node */
  if (t >= 8.2 && t < 11.1) {
    const toPill = easeInOut(seg(t, 8.35, 9.15));
    const toDot = easeInOut(seg(t, 10.45, 11.0));
    const press = seg(t, 10.0, 10.12) - seg(t, 10.12, 10.35);
    const box = toDot > 0 ? lerpBox(PILL, DOT, toDot) : lerpBox(PHONE, PILL, toPill);
    const filled = seg(t, 8.25, 8.7);
    const k = 1 - easeOut(clamp01(press)) * 0.07;
    ctx.save();
    ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
    ctx.scale(k, k);
    ctx.translate(-(box.x + box.w / 2), -(box.y + box.h / 2));
    const path = roundRect(box.x, box.y, box.w, box.h, box.r);
    ctx.fillStyle = fill;
    ctx.strokeStyle = fill;
    glow(ctx, s);
    ctx.globalAlpha = filled;
    ctx.fill(path);
    ctx.globalAlpha = 1 - filled;
    ctx.lineWidth = 3.4;
    ctx.stroke(path);
    ctx.globalAlpha = 1;
    cut(ctx, () => {
      ctx.font = "600 15px Montserrat, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Post", 100, 100.5);
    }, seg(t, 8.85, 9.2) * (1 - seg(t, 10.4, 10.55)));
    ctx.restore();

    // Click ripple.
    const rip = seg(t, 10.05, 10.75);
    if (rip > 0 && rip < 1) {
      ctx.save();
      ctx.strokeStyle = fill;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = (1 - rip) * 0.8;
      const grow = easeOut(rip) * 16;
      ctx.stroke(roundRect(PILL.x - grow, PILL.y - grow, PILL.w + grow * 2, PILL.h + grow * 2, PILL.r + grow));
      ctx.restore();
    }

    // Cursor glides in, clicks, leaves.
    const cin = easeInOut(seg(t, 9.2, 9.95));
    const cout = seg(t, 10.35, 10.7);
    if (cin > 0 && cout < 1) {
      const cx = lerp(176, 112, cin) + easeIn(cout) * 30;
      const cy = lerp(178, 104, cin) + easeIn(cout) * 30;
      const cs = 1 - easeOut(clamp01(press)) * 0.14;
      ctx.save();
      ctx.globalAlpha = (1 - cout) * seg(t, 9.2, 9.4);
      ctx.translate(cx, cy);
      ctx.scale(cs, cs);
      ctx.fillStyle = fill;
      glow(ctx, s, 0.7);
      ctx.fill(g.cursor);
      ctx.restore();
    }
  }

  /* 4 — the node branches out into a fading tree, then folds back into the message */
  if (t >= 10.95 && t < 13.8) {
    const fold = easeInOut(seg(t, 12.6, 13.35));
    const fade = 1 - seg(t, 13.25, 13.75);
    const WHITE = "#ffffff";
    // How far each node has travelled out from its parent.
    const grow = TREE.map((n) =>
      n.level === 0 ? 1 : easeOutBack(seg(t, 11.0 + (n.level - 1) * 0.27, 11.45 + (n.level - 1) * 0.27)),
    );
    const live: Pt[] = [];
    TREE.forEach((n, i) => {
      if (n.level === 0) live.push(n.p);
      else {
        const from = live[n.parent];
        live.push([lerp(from[0], n.p[0], grow[i]), lerp(from[1], n.p[1], grow[i])]);
      }
    });
    const pos = live.map((p, i): Pt => {
      const f = g.foldTargets[i];
      return [lerp(p[0], f[0], fold), lerp(p[1], f[1], fold)];
    });

    ctx.save();
    ctx.fillStyle = WHITE;
    ctx.strokeStyle = WHITE;
    ctx.lineCap = "round";
    noGlow(ctx);

    // Branches.
    const edgeAlpha = 1 - seg(t, 12.6, 13.0);
    TREE.forEach((n, i) => {
      if (n.level === 0 || grow[i] <= 0) return;
      ctx.globalAlpha = fade * edgeAlpha * LEVEL_ALPHA[n.level] * 0.6 * clamp01(grow[i] * 1.5);
      ctx.lineWidth = [0, 1.7, 1.35, 1.05, 0.8][n.level];
      ctx.beginPath();
      ctx.moveTo(pos[n.parent][0], pos[n.parent][1]);
      ctx.lineTo(pos[i][0], pos[i][1]);
      ctx.stroke();
    });

    // A signal running out from the centre to the leaves.
    const wave = (t - 11.95) * 125;
    if (wave > 0 && t < 12.75) {
      TREE.forEach((n, i) => {
        if (n.level === 0) return;
        const r0 = LEVEL_RADIUS[n.level - 1];
        const r1 = LEVEL_RADIUS[n.level];
        const k = (wave - r0) / (r1 - r0);
        if (k < 0 || k > 1) return;
        ctx.globalAlpha = fade * LEVEL_ALPHA[n.level] * Math.sin(k * Math.PI);
        ctx.beginPath();
        ctx.arc(lerp(pos[n.parent][0], pos[i][0], k), lerp(pos[n.parent][1], pos[i][1], k), 1.4 + (4 - n.level) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Nodes: big and bright in the middle, smaller and fainter outward.
    ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
    TREE.forEach((n, i) => {
      if (grow[i] <= 0) return;
      let r = LEVEL_SIZE[n.level];
      if (n.level === 0) r = lerp(7, LEVEL_SIZE[0], seg(t, 11.0, 11.3)) * (1 - fold);
      else r = lerp(r, 2.4, fold) * clamp01(grow[i] * 1.4);
      if (r <= 0.05) return;
      ctx.shadowBlur = (n.level < 2 ? 8 : 4) * s.px;
      ctx.globalAlpha = fade * lerp(LEVEL_ALPHA[n.level], 0.85, fold);
      ctx.beginPath();
      ctx.arc(pos[i][0], pos[i][1], r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Key frames, for previews and posters. */
export const LOOP_KEYS = [
  { t: 0.9, label: "Message" },
  { t: 2.62, label: "Character" },
  { t: 4.1, label: "Walk cycle" },
  { t: 7.3, label: "Reel on a phone" },
  { t: 9.5, label: "Post button" },
  { t: 12.45, label: "Network" },
] as const;

/** In-between frames, to check the transitions. */
export const LOOP_TRANSITIONS = [
  { t: 2.05, label: "Message → character" },
  { t: 5.8, label: "Camera pulls back" },
  { t: 8.7, label: "Phone → button" },
  { t: 10.12, label: "Click" },
  { t: 10.75, label: "Button → node" },
  { t: 11.5, label: "Network branches" },
  { t: 12.95, label: "Network folds" },
  { t: 13.5, label: "Back to the message" },
] as const;
