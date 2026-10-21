"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import { useReducedMotion } from "@/lib/hooks";
import { contactInfo, emailjsConfig } from "@/lib/content";
import { fitSize } from "@/lib/motion";
import { Magnetic } from "@/components/Magnetic";
import { sound } from "@/lib/sound";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "ok" | "err" | "invalid";

export function Contact() {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-big]",
        { yPercent: 110, "--wdth": 62 },
        { yPercent: 0, "--wdth": 125, duration: 1.5, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: "[data-bigwrap]", start: "top 80%" } },
      );
      gsap.fromTo("[data-cin]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: "[data-cgrid]", start: "top 85%" } });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("from_name") || "").trim();
    const email = String(data.get("from_email") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      // Loaded on demand: nobody downloads the mail client until they send something.
      const emailjs = (await import("@emailjs/browser")).default;
      await emailjs.sendForm(emailjsConfig.serviceId, emailjsConfig.templateId, form, { publicKey: emailjsConfig.publicKey });
      setStatus("ok");
      sound.confirm();
      form.reset();
    } catch (err) {
      console.error("EmailJS error:", err);
      setStatus("err");
    }
  };

  const f = t.contact.form;
  const field = "w-full border-b border-line-strong bg-transparent py-3 text-lg text-paper placeholder:text-muted-2 focus:border-signal focus:outline-none";

  return (
    <section id="contact" ref={root} tabIndex={-1} aria-labelledby="contact-title" className="relative px-[var(--gutter)] pb-40 pt-32 outline-none md:pt-44">
      <div className="mono mb-10 flex items-center gap-4 text-muted-2">
        <span className="text-paper">{t.contact.comp}</span>
        <span className="kf text-signal" />
        <span>{t.contact.label}</span>
        <span className="h-px flex-1 bg-line-strong" />
      </div>

      <h2 id="contact-title" data-bigwrap className="display" style={{ fontSize: fitSize(t.contact.big, "clamp(3.5rem,13vw,13rem)") }}>
        {t.contact.big.map((w, i) => (
          <span key={w} className={cn("block overflow-hidden pb-[0.05em]", i === 1 && "text-signal", i === 2 && "md:pl-[18%]")}>
            <span data-big className="block [font-variation-settings:'wdth'_var(--wdth,125)]">
              {w}
            </span>
          </span>
        ))}
      </h2>

      <div data-cgrid className="mt-20 grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p data-cin className="max-w-md text-lg leading-relaxed text-muted">
            {t.contact.sub}
          </p>
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {[
              { k: "E-mail", v: contactInfo.email, href: `mailto:${contactInfo.email}` },
              { k: "LinkedIn", v: "kaio-homem", href: contactInfo.linkedin },
              { k: "GitHub", v: "@KaioHomem", href: contactInfo.github },
              { k: "Tel", v: contactInfo.phone, href: contactInfo.phoneHref },
            ].map((l) => (
              <li key={l.k} data-cin>
                <a
                  href={l.href}
                  {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center justify-between py-4 transition-colors hover:text-signal"
                >
                  <span className="mono text-muted-2">{l.k}</span>
                  <span className="flex items-center gap-3">
                    {l.v}
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">
                      ↗
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div data-cin className="mt-10">
            <Magnetic strength={0.2}>
              <a
                href={t.cv}
                download="Kaio Felipe Homem.pdf"
                data-cursor-label="PDF"
                className="mono inline-flex items-center gap-3 bg-paper px-6 py-4 text-ink-950 transition-colors hover:bg-signal"
              >
                ↓ {t.contact.cv}
              </a>
            </Magnetic>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8 md:col-span-6 md:col-start-7" aria-describedby="form-status">
          <label data-cin className="block">
            <span className="mono text-muted-2">{f.name}</span>
            <input name="from_name" type="text" autoComplete="name" required placeholder={f.namePh} className={field} />
          </label>
          <label data-cin className="block">
            <span className="mono text-muted-2">{f.email}</span>
            <input name="from_email" type="email" autoComplete="email" required placeholder={f.emailPh} className={field} />
          </label>
          <label data-cin className="block">
            <span className="mono text-muted-2">{f.msg}</span>
            <textarea name="message" rows={4} required placeholder={f.msgPh} className={cn(field, "resize-none")} />
          </label>
          <div data-cin className="flex flex-wrap items-center gap-6">
            <button
              type="submit"
              disabled={status === "sending"}
              className="mono group inline-flex items-center gap-3 border border-signal px-6 py-4 text-signal transition-colors hover:bg-signal hover:text-ink-950 disabled:opacity-50"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status === "sending" ? f.sending : f.send}
            </button>
            <p id="form-status" role="status" aria-live="polite" className={cn("text-sm", status === "ok" ? "text-paper" : "text-signal")}>
              {status === "ok" && f.ok}
              {status === "err" && f.err}
              {status === "invalid" && f.invalid}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
