"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getContent, LANGS, type Lang } from "./content";

// Same rules as the old site: a saved choice wins, then the browser language, then Portuguese.
// The static HTML is Portuguese; other languages swap in on the client.
const KEY = "kf_lang";

function detect(): Lang {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && (LANGS as string[]).includes(stored)) return stored as Lang;
  } catch {}
  const raw = (navigator.language || "pt").toLowerCase();
  return raw.startsWith("de") ? "de" : raw.startsWith("en") ? "en" : "pt";
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: ReturnType<typeof getContent> };
const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const detected = detect();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the language is only knowable on the client
    if (detected !== "pt") setLangState(detected);
  }, []);

  useEffect(() => {
    document.documentElement.lang = getContent(lang).htmlLang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: getContent(lang) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang outside LangProvider");
  return ctx;
}
