"use client";

import { useLang } from "@/lib/i18n";
import { contactInfo } from "@/lib/content";
import { scrollToTarget } from "@/features/scroll/SmoothScroll";
import { useReducedMotion } from "@/lib/hooks";

export function Footer() {
  const { t } = useLang();
  const reduced = useReducedMotion();
  return (
    <footer className="mono border-t border-line px-[var(--gutter)] pb-20 pt-10 text-muted-2">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <p>© {new Date().getFullYear()} Kaio Felipe Homem · {t.footer.built}</p>
        <ul className="flex flex-wrap gap-6">
          <li>
            <a href="/ferramentas/" className="hover:text-paper">
              {t.footer.tools}
            </a>
          </li>
          <li>
            <a href="/privacidade.html" className="hover:text-paper">
              {t.footer.privacy}
            </a>
          </li>
          <li>
            <a href={contactInfo.repo} target="_blank" rel="noopener noreferrer" className="hover:text-paper">
              {t.footer.source} ↗
            </a>
          </li>
          <li>
            <button type="button" onClick={() => scrollToTarget(0, reduced)} className="hover:text-signal">
              ↑ {t.footer.top}
            </button>
          </li>
        </ul>
      </div>
    </footer>
  );
}
