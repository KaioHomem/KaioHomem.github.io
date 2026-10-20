"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { duration, ease } from "@/lib/motion";
import { setState } from "@/lib/store";
import { useLang } from "@/lib/i18n";
import { getLenis } from "@/features/scroll/SmoothScroll";
import { sound } from "@/lib/sound";

const KEY = "kf:intro-seen";
const TOTAL = 90;

/**
 * A render queue, about 1.6 s, once per session: the composition "renders" its frames,
 * then the frame splits open like a shutter. Any key, click or tap skips it.
 * Without JavaScript the overlay removes itself with CSS, so the page is never stuck.
 */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const finish = () => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      getLenis()?.start();
      setState({ introDone: true });
      setGone(true);
    };

    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    getLenis()?.stop();
    const el = root.current!;
    const counter = el.querySelector<HTMLElement>("[data-counter]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;
    const lines = el.querySelectorAll<HTMLElement>("[data-step]");
    const frames = { n: 0 };

    const tl = gsap.timeline({ onComplete: finish });
    tl.set(el, { animation: "none" })
      .from(el.querySelectorAll("[data-head]"), { opacity: 0, y: 8, duration: 0.3, stagger: 0.07, ease: ease.soft })
      .to(
        frames,
        {
          n: TOTAL,
          duration: 1.15,
          ease: "power2.inOut",
          onUpdate: () => {
            counter.textContent = String(Math.round(frames.n)).padStart(3, "0");
          },
        },
        0.15,
      )
      .to(bar, { scaleX: 1, duration: 1.15, ease: "power2.inOut" }, 0.15);
    lines.forEach((line, i) => {
      tl.fromTo(line, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.12, onStart: sound.tick }, 0.25 + i * 0.25);
    });
    tl.to(el.querySelector("[data-content]"), { opacity: 0, duration: duration.fast, ease: ease.exit }, "+=0.1")
      .call(() => sound.whoosh())
      .to(el.querySelector("[data-top]"), { yPercent: -100, duration: duration.slow, ease: ease.inOut }, "<")
      .to(el.querySelector("[data-bottom]"), { yPercent: 100, duration: duration.slow, ease: ease.inOut }, "<")
      .call(() => setState({ introDone: true }), [], "-=0.75");

    const skip = () => tl.progress(1);
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      tl.kill();
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      role="status"
      aria-label={t.intro.title}
      className="fixed inset-0 z-[80] [animation:intro-fallback_0.4s_3.5s_forwards]"
    >
      <style>{`@keyframes intro-fallback{to{opacity:0;visibility:hidden}}`}</style>
      {/* two shutter halves */}
      <div data-top className="absolute inset-x-0 top-0 h-1/2 bg-ink-950" />
      <div data-bottom className="absolute inset-x-0 bottom-0 h-1/2 border-t border-line bg-ink-950" />

      <div data-content className="mono absolute inset-x-[var(--gutter)] bottom-[14vh] max-w-md text-muted">
        <div className="mb-6 flex items-baseline justify-between gap-6">
          <p data-head className="text-paper">
            {t.intro.title}
          </p>
          <p data-head className="tabular-nums text-muted-2">
            <span data-counter className="text-signal">
              000
            </span>{" "}
            / {TOTAL}
          </p>
        </div>
        {t.intro.steps.map((s, i) => (
          <p key={s} data-step className="flex justify-between leading-7 opacity-0">
            <span className={i === t.intro.steps.length - 1 ? "text-signal" : ""}>{s}</span>
            <span className="text-muted-2">{i === t.intro.steps.length - 1 ? "●" : "OK"}</span>
          </p>
        ))}
        <div className="mt-6 h-px w-full bg-line">
          <div data-bar className="h-px origin-left scale-x-0 bg-signal" />
        </div>
      </div>
    </div>
  );
}
