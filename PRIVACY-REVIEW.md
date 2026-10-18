# Privacy policy implementation — publication review

Status: **draft; do not merge/deploy as an effective privacy notice yet.** Prepared 18 October 2026 against website commit `d6b03ba134cda290d73b157e4f52bcc5b0475eca`.

## Implemented

- `/privacy` resolves to the static `privacy/index.html` page (ordinary directory redirect to `/privacy/`). Root-relative assets work with either URL. `privacy.html` redirects old bookmarks to it, with a visible fallback link.
- Existing navy/red design tokens, logo, navigation and footer; responsive contents navigation, semantic sections, keyboard focus, skip link and print styling. No new scripts or third-party resources on the policy page.
- All public pages, management pages and the account-linking page have `/privacy` footer links. Corrected malformed closing footer tags in Join and Operations while updating those links.
- Join links to the notice before Discord registration. The existing account-linking form requires an unchecked acknowledgement, distinct from consent. Its policy link opens a new tab because leaving the linking page would lose the token already removed from the address bar.
- Acknowledgement is client-side only; no new personal information, backend field or consent record is sent. It is not evidence that the separate Discord new-account flow has shown or recorded the notice.
- Visible draft status, explicit `Privacy contact email: TBD`, no effective date, and `noindex` while under review. `noindex` is not an access-control or deployment safeguard.

## Evidence from the current website repository

| Topic | Evidence | Limits |
| --- | --- | --- |
| Public pilot identity and simulator tracks | `assets/js/operations.js`: `getPilotDisplay`, `public_live_operations`, `public_recent_operations`, `flight_track_points`; `operations.html` | Confirms requested/displayed fields. Not a live database permission audit. |
| Pilot administration | `management/pilot.js`, `management/pilots.js`: `pilot_statistics`, `pilots`, nickname, role, status, joining and flight statistics | Actual staff roles and access governance are unverified. |
| Flight performance and review | `management/pirep.js`, `management/report.js`, `management/reviews.js` | Confirms report fields and review UI; no conclusion about significant automated decisions. |
| Authentication | `management/management.js`: Supabase client, `signInWithPassword`, internal email-format identifier | Does not prove collection of a personal email address or backend security configuration. |
| Discord linking | `registration/index.html`, `registration/setup.js`; `management/dispatch.html`, `management/dispatch.js` | Browser sends token/password to `bmv-link`; manager form links Discord and pilot IDs. Backend/bot source is absent. Existing page claims about expiry and credential delivery require verification. |
| Hosting and external assets | `CNAME`; external font/library URLs in HTML; OpenStreetMap tile URL in `assets/js/operations.js` | Custom domain confirmed; hosting account, regions, logs and contracts not established from source alone. |
| Browser storage | Standard Supabase browser client configuration; token read from fragment and removed by `history.replaceState` | Supabase can persist sessions; production storage names/lifetimes and third-party behaviour need inspection. No first-party analytics/ad code found. |
| Group relationship | `group.html` describes shared infrastructure and European Cargo management | Branding is not proof of controller identity or a joint-controller agreement. |
| Age requirement | `join.html` states 18+ | Enforcement and handling of underage applicants unverified. |
| SimBrief/BMAcars | Flight records consumed by the website; user-requested service scope | Current desktop source and SimBrief data exchange are not in this repository. Policy explicitly marks those details unverified. |

No live pilot records, production credentials or private account data were retrieved for this work. No database, bot, desktop application or production setting was changed.

## Required decisions before publication

1. Identify the controller(s): actual legal person/organisation, address, contact route, territorial scope and any representative/DPO details if applicable. Confirm whether each named community service is operated by that controller.
2. Replace **TBD** with a monitored privacy email. Verify private intake, identity verification, ownership/escalation, statutory response handling and complaints procedures; do not direct sensitive requests into public channels.
3. Establish European Cargo Virtual's independent/joint/processor relationship for each shared purpose. Add its notice or the required shared-responsibility information. Do not infer this from group branding.
4. Approve purpose-by-purpose lawful bases. Document legitimate-interest assessments, especially public names/IDs/tracks. Verify any membership contract and public-display objection/opt-out workflow. Do not rely on the acknowledgement as consent.
5. Audit current BMAcars, Discord bot and edge functions: application questions, account identifiers, passwords/initial credential delivery, logs, SimBrief identifiers and dispatch data, notification recipients, providers and data flows. Present the notice in Discord **before** collecting new registrations; add an acknowledgement there if required and define whether/how to record notice version/time.
6. Approve and implement retention/deletion criteria for accounts, links, reports, tracks, statistics, messages, logs, tokens and backups, including departures, objections and account deletion. No period is fabricated in the draft.
7. Confirm Supabase/hosting regions, processors, contracts, subprocessors, international recipients and safeguards, plus how copies/information about safeguards can be requested.
8. Audit production cookies/local storage/network resources and record provider, purpose, duration and exemption/consent requirements. Add working consent controls before any non-exempt use. Acknowledgement is not cookie consent.
9. Verify database grants/RLS/public views, management permissions, credentials, access reviews, backups, incident response, age enforcement and any consequential automated decisions. Avoid unsupported absolute security statements.
10. Resolve all draft wording into confirmed facts, set approval/effective dates and version, then remove the draft notices and `noindex`. Check `/privacy`, legacy redirect and the deployed linking form before release. Review existing broken `terms.html` and `contact.html` footer destinations separately; they predate this change and have no corresponding files in this repository.

## Reference guidance

- [ICO: privacy information to provide](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
- [ICO: lawful basis](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/)
- [ICO: cookies and similar technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/)
- [ICO: complaints](https://ico.org.uk/make-a-complaint/)
- [Supabase: browser client initialisation and session persistence](https://supabase.com/docs/reference/javascript/initializing)

The reference guidance informs the draft; it does not establish this community's operational practices or constitute legal approval.

## Verification

- Browser preview of `/privacy` and `privacy.html` redirect passed; all ten contents anchors resolve.
- Desktop and 390px mobile layout visually inspected; mobile DOM has no horizontal overflow.
- Account-linking acknowledgement starts unchecked/required; browser validity rejects the missing acknowledgement and accepts it when checked. Missing-token protection remains in place. No real account or password was submitted.
- All 20 existing HTML pages have a footer privacy link, including management and registration. Static HTML/link checks and JavaScript syntax/diff checks completed.
- Production backend enforcement, Discord registration, signed-in session storage and deployment have not been tested. This is a static site with no package build command.

Windows checkout note: the repository contains `assets/images/aircraft/gitkeep.`, which Windows cannot normally check out. The working copy excludes only that placeholder via sparse checkout; it is preserved in Git and is not part of this change.
