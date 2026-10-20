"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { useReducedMotion } from "@/lib/hooks";
import { SectionHead } from "@/components/SectionHead";

/** Education and work as keyframes on a vertical track; the track draws itself with the scroll. */
export function Journey() {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-track]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-list]", start: "top 75%", end: "bottom 60%", scrub: true } });
      gsap.utils.toArray<HTMLElement>("[data-item]").forEach((el) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%" } });
        tl.fromTo(el.querySelector("[data-key]"), { scale: 0 }, { scale: 1, duration: 0.6, ease: "back.out(2)" }).fromTo(
          el.querySelectorAll("[data-in]"),
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 },
          0.1,
        );
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="journey" ref={root} tabIndex={-1} aria-labelledby="journey-title" className="relative px-[var(--gutter)] py-32 outline-none md:py-44">
      <SectionHead id="journey" comp={t.journey.comp} label={t.journey.label} title={t.journey.title} />
      <ol data-list className="relative ml-1 md:ml-[33%]">
        <span aria-hidden className="absolute bottom-0 left-[3px] top-2 w-px bg-line" />
        <span aria-hidden data-track className="absolute bottom-0 left-[3px] top-2 w-px origin-top bg-signal" />
        {t.journey.items.map((item) => (
          <li key={item.what} data-item className="relative pb-16 pl-10 last:pb-0">
            <span data-key aria-hidden className="absolute left-0 top-2 block h-2 w-2 rotate-45 bg-signal" />
            <p data-in className="mono mb-3 text-muted-2">
              {item.when}
            </p>
            <h3 data-in className="text-[clamp(1.6rem,3.2vw,2.6rem)] font-bold leading-tight tracking-tight">
              {item.what}
            </h3>
            <p data-in className="mono mt-2 text-signal">
              {item.where}
            </p>
            <p data-in className="mt-4 max-w-xl leading-relaxed text-muted">
              {item.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
