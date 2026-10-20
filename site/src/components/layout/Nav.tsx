"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { LANGS } from "@/lib/content";
import { setState, useStore } from "@/lib/store";
import { scrollToTarget } from "@/features/scroll/SmoothScroll";
import { useReducedMotion } from "@/lib/hooks";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

export function Nav() {
  const { t, lang, setLang } = useLang();
  const soundOn = useStore((s) => s.sound);
  const hidden = useStore((s) => s.navHidden);
  const introDone = useStore((s) => s.introDone);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!introDone || reduced) return;
    gsap.fromTo(ref.current!.children, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "expo.out", delay: 0.4 });
  }, [introDone, reduced]);

  const links = [
    { id: "work", label: t.nav.work },
    { id: "about", label: t.nav.about },
    { id: "journey", label: t.nav.journey },
    { id: "contact", label: t.nav.contact },
  ];

  const go = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    sound.confirm();
    scrollToTarget(el, reduced);
    el.focus({ preventScroll: true });
  };

  return (
    <>
      <a href="#main" className="mono sr-only z-[100] bg-signal px-3 py-2 text-ink-950 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        {t.nav.skip}
      </a>
      <header
        ref={ref}
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-[var(--nav-h)] items-center justify-between gap-3 bg-gradient-to-b from-ink-900 via-ink-900/80 to-transparent px-[var(--gutter)] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
          hidden && "-translate-y-full",
        )}
      >
        <a
          href="#top"
          onClick={(e) => go(e, "top")}
          className="mono flex items-center gap-3 text-paper"
          aria-label="Kaio Felipe — início"
        >
          <span className="kf kf-fill text-signal" />
          <span>
            Kaio Felipe <span className="text-muted-2 max-sm:hidden">/ dev · motion</span>
          </span>
        </a>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="mono flex gap-8">
            {links.map((l, i) => (
              <li key={l.id}>
                <a href={`#${l.id}`} onClick={(e) => go(e, l.id)} className="group flex gap-2 text-muted transition-colors hover:text-paper">
                  <span className="text-muted-2 group-hover:text-signal">0{i + 2}</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mono flex items-center gap-3 sm:gap-5">
          <div role="group" aria-label="Idioma / Language / Sprache" className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLang(l);
                  sound.tick();
                }}
                aria-pressed={lang === l}
                className={cn("px-1.5 py-1 transition-colors", lang === l ? "text-paper" : "text-muted-2 hover:text-muted")}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setState({ sound: !soundOn });
              if (!soundOn) setTimeout(() => sound.confirm(), 10);
            }}
            aria-pressed={soundOn}
            className="flex items-center gap-2 text-muted transition-colors hover:text-paper"
          >
            <span aria-hidden className="flex h-3 items-end gap-[2px]">
              {[0.5, 1, 0.7, 0.9].map((h, i) => (
                <span
                  key={i}
                  className={cn("w-[2px] bg-current", soundOn && "animate-pulse")}
                  style={{ height: soundOn ? `${h * 100}%` : "2px", animationDelay: `${i * 120}ms` }}
                />
              ))}
            </span>
            <span className="max-sm:sr-only">{soundOn ? t.nav.soundOn : t.nav.soundOff}</span>
          </button>
        </div>
      </header>
    </>
  );
}
