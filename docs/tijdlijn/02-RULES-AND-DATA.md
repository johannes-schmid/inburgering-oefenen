# Rules & Data Reference — Tijdlijn Builder

**All figures verified against primary sources on 20 August 2026.**
Primary source unless noted: **DUO / inburgeren.nl** (the executing authority). Secondary sources are marked ⚠ and must be re-verified before they drive a displayed number.

This document is the single source of truth for `inburgering-rules.v1.json`. If they disagree, this document wins and the JSON gets fixed.

---

## 0. The architectural rule that matters most

There are **two kinds of numbers** in this product and they must never be mixed:

| | **Legal rules** | **Planning heuristics** |
|---|---|---|
| Examples | 3-year term, €50 per exam, 16 weeks for childbirth, €340 PVT fine | "you need ~450 hours to reach A2", "allow 6 weeks to get a slot" |
| Origin | Statute / DUO publication | Our model + DUO's own stated lead times |
| Mutability | Only when the law or DUO changes it | Tunable by us anytime |
| In the UI | Solid, sourced, "DUO" badge | Dashed, ranged, "estimate" badge |
| In the code | `rules.legal.*` | `rules.planning.*` |

Every legal rule carries `source_url` and `checked_on`. Every heuristic carries `rationale` and `confidence`.

---

## 1. Which law applies

| Rule | Value | Source |
|---|---|---|
| Wi2021 applies to | people who became inburgeringsplichtig **on or after 1 January 2022** | Divosa, Wet inburgering in vraag en antwoord |
| Wi2013 applies to | people who became inburgeringsplichtig before that date | idem |
| Start of the **inburgeringsplicht** (Wi2021) | the date the IND makes the residence right known | Divosa |
| Start of the **inburgeringstermijn** (Wi2021) | **the day after the date on the first PIP** — this is a different date from the start of the plicht, and the *first* PIP is the one that counts | Divosa (art. 11 Wi2021) |
| Start of the termijn (Wi2013) | the date stated in the DUO letter | inburgeren.nl `/u-gaat-inburgeren/` |
| DUO letter is only sent once | you have a BSN **and** a residence permit **and** are registered with the gemeente | inburgeren.nl `/u-gaat-inburgeren/` |
| Letter lead time after those three are in place | up to **8 weeks** (after which: contact DUO) | idem |

**Engine implication:** the anchor date is *not* the arrival date and *not* the permit date. Ask for the PIP date first, the DUO letter date second, and only fall back to "registered with the gemeente around ___" in estimate mode — and when you do, warn that the real start is likely later, so the estimate is deliberately pessimistic.

---

## 2. The term

| Rule | Value | Source |
|---|---|---|
| Inburgeringstermijn | **3 years**, both laws | inburgeren.nl `/u-gaat-inburgeren/`, `/extra-tijd/` |
| Wi2021: leerroute, PVT and MAP | all share the same 3-year term | Divosa |
| Wi2013: PVT | must be signed within **1 year** of gemeente registration | inburgeren.nl `/examen-doen/inhoud-kennisexamens.jsp` |
| Wi2021: PVT | within the 3-year term | idem |
| Maximum non-culpable extension | up to **2 years** ⚠ (Stimulansz; confirm against Besluit inburgering 2021 before displaying as a hard cap) | Stimulansz |
| Extensions per period | only **one** extension per period; a different period can qualify again | inburgeren.nl `/extra-tijd/` |
| Who decides an extension | **DUO**, by decision; the gemeente does not need to amend the PIP | Schulinck |

---

## 3. Routes and required components (Wi2021)

| Route | Language requirement | Knowledge components | Notes |
|---|---|---|---|
| **B1-route** | 4 language exams at **B1** (Staatsexamen NT2) within 3 years | KNM, PVT, MAP | After **≥600 hours** of language lessons, if B1 proves unreachable, the gemeente can agree to scale down (*afschalen*) to A2 |
| **Onderwijsroute** | 4 language exams at **B1 or B2** | KNM, PVT | Aimed at younger people heading to mbo/hbo/wo. ~**1,500 lesson hours over 1.5–2 years**, of which ~1,000 language ⚠ (Divosa) |
| **Z-route** | learns Dutch toward **A1**; A2 exams *permitted but not required* | PVT, MAP + closing interview with the gemeente → certificate | Minimum **800 hours** NT2 tuition and **800 hours** participation ⚠ (Divosa). Certificate alone is **not** sufficient for naturalisation |
| **Wi2013 (A2)** | 4 language exams at **A2** or higher | KNM, ONA, PVT | — |

