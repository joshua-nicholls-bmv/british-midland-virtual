# Website pilot registration

The application form is in `join.html`; management reviews are in `management/applications.html`. The implementation uses the existing Supabase project `eqbaezhcwnjlcnvtfxho`, BMA allocator, internal Auth email, Cadet provisioning and `standardPassword()`.

## Current status

- Database upgrade and five function bundles deployed: public application endpoint, management endpoint, worker, Discord handler and shared Tech Ops handler.
- Website submissions remain closed until Turnstile is configured and `BMV_WEBSITE_REGISTRATION_ENABLED=true` is set.
- Old Discord registration remains enabled during the transition. Website applications are excluded from Discord approval posts and Discord role assignment. The website path sends only the welcome DM.
- No Discord OAuth, no password redesign, and no changes to existing ACARS credentials.
- Optional VATSIM and SimBrief IDs are retained with the application for review. They do not establish verified VATSIM identity or overwrite existing ACARS profile settings.

## Open applications

1. In [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), add a Managed widget named **BMV pilot applications**. Allow `britishmidlandvirtual.co.uk` and `www.britishmidlandvirtual.co.uk`. Use production keys, not testing keys.
2. In [Supabase Edge Function secrets](https://supabase.com/dashboard/project/eqbaezhcwnjlcnvtfxho/functions/secrets), add `BMV_TURNSTILE_SITE_KEY` (public site key) and `BMV_TURNSTILE_SECRET` (secret key). Keep the secret out of chat, website files and Git.
3. Set `BMV_WEBSITE_REGISTRATION_ENABLED=true` in the same secrets screen. The page fetches configuration automatically; no key needs to be copied into HTML. Refresh `join.html`.
4. Complete a controlled real application using an intended recipient who can receive the welcome DM. Sign in to the existing Management Portal, open **Pilot applications**, confirm the recipient, and approve. Check the resulting Cadet account, BMA username, welcome DM and ACARS login. Reject a second controlled application, and check a non-management login cannot list or approve applications. No production test account or DM was created during development.
5. Before retiring legacy registration, resolve old pending applications, approved/link applications and pending interactions. Review with:

```sql
select state, kind, count(*) from bmv_registration.applications
where application_source <> 'website' and state in ('pending','approved') group by state,kind;
select count(*) from bmv_registration.interactions where state='pending';
```

6. Only after that test and queue check, set `BMV_WEBSITE_ONLY=true` in Supabase secrets. The registration worker then only provisions website applications and sends their welcome DMs. The signed legacy command handlers direct users to the website. Other Tech Ops and flight systems retain their existing handlers.
7. Optionally remove the three retired registration commands with `node backend/retire-discord-registration.mjs --retire-after-live-test`, with the existing bot token supplied privately as an environment variable. This targets only `/register`, `/link-pilot`, `/registration-status` and preserves other commands. It has not been run.

## Full replacement files / redeployment

Copy the supplied website files to the same paths in the website repository. Keep `backend/`, `tests/`, `.git` and `node_modules` outside served assets; `.assetsignore` is included for Cloudflare Workers assets.

The backend directory contains full function sources with their shared imports and pinned dependency configuration. Do not paste a single `index.ts` into a standalone dashboard editor: that caused the original missing `_shared/db.js` failure. From `backend/`, use the Supabase CLI:

```sh
supabase functions deploy bmv-website-register bmv-website-management bmv-worker bmv-discord smooth-action --project-ref eqbaezhcwnjlcnvtfxho --use-api --no-verify-jwt
```

The public function authenticates submissions using Turnstile; management validates the actual user through Supabase Auth and checks active `management_users` membership on every request. Discord verifies signatures and the worker validates its existing secret digest. These custom checks are why gateway JWT validation is disabled. Never deploy unrelated functions or use `--prune`.

The additive SQL in `backend/sql/website-registration.sql` has already been applied to this project. Legacy SQL files are retained only for regression tests and reference: do not rerun them or blindly push the bundled migration history over production.

## Controls and operations

- Strict allowed website origins; 8 KB streamed request limit; required age/privacy acknowledgement; validated name, email and IDs; Cloudflare server verification checks success, hostname and action `pilot_join`.
- Database-backed hourly limits: 100 total attempts, five per normalised email and five per Discord ID. HMAC identifiers avoid storing raw identities in the rate-limit table. These limits are independent of client IP headers. Review limits as membership grows; periodically remove old rate-limit rows via a privileged maintenance job (`delete from bmv_registration.website_limits where window_start < now()-interval '7 days'`).
- Existing unique Discord/pilot indexes plus the website email index protect duplicate account applications. Duplicate public replies deliberately disclose no account or application details. Rejected applications have a 24-hour resubmission cooldown.
- Reviews lock the application and allow only a pending-state transition. Managers must check the intended Discord recipient; a typed ID alone does not prove identity. Matching linked self-review is blocked. Decisions are audited with the manager's authenticated UUID.
- Existing cron work provisions approved applications. The management list reports account and welcome-delivery status. A blocked/ambiguous DM is flagged for manual checking; the system does not repeatedly send passwords or create another account. There is no new password retrieval API.
- Public application rows and rate-limit records are not granted to anonymous or ordinary authenticated API callers. Backend queries use `SET LOCAL ROLE bmv_registration_service`.

## Verification

14 Node tests passed: existing account provisioning/linking/password contract, signature checks, website validation, Turnstile hostname/action checks, request bounds, rate limits, duplicates, self-review and conflicting decisions. Deno compilation passed for both new endpoints. Browser tests passed at 1440, 768, 390 and 320 px, including submission payload, disabled/success states, safe rendering and the recipient confirmation gate.

Live checks: register GET returned disabled configuration (200); closed submissions returned 503; unsigned management GET returned 401. Rate-limit table has RLS and denies SELECT to `anon` and `authenticated`. Supabase security advisors reported no findings for the new table; existing unrelated project findings remain, including [security-definer views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view). They were not changed as part of registration.

Live Turnstile submission, authenticated management approval and actual welcome delivery still require the controlled test above. Keep legacy commands enabled until it passes.

Rollback: set `BMV_WEBSITE_REGISTRATION_ENABLED=false` to stop new website submissions; keep the worker running for approved applications. Leave `BMV_WEBSITE_ONLY` unset/false to retain the legacy flow. No destructive database rollback is required.

References: [Supabase multi-file function deployment](https://supabase.com/docs/guides/functions/deploy), [Cloudflare server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
