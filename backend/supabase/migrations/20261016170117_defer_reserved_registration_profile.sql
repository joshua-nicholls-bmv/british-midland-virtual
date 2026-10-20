create or replace function public.handle_new_bm_pilot() returns trigger
language plpgsql security definer set search_path='' as $$
declare application bmv_registration.applications%rowtype; registration_id text;
begin
 registration_id:=new.raw_app_meta_data->>'bmv_registration_id';
 if registration_id is not null then
  -- This is trusted admin metadata; never accept user-editable pilot IDs as authority.
  select * into application from bmv_registration.applications
   where id=registration_id::uuid and kind='new' and state='approved';
  if not found or lower(new.email) is distinct from lower(application.pilot_id)||'@auth.britishmidlandvirtual.internal' then
   raise exception 'No matching approved BMV registration';
  end if;
  insert into public.pilots(id,pilot_id,nickname,role,status,login_enabled)
   values(new.id,application.pilot_id,application.nickname,'Cadet','Active',true);
 else
  -- GoTrue may insert the Auth row before applying trusted app metadata.
  -- A reserved email is only a deferral signal, never proof of account ownership.
  -- The worker validates trusted metadata and creates the reserved profile after Auth returns.
  if exists(select 1 from bmv_registration.applications a
    where a.kind='new' and a.pilot_id is not null
    and lower(new.email)=lower(a.pilot_id)||'@auth.britishmidlandvirtual.internal') then
   return new;
  end if;
  -- Preserve the pre-existing profile-creation behaviour for other Auth consumers.
  insert into public.pilots(id,nickname) values(new.id,new.raw_user_meta_data->>'nickname');
 end if;
 return new;
end; $$;
revoke all on function public.handle_new_bm_pilot() from public,anon,authenticated;


