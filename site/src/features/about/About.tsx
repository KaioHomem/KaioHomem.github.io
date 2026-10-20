"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { useReducedMotion } from "@/lib/hooks";
import { SectionHead } from "@/components/SectionHead";

export function About() {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-photo]",
        { clipPath: "inset(100% 0 0 0)" },
        { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: "[data-photo]", start: "top 80%" } },
      );
      gsap.fromTo("[data-photo] img", { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "[data-photo]", start: "top bottom", end: "bottom top", scrub: true } });
      gsap.utils.toArray<HTMLElement>("[data-para], [data-fact]").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="about" ref={root} tabIndex={-1} aria-labelledby="about-title" className="relative px-[var(--gutter)] py-32 outline-none md:py-44">
      <SectionHead id="about" comp={t.about.comp} label={t.about.label} title={t.about.title} />
      <div className="grid gap-14 md:grid-cols-12">
        <figure className="md:col-span-4">
          <div data-photo className="group relative aspect-square overflow-hidden border border-line bg-ink-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/foto.png"
              alt="Kaio Felipe"
              width={400}
              height={400}
              loading="lazy"
              className="h-full w-full object-cover grayscale transition-[filter] duration-700 group-hover:grayscale-0"
            />
            {/* viewfinder marks */}
            <span aria-hidden className="absolute left-3 top-3 h-4 w-4 border-l border-t border-paper/70" />
            <span aria-hidden className="absolute right-3 top-3 h-4 w-4 border-r border-t border-paper/70" />
            <span aria-hidden className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-paper/70" />
            <span aria-hidden className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-paper/70" />
          </div>
          <figcaption className="mono mt-3 flex justify-between text-muted-2">
            <span>kaio_felipe.png</span>
            <span>400 × 400</span>
          </figcaption>
        </figure>

        <div className="md:col-span-7 md:col-start-6">
          <div className="space-y-6 text-lg leading-relaxed text-paper-dim md:text-xl">
            {t.about.paragraphs.map((p) => (
              <p key={p} data-para>
                {p}
              </p>
            ))}
          </div>
          <dl className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2">
            {t.about.facts.map((f) => (
              <div key={f.k} data-fact className="bg-ink-900 p-5">
                <dt className="mono mb-2 flex items-center gap-2 text-muted-2">
                  <span className="kf h-1.5 w-1.5 text-signal" />
                  {f.k}
                </dt>
                <dd className="text-paper">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
