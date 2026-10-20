# VAA activity monitor

Open `/management/vaa.html` using an existing active management account. The page uses the existing management session and Supabase row-level security. No schema, policy, credential or database writes are introduced.

## Evidence and rules

The targets are 50 flights and 10 distinct member pilots per 60 days, from [VATSIM Associate policy](https://vatsim.net/docs/policy/virtual-airline-associate/), v1.2 section 8.8 (15 January 2026). BMA and BMR must both be registered prefixes. Meeting these activity targets alone does not establish accreditation compliance.

`vaa-core.js` defines the conservative inclusion rules. It requires a retained pilot record, valid CID syntax, a VATSIM report with server verification/session and positive observed duration, matching planned/network BMA or BMR callsigns, four-letter airport codes, completed chronological flight timestamps, an eligible status and no outstanding review. Duplicate reports, sessions and matching pilot/start/callsign combinations are excluded. Distinct pilots are counted by CID.

Existing BMAcars server verification supplies the evidence; this dashboard does not independently query VATSIM or prove continuous online coverage. The last check may be offline after earlier valid observations. A manually entered CID/provider is insufficient. Do not backfill verification flags merely to increase totals.

On inspection on 20 October 2026, the retained database had seven VATSIM-labelled reports but no server-verified qualifying reports. Initial zero totals are expected. Check the upstream BMAcars verification workflow on a real future flight before relying on this for an application.

## Reporting and access

The current window is `[refresh time - 60 days, refresh time)` in UTC, using stand time for completion. Five preceding adjacent windows give 360 days of trends. These are recalculated from currently retained records, not permanent historical snapshots; deletion, anonymisation or review changes may affect earlier totals. Missing records do not prove inactivity.

Data is paginated in batches of 500. The page refreshes every 60 seconds while visible and rechecks management access. Failed refreshes mark previous totals stale and disable CSV export.

CSV downloads contain qualifying evidence for the selected window, independent of the on-screen search/filter. They include PIREP/session IDs, pilot identifiers, CID, actual/planned callsign, route, flight timestamps, verification status/duration, reporting boundaries, export time and rules version. Spreadsheet formula prefixes are escaped. Downloads remain local; nothing is submitted to VATSIM. Management should retain approved exports securely if fixed audit snapshots are needed.

## Validation

Run `node --test tests/vaa.test.cjs` and `node --check management/vaa.js`.

Twenty core tests cover qualification/exclusion, duplicate protection, unique CID counting, UTC window boundaries, empty periods and CSV escaping. A separate local preview with fictional data verified rendering and period selection without accessing real pilot details. It is not included in the deployed files.

Before operational reliance, management should confirm registered callsigns, inspect a real server-verified flight end to end, and agree secure audit-export retention and authorised recipients. Existing database management update permissions remain unchanged.
