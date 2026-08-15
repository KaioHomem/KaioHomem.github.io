# Kaio Felipe Homem — Personal Portfolio Site

[![Site](https://img.shields.io/badge/Live-KaioHomem.github.io-blue?style=flat&logo=github)](https://KaioHomem.github.io)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-kaio--homem-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/kaio-homem-bb118335b/)

Personal portfolio and professional presentation site, built entirely with HTML, CSS and JavaScript — no frameworks.

## Features

- Responsive layout with mobile hamburger menu
- Smooth scroll section reveal via IntersectionObserver
- Contact form integrated with EmailJS (client-side email delivery)
- Active nav link tracking on scroll
- Semantic HTML5 and accessible markup

## Stack

`HTML5` · `CSS3` · `JavaScript` · `EmailJS`

## Running locally

```bash
# Clone the repo
git clone https://github.com/KaioHomem/KaioHomem.github.io.git

# Open in browser
open index.html     # macOS
start index.html    # Windows
```

No build step. No dependencies to install. Open and go.

## Project structure

```
KaioHomem.github.io/
├── index.html          # Main page
├── style.css           # Styles and design system
├── script.js           # Interactivity and form logic
├── translations.js     # PT / EN / DE strings
├── sitemap.xml         # Generated — do not edit by hand
├── robots.txt
└── ferramentas/        # Free calculator suite (see below)
```

---

# Ferramentas BR — calculator suite

A set of free, no-signup calculators at
[/ferramentas](https://kaiohomem.github.io/ferramentas/): net salary, severance
pay, 13th salary, vacation pay, compound interest and loan amortization, using
the 2026 Brazilian tax tables.

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

94 assertions pinned to independently verifiable reference points — the
R$ 988,09 INSS ceiling, the redutor reaching exactly zero at R$ 7.350,
Price and SAC schedules amortizing to a zero balance — plus invariants such as
"net pay never decreases when gross pay increases".

The suite runs on every push to `ferramentas/` and blocks the monthly
maintenance job. If a table is edited and a reference stops holding, CI fails
instead of quietly publishing wrong numbers.

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
