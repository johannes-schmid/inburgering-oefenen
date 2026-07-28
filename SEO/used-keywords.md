# Used primary keywords

Append-only. One primary keyword per post, never reused — two posts targeting the same term
cannibalise each other and both lose.

| Primary keyword | Post slug | Published |
|---|---|---|
| inburgeringsexamen a2 | `inburgeringsexamen-a2-uitleg` | 2026-07-08 |
| lezen examen inburgering | `lezen-examen-inburgering-a2` | 2026-07-14 |
| luisteren examen inburgering | `luisteren-examen-inburgering-a2` | 2026-07-20 |
| inburgeringsexamen zakken | `inburgeringsexamen-zakken-herkansen` | 2026-07-25 |
| wat is het verschil tussen a1 en a2 | `taalniveaus-a1-a2-b1-nederlands` | 2026-07-28 |

## Translation status (2026-07-28)

| Post | NL | EN | AR |
|---|---|---|---|
| `inburgeringsexamen-a2-uitleg` | ✅ | ✅ | ✅ |
| `lezen-examen-inburgering-a2` | ✅ | ✅ | — |
| `luisteren-examen-inburgering-a2` | ✅ | ✅ | — |
| `inburgeringsexamen-zakken-herkansen` | ✅ | ✅ | — |
| `taalniveaus-a1-a2-b1-nederlands` | ✅ | ✅ | — |

A locale with no `articleHtml` is `noindex`ed and shows a "not translated yet" notice above an
LTR-wrapped Dutch fallback, and is excluded from the sitemap. So the four missing Arabic bodies
are safe to leave — they cost reach, not correctness. Add them by filling
`translations.ar.articleHtml` (plus `heroTitle`, `description`, `category`, `heroSubtitle`,
`cta*`, `faq`, `sidebarHtml`); everything else is automatic. Use `factAr()` for fact boxes and
keep the slug identical across locales (see the note in `components/Nav.tsx`).

## Claimed but not yet written
Reserved so a future session doesn't target them from a second angle:
- `schrijven examen inburgering` — waiting for the Schrijven product to ship
- `spreken examen inburgering` — waiting for the Spreken product to ship
- `wet inburgering 2021` — blocked on reading the 2025-10-21 statute amendment
