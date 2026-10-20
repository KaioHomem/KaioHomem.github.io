# Kaio Felipe Homem — Personal Portfolio Site

[![Site](https://img.shields.io/badge/Live-KaioHomem.github.io-blue?style=flat&logo=github)](https://KaioHomem.github.io)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-kaio--homem-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/kaio-homem-bb118335b/)

Personal portfolio built like a motion piece: the page reads as a composition being rendered, with a timecode that follows the scroll and a chrome KF monogram rendered in Blender that the scroll scrubs frame by frame.

## Features

- Render-queue intro, giant variable-width type and scroll-driven scenes (GSAP + ScrollTrigger, Lenis)
- Chrome monogram rendered in Blender Cycles (`site/cgi/kf_monogram.py`), drawn on a 2D canvas as a WebP sequence, loaded after the first paint and skipped on save-data
- PT / EN / DE, detected from the browser, choice remembered
- Contact form through EmailJS, loaded only when someone sends a message
- Full `prefers-reduced-motion` fallback: no intro, no smooth scroll, no pinning, same content
- Synthesized interface sounds (Web Audio, no files), off by default

## Stack

`Next.js (static export)` · `TypeScript` · `Tailwind CSS 4` · `GSAP` · `Lenis` · `Blender` · `EmailJS` · two components from [Spell UI](https://spell.sh) (MIT)

## Running locally

```bash
cd site
npm install
npm run dev          # http://localhost:3000
```

Full production output, exactly as GitHub Pages serves it:

```bash
cd site
npm run build        # Next.js export into site/out
npm run assemble     # copies the static files from the repository root next to it
```

Re-render the monogram (Blender 4.5, GPU):

```bash
blender -b -P site/cgi/kf_monogram.py -- --out site/cgi/out --samples 40 --size 1000
```

Then convert the PNG frames to WebP into `site/public/cgi/` (desktop, 1000 px) and `site/public/cgi/m/` (phones, 560 px) with ffmpeg.

## Project structure

```
KaioHomem.github.io/
├── site/               # The portfolio (Next.js) — the home page at /
│   ├── src/            # App, sections, motion system, PT/EN/DE content
│   ├── public/cgi/     # Rendered monogram frames
│   └── cgi/            # Blender script that renders them
├── ferramentas/        # Free calculator suite (see below)
├── produtos/           # Folha Simples
├── privacidade.html
├── cv-kaio-felipe*.pdf
├── sitemap.xml         # Generated — do not edit by hand
├── robots.txt
└── docs/redesign/      # Plan and decisions behind the redesign
```

`.github/workflows/pages.yml` builds `site/`, copies every static file from the root next to it and publishes the result, so the calculator and product URLs never change.

---

# Ferramentas BR — calculator suite

Eight free, no-signup calculators at
[/ferramentas](https://kaiohomem.github.io/ferramentas/): net salary, severance
pay, 13th salary, vacation pay, unemployment benefit, overtime, compound
interest and loan amortization — using the 2026 Brazilian tax tables.

Everything runs client-side. There is no back-end, no database and no form that
captures user data — the numbers people type never leave their browser.

## Why it exists

Evergreen calculators are a durable kind of content: they answer a question
people search for every month, they do not go stale the way news posts do, and
they need almost no upkeep beyond one table update a year. That makes them a
sensible base for ad or affiliate revenue — but the tools have to be genuinely
correct first, which is what the test suite is for.

## Files

```
ferramentas/
├── nucleo.js            # Calculation core — pure functions, no DOM
├── testes.js            # Test suite (Node). CI gate.
├── verificar-tabelas.js # Flags when the fiscal tables go stale
├── verificar-consistencia.js # Nav / hub / sitemap must agree
├── consentimento.js     # LGPD gate — ads load only after consent
├── gerar-sitemap.js     # Regenerates sitemap.xml
├── app.js               # Shared header/footer + input helpers
├── monetizacao.js       # >>> Monetization config — the file you edit
├── tools.css            # Styles
├── index.html           # Hub
├── pg-*.js              # Per-page logic
└── *.html               # One page per calculator
```

## The calculation core

All fiscal parameters live in a single `TABELAS` object at the top of
`nucleo.js` — INSS brackets, the IRRF table, the simplified deduction and the
`redutor` introduced by Lei 15.270/2025 (the rule that exempts income up to
R$ 5.000 and phases out at R$ 7.350).

`nucleo.js` has no DOM access, so the same code that runs in the browser runs
under Node in CI.

## Tests

```bash
node ferramentas/testes.js
```

126 assertions pinned to independently verifiable reference points — the
R$ 988,09 INSS ceiling, the redutor reaching exactly zero at R$ 7.350, the
unemployment brackets meeting exactly at R$ 1.777,74 and R$ 2.518,65, Price and
SAC schedules amortizing to a zero balance — plus invariants such as "net pay
never decreases when gross pay increases".

Several assertions exist to catch a *specific* wrong refactor rather than to
check a number. The 13th-salary INSS is asserted equal to the monthly INSS of
the same amount, so that if anyone ever adds the bonus to the month's salary
before taxing it, the suite fails instead of quietly overtaxing users.

The suite runs on every push to `ferramentas/` and blocks the monthly
maintenance job. If a table is edited and a reference stops holding, CI fails
instead of quietly publishing wrong numbers.

```bash
node ferramentas/verificar-consistencia.js
```

A second gate, 232 checks. The list of calculators lives in four places that
must agree — the nav in `app.js`, the hub cards, the sitemap, and the pages
themselves — and nothing enforced that. Adding a tool and forgetting one spot
produced a page that existed but was unreachable: invisible to users and to
search engines, with no error anywhere. This makes that a failed build.

It also checks per-page SEO basics (one `<h1>`, canonical, usable meta
description, JSON-LD), that `consentimento.js` is loaded before
`monetizacao.js` on every page — the consent gate does nothing if that order
is wrong — and scans for committed secrets. Publisher ids and OAuth client ids
are deliberately *not* flagged: they are public by design, and warning on
correct configuration teaches people to ignore warnings.

```bash
node ferramentas/auditoria.js
```

A third gate, 213 checks, no browser and no network — cheap enough to run on
every push. It catches what silently rots on a static site: links that stop
resolving, `<img>` without alt, resources loaded over `http://`, external
links missing `rel="noopener"`, and sitemap entries pointing at files that no
longer exist.

Weight is measured **per page** — the scripts and stylesheets that page
actually references — not by summing every file in the repository. The first
version did the latter and reported 150KB of JavaScript, which was simply
wrong: no browser downloads the test suite. The real worst page is ~84KB.

## Automated maintenance

`.github/workflows/ferramentas.yml` runs on the 1st of each month:

1. runs the test suite,
2. regenerates `sitemap.xml` and commits it if it changed,
3. checks whether the fiscal tables have gone stale, and opens an issue with a
   checklist if they have.

Step 3 is the one thing automation cannot finish on its own: reading the new
official values off a government publication needs a human. The issue is the
handoff.

## Updating the tax tables (once a year, every January)

1. Edit only the `TABELAS` object in `ferramentas/nucleo.js`.
2. Run `node ferramentas/testes.js`. Reference assertions will fail on
   purpose — they point at last year's numbers.
3. Check each failure against the official source, then update the expected
   value in the test.

Sources: the interministerial ordinance for INSS, and the Receita Federal
normative instruction for IRRF.

## Turning on monetization

The site ships with monetization **off**. While it is off, no third-party
script loads and no ad space renders — the pages stay clean and fast.

Everything is configured in one file: `ferramentas/monetizacao.js`.

**AdSense.** Sign up at adsense.google.com with the site URL. Google reviews
the site before approving, and it needs real content and real traffic to pass —
which is why the tools ship first and ads come later. Once approved, create
three display units, paste the publisher id and the three slot ids into
`monetizacao.js`, and set `ativo: true`.

**Affiliates.** Fill the `blocos` object with real programs — keyed by tool —
and set `ativo: true`. Each entry renders as a card under that tool's result.
Links are emitted with `rel="sponsored nofollow noopener"`. Only add offers
that actually fit the tool; a relevant link under the financing calculator
earns, a random banner just costs trust.

These are the only steps that need a person: an account has to be opened by
whoever legally owns it and gets paid.

## Consent and privacy (LGPD)

`ferramentas/consentimento.js` is a real gate, not a banner: AdSense is never
loaded until the visitor accepts, and `monetizacao.js` fails closed if the
consent module is missing. Declining keeps the page fully functional — the
calculators never depended on cookies.

The banner only renders when something actually sets a cookie. With
monetization off the site sets none, so no banner appears. A consent prompt on
a site that sets no cookies is theatre, and it trains people to click through
the real ones.

`/privacidade.html` is the policy AdSense requires for approval. It discloses
the Google Fonts request (an IP transfer with no cookie), what `localStorage`
holds, and the LGPD rights of the visitor. Keep it truthful as integrations
change — it is the page a reviewer reads.

---

Made by [Kaio Felipe](https://KaioHomem.github.io) · Lages, SC
