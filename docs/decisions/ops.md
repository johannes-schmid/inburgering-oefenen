# Local stack, the hosted project and how deploys reach production

The ports, the migration-history outage, and why there is no `.vercel/` link in this repo.

> Moved out of `CLAUDE.md` on 2026-09-02, unchanged. It is the reasoning behind decisions
> that are already made — read it when a task touches this area, not every session.
> The rules that must hold at all times live in `CLAUDE.md`; this file is why they hold.


### Local database — ports 544xx, NOT the default 543xx
The app runs against the **local Supabase stack**, not a cloud project. `.env.development.local`
already points at it (`http://127.0.0.1:54421` + the standard local CLI keys) and takes
precedence over `.env.local` in dev — so `npm run dev` never touches production data.

**This project deliberately uses the 544xx port block** so its stack can run at the same time
as the `knm-website` stack, which keeps the default 543xx block. Don't "fix" the ports back to
the defaults — the two would fight over 54321/54322 and only one could run.

| | This project | knm-website |
|---|---|---|
| API | http://127.0.0.1:54421 | http://127.0.0.1:54321 |
| Studio (browse tables) | http://127.0.0.1:54423 | http://127.0.0.1:54323 |
| Mailpit (catches all mail) | http://127.0.0.1:54424 | http://127.0.0.1:54324 |
| Postgres | `…@127.0.0.1:54422/postgres` | `…@127.0.0.1:54322/postgres` |
| Next dev | 3001 | 3002 (`npx next dev -p 3002`) |

```bash
supabase db reset     # re-apply the baseline + seed.sql — the way to test a schema change
supabase status       # URLs and keys
supabase stop         # free the ports — WITHOUT --no-backup
```

### Hosted project
`bbgrsfcevbavgsmnqjrd` · **Inburgering Oefenen** · Central EU (Frankfurt) · linked.

**The baseline's migration history lied, and cost a production outage.** The hosted project ran an
*earlier* version of `20260729000000_a2_baseline.sql`; the file was later rewritten in place during
the schema rework, and because the version number did not change, the rewritten file was recorded as
applied without ever running. `supabase migration list` showed the baseline applied on both sides
while the schemas differed by three columns, three CHECK constraints and the `questions_flat` view.
Every exam 404'd on production because `fetchExamContent()` selects `exams.pass_threshold_pct`, which
did not exist there. `20260731200000_align_production_schema.sql` closes the gap.

**So: never edit a migration that has run anywhere, including "recorded as applied".** And when
production misbehaves in a way local does not, diff the two schemas — the migration history is a
record of intent, not of fact. `supabase db diff --linked` finds the drift but writes the correction
**backwards** (it drops from local to match production), so read it and invert it by hand.

### Deploys go through GitHub only
The Vercel project `inburgering-oefenen` builds from a push to `main`; it serves
www.inburgeringoefenen.nl and already has the three Supabase vars from the Supabase↔Vercel
integration. **There is deliberately no `.vercel/` CLI link in this repo** — don't run
`vercel link`, `vercel deploy` or `vercel env pull` here. Push to `main` and let the Git
integration build. `vercel.json` (the two crons) is committed project config and stays.

`.env.local` targets the hosted project; **`.env.development.local` targets the local stack and
takes precedence in dev**, so `npm run dev` cannot write to production. Keep it that way.

Two live mismatches worth knowing:
- **Local Postgres and hosted are both 17.** This used to be a 15/17 mismatch; it is aligned now.
  Worth knowing because `20260803000000_open_skill_axis.sql` relies on `UNIQUE NULLS NOT
  DISTINCT`, which is PostgreSQL 15+. Do not drop the local major version below 15.
- **Never copy `MOLLIE_API_KEY` from `.env.local` to Vercel** — the local one is a `test_` key,
  and `MOLLIE_WEBHOOK_URL` is an ngrok tunnel. Production needs the live key and the real URL.

**Never pass `--no-backup` to `supabase stop`.** It deletes the project's Docker volumes
rather than dumping them. Used on `--project-id knm-website`, it destroyed that project's
local database; it was only recoverable because its repo still had `seed.sql` and
`seed_woordkaarten.sql`. To free a port held by another project, stop it plainly.

`psql` is not installed on the host; query the DB through the container:
```bash
docker exec -i supabase_db_inburgering-oefenen psql -U postgres -d postgres -c '<sql>'
docker exec -i supabase_db_knm-website        psql -U postgres -d postgres -c '<sql>'
```
