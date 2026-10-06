"use client";

import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Painted sky-blue plate used until the video is ready (or when none is given). */
function makeProceduralTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d")!;

  const sky = ctx.createLinearGradient(0, 0, 0, c.height);
  sky.addColorStop(0, "#5fb8ff");
  sky.addColorStop(0.4, "#1f5df5");
  sky.addColorStop(1, "#071d7a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, c.width, c.height);

  // Soft cloud blobs
  const blobs = [
    [180, 150, 170],
    [520, 110, 230],
    [860, 170, 180],
    [700, 260, 150],
  ];
  for (const [x, y, r] of blobs) {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(255,255,255,0.5)");
    gr.addColorStop(0.5, "rgba(255,255,255,0.14)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Faint diagonal light streaks
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const x = 60 + i * 210;
    const gr = ctx.createLinearGradient(x, 0, x + 260, c.height);
    gr.addColorStop(0, "rgba(255,255,255,0)");
    gr.addColorStop(0.5, "rgba(190,225,255,0.1)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 60, 0);
    ctx.lineTo(x + 320, c.height);
    ctx.lineTo(x + 260, c.height);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function useFootageTexture(src: string | null) {
  const [fallback] = useState(makeProceduralTexture);
  const [video, setVideo] = useState<THREE.VideoTexture | null>(null);

  useEffect(() => {
    if (!src) return;
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = src;

    let tex: THREE.VideoTexture | null = null;
    const onReady = () => {
      tex = new THREE.VideoTexture(v);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      setVideo(tex);
      v.play().catch(() => {});
    };
    v.addEventListener("canplay", onReady, { once: true });
    v.addEventListener("error", () => setVideo(null), { once: true });
    v.load();

    return () => {
      v.pause();
      v.removeAttribute("src");
      v.load();
      tex?.dispose();
      setVideo(null);
    };
  }, [src]);

  useEffect(() => () => fallback.dispose(), [fallback]);

  // Drift the painted plate slowly so the fallback never looks frozen.
  useFrame((_, dt) => {
    if (!video) fallback.offset.setX((fallback.offset.x + dt * 0.012) % 1);
  });

  return video ?? fallback;
}
