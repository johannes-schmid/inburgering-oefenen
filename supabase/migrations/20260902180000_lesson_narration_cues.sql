-- De cues van een ingesproken uitleg: welk element wordt wannéér besproken.
--
-- Een jsonb-kolom en geen tweede tabel: een cue heeft geen eigen leven — hij bestaat alleen als
-- onderdeel van één opname, hij wordt altijd in zijn geheel herschreven als de opname opnieuw
-- wordt gegenereerd, en er wordt nooit los op gequeried. Een rijtje-per-cue zou drie joins
-- toevoegen voor iets wat altijd samen komt en samen gaat.
--
-- Vorm: [{ "id": "card-0", "at": 12.34, "note": "…" }]
--   id   — het element op de pagina (`rule`, `card-<n>`, `demo-<n>`, `exercises`)
--   at   — seconde waarop de stem erover begint, uit de ElevenLabs-alignment
--   note — de extra uitleg die náást de opname bij dit element hoort, of afwezig
alter table lesson_narration
  add column if not exists cues jsonb not null default '[]'::jsonb;

-- Een object zou hier stil verkeerd gaan: de speler loopt de cues op tijd af en dat vereist een
-- array. De CHECK is de enige plek waar dat vastligt, want jsonb kent het verschil niet.
alter table lesson_narration
  drop constraint if exists lesson_narration_cues_is_array;
alter table lesson_narration
  add constraint lesson_narration_cues_is_array
  check (jsonb_typeof(cues) = 'array');
