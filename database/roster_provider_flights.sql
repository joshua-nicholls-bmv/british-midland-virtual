-- User-confirmed rules: all recorded flights except management rejections.
grant select (atc_provider) on public.pireps to bmv_roster_reader;
create or replace view bmv_roster.safe_projection with (security_barrier = true) as
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
comment on view public.public_pilot_roster is 'Read-only British Midland roster: recorded airline flights except management rejections; VATSIM provider counts over rolling 60 days.';
notify pgrst, 'reload schema';
