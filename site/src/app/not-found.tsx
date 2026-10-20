"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLang();
  return (
    <main id="main" className="flex min-h-svh flex-col justify-center px-[var(--gutter)]">
      <p className="mono mb-6 flex items-center gap-3 text-muted-2">
        <span className="kf kf-fill text-signal" /> ERR · 404
      </p>
      <h1 className="display text-[clamp(3rem,12vw,11rem)]">{t.notFound.title}</h1>
      <p className="mt-6 max-w-md text-lg text-muted">{t.notFound.text}</p>
      <Link href="/" className="mono mt-10 inline-flex w-fit items-center gap-3 border border-signal px-6 py-4 text-signal hover:bg-signal hover:text-ink-950">
        ← {t.notFound.back}
      </Link>
    </main>
  );
}
