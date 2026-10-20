-- Prepared from the live BMV schema inspected 14 October 2026.
-- Apply after sql/001, 002 and 003. Production application requires confirmation.
begin;
create function bmv_registration.allocate_pilot_id() returns text
language plpgsql security definer set search_path='' as $$
declare floor_number bigint; allocated bigint;
begin
 perform 1 from bmv_registration.counter where singleton for update;
 select greatest(
  (select last_number from bmv_registration.counter where singleton),
  coalesce((select max(substring(pilot_id from 4)::int) from public.pilots where pilot_id ~ '^BMA[0-9]{4}$'),0),
  coalesce((select max(substring(email from 4 for 4)::int) from auth.users where email ~ '^bma[0-9]{4}@auth[.]britishmidlandvirtual[.]internal$'),0)
 ) into floor_number;
 if floor_number>=9999 then raise exception 'BMA number range exhausted'; end if;
 loop
  allocated:=nextval('public.bma_pilot_number_seq'::regclass);
  exit when allocated>floor_number;
 end loop;
 if allocated>9999 then raise exception 'BMA number range exhausted'; end if;
 update bmv_registration.counter set last_number=allocated where singleton;
 return 'BMA'||lpad(allocated::text,4,'0');
end; $$;
revoke all on function bmv_registration.allocate_pilot_id() from public,anon,authenticated;
grant execute on function bmv_registration.allocate_pilot_id() to bmv_registration_service;
alter table public.pilots alter column pilot_id set default bmv_registration.allocate_pilot_id();

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
  -- Preserve the pre-existing profile-creation behaviour for other Auth consumers.
  insert into public.pilots(id,nickname) values(new.id,new.raw_user_meta_data->>'nickname');
 end if;
 return new;
end; $$;
revoke all on function public.handle_new_bm_pilot() from public,anon,authenticated;

create unique index bmv_registration_discord_identity on public.pilots(discord_user_id) where discord_user_id is not null;
create function bmv_registration.bind_verified_discord(p_user uuid,p_discord text) returns void
language plpgsql security definer set search_path='' as $$
declare profile public.pilots%rowtype;
begin
 if p_discord !~ '^[0-9]{17,20}$' then raise exception 'Invalid Discord ID'; end if;
 perform pg_advisory_xact_lock(741901);
 select * into profile from public.pilots where id=p_user for update;
 if not found then raise exception 'Pilot missing'; end if;
 if profile.discord_user_id is not null and profile.discord_user_id<>p_discord then raise exception 'Pilot already linked'; end if;
 if exists(select 1 from public.pilots where discord_user_id=p_discord and id<>p_user) then raise exception 'Discord already linked'; end if;
 if exists(select 1 from public.tech_ops_pilot_links where
  (discord_user_id=p_discord and pilot_id<>profile.pilot_id) or
  (pilot_id=profile.pilot_id and discord_user_id<>p_discord)) then raise exception 'Existing technical operations link conflicts'; end if;
 update public.pilots set discord_user_id=p_discord where id=p_user;
end; $$;
revoke all on function bmv_registration.bind_verified_discord(uuid,text) from public,anon,authenticated;
grant execute on function bmv_registration.bind_verified_discord(uuid,text) to bmv_registration_service;
commit;
