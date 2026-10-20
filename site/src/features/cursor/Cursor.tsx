"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";
import { sound } from "@/lib/sound";

/**
 * A crosshair cursor, like the anchor point tool: a dot that follows exactly and a
 * bracket frame that trails behind and wraps anything interactive. Elements can set
 * data-cursor-label to show a word next to it. Fine pointers only.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!fine) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    const d = dot.current!;
    const f = frame.current!;
    const l = label.current!;
    const speed = reduced ? 0.01 : 0.35;
    const dx = gsap.quickTo(d, "x", { duration: 0.01 });
    const dy = gsap.quickTo(d, "y", { duration: 0.01 });
    const fx = gsap.quickTo(f, "x", { duration: speed, ease: "power3.out" });
    const fy = gsap.quickTo(f, "y", { duration: speed, ease: "power3.out" });
    let hovered: Element | null = null;

    const onMove = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      if (hovered) {
        const r = hovered.getBoundingClientRect();
        fx(r.left + r.width / 2);
        fy(r.top + r.height / 2);
      } else {
        fx(e.clientX);
        fy(e.clientY);
      }
      gsap.to([d, f], { autoAlpha: 1, duration: 0.2 });
    };

    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element).closest("a, button, [data-cursor-label], label, summary, input, textarea");
      if (target === hovered) return;
      hovered = target;
      if (target && !target.matches("input, textarea")) {
        const r = target.getBoundingClientRect();
        const pad = 10;
        gsap.to(f, { width: Math.min(r.width + pad, 420), height: Math.min(r.height + pad, 260), duration: 0.35, ease: "expo.out" });
        l.textContent = (target as HTMLElement).dataset.cursorLabel ?? "";
        sound.hover();
      } else {
        gsap.to(f, { width: 28, height: 28, duration: 0.35, ease: "expo.out" });
        l.textContent = "";
      }
    };

    const onLeaveWindow = () => gsap.to([d, f], { autoAlpha: 0, duration: 0.2 });
    const onDown = () => gsap.to(f, { scale: 0.85, duration: 0.15 });
    const onUp = () => gsap.to(f, { scale: 1, duration: 0.3, ease: "back.out(2)" });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeaveWindow);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeaveWindow);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [fine, reduced]);

  if (!fine) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] mix-blend-difference">
      <div ref={dot} className="invisible absolute left-0 top-0 -ml-[2px] -mt-[2px] h-1 w-1 rounded-full bg-white opacity-0" />
      <div
        ref={frame}
        className="invisible absolute left-0 top-0 h-7 w-7 -translate-x-1/2 -translate-y-1/2 opacity-0"
      >
        {/* four corner brackets */}
        <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-white" />
        <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-white" />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-white" />
        <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white" />
        <span ref={label} className="mono absolute left-full top-full ml-2 mt-1 whitespace-nowrap text-white" />
      </div>
    </div>
  );
}
