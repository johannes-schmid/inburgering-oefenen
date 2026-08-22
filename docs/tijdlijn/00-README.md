# Tijdlijn Builder — document set

Five files. Written 20 August 2026 for inburgeringoefenen.nl.

| File | What it's for | Who reads it |
|---|---|---|
| `01-PRD.md` | Product requirements: problem, users, scope, states, functionality, metrics, risks, release plan | You, deciding what to build |
| `02-RULES-AND-DATA.md` | Every legal rule, fee, deadline and lead time with its source and check date, plus the algorithm and four worked examples | The build — this is the correctness contract |
| `03-DESIGN-BRIEF.md` | Visual direction, screen specs, wireframes, states, motion, copy deck, RTL, and a paste-ready prompt for Claude Design | Claude Design / the prototype |
| `04-TECHNICAL-SPEC.md` | Architecture, TypeScript types, engine pipeline, URL state, testing, build sequence | The build |
| `inburgering-rules.v1.json` | Seed rules file, ready to drop into `src/features/tijdlijn/rules/` | The build |

## The three things that matter most

**1. The insight.** The 3-year deadline isn't the constraint. Registration takes over 6 weeks and results take 8 to 16 — so the last safe date to register for your final exam is roughly 5–6 months before the legal deadline. Nobody computes this. That's the whole product.

**2. The separation.** Legal facts (cited, dated, verifiable) and our planning estimates (tunable, ranged) are different types in the code and different visual treatments in the UI. Never let them look alike. This is what makes the tool trustworthy rather than a liability.

**3. The gap.** DUO's own step-by-step wizard is Wi2021-only, gives no dates, and is `noindex`. Covering Wi2013, naturalisation-only users, and actual dates — indexably — is uncontested territory.

## Before you build

Five verification tasks are listed at the end of `02-RULES-AND-DATA.md`. Two of them (NT2 B1/B2 result lead times, and whether DUO measures compliance by exam date or result date) affect the arithmetic directly. Close those first.

## Suggested order

Read `01` → skim `02 §1–4` → hand `03` to Claude Design for the prototype → build steps 1–4 of `04 §13` in parallel. The engine and the design can be built independently; they meet at the `Timeline` type.
