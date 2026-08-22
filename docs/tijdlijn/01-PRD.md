# PRD — Tijdlijn Builder (Inburgering Timeline Builder)

**Product:** inburgeringoefenen.nl
**Feature:** `/inburgering/tools/tijdlijn` (EN: `/en/inburgering/tools/timeline`)
**Status:** Draft v1.0 — for build
**Date:** 20 August 2026
**Owner:** Hannes / Studio Firn

---

## 1. Summary

An interactive, dated planner that turns a person's situation (law, status, route, start date, exams already passed) into **a personal timeline with real calendar dates**: when to register, when to sit each exam, when results land, when the legal deadline hits, and how much buffer is left. It also estimates cost, and lets people take a 10-question diagnostic per component that feeds directly back into the plan.

Everything is computed in the browser. No BSN, no DigiD, no account required.

### The one-line pitch

> DUO tells you *what* you must do. We tell you *when* — and whether you're going to make it.

---

## 2. Why this, why now

### 2.1 The real problem

The inburgeringstermijn is 3 years. Almost every source — including DUO's own — presents that as the whole story. It isn't. The binding constraint is not the deadline; it's the **queue in front of it**:

| Step | Duration (DUO, verified 20 Aug 2026) |
|---|---|
| Registering for an exam → actually sitting it | can take **more than 6 weeks** |
| Sitting a knowledge exam or A2 language exam → result | within **8 weeks** |
| Spreken A2 / Schrijven A2 result (current DUO notice) | up to **16 weeks** |
| ONA portfolio review | 6 weeks |
| ONA eindgesprek wait after approval | 6 weeks |
| ONA result | 8 weeks |
| DUO decision on an extension request | 8 weeks |

So someone who books their last exam three months before the deadline has, in fact, already missed it. **The last safe registration date can be 5–6 months before the legal deadline.** Nobody currently computes this for them.

### 2.2 What exists today (competitive scan)

| Source | What it does | Gap we exploit |
|---|---|---|
| **DUO "Maak uw eigen stappenplan"** (inburgeren.nl wizard, 7 languages) | Ordered list of *steps*. Explicitly **Wi2021 only** — Wi2013 users are told to phone. No dates, no arithmetic, no cost, `noindex` so it earns no search traffic. | Dates. Wi2013. Naturalisation-only users. Indexable. |
| **Mijn Inburgering (DUO portal)** | Authoritative personal data — but requires DigiD, is Dutch-only in places, and shows status, not a plan. | No login, multilingual, forward-looking. |
| **Gemeente / klantmanager** | Owns the PIP. Quality varies wildly by municipality. | Consistent, always-available second opinion. |
| **Language schools** | Sell a course, plan around their own calendar. | Vendor-neutral. |
| **Content sites (incl. inburgering.org)** | Explainer articles. | Interactive + personalised + wired to practice exams. |

No one offers a **dated, backward-planned, personalised timeline**. That's the wedge.

### 2.3 Why it fits the business

- **SEO:** owns a large, currently under-served intent cluster — *"inburgering deadline"*, *"hoelang heb ik om in te burgeren"*, *"wanneer moet ik examen doen"*, *"inburgeringstermijn verlopen"*, *"wat kost inburgeren"*. High-intent, low-competition, evergreen. DUO's own tool is `noindex`.
- **Funnel:** the tool's natural next step *is* the product. Every timeline ends with "your first exam is KNM in ~11 weeks → start practising now." Free diagnostic → timeline → paid practice.
- **Email capture with a real reason:** "Send me my timeline + remind me before my last safe registration date" is a far better offer than a gated PDF.
- **Retention hook:** a timeline is a thing you come back to. It gives inburgeringoefenen.nl a reason to exist between exam bookings.
- **Trust/USP alignment:** matches the existing positioning (validated by a real NT2 teacher, not AI slop) — here the equivalent claim is *"every date traced to a DUO source, with the date we checked it."*

---

