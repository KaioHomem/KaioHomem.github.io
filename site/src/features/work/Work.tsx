"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { useReducedMotion } from "@/lib/hooks";
import { contactInfo, type Project } from "@/lib/content";
import { SectionHead } from "@/components/SectionHead";
import { fitSize } from "@/lib/motion";
import { TiltCard } from "@/components/spell/tilt-card";
import { cn } from "@/lib/utils";

/**
 * Projects as clips on a timeline: an in-point (index + year), the clip itself (title,
 * description, tags) and its thumbnail, revealed by a track-matte wipe.
 */
export function Work() {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((clip) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: clip, start: "top 78%" } });
        tl.fromTo(clip.querySelector("[data-thumb]"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.3, ease: "expo.inOut" })
          .fromTo(clip.querySelector("[data-thumb] img"), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0.2)
          .fromTo(clip.querySelectorAll("[data-in]"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, 0.15)
          .fromTo(clip.querySelector("[data-track]"), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: "expo.inOut" }, 0);
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="work" ref={root} tabIndex={-1} aria-labelledby="work-title" className="relative px-[var(--gutter)] py-32 outline-none md:py-44">
      <SectionHead id="work" comp={t.work.comp} label={t.work.label} title={t.work.title} />
      <ol className="flex flex-col gap-28 md:gap-40">
        {t.projects.map((p, i) => (
          <Clip key={p.id} project={p} index={i} privateLabel={t.work.private} />
        ))}
      </ol>
      <div className="mt-28 flex justify-center">
        <a
          href={contactInfo.github}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor-label="GITHUB"
          className="mono group flex items-center gap-3 border border-line-strong px-6 py-4 text-paper transition-colors hover:border-signal hover:text-signal"
        >
          {t.work.more}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            ↗
          </span>
        </a>
      </div>
    </section>
  );
}

function Clip({ project: p, index, privateLabel }: { project: Project; index: number; privateLabel: string }) {
  const flip = index % 2 === 1;
  const external = p.href?.startsWith("http");
  return (
    <li data-clip className="relative grid gap-10 md:grid-cols-12 md:items-center md:gap-8">
      {/* clip bar: in-point to out-point */}
      <div className="absolute -top-8 left-0 right-0 flex items-center gap-3 md:-top-10">
        <span className="kf kf-fill h-1.5 w-1.5 text-signal" />
        <span data-track className="h-px flex-1 origin-left bg-line-strong" />
        <span className="kf h-1.5 w-1.5 text-muted-2" />
      </div>

      <div className={cn("md:col-span-5", flip ? "md:order-2 md:col-start-8" : "md:col-start-1")}>
        <p data-in className="mono mb-5 flex gap-4 text-muted-2">
          <span className="text-signal">{String(index + 1).padStart(2, "0")}</span>
          <span>{p.year}</span>
          <span>{p.kind}</span>
        </p>
        <h3
          data-in
          className="display text-[length:var(--fit-sm)] [font-variation-settings:'wdth'_100] md:text-[length:var(--fit-md)]"
          style={{ "--fit-sm": fitSize(p.title, "clamp(2.4rem,11vw,5.5rem)", 96), "--fit-md": fitSize(p.title, "clamp(2.4rem,6vw,5.5rem)", 34) } as React.CSSProperties}
        >
          {p.href ? (
            <a
              href={p.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              data-cursor-label="OPEN"
              data-text={p.title}
              className="rgb-split inline-block transition-colors hover:text-paper-dim"
            >
              {p.title}
            </a>
          ) : (
            <span data-text={p.title} className="rgb-split inline-block">
              {p.title}
            </span>
          )}
        </h3>
        <p data-in className="mt-6 max-w-md text-base leading-relaxed text-muted md:text-lg">
          {p.desc}
        </p>
        <ul data-in className="mono mt-6 flex flex-wrap gap-2" aria-label="Tags">
          {p.tags.map((tag) => (
            <li key={tag} className="border border-line px-2.5 py-1 text-paper-dim">
              {tag}
            </li>
          ))}
        </ul>
        <p data-in className="mono mt-8">
          {p.href ? (
            <a
              href={p.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group inline-flex items-center gap-2 text-paper underline decoration-line-strong underline-offset-8 transition-colors hover:text-signal hover:decoration-signal"
            >
              {p.linkLabel}
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                {external ? "↗" : "→"}
              </span>
            </a>
          ) : (
            <span className="text-muted-2">{privateLabel}</span>
          )}
        </p>
      </div>

      <div className={cn("md:col-span-6", flip ? "md:order-1 md:col-start-1" : "md:col-start-7")}>
        <TiltCard tiltLimit={6} scale={1.02} effect="gravitate" className="border border-line bg-ink-800">
          <div data-thumb className="relative aspect-[16/10] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={p.imageAlt}
              loading="lazy"
              decoding="async"
              className={cn("h-full w-full", p.id === "motion" ? "object-contain p-6" : "object-cover object-top")}
            />
            <span className="mono absolute bottom-3 left-3 bg-ink-950/80 px-2 py-1 text-muted">
              {p.title.toLowerCase().replace(/\s+/g, "_")}.mov
            </span>
          </div>
        </TiltCard>
      </div>
    </li>
  );
}
