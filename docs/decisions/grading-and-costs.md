# Rubric grading, stimulus audio and what the models cost

Two models per spoken answer, why Spreken records WAV, and where the AI spend is read from.

> Moved out of `CLAUDE.md` on 2026-09-02, unchanged. It is the reasoning behind decisions
> that are already made — read it when a task touches this area, not every session.
> The rules that must hold at all times live in `CLAUDE.md`; this file is why they hold.


## Rubric grading — Schrijven en Spreken

The docent authors the criteria; a model applies them; the docent reviews the result. Never frame
it as "de AI beoordeelt je antwoord" — that inverts the product's only claim.

| Piece | Where |
|---|---|
| Rubric keying + scoring maths | `lib/rubrics.ts` |
| Draft criteria (form prefill **only**) | `lib/rubric-templates.ts` |
| Model ids, timeout, temperature | `lib/ai/gateway.ts` |
| Scribe transcription + measured signals | `lib/ai/transcribe.ts` |
| The one grading prompt | `lib/ai/grade.ts` |
| The endpoint | `app/api/grade-open/route.ts` |
| Candidate-facing result | `components/exam/RubricFeedback.tsx` |
| Rubric authoring | `(admin)/admin/rubrics/` |
| Review inbox + agreement eval | `(admin)/admin/beoordeling/` |

**Two models, and why.** Schrijven grades on text. Spreken transcribes with ElevenLabs Scribe
(`scribe_v2`) *and* sends the recording to an audio-capable model, because the owner's decision
(2026-07-30) is that pronunciation is judged from the audio, not inferred from a transcript. Two
calls per spoken answer is deliberate: the transcript is shown to candidate and docent, and Scribe's
per-word `logprob` yields an **objective** intelligibility number the docent can verify. That is
what keeps the pronunciation criterion defensible.

**Spreken records WAV, not WebM.** Verified: the grading model accepts wav/mp3/aiff/aac/ogg/flac and
**not** WebM or Opus, which is all `MediaRecorder` can emit. `lib/wav-recorder.ts` encodes 16 kHz
mono WAV in the browser (AudioWorklet + a 44-byte header, no dependency). Costs ~30 MB per Spreken
exam versus ~2 MB for Opus; buys one artifact that the browser, Scribe, the model and the docent's
inbox all read with no transcode anywhere. **Before changing the audio model, re-run
`npm run check:audio-model`** — it synthesises a Dutch sentence with unguessable words, sends only
the audio, and fails if they do not come back. Asking a model "did you get audio?" gets a yes either
way.

**Rubric keying is `(level, skill, task_type)`.** `rubrics.task_type` is free text. Schrijven uses `task_type`
(`email`, `short_text`, `form`, `picture_note`); Spreken has one task_type but four onderdelen with
different image rules, so it is keyed by `image_usage` → `speaking_none` / `speaking_describe` /
`speaking_choose` / `speaking_cover_all`. `rubricCategory()` is the only place that convention
lives. Eight rubrics cover all 20 open exams.

**Editing a rubric that has graded someone mints version + 1.** `open_criterion_scores.rubric_version`
is what makes a stored score interpretable later; rewriting v1 in place changes the meaning of every
grade already recorded against it. The decider is `used_count` from `open_criterion_scores`, **not**
`active` — a deactivated rubric can still have graded hundreds. `rubrics_one_active_idx` is
`UNIQUE (level, skill, task_type) WHERE active`, so activating v2 must deactivate v1 **first** —
and the deactivation must be scoped to the level, or activating a B1 rubric switches off A2's.

**AI and teacher scores coexist by design.** `UNIQUE (submission_id, criterion_key, source)`. The
candidate sees one number per criterion and it is the docent's where she entered one
(`effectiveScores()`); the pair is the dataset `/admin/beoordeling/evals` runs on. The headline
metric there is **signed bias per criterion**, not accuracy — "0.6 milder dan jij op grammatica" is
actionable, "71% overeenkomst" is not.

**`grading_examples.use_as_fewshot` is a train/test split.** `true` is fed to the grader; `false` is
held back to measure it. Promoting a held-back example inflates the next eval without the model
having improved. Never pass `use_as_fewshot = false` rows to `fetchFewShot`.