## 3. Users

### Primary personas

**P1 — Amira, gezinsmigrant, Wi2021, 14 months in.**
Paying for everything herself. Has a PIP, doesn't fully understand it. Anxious about the fine. Needs: what does this cost me in total, and when is the last moment I can still start?
*Success:* she leaves with a dated plan and books the KNM exam.

**P2 — Yonas, asielstatushouder, Wi2021, B1-route, 26 months in, 1 of 4 exams passed.**
Gemeente pays; 2 free attempts per exam. Might qualify for the automatic 6-month extension. Needs: am I going to make it, and do I get more time?
*Success:* he learns he likely qualifies for automatic +6 months, and which exams to prioritise.

**P3 — Marta, EU citizen / not obliged, wants a Dutch passport.**
No inburgeringsplicht, no PIP, no deadline. Her timeline is a *naturalisation* timeline: 5 years' residence + A2 diploma + fees. Needs: what's the fastest legal path.
*Success:* she sees the residence clock and the exam clock side by side and books practice.

**P4 — Kwame, Wi2013, termijn expired, has a fine.**
Excluded from DUO's own tool. Needs: how much extra time do I have now, what do I still owe, what's next.
*Success:* recovery plan rather than panic.

**Secondary users:** NT2 teachers and gemeente klantmanagers using it *with* a client (screen-share / print). Design for that: printable, no login, plain language.

### Jobs to be done

1. "Tell me my actual deadline — and the date I really need to act by."
2. "Tell me what I must do, in what order, and roughly how long each thing takes."
3. "Tell me what this will cost me, and who pays."
4. "Tell me if I'm behind, and what happens if I am."
5. "Tell me where I stand right now" → the diagnostic.
6. "Keep it. Remind me."

---

## 4. Scope

### In scope (v1)

- Wizard: 6–9 branching questions, all optional beyond the first two.
- Deterministic rules engine covering **Wi2021** (B1 / Onderwijs / Z-route), **Wi2013** (A2), and **voluntary / naturalisation-only**.
- Dated, vertical timeline output with backward-planned "last safe date" per component.
- Cost projection (who pays, per-attempt fees, loan eligibility).
- Extension and fine logic (informational, clearly labelled as "possible — DUO decides").
- Embedded 10-question diagnostic per component, feeding readiness estimates back into dates.
- What-if editing: change study hours, mark exams passed, add an extension.
- Save/share: shareable URL (state encoded), print/PDF, `.ics` calendar export, email a copy.
- Languages: **NL, EN, AR** at launch (mirrors existing ad markets). Structure for TR / Tigrinya / Farsi / Dari next.
- Full source citation panel with "checked on" dates.

### Out of scope (v1)

- Any connection to DUO systems, DigiD, Mijn Inburgering, or real exam-slot availability. (No API exists; do not fake it.)
- Legal advice, ontheffing/BIO applications, appeals.
- Automated gemeente-specific rules (municipalities differ; we say "ask your gemeente").
- Account-based multi-device sync (v1.5, only once email capture proves out).
- Predicting *actual* exam slot availability by city.

### Explicit non-goals

- Not a replacement for the PIP or Mijn Inburgering. Every result screen says so, once, calmly.
- Not a fine calculator. Fine amounts depend on data only DUO holds (registered course hours, attempts). We show the **maximum** and the mechanism, never a computed personal figure.

---

## 5. Functional requirements

### 5.1 Input wizard

One question per screen. Progress bar. Back always available. Every answer has an **"I don't know"** option that degrades gracefully into estimate mode — this is essential; many users genuinely don't know which law applies to them.

