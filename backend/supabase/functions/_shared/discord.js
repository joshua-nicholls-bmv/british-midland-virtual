import {pool,tx,audit,apply,decide,status,provision} from './db.js';
import {pilotId,standardPassword,hasManagementRole} from './core.js';
import {setting as env} from './settings.js';
import {welcomeStart,deliverWelcome} from './welcome.js';
export const cfg=()=>({guild:env('DISCORD_GUILD_ID'),channel:env('DISCORD_APPROVAL_CHANNEL_ID'),management:env('DISCORD_MANAGEMENT_ROLE_IDS').split(',').map(id=>id.trim()).filter(Boolean),pilot:env('DISCORD_PILOT_ROLE_ID'),app:env('DISCORD_APPLICATION_ID')});
export async function discord(path,method='GET',body){
 const r=await fetch(`https://discord.com/api/v10/${path}`,{method,headers:{Authorization:`Bot ${env('DISCORD_TOKEN')}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
 if(!r.ok){const e=new Error('Discord request failed');e.status=r.status;e.operation=path.startsWith('oauth2/')?'application':path.startsWith('channels/')?'channel':path.endsWith('/roles')?'roles':path.endsWith('/members/@me')?'bot membership':'Discord operation';throw e;}
 return r.status===204?null:r.json();
}
export async function ensureCommands(){
 const c=cfg();
 const app=await discord('oauth2/applications/@me');
 if(app.id!==c.app)throw new Error('Token belongs to a different Discord application');
 await checkConfiguration();
 for(const [name,description] of [['register','Apply for a BMV pilot account'],['link-pilot','Link your existing BMAcars account'],['registration-status','Check registration and privately retrieve your initial credentials']]){
  await discord(`applications/${c.app}/guilds/${c.guild}/commands`,'POST',{name,description,type:1});
 }
}
export async function checkConfiguration(){
 const c=cfg();
 if(!c.management.length || c.management.includes(c.pilot) || c.management.includes(c.guild) || c.pilot===c.guild)throw new Error('Invalid roles');
 const bot=await discord('users/@me');
 const [channel,roles,me]=await Promise.all([discord(`channels/${c.channel}`),discord(`guilds/${c.guild}/roles`),discord(`guilds/${c.guild}/members/${bot.id}`)]);
 if(channel.guild_id!==c.guild || channel.type!==0)throw new Error('Private guild text channel required');
 const view=1024n,manage=268435456n,admin=8n;
 const everyone=channel.permission_overwrites.find(o=>o.id===c.guild);
 if(!everyone || !(BigInt(everyone.deny)&view))throw new Error('Channel must deny everyone');
 for(const o of channel.permission_overwrites)if((BigInt(o.allow)&view) && ![...c.management,me.user.id].includes(o.id))throw new Error('Unexpected channel visibility');
 for(const id of [...c.management,me.user.id])if(!channel.permission_overwrites.some(o=>o.id===id && (BigInt(o.allow)&view)))throw new Error('Management and bot must have explicit channel access');
 const pilot=roles.find(r=>r.id===c.pilot);
 const own=roles.filter(r=>me.roles.includes(r.id)||r.id===c.guild);
 const permissions=own.reduce((p,r)=>p|BigInt(r.permissions),0n);
 if(!pilot || pilot.managed || (BigInt(pilot.permissions)&(admin|manage)) || Math.max(...own.map(r=>r.position))<=pilot.position || !(permissions&(manage|admin)))throw new Error('Unsafe role hierarchy');
}
function message(a){return {content:`BMV application ${a.id}\nApplicant: <@${a.discord_id}>\nName: ${a.nickname}\nType: ${a.kind}\nStatus: ${a.state}${a.pilot_id?` · ${a.pilot_id}`:''}${a.reason?`\nDecision: ${a.reason}`:''}`,allowed_mentions:{parse:[]},components:a.state==='pending'?[{type:1,components:[{type:2,style:3,label:'Approve',custom_id:`approve:${a.id}`},{type:2,style:4,label:'Reject',custom_id:`reject:${a.id}`}]}]:[]};}
export async function runInteraction(p,client=null){
 const c=cfg();if(p.guild_id!==c.guild)throw new Error('Wrong guild');
 const actor=p.actor;
 const member=await discord(`guilds/${c.guild}/members/${actor}`);
 if(p.action==='register' || p.action==='link-pilot'){
  const nickname=String(p.nickname||'').trim();if(!nickname || nickname.length>80)throw new Error('Invalid name');
  const a=await apply(actor,nickname,p.action==='register'?'new':'link',p.action==='register'?null:pilotId(p.pilot),client);
  return `Application ${a.state}. Use /registration-status for progress and credentials.`;
 }
 if(['approve','reject'].includes(p.action)){
  if(p.channel_id!==c.channel || !hasManagementRole(member.roles,c.management))throw new Error('Management permission required');
  await checkConfiguration();
  const reason=String(p.reason||'').trim();if(!reason || reason.length>300)throw new Error('Reason required');
  const a=await decide(p.application,actor,p.action==='approve',reason,client);
  return `Application ${a.state}. The applicant can use /registration-status.`;
 }
 throw new Error('Unknown action');
}
export async function getStatus(actor){
 const c=cfg();await discord(`guilds/${c.guild}/members/${actor}`);
 const {application:a,token,locked}=await status(actor);
 if(!a)return 'No application yet. Use /register or /link-pilot.';
 if(locked)return 'Too many linking attempts. Wait 15 minutes.';
 if(token)return `Verify ownership of ${a.pilot_id}: ${env('LINK_PAGE_URL')}#${token}\nPrivate link, valid for 15 minutes. Use your current BMAcars password.`;
 if(a.kind==='new' && a.state==='complete')return `Username: ${a.pilot_id}\nInitial password: ${standardPassword(a.pilot_id)}\nIf you changed your password, use your changed password. Pilot-role assignment is automatic.`;
 return `Application: ${a.state}${a.pilot_id?` · ${a.pilot_id}`:''}${a.reason?` · ${a.reason}`:''}${a.state==='approved'?' · Account processing is automatic. Check again shortly.':''}`;
}
export async function processQueued(id){
 // Transaction-level advisory lock prevents concurrent execution; disconnect releases it.
 return tx(async c=>{
  const {rows:[lock]}=await c.query('select pg_try_advisory_xact_lock(hashtextextended($1,2)) as acquired',[id]);
  if(!lock.acquired)return 'Already processing. Use /registration-status.';
  const {rows:[item]}=await c.query("select * from bmv_registration.interactions where id=$1 and state='pending'",[id]);
  if(!item)return 'Already recorded. Use /registration-status.';
  const result=await runInteraction(item.payload,c);
  await c.query("update bmv_registration.interactions set state='done' where id=$1",[id]);
  return result;
 });
}
export async function work(){
 await workWebsite();
 const deadline=Date.now()+35000;
 const {rows:items}=await pool.query("select id from bmv_registration.interactions where state='pending' and retry_at<=now() order by retry_at limit 5");
 for(const item of items){
  if(Date.now()>deadline)return;
  await pool.query("update bmv_registration.interactions set retry_at=now()+interval '1 minute',attempts=attempts+1 where id=$1",[item.id]);
  try{await processQueued(item.id);}catch(e){console.error('Interaction retry',item.id,e.name);}
 }
 await checkConfiguration();
 const c=cfg();
 const {rows}=await pool.query(`with due as (select id from bmv_registration.applications where application_source<>'website' and retry_at<=now() and
 (message_id is null or message_state is distinct from state or (kind='new' and state='approved') or (state='complete' and role_assigned_at is null) or (state='complete' and reviewed_at>=$1 and not exists(select 1 from bmv_registration.audit e where e.application_id=applications.id and e.event='welcome_dm_attempted')))
 order by retry_at limit 3 for update skip locked)
 update bmv_registration.applications a set retry_at=now()+interval '2 minutes' from due where a.id=due.id returning a.*`,[welcomeStart]);
 for(const a of rows){
  if(Date.now()>deadline)return;
  try{
   if(a.kind==='new' && a.state==='approved' && await provision(a.id))a.state='complete';
   if(a.state==='complete')await deliverWelcome(a,{tx,audit,discord});
   if(!a.message_id){
    const m=await discord(`channels/${c.channel}/messages`,'POST',{...message(a),nonce:a.id.replaceAll('-','').slice(0,24),enforce_nonce:true});
    await pool.query('update bmv_registration.applications set message_id=$2,message_state=$3 where id=$1 and message_id is null',[a.id,m.id,a.state]);
   }else if(a.message_state!==a.state){
    try{await discord(`channels/${c.channel}/messages/${a.message_id}`,'PATCH',message(a));
      await pool.query('update bmv_registration.applications set message_state=$2 where id=$1',[a.id,a.state]);
    }catch(e){if(e.status===404)await pool.query('update bmv_registration.applications set message_id=null where id=$1',[a.id]);else throw e;}
   }
   if(a.state==='complete' && !a.role_assigned_at){
    await discord(`guilds/${c.guild}/members/${a.discord_id}/roles/${c.pilot}`,'PUT');
    await tx(async db=>{const r=await db.query('update bmv_registration.applications set role_assigned_at=now() where id=$1 and role_assigned_at is null returning id',[a.id]);if(r.rowCount)await audit(db,a.id,'bot','pilot_role_assigned');});
   }
  }catch(e){console.error('Application retry',a.id,e.name);}
 }
}
// Website applications never create approval messages or change Discord roles.
export async function workWebsite(){
 const {rows}=await pool.query(`with due as (select id from bmv_registration.applications a where application_source='website' and retry_at<=now() and
 (state='approved' or (state='complete' and not exists(select 1 from bmv_registration.audit e where e.application_id=a.id and e.event='welcome_dm_attempted')))
 order by retry_at limit 3 for update skip locked)
 update bmv_registration.applications a set retry_at=now()+interval '2 minutes' from due where a.id=due.id returning a.*`);
 for(const a of rows){try{
  if(a.state==='approved' && await provision(a.id))a.state='complete';
  if(a.state==='complete')await deliverWelcome(a,{tx,audit,discord});
 }catch(e){console.error('Website registration retry',a.id,e.name);}}
}
