-- De twee opgavesoorten waarin de cursist zélf spreekt.
--
-- ── WAAROM DIT MOET ──────────────────────────────────────────────────────────
-- De leerlaag had veertien item-soorten en geen enkele waarin je je stem gebruikt. Voor A2
-- Lezen was dat geen gemis; voor A2 Spreken is het de hele vaardigheid. Een spreekcursus met
-- alleen `open_zin` laat de cursist *typen* wat hij zou zeggen, en dat is precies de fout die
-- het examen bestraft: verstaanbaarheid meet je niet op papier.
--
--   naspreken  hoor de zin, spreek hem na, hoor jezelf terug (blok B, uitspraak)
--   opnemen    geef zelf een gesproken antwoord op een opdracht (blok C en D)
--
-- ── GEEN BEOORDELING, EN DAT IS EEN ONTWERPKEUZE ─────────────────────────────
-- Beide soorten kijken zichzelf niet na. Er gaat geen rubriek en geen modelcall aan te pas:
-- de cursist hoort zijn eigen opname terug naast het voorbeeld en vergelijkt zelf, precies
-- zoals `open_zin` dat met een voorbeeldantwoord doet. Twee redenen, en de tweede is de
-- belangrijkste:
--
--   1. Een rubriekcall per oefenzin is niet te betalen; de Schrijven- en Spreken-rubrieken
--      bestaan om een héle examenopdracht te beoordelen.
--   2. Het product belooft dat een docent beoordeelt, niet een model. Een oefenzin die met
--      een rood kruis terugkomt omdat de spraakherkenning een accent niet volgde, is erger
--      dan geen meting — en het zou de enige claim die dit product heeft ondermijnen.
--
-- De opname verlaat de browser niet. Er is dus ook geen Storage-pad, geen rij en geen
-- bewaartermijn: wat je inspreekt bestaat zolang de pagina open staat.
--
-- ── AUDIO ZONDER URL IS NU GELDIG ────────────────────────────────────────────
-- `lesson_items.payload` is jsonb en heeft geen CHECK op zijn vorm — de vorm staat in
-- `lib/lessons/items.ts`. Daar wordt `audio.audio_url` nullable, omdat een luisterles wordt
-- geschreven vóór het fragment is ingesproken: eerst de tekst en de vragen, dan de TTS-run.
-- Een verzonnen URL in de tussentijd zou een 404 zijn die eruitziet als kapotte audio.
-- Deze migratie hoeft daar niets voor te doen; het staat hier omdat de twee bij elkaar horen.

alter table lesson_items drop constraint lesson_items_kind_check;

alter table lesson_items add constraint lesson_items_kind_check check (kind = any (array[
  -- uitleg en materiaal — vragen niets, hebben geen `tier`
  'uitleg', 'voorbeeld', 'leestekst', 'audio', 'video', 'woordenlijst', 'zinnenbank',
  -- opgaven — hebben altijd een `tier` en een `explanation`
  'mcq', 'gap_choice', 'gap_type', 'woordorde', 'matchen', 'open_zin', 'markeren',
  -- opgaven waarin de cursist spreekt
  'naspreken', 'opnemen'
]::text[]));

comment on constraint lesson_items_kind_check on lesson_items is
  'Moet gelijk blijven aan ITEM_KINDS in lib/lessons/items.ts. De database is de tweede muur, '
  'niet de eerste: de payloadvorm wordt daar gevalideerd, hier alleen de soortnaam.';
