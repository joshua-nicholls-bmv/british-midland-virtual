create function public.verify_vaa_with_statsim_time(flight uuid, note text, source text, confirmed_cid text, confirmed_callsign text, last_review bigint, block_minutes integer)
returns void language plpgsql security definer set search_path='' as $$
begin
  if source is null or source !~ '^https://(www\.)?statsim\.net/flights/detail/[0-9]+/?$' or block_minutes is null or block_minutes <= 0 then
    raise exception 'Enter a StatSim flight detail link and positive block minutes';
  end if;
  perform public.record_vaa_review(flight,'verified',note,source,confirmed_cid,confirmed_callsign,last_review);
  update public.vaa_management_reviews set previous_values=coalesce(previous_values,'{}'::jsonb)||jsonb_build_object('previous_statsim_track',(select debrief_data->'statsim_track' from public.pireps where id=flight))
  where id=(select max(id) from public.vaa_management_reviews where pirep_id=flight);
  update public.pireps set debrief_data=coalesce(debrief_data,'{}'::jsonb)||jsonb_build_object('statsim_track',jsonb_build_object('source',source,'estimated_block_seconds',block_minutes::bigint*60,'method','Management reviewed StatSim block minutes')) where id=flight;
end $$;
revoke all on function public.verify_vaa_with_statsim_time(uuid,text,text,text,text,bigint,integer) from public,anon;
grant execute on function public.verify_vaa_with_statsim_time(uuid,text,text,text,text,bigint,integer) to authenticated;
