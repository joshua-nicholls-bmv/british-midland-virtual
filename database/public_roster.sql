-- Applied with Supabase apply_migration: public_pilot_roster.
-- No private source table is made readable by anonymous callers.
create schema bmv_roster;
revoke all on schema bmv_roster from public;
create role bmv_roster_reader nologin noinherit nobypassrls;
grant bmv_roster_reader to postgres;
grant usage on schema public, bmv_roster to bmv_roster_reader;

create table bmv_roster.preferences (
  pilot_id uuid primary key references public.pilots(id) on delete cascade,
  hidden boolean not null default false,
  public_name text check (public_name is null or length(trim(public_name)) between 1 and 80)
);
create table bmv_roster.vatsim_verifications (
  pirep_id uuid primary key references public.pireps(id) on delete cascade,
  evidence_reference text not null check (length(trim(evidence_reference)) > 0),
  verified_at timestamptz not null default now(),
  revoked_at timestamptz
);
create table bmv_roster.settings (
  singleton boolean primary key default true check (singleton),
  verification_enabled boolean not null default false
);
insert into bmv_roster.settings default values;
alter table bmv_roster.preferences enable row level security;
alter table bmv_roster.vatsim_verifications enable row level security;
alter table bmv_roster.settings enable row level security;
revoke all on all tables in schema bmv_roster from public, anon, authenticated;
grant usage on schema bmv_roster to service_role;
grant all on all tables in schema bmv_roster to service_role;
grant select on bmv_roster.preferences, bmv_roster.settings to bmv_roster_reader;
grant select (pirep_id, verified_at, revoked_at) on bmv_roster.vatsim_verifications to bmv_roster_reader;
create policy roster_reader on bmv_roster.preferences for select to bmv_roster_reader using (true);
create policy roster_reader on bmv_roster.vatsim_verifications for select to bmv_roster_reader using (true);
create policy roster_reader on bmv_roster.settings for select to bmv_roster_reader using (true);
grant select (id, pilot_id, nickname, status) on public.pilots to bmv_roster_reader;
grant select (id, pilot_id, flight_number, stand, landing, block_minutes, requires_review, status, atc_provider) on public.pireps to bmv_roster_reader;
grant select (id, pirep_id, decision, created_at) on public.pirep_reviews to bmv_roster_reader;
grant select (pilot_id, rank) on public.acars_pilot_ranks to bmv_roster_reader;
create policy roster_reader on public.pilots for select to bmv_roster_reader using (true);
create policy roster_reader on public.pireps for select to bmv_roster_reader using (true);
create policy roster_reader on public.pirep_reviews for select to bmv_roster_reader using (true);
create policy roster_reader on public.acars_pilot_ranks for select to bmv_roster_reader using (true);

-- A deliberately restricted owner-rights projection in a NON-EXPOSED schema.
-- Its NOLOGIN, NOBYPASSRLS owner can read only the columns above, never credentials,
-- Discord/SimBrief/VATSIM IDs, review notes, or verification evidence.
create view bmv_roster.safe_projection with (security_barrier = true) as
select p.pilot_id as pilot_number,
       coalesce(nullif(trim(pref.public_name), ''), nullif(trim(p.nickname), ''), 'Pilot') as display_name,
       nullif(trim(r.rank), '') as rank,
       case lower(trim(p.status)) when 'active' then 'Active'
         when 'on leave' then 'On leave' when 'on_leave' then 'On leave'
         when 'leave' then 'On leave' else 'Inactive' end as status,
       totals.completed_flights,
       round(totals.total_minutes / 60.0, 2) as flight_hours,
       (totals.last_flight at time zone 'UTC')::date as last_flight,
       totals.vatsim_flights
from public.pilots p
left join bmv_roster.preferences pref on pref.pilot_id = p.id
left join public.acars_pilot_ranks r on r.pilot_id = p.id
cross join lateral (
  select count(*) as completed_flights,
         coalesce(sum(greatest(f.block_minutes, 0)), 0) as total_minutes,
         max(coalesce(f.stand, f.landing)) as last_flight,
         count(*) filter (where lower(trim(f.atc_provider)) = 'vatsim'
           and coalesce(f.stand, f.landing) >= now() - interval '60 days'
           and coalesce(f.stand, f.landing) <= now()) as vatsim_flights
  from public.pireps f
  left join lateral (
    select review.decision from public.pirep_reviews review
    where review.pirep_id = f.id
    order by review.created_at desc nulls last, review.id desc limit 1
  ) latest on true
  where f.pilot_id = p.id and latest.decision is distinct from 'rejected'
    and upper(trim(f.flight_number)) ~ '^(BMA|BMR|BMI)[0-9]'
) totals
where upper(trim(p.pilot_id)) ~ '^BMA[0-9]'
  and not coalesce(pref.hidden, false);
grant create on schema bmv_roster to bmv_roster_reader;
alter view bmv_roster.safe_projection owner to bmv_roster_reader;
revoke create on schema bmv_roster from bmv_roster_reader;
revoke all on bmv_roster.safe_projection from public, anon, authenticated;
grant usage on schema bmv_roster to anon, authenticated;
grant select on bmv_roster.safe_projection to anon, authenticated;

-- The exposed view runs with caller rights and exposes EXACTLY these eight fields.
create view public.public_pilot_roster with (security_invoker = true, security_barrier = true) as
select pilot_number, display_name, rank, status, completed_flights,
       flight_hours, last_flight, vatsim_flights
from bmv_roster.safe_projection;
revoke all on public.public_pilot_roster from public, anon, authenticated;
grant select on public.public_pilot_roster to anon, authenticated;
comment on view public.public_pilot_roster is 'Read-only British Midland roster: recorded airline flights except management rejections; VATSIM provider counts over rolling 60 days.';
notify pgrst, 'reload schema';
