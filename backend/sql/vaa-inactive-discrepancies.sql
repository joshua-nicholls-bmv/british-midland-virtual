alter table public.vaa_management_reviews
  add column resolution_snapshot jsonb,
  drop constraint vaa_management_reviews_decision_check,
  add constraint vaa_management_reviews_decision_check check (decision in ('note','verified','rejected','inactive'));

create function public.close_vaa_discrepancy(flight uuid, note text, snapshot jsonb, last_review bigint)
returns void language plpgsql security definer set search_path='' as $$
declare
  manager_name text;
begin
  select display_name into manager_name from public.management_users where user_id=auth.uid() and active;
  if manager_name is null then raise exception 'Active management access required'; end if;
  if coalesce(length(trim(note)),0) not between 1 and 2000 then raise exception 'Enter the reason for closing this discrepancy'; end if;
  if jsonb_typeof(snapshot->'issues') is distinct from 'array' or length(snapshot::text)>10000 then raise exception 'Invalid discrepancy details'; end if;
  if jsonb_array_length(snapshot->'issues')=0 then raise exception 'No open discrepancy'; end if;
  perform 1 from public.pireps where id=flight for update;
  if not found then raise exception 'Flight unavailable'; end if;
  if (select max(id) from public.vaa_management_reviews where pirep_id=flight) is distinct from last_review then raise exception 'Review changed. Reopen the flight and check the latest notes.'; end if;
  insert into public.vaa_management_reviews(pirep_id,reviewer_id,reviewer_name,decision,notes,resolution_snapshot)
  values(flight,auth.uid(),manager_name,'inactive',trim(note),snapshot);
end $$;
revoke all on function public.close_vaa_discrepancy(uuid,text,jsonb,bigint) from public,anon;
grant execute on function public.close_vaa_discrepancy(uuid,text,jsonb,bigint) to authenticated;
