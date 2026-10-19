with
fixture_pilots(id,pilot_id,nickname,status) as (values (1,'BMA001','Public pilot','Active'),(2,'BMA002','Hidden pilot','Active'),(3,'ECV001','Cargo pilot','Active'),(4,'BMA004','','On leave')),
fixture_preferences(pilot_id,hidden,public_name) as (values (2,true,null::text),(4,false,'Chosen name')),
fixture_acars_pilot_ranks(pilot_id,rank) as (values (1,'Captain')),
fixture_settings(verification_enabled) as (values (true)),
raw_pireps(id,pilot_id,flight_number,stand,landing,block_minutes,requires_review) as (
 values (1,1,'BMA101',now()-interval '1 day',null::timestamptz,60,false),
 (2,1,'BMR102',now()-interval '60 days',null,90,false),
 (3,1,'BMA103',now()-interval '60 days 1 second',null,30,false),
 (4,1,'BMA104',now(),null,999,false),
 (5,1,'BMA105',now(),null,120,false),
 (6,1,'URO106',now(),null,999,false),
 (7,1,'BMA107',now(),null,999,true),
 (8,1,'BMA108',now()+interval '1 day',null,10,false),
 (9,1,'BMA109',null,now()-interval '2 days',20,false),
 (10,1,'BMA110',now()-interval '3 days',null,-10,false)),
fixture_pireps as (select raw_pireps.*, 'Submitted'::text as status from raw_pireps),
fixture_pirep_reviews(id,pirep_id,decision,created_at) as (values
 (1,1,'cleared',now()),(2,2,'advisory',now()),(3,3,'cleared',now()),
 (4,4,'cleared',now()-interval '1 day'),(5,4,'rejected',now()),
 (6,6,'cleared',now()),(7,7,'cleared',now()),(8,8,'cleared',now()),
 (9,9,'cleared',now()),(10,10,'cleared',now())),
fixture_vatsim_verifications(pirep_id,verified_at,revoked_at) as (values
 (1,now(),null::timestamptz),(2,now(),null),(3,now(),null),(8,now(),null),(9,now(),now())),
result as (select p.pilot_id as pilot_number,
       coalesce(nullif(trim(pref.public_name), ''), nullif(trim(p.nickname), ''), 'Pilot') as display_name,
       nullif(trim(r.rank), '') as rank,
       case lower(trim(p.status)) when 'active' then 'Active'
         when 'on leave' then 'On leave' when 'on_leave' then 'On leave'
         when 'leave' then 'On leave' else 'Inactive' end as status,
       totals.completed_flights,
       round(totals.total_minutes / 60.0, 2) as flight_hours,
       (totals.last_flight at time zone 'UTC')::date as last_flight,
       case when settings.verification_enabled then totals.vatsim_flights else null end as vatsim_flights
from fixture_pilots p
left join fixture_preferences pref on pref.pilot_id = p.id
left join fixture_acars_pilot_ranks r on r.pilot_id = p.id
cross join fixture_settings settings
cross join lateral (
  select count(*) as completed_flights,
         coalesce(sum(greatest(f.block_minutes, 0)), 0) as total_minutes,
         max(coalesce(f.stand, f.landing)) as last_flight,
         count(*) filter (where v.pirep_id is not null and v.revoked_at is null
           and v.verified_at <= now()
           and coalesce(f.stand, f.landing) >= now() - interval '60 days'
           and coalesce(f.stand, f.landing) <= now()) as vatsim_flights
  from fixture_pireps f
  left join lateral (
    select review.decision from fixture_pirep_reviews review
    where review.pirep_id = f.id
    order by review.created_at desc nulls last, review.id desc limit 1
  ) latest on true
  left join fixture_vatsim_verifications v on v.pirep_id = f.id
  where f.pilot_id = p.id and f.requires_review = false
    and (latest.decision in ('cleared', 'advisory')
      or (latest.decision is null and lower(trim(f.status)) in ('submitted', 'completed')))
    and upper(trim(f.flight_number)) ~ '^(BMA|BMR|BMI)[0-9]'
) totals
where upper(trim(p.pilot_id)) ~ '^BMA[0-9]'
  and not coalesce(pref.hidden, false))
select count(*)=2 as privacy_and_membership,
 bool_and(case when pilot_number='BMA001' then completed_flights=7 and flight_hours=5.50 and vatsim_flights=2 else completed_flights=0 and flight_hours=0 and last_flight is null and display_name='Chosen name' and status='On leave' and rank is null end) as totals_reviews_boundaries_and_empty
from result;