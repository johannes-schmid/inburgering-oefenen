# Used primary keywords

Append-only. One primary keyword per post, never reused — two posts targeting the same term
cannibalise each other and both lose.

| Primary keyword | Post slug | Published |
|---|---|---|
| inburgeringsexamen a2 | ~~`inburgeringsexamen-a2-uitleg`~~ → `/taalexamens/taalexamens-a2-b1` (samengevoegd 2026-11-03) | 2026-07-08 |
| lezen examen inburgering | ~~`lezen-examen-inburgering-a2`~~ → `/taalexamens/lezen-examen` (samengevoegd 2026-11-03) | 2026-07-14 |
| luisteren examen inburgering | ~~`luisteren-examen-inburgering-a2`~~ → `/taalexamens/luisteren-examen` (samengevoegd 2026-11-03) | 2026-07-20 |
| inburgeringsexamen zakken | `inburgeringsexamen-zakken-herkansen` | 2026-07-25 |
| wat is het verschil tussen a1 en a2 | `taalniveaus-a1-a2-b1-nederlands` | 2026-07-28 |
| schrijven examen inburgering tips | `veelgemaakte-fouten-schrijven-examen-a2` | 2026-09-16 |
| verschil want en omdat | `want-of-omdat` | 2026-09-16 |
| wederkerende werkwoorden | `wederkerende-werkwoorden-nederlands` | 2026-09-16 |
| spreken examen inburgering tips | ~~`spreken-examen-inburgering-tips`~~ → `/taalexamens/spreken-examen` (samengevoegd 2026-11-03) | 2026-09-16 |

## Page-level primaries (2026-09-25, Semrush)

Not blog posts, but the same rule holds: one primary per URL, never reused. The full map with
volumes is the top of `SEO/keywords.md`.

| Primary keyword | URL |
|---|---|
| inburgering examen oefenen | `/nl` |
| inburgering examen oefenen a2 | `/nl/oefenexamen/a2` |
| inburgeringsexamen oefenen b1 | `/nl/oefenexamen/b1` |
| inburgering examen oefenen {lezen,luisteren,schrijven,spreken} a2 | `/nl/oefenexamen/a2/<skill>` |
| oefenen voor inburgering | `/nl/oefenen` |
| inburgering examen oefenen knm | `/nl/oefenexamen/knm` |
| inburgering practice exam | `/en` |
| dutch a2 exam | `/en/practice-exam/a2` |
| inburgeringsexamen | `/nl/taalexamens/taalexamens-a2-b1` |
| wet inburgering 2021 | `/nl/inburgering/welke-wet-en-welke-route` |
| map inburgering | `/nl/inburgering/pvt-map-en-ona` |
| inburgering verplicht | `/nl/inburgering/moet-ik-inburgeren` |

## Translation status (2026-09-16)

| Post | NL | EN | AR |
|---|---|---|---|
| `inburgeringsexamen-zakken-herkansen` | ✅ | ✅ | — |
| `taalniveaus-a1-a2-b1-nederlands` | ✅ | ✅ | — |
| `veelgemaakte-fouten-schrijven-examen-a2` | ✅ | ✅ | ✅ |
| `want-of-omdat` | ✅ | ✅ | ✅ |
| `wederkerende-werkwoorden-nederlands` | ✅ | ✅ | ✅ |

A locale with no `articleHtml` is `noindex`ed and shows a "not translated yet" notice above an
LTR-wrapped Dutch fallback, and is excluded from the sitemap. So the four remaining missing Arabic bodies (the July posts)
are safe to leave — they cost reach, not correctness. Add them by filling
`translations.ar.articleHtml` (plus `heroTitle`, `description`, `category`, `heroSubtitle`,
`cta*`, `faq`, `sidebarHtml`); everything else is automatic. Use `factAr()` for fact boxes and
keep the slug identical across locales (see the note in `components/Nav.tsx`).

## Claimed but not yet written
Reserved so a future session doesn't target them from a second angle:
- `schrijven examen inburgering voorbeeld` — `/taalexamens/schrijven-examen-voorbeelden` (concept 2026-11-03, wacht op review)
- `uitslag spreken a2` / `uitslag inburgeringsexamen` — `/taalexamens/uitslag-spreken-schrijven-a2` (concept 2026-11-03)
- `taaleis naturalisatie` — `/inburgering/taaleis-naturalisatie` (concept 2026-11-03)
- `schrijven examen inburgering` — nog vrij; de tips-variant is geclaimd door `veelgemaakte-fouten-schrijven-examen-a2`
- `spreken examen inburgering` — eigenaar is `/taalexamens/spreken-examen` (de tips-post is er op 2026-11-03 in opgegaan)
- `wet inburgering 2021` — blocked on reading the 2025-10-21 statute amendment
