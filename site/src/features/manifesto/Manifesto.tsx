"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { setState } from "@/lib/store";
import { useReducedMotion } from "@/lib/hooks";
import { SplitChars } from "@/components/SplitChars";

/** Font size that keeps a word on one line, however long it is in the active language. */
const fit = (word: string) => `min(var(--text-mega), ${(112 / Math.max(word.length, 4)).toFixed(2)}vw)`;
const ECHOES = 4;

/**
 * Four words, one screen each. The section pins and the scroll drives one timeline.
 * Each word enters and leaves with its own transition, the way a motion piece would:
 *  1. stretch  — letters expand along the width axis
 *  2. echo     — a stack of trailing copies collapses into one, then splits apart
 *  3. focus    — a blurred, spaced-out word snaps into focus
 *  4. wipe     — a violet matte wipes across, then the camera pushes through the word
 */
export function Manifesto() {
  const { t, lang } = useLang();
  const root = useRef<HTMLElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const words = t.manifesto.words;

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]");
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: `+=${scenes.length * 95}%`,
          pin: pinned.current,
          scrub: 0.7,
          onToggle: (self) => setState({ navHidden: self.isActive }),
          onUpdate: (self) => {
            gsap.set("[data-progress]", { scaleX: self.progress });
            const i = Math.min(scenes.length - 1, Math.floor(self.progress * scenes.length));
            const counter = root.current?.querySelector("[data-counter]");
            if (counter) counter.textContent = String(i + 1).padStart(2, "0");
            const big = root.current?.querySelector("[data-bigframe]");
            if (big) big.textContent = String(Math.round(self.progress * 360)).padStart(3, "0");
          },
        },
      });

      scenes.forEach((scene, i) => {
        const word = scene.querySelector("[data-word]");
        const chars = scene.querySelectorAll("[data-c]");
        const echoes = scene.querySelectorAll("[data-echo]");
        const matte = scene.querySelector("[data-matte]");
        const line = scene.querySelector("[data-line]");
        const at = i * 3;
        tl.set(scene, { autoAlpha: 1 }, at);

        if (i === 0) {
          tl.fromTo(chars, { "--wdth": 50, yPercent: 60, autoAlpha: 0 }, { "--wdth": 125, yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 1.1 }, at);
          tl.to(chars, { yPercent: -120, autoAlpha: 0, stagger: 0.05, duration: 0.9, ease: "power2.in" }, at + 2);
        }
        if (i === 1) {
          tl.fromTo(echoes, { yPercent: (k: number) => (k + 1) * 26, autoAlpha: (k: number) => 0.5 - k * 0.1 }, { yPercent: 0, autoAlpha: 0, duration: 1.1 }, at);
          tl.fromTo(word, { scaleY: 1.5, autoAlpha: 0 }, { scaleY: 1, autoAlpha: 1, duration: 1.1, ease: "power3.out" }, at);
          tl.to(echoes, { yPercent: (k: number) => -(k + 1) * 30, autoAlpha: (k: number) => 0.45 - k * 0.1, duration: 0.6 }, at + 2);
          tl.to(word, { autoAlpha: 0, duration: 0.6 }, at + 2.2);
          tl.to(echoes, { autoAlpha: 0, duration: 0.3 }, at + 2.7);
        }
        if (i === 2) {
          tl.fromTo(word, { filter: "blur(28px)", letterSpacing: "0.4em", autoAlpha: 0 }, { filter: "blur(0px)", letterSpacing: "-0.035em", autoAlpha: 1, duration: 1.2, ease: "power3.out" }, at);
          tl.to(word, { filter: "blur(22px)", scale: 1.15, autoAlpha: 0, duration: 0.9, ease: "power2.in" }, at + 2);
        }
        if (i === 3) {
          tl.fromTo(word, { xPercent: 30, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }, at);
          tl.fromTo(matte, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.8 }, at + 0.9);
          tl.to(matte, { clipPath: "inset(0 0 0 100%)", duration: 0.6 }, at + 1.75);
          tl.to(word, { scale: 10, autoAlpha: 0, duration: 1, ease: "power2.in" }, at + 2);
        }
        tl.fromTo(line, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.6);
        tl.to(line, { autoAlpha: 0, duration: 0.4 }, at + 2);
        tl.set(scene, { autoAlpha: 0 }, at + 3);
      });
    }, root);
    return () => {
      ctx.revert();
      setState({ navHidden: false });
    };
    // lang: the words change length, so every tween is rebuilt.
  }, [reduced, lang]);

  if (reduced) {
    return (
      <section id="manifesto" tabIndex={-1} aria-label={t.manifesto.a11y} className="px-[var(--gutter)] py-32 outline-none">
        <p className="mono mb-12 text-muted-2">{t.manifesto.label}</p>
        <ol className="grid gap-16 md:grid-cols-2">
          {words.map((w) => (
            <li key={w.word}>
              <p className="display text-[clamp(3rem,10vw,8rem)]">{w.word}</p>
              <p className="mono mt-4 text-muted">{w.line}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section key={lang} id="manifesto" ref={root} tabIndex={-1} aria-label={t.manifesto.a11y} className="relative outline-none">
      <div ref={pinned} className="relative h-svh overflow-hidden">
        <h2 className="sr-only">{t.manifesto.a11y}</h2>

        {/* giant frame counter in the background */}
        <p aria-hidden data-bigframe className="display pointer-events-none absolute -bottom-[0.12em] left-[var(--gutter)] text-[28vw] text-ink-800">
          000
        </p>

        {words.map((w, i) => (
          <div key={w.word} data-scene className="invisible absolute inset-0 flex flex-col items-center justify-center px-[var(--gutter)]" aria-hidden>
            <div className="relative">
              {i === 1 &&
                Array.from({ length: ECHOES }, (_, k) => (
                  <p
                    key={k}
                    data-echo
                    className="display absolute inset-0 text-transparent [-webkit-text-stroke:1px_var(--paper-dim)]"
                    style={{ fontSize: fit(w.word) }}
                  >
                    {w.word}
                  </p>
                ))}
              <p data-word className="display relative whitespace-nowrap will-change-transform" style={{ fontSize: fit(w.word) }}>
                {i === 0 ? (
                  <SplitChars text={w.word} attr="data-c" charClassName="[font-variation-settings:'wdth'_var(--wdth,125)]" />
                ) : (
                  w.word
                )}
                {i === 3 && (
                  <span data-matte aria-hidden className="absolute inset-0 bg-signal text-ink-950 [clip-path:inset(0_100%_0_0)]">
                    {w.word}
                  </span>
                )}
              </p>
            </div>
            <p data-line className="mono mt-8 text-center text-muted">
              {w.line}
            </p>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-20 flex items-center gap-6 px-[var(--gutter)]">
          <span className="mono tabular-nums text-muted-2">
            <span data-counter className="text-paper">
              01
            </span>{" "}
            / 0{words.length}
          </span>
          <span className="h-px flex-1 bg-line">
            <span data-progress className="block h-px origin-left scale-x-0 bg-signal" />
          </span>
          <span className="mono text-muted-2">{t.manifesto.label}</span>
        </div>
      </div>
    </section>
  );
}
