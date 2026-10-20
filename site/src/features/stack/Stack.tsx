"use client";

import { useLang } from "@/lib/i18n";
import { SectionHead } from "@/components/SectionHead";
import { Marquee } from "@/components/spell/marquee";

/**
 * The stack laid out like an After Effects effects panel: each group twirls open
 * (plain <details>, so it works without JavaScript) and every item is an "fx" row.
 */
export function Stack() {
  const { t } = useLang();
  const all = t.stack.groups.flatMap((g) => g.items);

  return (
    <section id="stack" tabIndex={-1} aria-labelledby="stack-title" className="relative py-32 outline-none md:py-44">
      <div aria-hidden className="mb-24 border-y border-line py-6">
        <Marquee duration={40} fadeAmount={8}>
          {all.map((item) => (
            <span key={item} className="display flex items-center gap-8 pr-8 text-[clamp(2rem,5vw,4rem)] text-ink-700">
              {item}
              <span className="kf h-3 w-3 text-signal" />
            </span>
          ))}
        </Marquee>
      </div>

      <div className="px-[var(--gutter)]">
        <SectionHead id="stack" comp={t.stack.comp} label={t.stack.label} title={t.stack.title} />
        <div className="grid gap-px border border-line bg-line md:grid-cols-2">
          {t.stack.groups.map((g, gi) => (
            <details key={g.name} open className="group bg-ink-900">
              <summary className="mono flex cursor-pointer list-none items-center justify-between gap-4 border-b border-line px-5 py-4 text-paper [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3">
                  <span aria-hidden className="inline-block text-muted-2 transition-transform group-open:rotate-90">
                    ▸
                  </span>
                  {g.name}
                </span>
                <span className="text-muted-2">
                  {String(gi + 1).padStart(2, "0")} · {g.items.length} fx
                </span>
              </summary>
              <ul className="divide-y divide-line">
                {g.items.map((item) => (
                  <li key={item} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-ink-800">
                    <span className="flex items-center gap-3">
                      <span aria-hidden className="mono border border-line-strong px-1 text-[0.6rem] text-signal">
                        fx
                      </span>
                      <span className="text-paper-dim">{item}</span>
                    </span>
                    <span aria-hidden className="kf h-1.5 w-1.5 text-muted-2" />
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