**Naturalisation caveat (important product logic):** someone who completes the Z-route holds a certificate, not an inburgeringsdiploma. To naturalise they must either pass the full A2 set (4 language + KNM + ONA, with a completed MAP granting exemption from ONA) or obtain an *advies aantoonbaar geleverde inspanningen*. The timeline must surface this early for Z-route users who answered "yes" to the passport question — otherwise they discover it three years too late.

---

## 4. Exams: fees, who pays, lead times

### 4.1 Fees

**Wi2021** (source: inburgeren.nl `/inburgeren-betalen/`)

| Component | Fee |
|---|---|
| Schrijven | €50 |
| Spreken | €50 |
| Luisteren | €50 |
| Lezen | €50 |
| KNM | €50 |
| **Total** | **€250** |
| MAP (at the gemeente) | free |
| PVT | free |

**Wi2013** (same source)

| Component | Fee |
|---|---|
| Schrijven / Spreken / Luisteren / Lezen / KNM | €50 each |
| ONA | €40 |
| **Total** | **€290** |
| PVT | free for asylum status holders, otherwise **€150** |

**Basisexamen inburgering buitenland (A1, pre-MVV):** €150 for the full exam, €50 per part (KNS, Lezen, Spreken) ⚠ — secondary sources citing Naar Nederland, May 2026. Verify at naarnederland.nl before display. Only relevant for users still abroad (mode A).

**Naturalisation fees, from 1 January 2026** (Staatscourant 2025, 31825; corroborated by municipal fee listings):

| Type | Fee |
|---|---|
| Single request, standard | €1,139 |
| Single request, reduced | €847 |
| Joint request, standard | €1,454 |
| Joint request, reduced | €1,163 |
| Co-naturalising minor child | €168 |

Indexed annually — schedule a January review.

### 4.2 Who pays

| Situation | Course | Exams |
|---|---|---|
| **Asylum status holder, Wi2021** | gemeente pays | **first 2 attempts of each exam free** — but not if taken *below* the level in the PIP (higher is allowed). Further attempts self-funded. **Cannot borrow from DUO.** |
| **Family/other migrant, Wi2021** | self-funded or DUO loan | self-funded or DUO loan; loan only for schools listed on zoekinburgerschool.nl |
| **Asylum status holder, Wi2013** | DUO loan up to **€10,000** | idem |
| **Non-asylum, any law** | loan amount depends on income (DUO decides; DUO publishes a *rekenhulp*) | idem |
| Passed first time? | may re-sit once at a **higher** level | — |

This is one of the most commonly misreported facts on the Dutch internet — the €10,000 figure is routinely stated as universal, when in fact asylum status holders under Wi2021 cannot borrow at all. Getting it right is a credibility asset; say so plainly.

Childcare allowance (kinderopvangtoeslag) is available for all compulsory integration components — course, MAP, PVT and Z-route participation hours — for people with a DUO letter whose children are in childcare. Worth a node in the cost panel; it's real money and almost nobody knows.

### 4.3 Lead times — **the engine's core input**

| Step | Duration | Source |
|---|---|---|
| Registration → exam date | **can exceed 6 weeks** | inburgeren.nl `/examen-doen/aanmelden-examen.jsp` |
| Changing date/place | allowed up to **1 week** before | idem |
| Cancelling with refund | up to **1 week** before | idem |
| Result: knowledge exams + A2 language | within **8 weeks**, by letter and in Mijn Inburgering | `/examen-doen/uitslag.jsp` |
| Result: Spreken A2 and Schrijven A2 | currently up to **16 weeks** (active DUO notice, Aug 2026) | inburgeren.nl news |
| Result: NT2 B1/B2 | see duo.nl NT2 pages ⚠ (not yet captured — needed for B1/Onderwijsroute accuracy) | — |
| ONA portfolio review | **6 weeks** (again after each resubmission) | `/examen-doen/inhoud-kennisexamens.jsp` |
| ONA eindgesprek wait | **6 weeks** after approval | idem |
| ONA result | **8 weeks** | idem |
| PVT signature visible in Mijn Inburgering | ~**3 weeks** after the gemeente reports it | idem |
| DUO decision on extension / loan / income change | **8 weeks** | `/extra-tijd/*`, `/inburgeren-betalen/` |
| Paper diploma delivery | **8 weeks** | `/u-gaat-inburgeren/naturaliseren.jsp` |
| Advies aantoonbaar geleverde inspanningen | **8 weeks** | idem |

