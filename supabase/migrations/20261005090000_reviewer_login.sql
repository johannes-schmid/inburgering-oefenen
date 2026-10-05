-- Wachtwoord-login voor precies één soort account: de reviewer van de OpenAI-review.
--
-- De site logt in met Google en alleen met Google (CLAUDE.md §4). De review van de ChatGPT-app
-- eist echter een testaccount dat "direct werkt, zonder MFA, e-mailcode of magic link" — en een
-- Google-login vanaf het netwerk van OpenAI krijgt vrijwel zeker een "Verify it's you"-uitdaging
-- die niemand kan uitzetten. Daarom bestaat er één wachtwoordaccount, en twee Auth-hooks zorgen
-- dat het er ook maar één kán zijn:
--
--   1. `hook_reviewer_claims` (Customize Access Token) weigert elk token dat met een wachtwoord is
--      verkregen tenzij `app_metadata.reviewer = true`. Dat veld is alleen met de service-sleutel
--      te schrijven (user_metadata is dat niet, zie open-items.md), dus een gebruiker kan zichzelf
--      nooit tot reviewer maken. Google-accounts hebben geen wachtwoord.
--   2. `hook_google_only_signup` (Before User Created) weigert het aanmaken van een e-mailaccount,
--      behalve via de admin-API met `reviewer: true`.
--
-- De "Password verification attempt"-hook (met een slot na vijf fouten) was de eerste keus, maar
-- die is alleen op het Team-plan beschikbaar. De bruteforce-bescherming is nu Supabase's eigen
-- rate-limit per IP op /token plus een willekeurig wachtwoord van 32 tekens.
--
-- Aanzetten: Dashboard → Authentication → Hooks → "Customize Access Token (JWT) Claims" en
-- "Before User Created", beide als Postgres-functie. Lokaal staan ze in config.toml.
-- Uitzetten na de review: REVIEWER_LOGIN_ENABLED leeg op Vercel verbergt het formulier, en het
-- account kan weg; de hooks mogen blijven staan.

create or replace function public.hook_reviewer_claims(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_method text := event->>'authentication_method';
  v_is_reviewer boolean := coalesce((event->'claims'->'app_metadata'->>'reviewer')::boolean, false);
begin
  if v_method = 'password' and not v_is_reviewer then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Inloggen met een wachtwoord is niet mogelijk. Gebruik Inloggen met Google.'
    ));
  end if;
  -- Claims ongewijzigd teruggeven; de hook mag de verplichte claims niet laten vallen.
  return jsonb_build_object('claims', event->'claims');
end;
$$;

grant execute on function public.hook_reviewer_claims to supabase_auth_admin;
revoke execute on function public.hook_reviewer_claims from authenticated, anon, public;

-- Tweede slot: niemand mág een e-mail-account aanmaken. De hook hierboven weigert het inloggen,
-- maar `signUp` met e-mail geeft bij uitgeschakelde e-mailbevestiging direct een sessie — en die
-- ene sessie zou een account zonder Google zijn. Deze hook weigert het aanmaken zelf, zodat de
-- regel "alleen Google" niet afhangt van een dashboardschakelaar. Het reviewer-account wordt met
-- de service-sleutel aangemaakt (admin-API, provider 'email'), daarom laat de hook aanmaken door
-- door als `app_metadata.reviewer = true` al in het verzoek staat — en dat kan alleen de admin-API.
-- Aanzetten: Dashboard → Authentication → Hooks → "Before user created".
create or replace function public.hook_google_only_signup(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_provider text := event->'user'->'app_metadata'->>'provider';
  v_reviewer boolean := coalesce((event->'user'->'app_metadata'->>'reviewer')::boolean, false);
begin
  if v_provider = 'email' and not v_reviewer then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Een account maak je aan met Inloggen met Google.'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;

grant execute on function public.hook_google_only_signup to supabase_auth_admin;
revoke execute on function public.hook_google_only_signup from authenticated, anon, public;
