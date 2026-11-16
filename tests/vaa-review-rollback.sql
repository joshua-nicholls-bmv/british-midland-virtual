begin;
do $$
declare f uuid:='90b1881d-d742-fb31-8934-dc5d42270266'; mgr uuid; rev bigint; orig public.pireps%rowtype; changed public.pireps%rowtype; audit public.vaa_management_reviews%rowtype;
begin
 select * into strict orig from public.pireps where id=f;
 select user_id into strict mgr from public.management_users where active limit 1;
 select max(id) into rev from public.vaa_management_reviews where pirep_id=f;
 perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true);
 begin
  perform public.review_vaa_discrepancy(f,'rejected','Test',null,null,null,rev,null,null,'[]');
  raise exception 'Non-manager accepted';
 exception when raise_exception then if SQLERRM='Non-manager accepted' then raise; end if; end;
 perform set_config('request.jwt.claim.sub',mgr::text,true);
 begin
  perform public.review_vaa_discrepancy(f,'verified','Test',null,'1621484','BMR46AS',rev,orig.stand,null,'[]');
  raise exception 'Missing evidence accepted';
 exception when raise_exception then if SQLERRM='Missing evidence accepted' then raise; end if; end;
 -- Deliberately conflicting identity and invalid original timestamps must be reviewable.
 perform public.review_vaa_discrepancy(f,'verified','ROLLBACK TEST ONLY: timestamps and identity reviewed','https://statsim.net/flights/detail/31390957','1234567','TEST123',rev,orig.stand,76,'["Invalid or incomplete flight timestamps","Identity conflict"]');
 select * into changed from public.pireps where id=f;
 if changed.off_blocks is distinct from orig.off_blocks or changed.takeoff is distinct from orig.takeoff or changed.landing is distinct from orig.landing or changed.stand is distinct from orig.stand or changed.vatsim_participation_seconds is distinct from orig.vatsim_participation_seconds then raise exception 'Original times or observations changed'; end if;
 select * into audit from public.vaa_management_reviews where pirep_id=f order by id desc limit 1;
 if audit.decision<>'verified' or audit.resolution_snapshot->>'kind'<>'management_override_v1' or audit.reviewer_id<>mgr or audit.resolution_snapshot->'original_report'->>'vatsim_id' is distinct from orig.vatsim_id then raise exception 'Audit incomplete'; end if;
 begin
  perform public.review_vaa_discrepancy(f,'rejected','Stale test',null,null,null,rev,null,null,'[]');
  raise exception 'Stale review accepted';
 exception when raise_exception then if SQLERRM='Stale review accepted' then raise; end if; end;
 perform public.review_vaa_discrepancy(f,'rejected','ROLLBACK TEST ONLY rejection',null,null,null,audit.id,null,null,'[]');
 select max(id) into rev from public.vaa_management_reviews where pirep_id=f;
 if (select vatsim_verified from public.pireps where id=f) then raise exception 'Rejection not applied'; end if;
 perform public.review_vaa_discrepancy(f,'verified','ROLLBACK TEST ONLY reapproval','Independent test record',orig.vatsim_id,orig.atc_callsign,rev,orig.stand,null,'[]');
 if not (select vatsim_verified from public.pireps where id=f) then raise exception 'Reapproval not applied'; end if;
end $$;
rollback;
select 'PASS: manager-only, evidence requirement, timestamp/identity override, preserved timestamps and observed seconds, audit, stale review, rejection and reapproval. All test changes rolled back.' as result;