**A missing criterion is missing, not zero.** `pctFromCriteria` drops unscored criteria from the
denominator and the UI says so. Scoring them 0 would turn a grading bug into a failed exam.

**`exam_attempts.feedback_mode`.** The owner chose per-answer feedback inside full exams. A
`practice` sitting therefore lets the candidate revise after being told what was wrong, so its score
does not predict DUO. `exam` mode withholds feedback until submit. Anything claiming readiness must
filter on `feedback_mode = 'exam'`.

**Rubric attempts have a null score until graded.** `completeExamAttempt` takes
`score`/`pct`/`passed` as nullable. It used to write `0 / 0% / false` for open skills, which the
dashboard rendered as a fail and averaged in.

**`/api/grade-open` spends money per call.** It is capped at 3 grades per task (per attempt, or per
`(user, task)` when `attempt_id` is null), idempotent unless an admin passes `force`, and it records
`grade_error` on the row so a stuck answer surfaces in the inbox. There is deliberately **no
`/api/transcribe`** — transcription only ever runs as the first step of a grade.

**Live transcript: browser → ElevenLabs directly, no relay.** `/api/stt-token` mints a single-use
token (`POST /v1/single-use-token/realtime_scribe`, 15-minute expiry) so the key never reaches the
browser; the client then opens `wss://api.elevenlabs.io/v1/speech-to-text/realtime` itself with
`model_id=scribe_v2_realtime&audio_format=pcm_16000&commit_strategy=vad&filter_background_audio=true`.
Proxying would mean our infrastructure carrying audio it has no use for.

`WavRecorder` already produces 16 kHz mono PCM, which is what that endpoint wants, so
`lib/realtime-transcript.ts` taps the recorder's frames via `start({ onPcm })` rather than opening a
second `getUserMedia` — two mic streams conflict on some platforms and would capture subtly
different audio from the file that actually gets graded. The tap can never break the recording.

**`filter_background_audio=true` is not optional.** Without it Scribe invents words from silence: a
4.8-second probe followed by quiet produced a trailing "Ja." nobody said. A candidate who finishes
early leaves exactly that silence, and a readback showing words they did not say destroys the only
thing the pane is for.

**The live transcript is never the graded transcript.** Grading runs on the submitted WAV through the
batch call in `lib/ai/transcribe.ts`, which also yields the per-word confidence the docent reviews.
The two can differ, and the UI says so. The readback is Oefenmodus-only — DUO gives none, and reading
your own words mid-answer trains self-correction rather than speaking.

**ElevenLabs keys are per-product scoped.** Text-to-speech and `speech_to_text` are separate
permissions, and a key without the latter 401s with `missing the permission speech_to_text` on both
Scribe paths while TTS keeps returning 200. Rotating the key does not help; the scope does. Every
transcription path degrades rather than failing the grade.

**Never select `model_answer` or rubric criteria into a client component.** `ExamContent` goes
straight into `ExamShell`, so anything in `TASK_COLS` is in the page payload. The exemplar answer and
the anchors are a scoring key. `rubrics` has no non-admin SELECT policy for the same reason, which is
why grading is a server route.

---

## Stimulus audio is generated from admin

`/api/generate-stimulus-audio` renders a Luisteren stimulus from `stimuli.script` and
`stimuli.voice_cast` in **one** `/v1/text-to-dialogue` call (`eleven_v3`), uploads to the
`question-audio` bucket and writes `stimuli.audio_url`. Three modes: a **draft** (script not saved
yet, returns a URL and writes no row), one saved stimulus, or every audio stimulus in an exam that
has no file. `lib/tts-dialogue.ts` holds the parsing and casting rules and is the server twin of
`scripts/generate-free-practice-audio.mjs` — change one, look at the other.

- **Generation refuses rather than guesses.** An uncast speaker, an unknown voice key, or two
  speakers sharing a voice are all 400s. Casting is a content decision the script forces
  (`mevrouw De Wit` is female) and is **not** recoverable from the mp3, so a generator that picked
  for you would produce plausible audio that is quietly wrong.
