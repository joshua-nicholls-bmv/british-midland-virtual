create or replace function public.review_vaa_discrepancy(
  flight uuid, action text, note text, source text, confirmed_cid text,
  confirmed_callsign text, last_review bigint, completed_at timestamptz,
  block_minutes integer, discrepancies jsonb
) returns void language plpgsql security definer set search_path='' as $$
declare manager_name text; report public.pireps%rowtype; prior jsonb; resolution jsonb;
begin
  select display_name into manager_name from public.management_users where user_id=auth.uid() and active;
  if manager_name is null then raise exception 'Active management access required'; end if;
  if action is null or action not in ('verified','rejected') then raise exception 'Choose approve or reject'; end if;
  if coalesce(length(trim(note)),0) not between 1 and 2000 then raise exception 'Enter review notes explaining your decision'; end if;
  if jsonb_typeof(discrepancies) is distinct from 'array' or length(discrepancies::text)>10000 then raise exception 'Invalid discrepancy list'; end if;
  select * into strict report from public.pireps where id=flight for update;
  if (select max(id) from public.vaa_management_reviews where pirep_id=flight) is distinct from last_review then
    raise exception 'Another review was saved. Refresh and check the latest notes.';
  end if;
  prior:=to_jsonb(report)-'debrief_data';
  resolution:=jsonb_build_object('kind','management_override_v1','issues',discrepancies,
    'original_report',prior,'original_statsim_track',report.debrief_data->'statsim_track',
    'original_session',(select to_jsonb(s) from public.acars_vatsim_sessions s where s.id=report.vatsim_session_id),
    'profile_cid',(select vatsim_cid from public.pilots where id=report.pilot_id));
  if action='verified' then
    confirmed_cid:=trim(confirmed_cid); confirmed_callsign:=upper(trim(confirmed_callsign));
    if coalesce(length(trim(source)),0) not between 1 and 1000 then raise exception 'Independent evidence is required for approval'; end if;
    if coalesce(confirmed_cid,'') !~ '^[1-9][0-9]{5,8}$' or coalesce(confirmed_callsign,'') !~ '^[A-Z0-9]{2,10}$' then raise exception 'Enter the CID and callsign supported by the evidence'; end if;
    if completed_at is null or not isfinite(completed_at) or completed_at>now() then raise exception 'Enter the evidenced completion date and time in UTC, not a future date'; end if;
    if block_minutes is not null and (block_minutes<=0 or trim(source) !~ '^https://(www[.])?statsim[.]net/flights/detail/[0-9]+/?$') then raise exception 'StatSim block minutes require a StatSim flight detail link and positive minutes'; end if;
    resolution:=resolution||jsonb_build_object('completed_at',completed_at,'confirmed_cid',confirmed_cid,'confirmed_callsign',confirmed_callsign);
    update public.pireps set atc_provider='VATSIM',vatsim_id=confirmed_cid,atc_callsign=confirmed_callsign,
      vatsim_network_callsign=confirmed_callsign,vatsim_verified=true,vatsim_verification_status='manually_verified'
      where id=flight;
    if block_minutes is not null then
      update public.pireps set debrief_data=coalesce(debrief_data,'{}'::jsonb)||jsonb_build_object('statsim_track',
        jsonb_build_object('source',trim(source),'estimated_block_seconds',review_vaa_discrepancy.block_minutes::bigint*60,'method','Management reviewed StatSim block minutes')) where id=flight;
    end if;
  else
    update public.pireps set vatsim_verified=false,vatsim_verification_status='management_rejected' where id=flight;
  end if;
  insert into public.vaa_management_reviews(pirep_id,reviewer_id,reviewer_name,decision,notes,evidence,previous_values,resolution_snapshot)
  values(flight,auth.uid(),manager_name,action,trim(note),nullif(trim(source),''),prior,resolution);
end $$;
revoke all on function public.review_vaa_discrepancy(uuid,text,text,text,text,text,bigint,timestamptz,integer,jsonb) from public,anon;
grant execute on function public.review_vaa_discrepancy(uuid,text,text,text,text,text,bigint,timestamptz,integer,jsonb) to authenticated;
comment on function public.review_vaa_discrepancy(uuid,text,text,text,text,text,bigint,timestamptz,integer,jsonb) is 'Manager-only VAA decision overriding automated discrepancies with independent evidence, completion date and immutable review history. Does not rewrite original flight times or ACARS observation seconds.';

