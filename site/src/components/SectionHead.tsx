"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";
import { fitSize } from "@/lib/motion";

/**
 * Section opener: "COMP 02 ◆ Label" on a ruled line, then a big title whose lines
 * rise out of a mask and stretch along the width axis as they enter the viewport.
 */
export function SectionHead({ comp, label, title, id }: { comp: string; label: string; title: string[] | string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const lines = Array.isArray(title) ? title : [title];

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 82%" } });
      tl.fromTo("[data-rule]", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" })
        .fromTo("[data-meta]", { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6, ease: "expo.out" }, 0.2)
        .fromTo(
          "[data-tline]",
          { yPercent: 110, "--wdth": 70 },
          { yPercent: 0, "--wdth": 125, duration: 1.3, ease: "expo.out", stagger: 0.1 },
          0.25,
        );
    }, ref);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={ref} className="mb-16 md:mb-24">
      <div className="mono mb-8 flex items-center gap-4 text-muted-2">
        <span data-meta className="flex items-center gap-3">
          <span className="text-paper">{comp}</span>
          <span className="kf text-signal" />
          <span>{label}</span>
        </span>
        <span data-rule className="h-px flex-1 origin-left bg-line-strong" />
      </div>
      <h2 id={`${id}-title`} className="display" style={{ fontSize: fitSize(lines, "clamp(2.8rem,9vw,9rem)") }}>
        {lines.map((l) => (
          <span key={l} className="block overflow-hidden pb-[0.06em]">
            <span data-tline className="block [font-variation-settings:'wdth'_var(--wdth,125)]">
              {l}
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
}
