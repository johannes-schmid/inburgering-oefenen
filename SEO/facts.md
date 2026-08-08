# Fact sheet — every number we are allowed to publish

**This file is the USP made auditable.** The product promise is *"echt door een docent
gevalideerd, geen AI."* A wrong exam fee or pass norm on the blog attacks the only wedge the
product has. So: **if a number is not in this file with a source URL, it does not go in an
article.**

All facts below verified **2026-07-28**. No `inburgeren.nl` page exposes a last-updated date,
so our own consulted-on date is the only provenance available — that is why every `FactBox`
renders one.

---

## 1. The four language components at A2 — VERIFIED

Source: https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp
Corroborated by the official **Examenreglement**, Artikel 9 (Examinering):
https://www.inburgeren.nl/images/examenreglement.pdf

| Component | Items | Duration | Modality | How it is scored (Artikel 10) |
|---|---|---|---|---|
| **Lezen** | 25 vragen | max 65 min | computer | automated |
| **Luisteren** | 25 vragen | 45 min | computer | automated |
| **Schrijven** | 4 opdrachten | max 40 min | **pen en papier** | by certified human assessors |
| **Spreken** | 16 vragen | max 35 min | computer | partly automated, partly certified human assessors |
| *(KNM)* | *40 vragen* | *max 45 min* | *computer* | *automated* |

Verbatim DUO descriptions:
- Lezen — *"Het examen Lezen op niveau A2 doet u op de computer. U moet teksten lezen. U moet ook vragen beantwoorden. Het examen duurt 65 minuten."*
- Luisteren — *"Het examen Luisteren op niveau A2 doet u op de computer. U krijgt vragen over filmpjes en u luistert naar teksten. Het examen duurt 45 minuten."*
- Schrijven — *"Het examen Schrijven op niveau A2 maakt u met pen en papier. U krijgt 4 schrijfopdrachten. U schrijft bijvoorbeeld een korte brief. Of u vult een formulier in. Het examen duurt 40 minuten."*
- Spreken — *"Het examen Spreken op niveau A2 doet u op de computer. U moet Nederlands spreken en verstaan. U bekijkt filmpjes en u beantwoordt vragen. Het examen duurt 35 minuten."*

### How the item counts were established — read this before citing them

