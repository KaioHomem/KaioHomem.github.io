"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { timecode } from "@/lib/motion";
import { scrollToTarget } from "@/features/scroll/SmoothScroll";
import { useReducedMotion } from "@/lib/hooks";
import { sound } from "@/lib/sound";

// The whole page reads as a 90-second composition: the timecode and the playhead
// follow the scroll, and every section is a keyframe you can jump to.
const DURATION = 90;
const SECTIONS = ["top", "manifesto", "work", "about", "stack", "journey", "contact"] as const;

type Marker = { id: string; at: number };

export function TimelineHud() {
  const { t } = useLang();
  const reduced = useReducedMotion();
  const tc = useRef<HTMLSpanElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [active, setActive] = useState("top");

  const names: Record<string, string> = {
    top: "COMP 00",
    manifesto: "COMP 01",
    work: t.work.label,
    about: t.about.label,
    stack: t.stack.label,
    journey: t.journey.label,
    contact: t.contact.label,
  };

  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      setMarkers(
        SECTIONS.flatMap((id) => {
          const el = document.getElementById(id);
          if (!el) return [];
          return [{ id, at: Math.min(1, (el.getBoundingClientRect().top + window.scrollY) / max) }];
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    let lastFrame = -1;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (tc.current) tc.current.textContent = timecode(p * DURATION);
      if (head.current) head.current.style.transform = `translateX(${(p * 100).toFixed(3)}cqw)`;
      const frame = Math.floor(p * DURATION * 2);
      if (frame !== lastFrame) {
        if (lastFrame !== -1) sound.tick();
        lastFrame = frame;
      }
      let current = "top";
      for (const m of markers) if (p + 0.002 >= m.at) current = m.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [markers]);

  return (
    <div aria-hidden={false} className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-[var(--gutter)] pb-3">
      <div className="mono mb-2 flex items-center justify-between text-muted-2">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
          <span className="text-paper-dim">REC</span>
          <span ref={tc} className="tabular-nums text-paper">
            00:00:00:00
          </span>
        </span>
        <span className="max-sm:hidden">{names[active]}</span>
      </div>
      <div className="relative h-3 [container-type:inline-size]">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
        {markers.map((m) => (
          <button
            key={m.id}
            type="button"
            tabIndex={-1}
            aria-label={names[m.id]}
            onClick={() => {
              const el = document.getElementById(m.id);
              if (el) {
                sound.confirm();
                scrollToTarget(el, reduced);
              }
            }}
            className="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-1"
            style={{ left: `${m.at * 100}%` }}
          >
            <span className={`kf block h-2 w-2 ${active === m.id ? "kf-fill text-signal" : "text-muted"}`} />
          </button>
        ))}
        <div ref={head} className="absolute inset-y-[-4px] left-0 w-px bg-signal will-change-transform">
          <span className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] bg-signal" />
        </div>
      </div>
    </div>
  );
}
