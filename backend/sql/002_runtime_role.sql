-- Apply as database owner after 001. Set a login password separately via your secret manager.
begin;
create role bmv_registration_service login;
grant usage on schema bmv_registration,public,auth to bmv_registration_service;
grant select,insert,update on bmv_registration.applications,bmv_registration.tokens,bmv_registration.counter to bmv_registration_service;
grant select,insert on bmv_registration.links,bmv_registration.audit to bmv_registration_service;
grant usage,select on all sequences in schema bmv_registration to bmv_registration_service;
create policy registration_service_applications on bmv_registration.applications to bmv_registration_service using(true) with check(true);
create policy registration_service_tokens on bmv_registration.tokens to bmv_registration_service using(true) with check(true);
create policy registration_service_counter on bmv_registration.counter to bmv_registration_service using(true) with check(true);
create policy registration_service_links on bmv_registration.links to bmv_registration_service using(true) with check(true);
create policy registration_service_audit on bmv_registration.audit to bmv_registration_service using(true) with check(true);
grant select on public.pilots to bmv_registration_service;
grant insert(id,pilot_id,nickname,role,status,login_enabled) on public.pilots to bmv_registration_service;
create policy registration_service_read_pilots on public.pilots for select to bmv_registration_service using(true);
create policy registration_service_create_pilots on public.pilots for insert to bmv_registration_service with check(true);
grant select(id,email,raw_app_meta_data) on auth.users to bmv_registration_service;
-- auth.users is normally RLS-enabled with no client policies. This role needs read-only recovery lookup.
create policy registration_service_auth_lookup on auth.users for select to bmv_registration_service using(true);
commit;