| # | Question | Options | Drives |
|---|---|---|---|
| Q1 | Where are you in the process? | Not in NL yet / Just arrived, no letter yet / I have a DUO letter / I've been at this a while / My deadline passed / I don't have to but I want a passport | Branch + result mode |
| Q2 | When did you become inburgeringsplichtig? *(or: date on your PIP / DUO letter)* | Date picker, month precision OK / "I don't know" | Termijn start |
| Q3 | Which law? | Wi2021 / Wi2013 / Don't know → auto-derive from Q2 (on-or-after 1 Jan 2022 = Wi2021) | Rule set |
| Q4 | Your status | Asielstatushouder / Family migrant or other / EU or not obliged / Don't know | Who pays, free attempts, fine exposure |
| Q5 | Your route (Wi2021) | B1 / Onderwijs / Z-route / Don't know → default B1 | Required components, target level |
| Q6 | What have you already done? | Multi-select checklist per component + "passed / booked / attempted N times" | Remaining work |
| Q7 | How much do you study? | Course hours per week + self-study hours per week; "no course yet" | Readiness estimate |
| Q8 | Do you want to become Dutch afterwards? | Yes / No / Maybe | Adds naturalisation leg |
| Q9 | Anything that cost you time? | Illness / new baby / homelessness / gemeente or school failed me / literacy course / studying in NL / none | Flags possible extension |

**Rules for the wizard:**
- Q1 and Q2 are enough to render a first result. Everything after Q2 refines. Show a live preview of the deadline from Q3 onward — the user should see value before finishing.
- Never block on an unknown. `unknown` is a first-class value throughout the engine.
- Month-precision dates are accepted; the engine then computes a *range* and says so.

### 5.2 Output — the timeline

Vertical, chronological, today-anchored. Three lanes are visually distinguished:

