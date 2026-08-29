-- The AI Gateway's own id for a call, so a row in our ledger can be reconciled against Vercel.
--
-- `providerMetadata.gateway.generationId` comes back on every gateway call and `GET /v1/generation`
-- resolves it to the billed cost, tokens and latency. Without it a disagreement between our total
-- and Vercel's is unfindable: there is no key to line the two up on.
--
-- Null for anything that did not go through the gateway — which is every Scribe row, since
-- ElevenLabs bills separately.
alter table ai_usage add column if not exists generation_id text;
create index if not exists ai_usage_generation_idx on ai_usage (generation_id);
