create table public.vaa_management_reviews (
  id bigint generated always as identity primary key,
  pirep_id uuid not null references public.pireps(id),
  reviewer_id uuid not null,
  reviewer_name text not null,
  recorded_at timestamptz not null default now(),
  decision text not null check (decision in ('note','verified')),
  notes text not null check (length(trim(notes)) between 1 and 2000),
  evidence text,
  previous_values jsonb
);
create index vaa_reviews_by_flight on public.vaa_management_reviews(pirep_id,id desc);
alter table public.vaa_management_reviews enable row level security;
revoke all on public.vaa_management_reviews from public,anon,authenticated;
grant select on public.vaa_management_reviews to authenticated;
create policy management_reads_vaa_reviews on public.vaa_management_reviews for select to authenticated
using (exists(select 1 from public.management_users where user_id=(select auth.uid()) and active));

create function public.record_vaa_review(flight uuid, action text, note text, source text, confirmed_cid text, confirmed_callsign text, last_review bigint)
returns void language plpgsql security definer set search_path='' as $$
declare
  manager_name text;
  report public.pireps%rowtype;
  profile_cid text;
  observed public.acars_vatsim_sessions%rowtype;
  prior jsonb;
begin
  select display_name into manager_name from public.management_users where user_id=auth.uid() and active;
  if manager_name is null then raise exception 'Active management access required'; end if;
  if action is null or action not in ('note','verified') or coalesce(length(trim(note)),0) not between 1 and 2000 then raise exception 'Enter a management note of up to 2000 characters'; end if;
  select * into strict report from public.pireps where id=flight for update;
  if (select max(id) from public.vaa_management_reviews where pirep_id=flight) is distinct from last_review then raise exception 'Another review was saved. Refresh and check the latest notes.'; end if;
  if action='verified' then
    confirmed_cid:=trim(confirmed_cid);
    confirmed_callsign:=upper(trim(confirmed_callsign));
    if coalesce(length(trim(source)),0) not between 1 and 1000 then raise exception 'An independent evidence link or record reference is required'; end if;
    if coalesce(confirmed_cid,'') !~ '^[1-9][0-9]{5,8}$' or coalesce(confirmed_callsign,'') !~ '^(BMA|BMR)[A-Z0-9]{1,7}$' then raise exception 'Enter the evidenced CID and airline callsign'; end if;
    select vatsim_cid into profile_cid from public.pilots where id=report.pilot_id;
    if not found then raise exception 'Pilot record missing'; end if;
    select * into observed from public.acars_vatsim_sessions where id=report.vatsim_session_id;
    if (nullif(profile_cid,'') is not null and profile_cid<>confirmed_cid)
      or (nullif(report.vatsim_id,'') is not null and report.vatsim_id<>confirmed_cid)
      or (observed.verified_cid is not null and observed.verified_cid<>confirmed_cid)
      or (observed.owner_id is not null and observed.owner_id<>report.pilot_id)
      then raise exception 'Resolve the pilot identity conflict before verification'; end if;
    if upper(coalesce(report.flight_purpose,''))='MAC' or upper(report.flight_number) ~ '^MAC($|[ |])' or upper(report.registration) in ('G-WARB','G-JIMH','G-SHED','G-BLZH','G-NWFG','G-RGAH')
      or report.requires_review or upper(coalesce(report.status,'')) not in ('SUBMITTED','COMPLETED','APPROVED','ACCEPTED')
      or coalesce(upper(report.departure),'') !~ '^[A-Z]{4}$' or coalesce(upper(report.arrival),'') !~ '^[A-Z]{4}$'
      or not coalesce(report.off_blocks<=report.takeoff and report.takeoff<report.landing and report.landing<=report.stand and report.stand<=now(),false)
      then raise exception 'Resolve flight eligibility or timing before verification'; end if;
    if exists(select 1 from public.pireps p where p.id<>flight and p.vatsim_verified and
      ((p.pilot_id=report.pilot_id and p.off_blocks=report.off_blocks and upper(coalesce(p.atc_callsign,p.flight_number))=confirmed_callsign)
       or p.vatsim_session_id=report.vatsim_session_id)) then raise exception 'Review duplicate flight or session before verification'; end if;
    prior:=jsonb_build_object('provider',report.atc_provider,'cid',report.vatsim_id,'planned',report.atc_callsign,'network',report.vatsim_network_callsign,'verified',report.vatsim_verified,'status',report.vatsim_verification_status);
    update public.pireps set atc_provider='VATSIM',vatsim_id=confirmed_cid,atc_callsign=confirmed_callsign,vatsim_network_callsign=confirmed_callsign,vatsim_verified=true,vatsim_verification_status='manually_verified' where id=flight;
  end if;
  insert into public.vaa_management_reviews(pirep_id,reviewer_id,reviewer_name,decision,notes,evidence,previous_values)
  values(flight,auth.uid(),manager_name,action,trim(note),nullif(trim(source),''),prior);
end $$;
revoke all on function public.record_vaa_review(uuid,text,text,text,text,text,bigint) from public,anon;
grant execute on function public.record_vaa_review(uuid,text,text,text,text,text,bigint) to authenticated;
