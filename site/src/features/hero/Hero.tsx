"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/hooks";
import { duration, ease, stagger } from "@/lib/motion";
import { Magnetic } from "@/components/Magnetic";
import { SplitChars } from "@/components/SplitChars";
import { scrollToTarget } from "@/features/scroll/SmoothScroll";
import { sound } from "@/lib/sound";
import { Monogram } from "./Monogram";

export function Hero() {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const introDone = useStore((s) => s.introDone);
  const reduced = useReducedMotion();

  // Entrance: letters rise out of a mask while the width axis stretches from
  // condensed to expanded, like a scale keyframe with an overshoot.
  useEffect(() => {
    if (!introDone) return;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set("[data-char]", { y: 0, yPercent: 0, "--wdth": 125 });
        gsap.set("[data-fade]", { opacity: 1, y: 0 });
        gsap.set("[data-rule]", { scaleX: 1 });
        return;
      }
      gsap
        .timeline({ delay: 0.1 })
        .fromTo(
          "[data-char]",
          // y: 0 clears the pixel offset GSAP reads from the inline translateY(115%).
          { y: 0, yPercent: 115, "--wdth": 62 },
          { y: 0, yPercent: 0, "--wdth": 125, duration: duration.cinematic, ease: ease.out, stagger: stagger.letters },
        )
        .fromTo("[data-rule]", { scaleX: 0 }, { scaleX: 1, duration: duration.cinematic, ease: ease.inOut }, 0.15)
        .fromTo("[data-fade]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: duration.slow, ease: ease.out, stagger: stagger.lines }, 0.55);
    }, root);
    return () => ctx.revert();
  }, [introDone, reduced]);

  // Scroll: the two lines of the name slide apart and thin out, the stage sinks back.
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      tl.to("[data-line='0']", { xPercent: -18, ease: "none" }, 0)
        .to("[data-line='1']", { xPercent: 14, ease: "none" }, 0)
        .to("[data-char]", { "--wdth": 70, ease: "none" }, 0)
        .to("[data-stage]", { opacity: 0.1, scale: 0.92, ease: "none" }, 0)
        .to("[data-monogram]", { yPercent: 18, scale: 1.25, ease: "none" }, 0);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  const enter = () => {
    const el = document.getElementById("manifesto");
    if (!el) return;
    sound.confirm();
    scrollToTarget(el, reduced);
    el.focus({ preventScroll: true });
  };

  return (
    <section
      ref={root}
      id="top"
      tabIndex={-1}
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col justify-between overflow-hidden px-[var(--gutter)] pb-16 pt-[calc(var(--nav-h)+1.5rem)] outline-none"
    >
      {/* CGI monogram: in the empty space beside the first line on desktop, between the name and the text on phones */}
      <div
        data-monogram
        className="pointer-events-none relative order-2 mx-auto -my-6 w-[min(84vw,46vh)] drop-shadow-[0_40px_60px_rgba(0,0,0,0.65)] md:absolute md:right-0 md:top-[-7%] md:z-10 md:m-0 md:w-[min(50vw,66vh,720px)]"
      >
        <Monogram scrollTrigger={root} />
      </div>

      <div className="mono relative z-20 order-0 flex justify-between gap-4 text-muted-2">
        <span data-fade className="opacity-0">
          {t.hero.place}
        </span>
        <span data-fade className="opacity-0 max-sm:hidden">
          {t.hero.edition}
        </span>
        <span data-fade className="flex items-center gap-2 text-paper-dim opacity-0">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          <span className="max-sm:hidden">{t.hero.status}</span>
        </span>
      </div>

      <div data-stage className="relative order-1 py-8">
        <h1 id="hero-title" aria-label="Kaio Felipe" className="display select-none text-[length:var(--text-display)]">
          {["KAIO", "FELIPE"].map((word, i) => (
            <span
              key={word}
              data-line={i}
              aria-hidden
              className={`flex overflow-hidden pb-[0.04em] ${i === 1 ? "justify-end" : ""}`}
            >
              <SplitChars
                text={word}
                charClassName="[font-variation-settings:'wdth'_var(--wdth,125)]"
                charStyle={{ transform: "translateY(115%)" }}
              />
            </span>
          ))}
        </h1>
      </div>

      <div className="relative z-20 order-3 grid gap-8 md:grid-cols-12 md:items-end">
        <div data-rule className="h-px origin-left scale-x-0 bg-line-strong md:col-span-12" />
        <p data-fade className="text-[clamp(1.15rem,2.1vw,1.8rem)] font-semibold leading-tight tracking-tight opacity-0 md:col-span-5">
          {t.hero.lead}
          <span className="block font-normal text-muted">{t.hero.sub}</span>
        </p>
        <p data-fade className="mono max-w-xs leading-6 text-muted-2 opacity-0 md:col-span-4 md:col-start-7">
          {t.hero.side}
        </p>
        <div data-fade className="opacity-0 md:col-span-3 md:justify-self-end">
          <Magnetic>
            <button
              type="button"
              onClick={enter}
              data-cursor-label="PLAY"
              className="group relative flex h-28 w-28 items-center justify-center rounded-full border border-line-strong transition-colors duration-500 hover:border-signal hover:bg-signal hover:text-ink-950 md:h-32 md:w-32"
            >
              <span className="mono flex flex-col items-center gap-2">
                <svg aria-hidden width="14" height="16" viewBox="0 0 14 16" className="transition-transform duration-500 group-hover:scale-125">
                  <path d="M0 0 L14 8 L0 16 Z" fill="currentColor" />
                </svg>
                {t.hero.cta}
              </span>
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
