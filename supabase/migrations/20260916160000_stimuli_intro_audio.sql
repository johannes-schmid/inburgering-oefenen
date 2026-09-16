-- De ingesproken introductie van een luistertekst.
--
-- DUO zet bij élke tekst een eigen introtrack (2024: "Track 9 intro Mbo-opleiding gastvrouw").
-- Daarin leest een verteller de titel voor, dan waar het gesprek over gaat, en dan "U hoort nu
-- eerst het begin van het gesprek. Hierbij is nog geen opgave." — waarna het begin van het
-- gesprek zelf speelt. Scribe telt in zo'n track drie sprekers: de verteller plus de twee die
-- daarna aan het woord zijn.
--
-- ## Waarom een kolom en geen eigen stimulus-rij
-- De voor de hand liggende vorm is een zevende `stimuli`-rij per gesprek, zonder vraag. Dat
-- loopt op drie dingen stuk, en geen ervan is de moeite waard:
--
--   1. `exam_publish_issues()` geeft een **error** op "Stimulus zonder vragen". Die functie
--      aanpassen is precies het soort herschrijving dat hier al twee keer een eerdere fix heeft
--      opgeslokt (zie CLAUDE.md).
--   2. `exam_formats.stimulus_count` staat op 39. Zes introrijen maken er 45 van, en dan moet
--      dat getal iets anders gaan betekenen dan "aantal vragen".
--   3. `ExamShell` bouwt zijn stappen als `stimuli.flatMap(s => s.questions.map(...))`. Een rij
--      zonder vragen levert nul stappen op en zou dus überhaupt niet in beeld komen.
--
-- Met deze twee kolommen blijft het aantal rijen 39 en wordt de introstap afgeleid: een stimulus
-- mét `intro_audio_url` krijgt in de speler een eigen scherm vóór zijn vraag. De bestaande
-- `intro`-kolom draagt de gedrukte tekst al, en die staat alleen op het eerste fragment van een
-- gesprek — dus het groeperen zit er al in.
alter table stimuli
  add column if not exists intro_audio_url text,
  add column if not exists intro_audio_seconds numeric(6,2);

-- Zelfde regel als `stimuli_audio_seconds_check`: een duur van nul of minder is een meetfout,
-- geen waarde.
alter table stimuli
  drop constraint if exists stimuli_intro_audio_seconds_check;
alter table stimuli
  add constraint stimuli_intro_audio_seconds_check
  check (intro_audio_seconds is null or intro_audio_seconds > 0);

-- Een duur zonder bestand is een halve opname en leest in de speler als een bug.
alter table stimuli
  drop constraint if exists stimuli_intro_audio_pair;
alter table stimuli
  add constraint stimuli_intro_audio_pair
  check (intro_audio_seconds is null or intro_audio_url is not null);

comment on column stimuli.intro_audio_url is
  'De ingesproken introductie: verteller leest titel en scenario, daarna het begin van het gesprek. Alleen gevuld op het eerste fragment van een luistertekst.';
