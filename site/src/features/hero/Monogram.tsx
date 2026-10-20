"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/hooks";

// The chrome KF monogram, rendered in Blender (site/cgi/kf_monogram.py) as 90 frames.
// Frames 1-40 play once as the entrance; 40-90 follow the scroll through the hero.
const FRAMES = 90;
const LOCK = 40;
const src = (dir: string, i: number) => `/cgi/${dir}kf_${String(i).padStart(3, "0")}.webp`;

/** Load the whole sequence only on devices and connections that can take it. */
function canAnimate() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return false;
  return true;
}

export function Monogram({ scrollTrigger }: { scrollTrigger: React.RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const introDone = useStore((s) => s.introDone);
  const reduced = useReducedMotion();
  const frames = useRef<HTMLImageElement[]>([]);
  const state = useRef({ frame: LOCK });

  // Load the sequence after the first paint, starting from the lock pose outward.
  useEffect(() => {
    if (reduced || !canAnimate()) return;
    const dir = window.innerWidth < 768 ? "m/" : "";
    let cancelled = false;
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    const start = () => {
      for (let i = 1; i <= FRAMES; i++) {
        const img = new Image();
        img.decoding = "async";
        img.onload = img.onerror = () => {
          loaded++;
          if (loaded === FRAMES && !cancelled) {
            frames.current = imgs;
            setReady(true);
          }
        };
        img.src = src(dir, i);
        imgs[i - 1] = img;
      }
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const id = idle ? idle(start) : window.setTimeout(start, 200);
    return () => {
      cancelled = true;
      if (!idle) window.clearTimeout(id);
    };
  }, [reduced]);

  // Draw a frame into the canvas, sized to the device pixel ratio.
  useEffect(() => {
    if (!ready) return;
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    let drawn = -1;
    const draw = () => {
      const i = Math.round(gsap.utils.clamp(1, FRAMES, state.current.frame));
      if (i === drawn) return;
      const img = frames.current[i - 1];
      if (!img?.complete || !img.naturalWidth) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      drawn = i;
    };
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      drawn = -1;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    gsap.ticker.add(draw);
    return () => {
      window.removeEventListener("resize", resize);
      gsap.ticker.remove(draw);
    };
  }, [ready]);

  // When the intro handed over. If the frames arrive much later, the poster already
  // shows the lock pose, so the entrance is skipped instead of jumping back.
  const introAt = useRef(0);
  useEffect(() => {
    if (introDone) introAt.current = performance.now();
  }, [introDone]);

  // Entrance (once the intro hands over), then scroll scrubbing.
  useEffect(() => {
    if (!ready || !introDone) return;
    const ctx = gsap.context(() => {
      if (performance.now() - introAt.current < 1200 && window.scrollY < 10) {
        state.current.frame = 1;
        gsap.to(state.current, { frame: LOCK, duration: 1.6, ease: "power2.out", delay: 0.15 });
      }
      ScrollTrigger.create({
        trigger: scrollTrigger.current,
        start: "top top",
        end: "bottom top",
        scrub: 0.4,
        onUpdate: (self) => {
          state.current.frame = LOCK + (FRAMES - LOCK) * self.progress;
        },
      });
    });
    return () => ctx.revert();
  }, [ready, introDone, scrollTrigger]);

  // Pointer: the monogram drifts toward the cursor with a heavy follow.
  useEffect(() => {
    if (reduced) return;
    const el = wrap.current!;
    const xTo = gsap.quickTo(el, "x", { duration: 1.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 1.4, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      xTo((e.clientX / window.innerWidth - 0.5) * 28);
      yTo((e.clientY / window.innerHeight - 0.5) * 18);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <div ref={wrap} aria-hidden className="relative aspect-square w-full">
      {/* The lock pose as a plain image: what reduced-motion, save-data and slow loads see. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src("", LOCK)}
        alt=""
        width={1000}
        height={1000}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full"
        style={{ opacity: ready ? 0 : 1 }}
      />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" style={{ opacity: ready ? 1 : 0 }} />
    </div>
  );
}