**Derived planning constants (defaults, tunable):**

```
REGISTRATION_LEAD_WEEKS      = 7   // DUO says ">6"; we round up
RESULT_LEAD_WEEKS_DEFAULT    = 8
RESULT_LEAD_WEEKS_A2_PRODUCTIVE = 16   // Spreken A2, Schrijven A2 — while the DUO notice stands
SAFETY_BUFFER_WEEKS          = 4   // ours, so a single retake doesn't blow the plan
```

---

## 5. Extensions (verlenging)

Grounds recognised under **Wi2021** (source: inburgeren.nl `/extra-tijd/`):

- literacy (alfabetisering) course taken first
- following a Dutch education programme *(note: mbo level 1 / entreeopleiding is a ground for extension; mbo level 2 is not ⚠ — Schulinck/Binnenlands Bestuur)*
- illness (own or a family member's)
- death of a family member
- childbirth
- homelessness or living in a women's shelter
- the gemeente failed to arrange a school in time
- the school had problems and you couldn't attend
- many course hours completed **and at least 2 of 4 exams passed**
- another reason

**Wi2013** grounds are the same minus the last two, plus "300 hours of course and all exams attempted twice".

### 5.1 Two precisely-specified extensions worth hard-coding

**Childbirth — +16 weeks.** Conditions: the applicant is a woman; the child was born within the term; **the term started at least 2.5 years ago**. Applied for with a form plus a copy of the birth certificate; decision within 8 weeks. Terminated pregnancy: same route with the *akte van geboorte (levenloos)*.

**"Many hours and many attempts" — +6 months, granted automatically, no application needed.**

*Wi2021, asylum status holder:*
- on the B1-route (scaling down to A2 doesn't matter)
- term started ≥ 2.5 years ago
- ≥ 2 of 4 language exams passed at the PIP level or higher
- KNM passed
- all KNM course hours attended
- all language lessons in the PIP attended
- PVT and MAP completed

*Wi2021, family migrant:* same, except the hours condition is **450 hours of language course plus the KNM course hours at a school with the BOW keurmerk**.

*Wi2013:* ≥300 hours at a Blik op Werk school (or vso/pro/ISK within the last 2 years; online hours don't count), at least one full ONA attempt (approved portfolio **and** eindgesprek), all other unpassed exams attempted at least twice (B1/B2 NT2 attempts count), term started ≥2.5 years ago. **Must be applied for** with a form; decision in 8 weeks.

**Product implication:** the "automatic +6 months" for Wi2021 is a genuinely valuable, checkable, largely unknown entitlement. Build it as a checklist widget — "You may already qualify for 6 extra months. Check these 7 boxes." That alone is worth the build.

---

## 6. Fines and what happens after

### 6.1 The overriding rule

**Asylum status holders are never fined.** Beyond that, following a ruling of the Raad van State, DUO may not fine status holders under Wi2013 or Wi2021 for taking too long, and may not reclaim integration loan money from them. DUO informs affected people individually; the obligation to keep integrating remains.
*(Source: inburgeren.nl `/u-gaat-inburgeren/boete.jsp`, Aug 2026.)*

This is a live, litigated area — flag the rule with a shorter re-check interval (90 days).

### 6.2 Wi2021, non-asylum

Sequence:
1. **2 months before** the end of the term: an informational letter from DUO showing the data it holds.
2. After the term ends: *"Vooraankondiging termijnoverschrijding"* — states a possible fine and its provisional amount. Not yet a decision; the amount can still change.
3. Then, if imposed, a fine decision with payment instructions.

Amounts:

| Fine | Maximum |
|---|---|
| Not finishing the leerroute in time | **≤ €1,000** — calculated from route, course hours at a zoekinburgerschool.nl school, number of attempts, and exams already passed |
| PVT not completed in time | **€340** |
| MAP not completed in time | **€340** |

Extra time granted *after* a fine — **model this precisely, it's the core of result mode E**:

*B1-route / Onderwijsroute, by exams passed:*

| Exams passed | Extra time |
|---|---|
| 0 | 2 years |
| 1 | 1.5 years |
| 2 | 1 year |
| 3 or 4 | 6 months |

*Z-route, by course hours:*

| Hours | Extra time |
|---|---|
| ≤ 200 | 2 years |
| 200–400 | 1.5 years |
| 400–600 | 1 year |
| 600–800 | 6 months |

*PVT and/or MAP:* PVT late → 6 months; MAP late → 6 months; **both** late → 1 year.

**Multiple fines:** the longest period applies. Extra periods are **not** added together.

### 6.3 Wi2013, non-asylum

Fine for not obtaining the diploma in time: **≤ €1,250**, calculated from course hours (integration, literacy and NT2 count, only at a Blik op Werk school), attempts, and components already passed. **2 years extra** to finish afterwards. PVT not signed within the year, if culpable: **€340**, and no further borrowing from DUO.

---

## 7. Exemptions and dispensations

**Wi2021** — may reduce the required exams:
- serious illness or disability
- an NT2 certificate/diploma giving partial exemption

— may remove the obligation entirely:
- serious illness or disability
- a Dutch-language diploma obtained in the Netherlands, Belgium or Suriname
- 10 years' residence in NL of which at least 5 in work
- inability to integrate due to special individual circumstances (**BIO**)

**Wi2013** — additionally: 600 hours of course completed (AGI dispensation); ONA exemption after ≥6 months' work in NL in the past year.

**AOW age:** the obligation runs until AOW age; after that no exams are required and borrowing stops.

**Critical naturalisation interaction:** a **BIO dispensation under Wi2021 is not sufficient for naturalisation.** A Wi2007 dispensation may be — show it to the gemeente. This trap deserves its own warning node.

---

## 8. Naturalisation

| Rule | Value | Source |
|---|---|---|
| Language/knowledge requirement | inburgeringsexamen at **A2**, or Staatsexamen NT2 **B1/B2** | inburgeren.nl `/u-gaat-inburgeren/naturaliseren.jsp` |
| Residence requirement | **5 years** continuous legal residence immediately before the request; no single absence over 3 months ⚠ (secondary) | IND |
| Shortened terms | 3 years for spouses/registered partners of Dutch nationals, plus other exceptions | IND |
| Where to apply | at the **gemeente**, which forwards to the IND | inburgeren.nl |
| Decision term | statutory maximum **1 year**; in practice 6–9 months ⚠ (secondary) | — |
| From abroad | possible at an embassy/consulate; exams there are Lezen, Schrijven, Spreken, Luisteren, KNM. If sitting the exams *in* the Netherlands while living abroad, **ONA is also required** | inburgeren.nl |
| AOW entitlement | exempts from ONA | idem |

**Advies aantoonbaar geleverde inspanningen** (for people who genuinely cannot pass):
- A2 course route: ≥600 hours of course (A2 + B1/B2 hours may be summed; literacy hours count if ≥200 A2 hours), at a zoekinburgerschool.nl school, and **≥3 attempts at all exams** (max 2 NT2 exams counted per component)
- Literacy route: ≥600 hours of which ≥300 literacy, plus a **€150 test** by DUO
- Decision within 8 weeks; a positive advice is submitted to the gemeente with the naturalisation request
- Only available to people living in the Netherlands

### 8.1 Pending legislation — build it as a dormant rule

A bill to extend the general naturalisation term **from 5 to 10 years** (and for partners of Dutch nationals from 3 to 5) was put to internet consultation in autumn 2025; the IND published an implementation assessment in February 2026; plenary debate was scheduled for week 13 of 2026. A separate government intention raises the naturalisation language requirement to **B1**.

**As at 20 August 2026 this is not in force** — 5 years and A2 remain the law. Verify status before each release. Model it as:

```json
{ "id": "naturalisation_term_10y",
  "status": "proposed",
  "effective_from": null,
  "value_years": 10,
  "supersedes": "naturalisation_term_5y" }
```

One field flips on the day it commences — and the site is first to be correct, which is worth real traffic.

---

## 9. Planning heuristics (ours, not DUO's)

Clearly labelled as estimates everywhere they surface.

### 9.1 Study-hours model

Anchors taken from the routes themselves (Z-route min 800 language hours; Onderwijsroute ~1,000 language hours; afschalen from B1 requires ≥600 hours; Wi2013 dispensation at 600 hours; the Wi2021 family-migrant extension threshold at 450 hours):

| From → to | Guided hours (band) |
|---|---|
| A0 → A1 | 150 – 250 |
| A1 → A2 | 200 – 350 |
| **A0 → A2** | **350 – 600** |
| A2 → B1 | 300 – 500 |
| B1 → B2 | 350 – 600 |
| Literacy track (pre-A0) | +300 – 800 |

Always express output as a range. Never a single number.

### 9.2 Effective weekly hours

```
effective_hours_per_week = course_hours + (self_study_hours × 0.5)
weeks_needed             = hours_remaining / max(effective_hours_per_week, 1)
```

Self-study is discounted deliberately; guided hours are what DUO and the research count.

### 9.3 Diagnostic multiplier

| Diagnostic score (of 10) | Remaining-hours multiplier |
|---|---|
| 8–10 | × 0.25 |
| 5–7 | × 0.60 |
| 0–4 | × 1.00 |

### 9.4 Retake expectation (for the cost projection)

| Diagnostic score | Expected attempts |
|---|---|
| 8–10 | 1.1 |
| 5–7 | 1.5 |
| 0–4 | 2.2 |
| unknown | 1.5 |

Round up when charging money to the estimate; round down when promising time.

---

## 10. The core algorithm

```
1.  law            ← explicit answer, else derive from anchor date vs 2022-01-01
2.  termijn_start  ← PIP date + 1 day (Wi2021) | DUO letter date (Wi2013)
3.  termijn_end    ← termijn_start + 3 years + Σ granted extensions
4.  components     ← required set for (law, route, status)
5.  for each unfinished component:
       result_lead        ← 16w if (A2 Spreken|Schrijven) else 8w
       latest_exam_date   ← termijn_end − result_lead
       latest_registration← latest_exam_date − 7w
       est_ready_date     ← today + weeks_needed(level_gap, hours/wk, diagnostic)
       slack              ← latest_registration − est_ready_date
6.  binding_component ← argmin(slack)
7.  buffer_weeks      ← slack(binding_component) − SAFETY_BUFFER_WEEKS
8.  mode              ← by table in PRD §5.3
9.  cost              ← Σ fee × expected_attempts − free_attempts(status, law)
10. extensions        ← evaluate eligibility checklists (informational only)
11. naturalisation    ← if requested: max(residence_start + 5y, diploma_date) + IND decision window
```

**Everything is computed with date arithmetic on whole days, in Europe/Amsterdam, using calendar-correct year addition** (3 years from 29 Feb → 28 Feb). Use `date-fns` `addYears`/`addWeeks` — do not do millisecond maths.

---

## 11. Worked examples (make these your unit tests)

### Example 1 — Amira, family migrant, Wi2021, B1-route

Input: PIP dated 12 May 2025; family migrant; B1-route; nothing passed; 6 course hours + 3 self-study hours per week; KNM diagnostic 6/10; today 20 Aug 2026.

```
termijn_start        = 13-05-2025
termijn_end          = 13-05-2028
Binding component    = Schrijven A2/B1 (16-week result window)
latest_exam_date     = 13-05-2028 − 16w = 21-01-2028
latest_registration  = 21-01-2028 − 7w  = 03-12-2027
KNM est_ready        = ~9–14 weeks from today (score 6 → ×0.6)
buffer               = ~63 weeks → MODE B (on track)
cost (expected)      = 5 × €50 × 1.5 attempts ≈ €375; PVT/MAP free; loan possible
```

### Example 2 — Yonas, asylum status holder, Wi2021, B1-route, 26 months in

Input: PIP 02-06-2024; asylum; B1; Lezen passed, Luisteren passed, KNM passed, PVT + MAP done, all PIP lessons attended.

```
termijn_end          = 03-06-2027
Extension check      → all 7 conditions met → automatic +6 months → 03-12-2027
Free attempts        = 2 per exam (at PIP level or higher)
Fine exposure        = none (asylum status holder)
Mode                 = B, with an "extra time" node and an explicit
                       "DUO grants this automatically — you don't apply" note
```

### Example 3 — Kwame, Wi2013, term expired, one exam passed, 320 course hours

```
termijn_end          = 14-02-2026 (passed)
Mode                 = E (overdue)
Shown                = fine ≤ €1,250 (max, not a personal estimate)
                       + 2 years extra to finish → new horizon 14-02-2028
                       + still owes: 3 language exams, ONA, KNM
                       + the €340 PVT fine rule if unsigned
                       + "if you are an asylum status holder, no fine applies"
```

### Example 4 — Marta, EU citizen, passport path

```
No inburgeringsplicht, no termijn.
Two clocks: residence (registered 01-09-2023 → eligible 01-09-2028)
            diploma  (A2 set: 5 exams, €250, ~30–45 weeks at 8h/wk from A0)
Binding     = residence
Advice      = "Your language clock has slack. Start with KNM, then Lezen."
Fees        = €1,139 single standard (from 01-01-2026)
Flag        = 10-year bill pending; not in force today
```

---

## 12. Source register

Store this in the repo and render it (collapsed) on the tool itself.

| # | Source | Used for | Checked |
|---|---|---|---|
| S1 | inburgeren.nl `/u-gaat-inburgeren/` | 3-year term, letter conditions, routes, PIP flow | 2026-08-20 |
| S2 | inburgeren.nl `/inburgeren-betalen/` | all exam fees, who pays, free attempts, PVT cost, childcare allowance | 2026-08-20 |
| S3 | inburgeren.nl `/inburgeren-betalen/hoeveel-geld-mag-u-lenen.jsp` | €10,000 Wi2013 asylum, no loan for Wi2021 asylum, income-based amounts | 2026-08-20 |
| S4 | inburgeren.nl `/extra-tijd/` + subpages | extension grounds, 16-week childbirth rule, +6-month automatic extension, Wi2013 300-hour route | 2026-08-20 |
| S5 | inburgeren.nl `/u-gaat-inburgeren/boete.jsp` | fine amounts, Raad van State ruling, post-fine extra time tables | 2026-08-20 |
| S6 | inburgeren.nl `/u-gaat-inburgeren/naturaliseren.jsp` | naturalisation requirements, AGI advice, BIO trap, from-abroad exams | 2026-08-20 |
| S7 | inburgeren.nl `/examen-doen/uitslag.jsp` + news | 8-week results, 16-week Spreken/Schrijven A2 notice | 2026-08-20 |
| S8 | inburgeren.nl `/examen-doen/aanmelden-examen.jsp` | >6-week registration lead, 1-week change/cancel | 2026-08-20 |
| S9 | inburgeren.nl `/examen-doen/inhoud-kennisexamens.jsp` | KNM/MAP/ONA/PVT content, ONA lead times, PVT deadlines and fine | 2026-08-20 |
| S10 | inburgeren.nl `/minder-of-geen-examens/` | exemptions and dispensations, AOW | 2026-08-20 |
| S11 | Divosa — Wet inburgering in vraag en antwoord / wijzigingenoverzicht | term start mechanics (PIP dagtekening), route hour norms | 2026-08-20 |
| S12 | Staatscourant 2025, 31825 | naturalisation fees from 01-01-2026 | 2026-08-20 |
| S13 | internetconsultatie.nl + IND uitvoeringstoets (Feb 2026) | pending 5→10-year bill (not in force) | 2026-08-20 |
| S14 ⚠ | Stimulansz | 2-year maximum extension — **needs primary confirmation** | 2026-08-20 |
| S15 ⚠ | Naar Nederland (via secondary) | basisexamen buitenland fees — **needs primary confirmation** | 2026-08-20 |

### Open verification tasks before launch

1. ⚠ Confirm the 2-year extension cap against Besluit inburgering 2021 / Regeling inburgering 2021.
2. ⚠ Confirm basisexamen buitenland fees directly at naarnederland.nl.
3. Capture NT2 B1/B2 result lead times from duo.nl (needed for B1-route and Onderwijsroute accuracy — currently the biggest hole in the model).
4. Confirm whether DUO measures compliance by exam date or result date. Until confirmed, we plan to the **result** date and say so.
5. Re-check the Spreken A2 / Schrijven A2 16-week notice monthly — it's temporary and it materially changes every B1-route plan.