1. **Fixed legal dates** (deadline, PVT/MAP due, termijn end) — hard, sourced.
2. **Backward-planned action dates** (last safe registration date, recommended registration date) — computed, hard-edged.
3. **Estimates** (when you'll be ready, expected result window) — soft, always shown as a range, visually distinct (dashed/soft).

**This separation is non-negotiable.** Legal facts and our planning heuristics must never look alike.

Each timeline node carries: title, date or range, one-line "why", cost + who pays, a source link, and where relevant a CTA into practice material.

**The headline number:** not the deadline. The headline is **"Last safe date to register for your final exam: 14 March 2027 — 29 weeks from today."**

### 5.3 Result modes (states)

| Mode | Trigger | Headline | Primary CTA |
|---|---|---|---|
| **A. Pre-clock** | Obliged but no PIP / DUO letter yet | "Your clock hasn't started. Here's what's coming." | Start free KNM practice — you can begin now |
| **B. On track** | Buffer ≥ 12 weeks on the binding component | "You have room — if you start now." | Book your first exam / practice |
| **C. Tight** | 0 < buffer < 12 weeks | "It's tight. Here's the order to do things in." | Prioritised component + practice |
| **D. At risk** | Buffer < 0 but deadline not passed | "On this pace you won't finish in time. Two options:" (intensify / check extension grounds) | Extension check + intensive plan |
| **E. Overdue** | today > termijn end | "Your term has ended. Here's what happens next." | Fine mechanics, extra time granted, recovery plan |
| **F. Exempt / not obliged** | Exemption or EU/AOW | "You don't have to integrate." + optional naturalisation leg | Naturalisation timeline |
| **G. Naturalisation-only** | Q1 = passport path | Residence clock + diploma clock side by side | A2 diploma plan |
| **H. Estimate mode** | Anchor date unknown | Everything expressed as ranges + "how to find your real date" | Instructions to find the date in Mijn Inburgering |

Mode E has a specific, verified nuance that most sites get wrong and that we must get right: **asylum status holders are never fined**, and following a Raad van State ruling DUO may not fine statushouders under Wi2013 or Wi2021 for exceeding the term, nor reclaim integration loan money.

### 5.4 Cost panel

Computed from the same rule set, shown as a small table:

- Wi2021: Lezen / Luisteren / Spreken / Schrijven / KNM at €50 each (€250 total); MAP free at the gemeente; PVT free.
- Wi2013: the same five plus ONA at €40 (€290 total); PVT €150 unless asylum status holder.
- Asylum status holder under Wi2021: gemeente pays the course; first 2 attempts per exam free (not below PIP level); extra attempts self-funded; **cannot borrow from DUO**.
- Family/other migrant: pay yourself or borrow from DUO (amount depends on income; approved schools only).
- Asylum status holder under Wi2013: loan up to €10,000.
- Optional naturalisation row: single request €1,139 standard / €847 reduced (rates from 1 January 2026).

Show **expected** cost using the diagnostic to predict retakes, alongside best case. Honesty beats optimism here.

### 5.5 Embedded diagnostic ("Waar sta je nu?")

Reuse the existing 10-questions-per-component engine, embedded inline in the timeline rather than as a separate page.

- Placed at each language/KNM node as a collapsed card: "Not sure if you're ready for KNM? 10 questions, 3 minutes, no account."
- On completion, the node updates in place: score → readiness band → estimated study weeks → the node's date range moves, visibly, with a short animation and a plain-language note ("Your KNM window moved 5 weeks earlier — you're closer than the default assumption.")
- That *visible recomputation* is the product's magic moment. Prioritise it.
- Score bands: 8–10 "nearly ready" (×0.25 remaining study), 5–7 "halfway" (×0.6), 0–4 "early" (×1.0).

### 5.6 What-if / editing

Post-result, the timeline is editable without redoing the wizard:
- Slider: study hours per week → all soft dates move live.
- Toggle per component: not started / studying / booked / passed.
- "I got an extension of __ months" → shifts the deadline and recomputes.
- "What if I fail one exam?" → adds a retake loop (registration + result lead times) and shows the new buffer. This single feature communicates the queue problem better than any amount of copy.

### 5.7 Save, share, export

- **URL state:** full input state encoded in the query string / short hash. Shareable with a teacher or klantmanager. No server needed.
- **Print/PDF:** one-page, A4, black-and-white-safe, with the source list. Klantmanagers will print this.
- **`.ics` export:** each hard date as a calendar event with a 6-week-ahead reminder on registration dates.
- **Email:** "send me my timeline" → email capture → Resend. This is the primary conversion event.
- **Local persistence:** `localStorage`, so returning users land on their timeline, not the wizard.

---

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| **Privacy** | No PII leaves the browser unless the user explicitly emails themselves the plan. No BSN, no DigiD, no V-number — and say so on the tool, visibly. This audience is rightly cautious about anything resembling an official form. |
| **Performance** | Interactive in < 1.5 s on a mid-range Android over 4G. Rules bundle ≤ 40 KB gzipped. |
| **Mobile** | Mobile-first. Assume one hand, small screen, possibly a shared phone. |
| **Language** | NL / EN / AR at launch. RTL support for Arabic is a real requirement for a timeline component, not an afterthought — plan the layout for mirroring from the start. |
| **Reading level** | Target A2–B1 Dutch and plain English. Every sentence in the output must be readable by someone at the language level the tool is helping them reach. Have Marieke (NT2 teacher) sign off on all NL and EN strings. |
| **Accessibility** | WCAG 2.2 AA. Keyboard-navigable wizard, visible focus, timeline readable as a list by screen readers, never colour-alone for status. |
| **Correctness** | Every legal date/amount traceable to a source URL with a `checked_on` date. Any rule not verified within 180 days triggers a build warning. |
| **Offline-ish** | Works fully client-side after first load; no runtime API calls required for the core computation. |

---

## 7. Success metrics

**North star:** *completed timelines that convert into a practice session.*

| Metric | Target (90 days post-launch) |
|---|---|
| Wizard start → result rendered | ≥ 65 % |
| Result → diagnostic started | ≥ 30 % |
| Result → email captured | ≥ 12 % |
| Result → free practice exam started | ≥ 25 % |
| Timeline → paid conversion (30-day attributed) | ≥ 3 % |
| Organic sessions to `/tools/tijdlijn` | 1,500/month by month 6 |
| Return visits to a saved timeline | ≥ 15 % of savers within 60 days |

**Instrument (PostHog):** `timeline_started`, `timeline_step_completed{step,answer_known}`, `timeline_abandoned{step}`, `timeline_computed{mode,law,route,buffer_weeks}`, `timeline_diagnostic_completed{component,score}`, `timeline_whatif_used{type}`, `timeline_saved{method}`, `timeline_cta_clicked{target}`.

`buffer_weeks` and `mode` in the computed event are gold: they tell you the actual distribution of desperation in your audience, which should drive content and pricing.

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Someone relies on our date and misses their deadline.** | Critical | Conservative arithmetic everywhere (plan for results to land *before* the deadline, not exams). Persistent, non-dismissible line: "DUO decides. Check Mijn Inburgering." Never present an estimate as a legal fact. Log the rules version with every rendered result. |
| **Rules change silently** (fees indexed, lead times shift, KNM eindtermen updated, Raad van State rulings). | High | Rules-as-data with `checked_on` + `source_url`; quarterly verification ritual; staleness warnings in CI; a visible "Rules last checked: DD-MM-YYYY" on the tool. |
| **The 5→10 year naturalisation bill passes.** | Medium | Already modelled as a dormant, dated rule variant behind a flag. Flip one field on the day it takes effect. Also a content opportunity — be the first site with a correct timeline. |
| **Scope creep into "we'll book your exam".** | Medium | Explicit non-goal. We plan; DUO books. |
| **Complexity makes the wizard feel like a government form** — the exact thing users are fleeing. | High | Max 9 questions, one per screen, "I don't know" everywhere, live preview from Q3. Test with real users at A2 Dutch. |
| **Municipal variation** (PIP practice differs a lot). | Medium | Never assert what "your gemeente will do"; phrase as "ask your gemeente" with a checklist of exactly what to ask. |

---

## 9. Release plan

**M1 — Engine + rules (week 1–2).** Typed rules JSON, pure computation functions, full unit test suite with worked examples. No UI. This is where correctness is won.

**M2 — Wizard + timeline (week 3–4).** NL only, desktop + mobile, modes A–E. Ship behind the "SOON" badge already in the nav.

**M3 — Diagnostic + what-if (week 5).** Wire the existing question bank in; the recompute animation.

**M4 — Save/share/export + email (week 6).** Conversion instrumentation live.

**M5 — EN + AR, SEO landing pages (week 7–8).** Per-intent landing variants (`/inburgering/deadline`, `/inburgering/wat-kost-het`, `/inburgering/termijn-verlopen`) that deep-link into pre-filled timeline states.

**Post-launch:** gemeente/teacher print mode, reminder emails, account sync.

---

## 10. Open decisions for Hannes

1. **Deadline semantics.** We plan so that *results* arrive before the deadline. That's the safe reading, and it's stricter than "sit the exam before the deadline." Confirm this conservative stance — it makes the tool more useful but also more alarming. My recommendation: keep it conservative, and show the less-safe date as a secondary marker ("absolute last exam date") so the user sees both.
2. **Fine display.** Show maximum amounts only (≤€1,000 Wi2021 leerroute, €340 PVT, €340 MAP, ≤€1,250 Wi2013), never a personal estimate. Confirm.
3. **Email gate.** Memory notes an email-gate drop-off problem on knmoefenen.nl. Recommendation: **do not gate the result at all.** Gate only the email/PDF copy. The timeline itself must be free and indexable, or the SEO play dies.
4. **Naturalisation leg.** Include in v1 (it's the emotional endpoint — "become a Dutch citizen" — and the reason people care about A2 at all), or defer to v1.1?
5. **Wi2013 coverage.** It's extra work for a shrinking cohort, but DUO's own tool excludes them entirely, which makes it defensible free traffic. Recommendation: include — it's ~15 % more rules for a segment with zero competition.
