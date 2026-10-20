import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pool,apply,decide,status,finish,provision} from '../supabase/functions/_shared/db.js';
import {processQueued} from '../supabase/functions/_shared/discord.js';
test('migration and registration lifecycle in isolated PostgreSQL',async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email text unique,raw_app_meta_data jsonb,raw_user_meta_data jsonb);
 create sequence public.bma_pilot_number_seq;
 create table public.pilots(id uuid primary key references auth.users(id),pilot_id text not null,nickname text,role text default 'Pilot',status text default 'Active',login_enabled boolean default true);
 create table public.tech_ops_pilot_links(discord_user_id text primary key,pilot_id text unique,linked_by uuid not null);
 insert into auth.users(id,email,raw_app_meta_data) values('00000000-0000-0000-0000-000000000001','bma0042@auth.britishmidlandvirtual.internal','{}');
 insert into public.pilots values('00000000-0000-0000-0000-000000000001','BMA0042','Existing','Pilot','Active',true);`);
 await db.exec(await readFile(new URL('../sql/001_registration.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../sql/002_runtime_role.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../sql/003_edge_queue.sql',import.meta.url),'utf8'));
 await db.exec('alter table public.pilots add column discord_user_id text');
 await db.exec(await readFile(new URL('../supabase/migrations/20261014173826_integrate_existing_bmv_pilots.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../sql/005_scoped_auth_lookup.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/20261016170117_defer_reserved_registration_profile.sql',import.meta.url),'utf8'));
 await db.exec('revoke usage on schema auth from bmv_registration_service');
 await db.exec('create trigger on_bm_pilot_created after insert on auth.users for each row execute function public.handle_new_bm_pilot()');
 await db.exec('alter table public.pilots enable row level security; alter table auth.users enable row level security; set role bmv_registration_service');
 const query=async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows??r.rows.length};};
 pool.connect=async()=>({query,release(){}});
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.PILOT_DEFAULT_ROLE='Pilot';
 const originalFetch=globalThis.fetch;
 try {
  const a=await apply('123456789012345678','New','new',null);
  assert.equal((await apply(a.discord_id,'Again','new',null)).id,a.id);
  await assert.rejects(()=>decide(a.id,a.discord_id,true,'self'));
  const approved=await decide(a.id,'manager',true,'Welcome');assert.equal(approved.pilot_id,'BMA0043');
  assert.equal((await decide(a.id,'other',false,'late')).state,'approved');
  await assert.rejects(()=>db.query("insert into public.pilots(id,pilot_id,nickname,role,status,login_enabled) values('00000000-0000-0000-0000-000000000001','BMA0043','Conflict','Pilot','Active',true)"),/reserved/);
  assert.equal((await status(a.discord_id)).token,undefined);
  globalThis.fetch=async(url,options)=>{
   assert.match(url,/admin\/users$/);const body=JSON.parse(options.body);
   assert.equal(body.email,'bma0043@auth.britishmidlandvirtual.internal');
   assert.equal(body.password,'BMA0043!');
   const id='00000000-0000-0000-0000-000000000002';
   await db.exec('reset role');
   // Real GoTrue sequence: INSERT first, then privileged app metadata UPDATE.
   const before=(await db.query('select last_value from public.bma_pilot_number_seq')).rows[0].last_value;
   await db.query('insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values($1,$2,$3,$4)',[id,body.email,{},body.user_metadata]);
   assert.equal((await db.query('select count(*)::int n from public.pilots where id=$1',[id])).rows[0].n,0);
   assert.equal((await db.query('select last_value from public.bma_pilot_number_seq')).rows[0].last_value,before);
   await db.query('update auth.users set raw_app_meta_data=$2 where id=$1',[id,body.app_metadata]);
   await db.exec('set role bmv_registration_service');
   return {ok:true,json:async()=>({id})};
  };
  assert.equal(await provision(a.id),'BMA0043');
  assert.equal(await provision(a.id),false);
  const p=await db.query("select * from public.pilots where pilot_id='BMA0043'");assert.equal(p.rows[0].login_enabled,true);
  assert.equal(p.rows[0].discord_user_id,a.discord_id);assert.equal(p.rows[0].role,'Cadet');
  const link=await apply('223456789012345678','Existing','link','BMA0042');await decide(link.id,'manager',true,'Verified application');
  assert.equal(await provision(link.id),false);
  const oldChallenge=await status(link.discord_id),challenge=await status(link.discord_id);
  assert.equal(await finish(oldChallenge.token,'existing-password'),false);
  globalThis.fetch=async()=>({ok:false});
  for(let n=0;n<5;n++)assert.equal(await finish(challenge.token,'wrong'),false);
  assert.equal((await status(link.discord_id)).locked,true);
  await db.query("update bmv_registration.tokens set expires_at=now()-interval '1 minute' where application_id=$1",[link.id]);
  const refreshed=await status(link.discord_id);
  globalThis.fetch=async()=>({ok:true,json:async()=>({user:{id:'00000000-0000-0000-0000-000000000001'}})});
  assert.equal(await finish(refreshed.token,'existing-password'),'BMA0042');
  assert.equal(await finish(refreshed.token,'existing-password'),false);
  const counts=await db.query('select count(*)::int n from bmv_registration.links');assert.equal(counts.rows[0].n,2);
  const rejected=await apply('523456789012345678','Test','new',null);
  await decide(rejected.id,'manager',false,'Test only');
  assert.equal((await apply(rejected.discord_id,'Retry','new',null)).id,rejected.id);
  await db.query("insert into bmv_registration.audit(application_id,actor,event) values($1,'operator','test_application_cleared')",[rejected.id]);
  assert.equal((await status(rejected.discord_id)).application,undefined);
  assert.notEqual((await apply(rejected.discord_id,'Retry','new',null)).id,rejected.id);
  assert.equal((await db.query('select state from bmv_registration.applications where id=$1',[rejected.id])).rows[0].state,'rejected');
  const originalDeno=globalThis.Deno;
  globalThis.Deno={env:{get:key=>({DISCORD_GUILD_ID:'guild',DISCORD_APPROVAL_CHANNEL_ID:'channel',DISCORD_MANAGEMENT_ROLE_IDS:'coo,ceo',DISCORD_PILOT_ROLE_ID:'pilot',DISCORD_APPLICATION_ID:'app',DISCORD_TOKEN:'fake'})[key.replace('BMV_REG_','')]}};
  globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({roles:[]})});
  try{
   await db.query('insert into bmv_registration.interactions(id,payload) values($1,$2)',['event-1',{actor:'323456789012345678',guild_id:'guild',channel_id:'public',action:'register',nickname:'Queued pilot'}]);
   assert.match(await processQueued('event-1'),/pending/);
   assert.match(await processQueued('event-1'),/Already recorded/);
   assert.equal((await db.query("select count(*)::int n from bmv_registration.applications where discord_id='323456789012345678'")).rows[0].n,1);
   await db.query('insert into bmv_registration.interactions(id,payload) values($1,$2)',['event-2',{actor:'423456789012345678',guild_id:'guild',channel_id:'channel',action:'approve',application:a.id,reason:'Forged role'}]);
   await assert.rejects(()=>processQueued('event-2'),/Management permission/);
   assert.equal((await db.query("select state from bmv_registration.interactions where id='event-2'")).rows[0].state,'pending');
  }finally{globalThis.Deno=originalDeno;}
  await assert.rejects(()=>db.query("update bmv_registration.audit set actor='tampered'"),/permission denied/);
  await db.exec('reset role');
  await assert.rejects(()=>db.query("update bmv_registration.audit set actor='tampered'"),/append-only/);
  await db.exec('set role anon');
  await assert.rejects(()=>db.query('select * from bmv_registration.tokens'),/permission denied/);
  await db.exec('reset role');
 } finally {globalThis.fetch=originalFetch;await db.close();await pool.end();}
});


