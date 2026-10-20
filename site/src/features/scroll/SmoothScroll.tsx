"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

let lenis: Lenis | null = null;
/** The running Lenis instance, for code that scrolls programmatically. */
export const getLenis = () => lenis;

/** Scroll to an element (or the top), smooth when Lenis runs, native otherwise. */
export function scrollToTarget(target: HTMLElement | number, reduced = false) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.5, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  const top = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

/**
 * Lenis drives the scroll position and GSAP's ticker drives Lenis, so there is one
 * animation loop for everything and ScrollTrigger always agrees with the page.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, [reduced]);

  // No per-frame work while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => (document.hidden ? gsap.ticker.sleep() : gsap.ticker.wake());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return null;
}
