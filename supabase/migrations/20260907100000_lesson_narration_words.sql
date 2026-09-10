-- Woord-voor-woord tijden van een ingesproken uitleg: het meelezen.
--
-- Waarom naast `cues` en niet erin: een cue markeert een *element op de pagina* en er zijn er
-- acht per les; dit zijn de ~250 woorden van het script zelf, en ze markeren niets — ze zijn de
-- tekst. Ze in `cues` gooien zou de speler elke seconde door 250 items laten lopen om de acht
-- die een element aanwijzen eruit te vissen.
--
-- Vorm: [{ "w": "Deze", "t": 0.12, "p": 0 }]
--   w — het woord zoals de stem het kreeg, inclusief interpunctie
--   t — seconde waarop het woord begint, uit de ElevenLabs-alignment
--   p — de alinea waarin het staat, zodat het meeleespaneel de regels van het script houdt
--
-- **Het paneel rendert uitsluitend uit deze kolom, niet uit `script`.** Anders zou de client
-- het script opnieuw in woorden moeten knippen met precies dezelfde regels als de generator,
-- en een tokenizer op twee plekken is een tokenizer die gaat verschillen — dan licht het
-- verkeerde woord op en is er niets dat het merkt.
alter table lesson_narration
  add column if not exists word_times jsonb not null default '[]'::jsonb;

-- Zoals bij `cues`: een array is de vorm waar de speler op loopt, en jsonb kent het verschil
-- tussen een array en een object niet.
alter table lesson_narration
  drop constraint if exists lesson_narration_word_times_is_array;
alter table lesson_narration
  add constraint lesson_narration_word_times_is_array
  check (jsonb_typeof(word_times) = 'array');