DUO does **not** publish item counts on any informational page. The counts above were read off
the **start screens of DUO's own official practice exams**, which are public and need no login
(https://www.inburgeren.nl/examen-doen/oefenen.jsp). Verified 2026-07-28, all 10 online A2
exams:

| Exam | Start-screen text | Counter |
|---|---|---|
| Lezen A2 oefenexamen 1–4 (all four) | *"U moet in dit examen 25 vragen beantwoorden."* | 25 VRAGEN / 65 MINUTEN |
| Luisteren A2 oefenexamen 1–3 (all three) | *"U moet in dit examen 25 vragen beantwoorden."* | 25 VRAGEN / 45 MINUTEN |
| Spreken A2 oefenexamen 1–3 (all three) | *"Het examen heeft vier soorten vragen: vragen met een video, vragen met 1 plaatje, vragen met 2 plaatjes, vragen met 3 plaatjes. U mag 35 minuten over het examen doen."* | 16 VRAGEN / 35 MINUTEN |
| Schrijven A2 oefenexamen 1 (PDF) | *"U moet in deze toets 4 vragen beantwoorden."* | — |

**Correct wording in an article:** "DUO's eigen oefenexamens Lezen bestaan uit 25 vragen." Not
"het examen bestaat officieel uit 25 vragen" — DUO publishes no such norm, and a real exam is
not guaranteed to match its practice exams. Always attribute to the practice exams.

`data/skills.ts` (25/25/4/16) matches these counts exactly. It was already right; it simply had
no source. This file is that source.

### The shape *inside* an exam — VERIFIED 2026-08-08, format only

Established the same way and under the same restriction: read off DUO's own practice exams in
`resources/exam-references/A2/`. These describe **structure**, never content, and they are what
`exam_formats` / `exam_task_rules` encode.

| Onderdeel | What is verified | Evidence |
|---|---|---|
| **Lezen** | one tekst carries **1 to 3 vragen**; **3 of 4** antwoordopties, mixed within one exam | 13 of the 25 items of oefenexamen 1. Q10+Q11 share one e-mail, Q18+Q20 one folder, Q24+Q25 one regelblad; 9 items had 3 options, 4 had 4 |
| **Luisteren** | 10 fragmenten, 2–3 vragen elk, 3 of 4 opties, 40–50 sec audio | established 2026-08-07, unchanged |
| **Schrijven** | **4 opgaven**; always exactly **één formulier** and exactly **één korte tekst** (wijkkrant); the other two are e-mails, or one e-mail and one briefje | all three oefenexamens, cover to cover |
| **Spreken** | **4 onderdelen × 4 vragen = 16**; **60 seconden** opname per vraag; onderdeel 1 video, 2 één plaatje, 3 twee plaatjes (kies er één), 4 drie plaatjes (gebruik alle) | oefenexamen 1 player, counter 1..16, recorder capped at 01:00; the onderdeel list is quoted on DUO's own start screen (see the table above) |

**Not verified, and therefore not recorded anywhere:**
- **How many fragmenten a Lezen exam has.** Only 13 of 25 items were captured, and 13 items is
  not a count of texts. `exam_formats.stimulus_count` is NULL for A2 Lezen on purpose.
- **The order of the four Schrijven opgaven.** The three oefenexamens order the genres
  differently, so only the mix is a rule.
- **How many teksten of each tekstsoort a Lezen exam holds.** Never counted; the admin reports
  the distribution and the docent judges it.
- **Anything at all about B1.** No B1 rule is filled in, at either level of the schema.

**Correct wording in an article:** "In DUO's eigen oefenexamens Spreken zitten vier onderdelen
van vier vragen." Never "het examen bestaat uit vier onderdelen" — same attribution rule as the
item counts above.

### Do not reproduce practice-exam content
Both the PDFs and the online exams carry *"© Ministerie van Sociale Zaken en Werkgelegenheid;
Inburgeringsexamen, 2024. Auteursrecht voorbehouden."* and the Schrijven PDFs add *"Het examen
is geheim. U mag de vragen van dit examen niet delen met anderen."* Counting items is fine.
Quoting a question is not. Same rule as `resources/exam-references/` — see `CLAUDE.md`.

---

## 2. Pass criteria — the honest-gap passage

**This is the single most differentiated thing we can publish.** Every competitor states a raw
pass norm; none of them can source it, and they contradict each other.

**Officially, verbatim, Examenreglement Artikel 10 lid 5:**
> "De zak-slaaggrens wordt uitgedrukt in een cesuur, vastgesteld door de Minister."

**Examenreglement Artikel 16 lid 1:**
> "Na afloop van de examenbeoordeling stelt de examencommissie de uitslag vast. Deze uitslag
> wordt uitgedrukt in 'geslaagd' dan wel 'niet geslaagd'. Voor de examens Luistervaardigheid,
> Leesvaardigheid, Schrijfvaardigheid, Spreekvaardigheid en Kennis van de Nederlandse
> Maatschappij krijgt de kandidaat een cijfer."

**Examenreglement, plain-language summary (p. 5), verbatim:**
> "Niet alle antwoorden hoeven goed te zijn om te slagen."

So what we can say, and nobody else does: the pass boundary is a **cesuur set by the Minister**
and **DUO does not publish it**. You get 'geslaagd'/'niet geslaagd' plus a cijfer per component.
Not all answers need to be correct.

**DO NOT PUBLISH:**
- ❌ "18 van de 25 goed" / "19 van de 25 goed" — no official source, and sources disagree
  (`nedles.nl` says 19 for Lezen and 18 for Luisteren; other sites say 18 for both).
- ❌ "500 punten" — appears on many competitor sites, is **not** on
  https://www.inburgeren.nl/examen-doen/uitslag.jsp, and is contradicted by the reglement's
  "cijfer" + "cesuur" wording. Unverified.

---

## 3. Results timeline — VERIFIED
- https://www.inburgeren.nl/examen-doen/uitslag.jsp — *"Hebt u een kennisexamen gedaan? Of een
  taalexamen op niveau A2? Dan krijgt u de uitslag binnen 8 weken per brief."*
- Examenreglement Artikel 16 lid 3 — *"De uitslag wordt schriftelijk, binnen 8 weken na het
  examen, aan de kandidaat kenbaar gemaakt. De uitslag wordt ook weergegeven in Mijn
  Inburgering."*
- DUO keeps results **60 years** (Artikel 14 lid 2). Exam information itself: 5 years.
- A sat exam **cannot** be reviewed afterwards: Artikel 14 lid 3 — *"Het afgelegde en beoordeelde
  examen kan niet worden ingezien door de kandidaat."*

## 4. Costs — VERIFIED, but treat as volatile
Source: https://www.inburgeren.nl/inburgeren-betalen/index.jsp
- **€50 per examenonderdeel** (Lezen, Luisteren, Schrijven, Spreken, KNM) → **€250 totaal** under
  Wet 2021.
- **ONA €40**, only under Wet 2013 → **€290 totaal** there.

**Volatility rule:** these are indexed and can change. State them with a `FactBox` *and* a link
to the DUO page, phrased so a change doesn't make the sentence false ("op het moment van
schrijven €50 per onderdeel — check de actuele prijs bij DUO"). Never build a table whose only
value is the money figure.

## 5. Retakes — VERIFIED, including the absence of a maximum
- https://www.inburgeren.nl/inburgeren-betalen/index.jsp — *"De eerste 2 pogingen van elk examen
  zijn gratis. Maar niet als u examen doet op een lager niveau dan in uw PIP staat."* (asielstatushouders)
- *"Hebt u meer dan 2 pogingen nodig? Dan moet u de extra pogingen betalen. U kunt geen geld
  lenen bij DUO."*
- Examenreglement Artikel 11 lid 11: cancel ≥7 days before → refund; a free attempt entitlement
  is preserved. Removing an aanmelding <1 day before → no refund.
- Miss the exam → *"Dan moet u weer betalen."* (p. 6)
- **No maximum number of attempts is stated** in the Examenreglement or on inburgeren.nl. The
  practical limit is the inburgeringstermijn. **Write it that way** — "DUO noemt geen maximum
  aantal pogingen; in de praktijk is je inburgeringstermijn de grens." Do **not** write
  "onbeperkt herkansen", which claims more than the source supports.

## 6. Exam-day rules — VERIFIED (Examenreglement)
Under-published by competitors and genuinely useful:
- **15 minuten uitleg** before each exam starts, on top of the exam time (p. 4).
- Be present **30 minuten** before the exam (Artikel 9 lid 8).
- Valid ID mandatory; no valid ID → you may not sit the exam.
- Phone/watch/bag go in a locker (Artikel 7).
- Toilet visits only with supervision (Artikel 8 lid 3).
- Exams are secret; no photos, no copying questions. Breach = examenfraude.
- Fraud → exam invalidated, possible police report, and it can affect an already-granted
  diploma or ontheffing (Artikel 17–18).
- Aggressive behaviour → removal and up to a **3-month** ban from that location (Artikel 8 lid 2).
- Change date/time/location up to **7 days** before (Artikel 3 lid 7).

## 7. Wet inburgering 2021 vs 2013 — VERIFIED, with a trap
- https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering
  — *"De nieuwe Wet Inburgering is in werking getreden op 1 januari 2022."*
  **The trap: the law is named 2021 but took effect 1 January 2022.** Competitors get this wrong.
- Legal basis of the exam rules (Examenreglement preamble): wet van **13 september 2012, Stb. 430**
  and wet van **2 februari 2021, Stb. 38**; artikel 3.10 Regeling inburgering.
- Statute: https://wetten.overheid.nl/BWBR0044770/2025-10-21/ — consolidated **2025-10-21**, i.e.
  amended recently. **Read the change list before writing anything about the law itself.**

### Which exams you must take — RESOLVED (the research flagged this as a conflict)
https://www.inburgeren.nl/examen-doen/index.jsp is a **tabbed** page: "Onder de Wet 2021" /
"Onder de Wet 2013". The date-grouped lists containing ONA and PVT are on the **Wet 2013** tab
(cohorts from 1 Jan 2013, 1 Jan 2015 and 1 Oct 2017 — all pre-2022). Verified by clicking the
tabs directly.

- **Under Wet 2021, DUO publishes no fixed exam list on that page.** It says your **PIP**
  (persoonlijk plan inburgering en participatie) and **leerroute** determine which exams you do.
- **ONA is a Wet 2013 component.** Under Wet 2013, cohorts obligated from 1 Oct 2017 do
  Lezen, Luisteren, Schrijven, Spreken, KNM, **ONA and PVT**.
- **MAP is not mentioned on inburgeren.nl at all** — it is a municipal obligation under Wet 2021
  (rijksoverheid). Do not present MAP as a DUO exam.
- Under Wet 2013 all language exams must be at *"taalniveau A2 of hoger"*.

### The three leerroutes (rijksoverheid)
| Route | Target level | Description |
|---|---|---|
| **B1-route** | B1, "maximaal 3 jaar" | language + (volunteer) work |
| **Onderwijsroute** | B1 or higher | toward mbo/hbo/wo, mainly for young people |
| **Zelfredzaamheidsroute (Z-route)** | A1 | for those who cannot do routes 1 or 2 |

All routes include KNM. The **gemeente** decides the route via the leerbaarheidstoets.

## 8. DUO's own practice-exam supply — VERIFIED, and it is our positioning
Source: https://www.inburgeren.nl/examen-doen/oefenen.jsp (verified 2026-07-28)
- **Lezen A2: 4** · **Luisteren A2: 3** · **Spreken A2: 3** · **Schrijven A2: 3** (PDF) · **KNM: 2**

We ship **10 per skill, 40 total**. "DUO geeft je 3 of 4 oefenexamens per onderdeel. Wij geven je
10." — fully citable, and the sharpest line available. Use it.

DUO's own advice on that page: use a desktop; rotate a phone/tablet to landscape. DUO's Spreken
practice exam **does not work in Safari**.

---

## 9. Still unverified — DO NOT PUBLISH

| Claim | Status |
|---|---|
| Raw-score pass norm (18/25, 19/25) | No official source; sources contradict. §2. |
| "500 punten" threshold | Not on DUO's uitslag page; contradicted by "cijfer"/"cesuur". §2. |
| A maximum number of retakes | No maximum stated anywhere. Phrase as absence, not as "unlimited". §5. |
| Exact vrijstelling thresholds (e.g. "5 jaar gewerkt") | Each has its own page under https://www.inburgeren.nl/minder-of-geen-examens/ — read the specific page and cite it. Not yet done. |
| AGI attempt minimum ("at least 3 attempts") | Via divosa.nl only. Verify against DUO first. |
| Verlenging rules for the 3-year termijn | Not verified. |
| Staatsexamen NT2 fees | Not fetched. https://www.duo.nl/particulier/staatsexamen-nt2/examengeld.jsp |
| Whether the 2025-10-21 amendment changed anything exam-relevant | Not read. Blocks the Wet-2021 article. |

---

## Sources, canonical list
- https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp
- https://www.inburgeren.nl/examen-doen/oefenen.jsp
- https://www.inburgeren.nl/examen-doen/uitslag.jsp
- https://www.inburgeren.nl/examen-doen/index.jsp
- https://www.inburgeren.nl/examen-doen/regels-voor-het-examen.jsp
- https://www.inburgeren.nl/images/examenreglement.pdf ← **the most citable document we have**
- https://www.inburgeren.nl/inburgeren-betalen/index.jsp
- https://www.inburgeren.nl/minder-of-geen-examens/
- https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering
- https://wetten.overheid.nl/BWBR0044770/2025-10-21/
