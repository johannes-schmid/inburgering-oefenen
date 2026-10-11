# AI compliance — EU AI Act, AVG, ACM, Google (2026-10-11)

Why the site says what it says about AI, and what would have to change if a pipeline changes.
Researched 2026-10-11; not legal advice. Re-check when the Commission's final high-risk
classification guidelines land (expected end of 2026).

## Where AI is used

| Surface | AI | Human | Disclosure |
|---|---|---|---|
| Exam items, lessons | LLM drafts in DUO format | Amber checks and corrects every item before publish | `/redactie`, homepage line, FAQ |
| NL guides and blog | LLM drafts; figures from `SEO/facts.md` | Amber reviews before publish | byline link to `/redactie` |
| EN/AR translations | machine translation | **none** | notice at the top of every page (`guides.mt_notice`, `blog.mt_notice`) |
| Schrijven/Spreken grading | Gemini 2.5 Flash via Vercel AI Gateway applies her rubric; ElevenLabs Scribe transcribes | Amber reviews gradings afterwards | `RubricFeedback`, `portal.rubric_note`, privacy §7 |
| Listening audio | ElevenLabs TTS, fictional speakers | script is reviewed | `/redactie` |
| Dashboard coach | none — rule-based (`lib/marieke-insights.ts`) | — | `/redactie` |

## EU AI Act (Regulation 2024/1689)

- **Article 50 has applied since 2 August 2026.** The AI Omnibus (in force 27-07-2026) did not
  postpone it; it only gave providers of systems already on the market until 2 December 2026 for
  machine-readable marking (50(2)).
- **50(4), text on matters of public interest** (immigration and integration rules count, per the
  Commission's Article 50 guidelines of 20-07-2026): disclosure is required **unless** the text
  was humanly reviewed and a natural or legal person holds editorial responsibility. That is
  why `/redactie` names Amber as eindredactie and Samen Sterk in Taal as publisher. The review must
  be substantive, not a glance.
- **The EN/AR translations do not qualify for that exception** — they are unreviewed. They carry
  the disclosure at the top of the page, before first exposure (50(5)).
- **Grading.** Wrapping a third-party model in our own grading feature may make us a *provider*
  under 50(2). The visible "een taalmodel beoordeelde dit" line at the point of grading is the
  cheap insurance.
- **High-risk (Annex III 3(b), "evaluate learning outcomes")**: most likely **not** applicable.
  The grading is formative practice feedback on a practice platform: no admission, no diploma,
  no level decision, not an educational institution. The Commission's draft classification
  guidelines (19-05-2026) treat formative feedback as generally not high-risk. Two things would
  move us towards it: presenting an AI score as a predicted DUO result, and steering a learner's
  route automatically on AI scores. **Keep the "wat nu?" routing rule-based and never call a
  score a pass/fail prediction.** Even in the worst case, Annex III applies from 2 December 2027.
- The **Code of Practice on marking and labelling** (final 10-06-2026) is voluntary. Not signed.

## AVG

- Grading has no legal or similarly significant effect, so **Article 22 does not apply**; the
  privacy policy says so and offers a human look on request.
- Privacy policy §7 names the processors (Vercel AI Gateway, Google/Gemini, ElevenLabs), the data
  sent (answer, recording, transcript — no name or e-mail), the legal basis (6(1)(b)),
  retention (as long as the account exists), no training, and the transfer basis (DPF or SCCs).
- **Open, internal:** DPAs signed with Vercel, Google and ElevenLabs; confirm each one's DPF
  listing at dataprivacyframework.gov. If the grader model changes (`AI_GRADER_TEXT_MODEL`),
  privacy §7 and `/redactie` change in the same commit.

## ACM

No AI-specific guidance, but the ordinary misleading-practices rules (Art. 6:193c BW) apply and
the ACM treats vague or absolute claims strictly. **"Geen AI" was literally false** and has been
removed site-wide (2026-10-11). The defensible claim is: *door een NT2-gecertificeerde docent
gemaakt en volledig nagekeken; AI helpt, zij beslist.* Never reintroduce "geen AI", "niet door AI"
or "niet door een algoritme".

## Google

- Scaled content abuse (spam policies, updated 2026-08-28) names automated translation only
  inside the "many pages, little value" framing; the old "translated by an automated tool without
  human review" line is gone. Our own reviewed guides, translated for real readers, are low risk —
  but `scripts/seo-agent/page-audit.mjs` lists 57 unreviewed translations without a single click,
  and noindexing those is the owner's call.
- "Using generative AI content" (01-10-2026): fact-check everything, including titles, meta
  descriptions, structured data and alt text, and explain how automation was used.
- "Creating helpful content" (05-10-2026): accurate bylines to real people; fabricated creator
  profiles are deception. This is why "Marieke Schipper" was replaced by Amber (11-10).
