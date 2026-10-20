-- De ingesproken situatie bij een luistervraag (A2).
--
-- DUO leest vóór élke vraag de situatie voor ("Meneer Diallo staat bij de balie van de
-- gemeente. Lees eerst de vraag. Kijk daarna naar de video."), laat dan leestijd, en speelt
-- daarna het fragment. Wie opnieuw wil luisteren, hoort die situatie eerst weer. De gedrukte
-- tekst staat al in `stimuli.intro`; dit is de opname ervan.
--
-- ## Waarom niet `intro_audio_url`
-- Die kolom bestaat al en betekent iets anders: de introtrack van een héél gesprek (B1), alleen
-- op het eerste fragment, en een stimulus mét `intro_audio_url` krijgt in de speler een eigen
-- scherm vóór zijn vraag. Dezelfde kolom vullen op elke A2-stimulus zou honderd extra schermen
-- opleveren. Twee betekenissen, twee kolommen.
alter table stimuli
  add column if not exists situation_audio_url text;