- **Draft mode exists because of the CHECK, not by preference.**
  `stimuli_payload_matches_kind` requires an audio stimulus to have an `audio_url`, so a new one
  cannot be saved script-first and generated from afterwards. The editor generates first and saves
  the URL it gets back. Don't "simplify" this by relaxing the constraint — that is what keeps a
  half-authored stimulus out of a published exam.
- **Scripts may put every turn on one line.** The seeded exams store `A: … B: … A: …` as a single
  paragraph, so the parser splits on inline tags as well as newlines. An inline tag must start with
  a capital and contain no spaces (which keeps `Hij zei: kom maar` out); a multi-word label like
  `Mevrouw De Wit:` is only honoured at the start of a line.
- **No loudness normalisation here.** The taster pipeline runs a two-pass ffmpeg loudnorm to
  −20 LUFS and there is no ffmpeg binary in a serverless function, so exam audio generated from
  admin sits at ElevenLabs' native level. Known and accepted — do not "fix" it by dropping the
  loudnorm from the taster script, which is the surface where a level mismatch inside one sitting
  would actually hurt.

**`lib/admin/guard.ts` (`requireAdmin()`) is how an `/api` route checks the allowlist.** The
`(admin)` layout guards pages; a route handler has no layout above it. `generate-stimulus-audio`
and `admin/run-eval` use it. **`generate-question-audio`, `generate-wordcard-audio` and
`admin/generate-lesson-audio` still do not** — they are reachable by anyone who knows the path and
each spends ElevenLabs credits per call. Worth closing.

### AI-kosten komen van de leveranciers, niet van een getal in .env (2026-08-28)

`ai_usage` is het grootboek: één rij per betaalde providercall, geschreven door `lib/ai/usage.ts`
op de service key, nooit fataal. Het paneel staat op `/admin` (`_components/AiCostCard.tsx`,
`lib/admin/ai-spend.ts`).

- **Een nakijkactie is niet een call.** Spreken is Scribe + de grader, Schrijven alleen de grader.
  Ze delen één `request_id` en het gemiddelde gaat over *distinct request ids*. Over rijen
  gemiddeld rapporteert Spreken de helft van de echte kosten — precies de vergelijking waarvoor het
  paneel bestaat.
- **Het budget is de creditsstand van de Gateway** (`GET /v1/credits`), geen
  `AI_MONTHLY_BUDGET_EUR`; die env-var is bewust weer weg. Vercel biedt **geen** endpoint voor de
  API-key-budget zelf (docs 2026-08-28), en een bedrag dat we niet kunnen verifiëren hoort niet op
  een beslispagina.
- **`GET /v1/report` is account-breed**, dus ongefilterd zit het B1-autheringswerk op
  `anthropic/claude-opus-5` erin. Elke gradingcall draagt daarom
  `providerOptions.gateway.tags = ['feature:nakijken', 'onderdeel:<skill>']` en de query filtert
  daarop. Verwijder die tags niet: dan is het controlecijfer een getal over iets anders.
- **Rapportage kost geld** ($5/1.000 queries, $0.075/1.000 tagwrites) en loopt minuten achter.
  Beide gateway-reads zijn daarom een uur gecached via `fetch`'s `next: { revalidate }`, en het
  Vercel-cijfer staat in de voetnoot als *controle* — nooit als bron voor de gemiddeldes, want
  Scribe (~15% van een Spreken-check) zit er niet in.
- **Alles degradeert naar `null`.** Geen key, een 403 (het endpoint vereist Pro), API down: het
  paneel laat de vergelijking weg. Een adminpagina mag niet omvallen op de rapportage-API van een
  derde.
- **`USD_EUR` in `lib/ai/costs.ts` is de enige aanname** en wordt bewust niet live opgehaald: een
  historie die meebeweegt met de FX-markt valt niet tegen een factuur te leggen. Tarieven daar zijn
  gepubliceerde leverancierstarieven; wijzig er nooit één zonder `RATES_CHECKED_ON` mee te zetten.
- **`bg-primary/10` rendert in de adminbundle volledig dekkend** (zelfde reden als de dichte
  vierkanten van de statstegels), dus de meter gebruikt een inline rgba. Een vulling onder ~1,5%
  is subpixel en leest als "niets besteed", vandaar de ondergrens.
