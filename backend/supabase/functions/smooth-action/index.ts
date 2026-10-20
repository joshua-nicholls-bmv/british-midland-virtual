// @ts-nocheck -- Existing Tech Ops handler retained; HTTP behavior covered by integration tests.
import {registrationHandler} from '../_shared/registration-handler.ts';
import {isRegistrationInteraction} from '../_shared/registration-routing.js';
// Discord requests use Ed25519 signatures. /manage uses Supabase Auth plus
// management membership. Neither route trusts a pilot ID submitted by Discord.
const APP = '1550252275862085833';
const PUBLIC_KEY = '050535e033a7fd3dc82fcd2826ae5911b5dd90b666dfa559a874c3015836eedb';
const GUILD = '1524310750410313808';
const CHANNEL = '1550250832388165642';
const ROLE = '1550252507308228740';
const LOGO = 'https://britishmidlandvirtual.co.uk/assets/images/logo.png';
const API = 'https://discord.com/api/v10';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const origins = ['https://britishmidlandvirtual.co.uk','https://www.britishmidlandvirtual.co.uk'];
const env = name => Deno.env.get(name) || '';
const json = (body,status=200,headers={}) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json',...headers}});
const ephemeral = content => json({type:4,data:{content,flags:64,allowed_mentions:{parse:[]}}});
function secret(name) { const value=env(name); if(!value) throw new Error(`Missing server configuration: ${name}`); return value; }
async function request(url,options) {
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(10000)});
 if(!response.ok) throw new Error(`Remote request failed (${response.status}). Contact management.`);
 return response.status===204 ? null : await response.json();
}
async function rpc(name,args={},jwt=null) {
 const key=secret('SUPABASE_SERVICE_ROLE_KEY');
 const response=await fetch(`${secret('SUPABASE_URL')}/rest/v1/rpc/${name}`,{
  method:'POST',headers:{apikey:key,Authorization:`Bearer ${jwt || key}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(10000)
 });
 if(!response.ok) {
  const body=await response.json().catch(()=>({}));
  // Only controlled database exceptions are presented to the user.
  throw new Error(body.code==='P0001' ? body.message : 'Database request failed. Contact management.');
 }
 const text=await response.text();const result=text?JSON.parse(text):null;
 // PostgREST may expose composite-returning RPCs as a single-row array.
 return Array.isArray(result)&&result.length===1?result[0]:result;
}
async function getJob(id) {
 const key=secret('SUPABASE_SERVICE_ROLE_KEY');
 const rows=await request(`${secret('SUPABASE_URL')}/rest/v1/tech_ops_jobs?id=eq.${id}&select=*`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
 if(!rows.length) throw new Error('Job not found');return rows[0];
}
async function discord(path,method='GET',body=null) {
 return await request(`${API}${path}`,{method,headers:{Authorization:`Bot ${secret('DISCORD_BOT_TOKEN')}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
}
export function jobMessage(job,announce=false) {
 const open=job.status==='OPEN';
 const flight=job.flight_number?`BMA${job.flight_number}T`:'Assigned when claimed';
 return {
  content:announce?`<@&${ROLE}> Technical Operations dispatch available.`:'Technical Operations dispatch',
  allowed_mentions:announce?{parse:[],roles:[ROLE]}:{parse:[]},
  embeds:[{author:{name:'BRITISH MIDLAND VIRTUAL · TECHNICAL OPERATIONS',icon_url:LOGO},thumbnail:{url:LOGO},
   title:`${job.departure} → ${job.destination} · ${flight}`,color:6714,
   description:job.briefing,
   fields:[{name:'STATUS',value:job.status,inline:true},{name:'SUPPORT AIRCRAFT',value:job.support_registration,inline:true},{name:'GROUNDED AIRCRAFT',value:job.grounded_registration,inline:true},
    {name:'PILOT',value:job.claimed_pilot_id || 'Unassigned',inline:true},{name:'FLIGHT NUMBER',value:flight,inline:true},
    {name:'JOB REFERENCE',value:job.id,inline:false}],
   footer:{text:'British Midland Virtual · Tech Ops role and linked active pilot required',icon_url:LOGO},timestamp:job.created_at}],
  components:[{type:1,components:[{type:2,style:open?1:2,label:open?'Claim Job':job.status==='CLAIMED'?'Claimed':job.status==='COMPLETED'?'Completed':'Cancelled',custom_id:`techops:claim:${job.id}`,disabled:!open}]}]
 };
}
async function syncJob(id) {
 const job=await getJob(id);
 if(job.discord_message_id) await discord(`/channels/${CHANNEL}/messages/${job.discord_message_id}`,'PATCH',jobMessage(job));
 return job;
}
export async function verifySignature(request,raw,keyHex=PUBLIC_KEY) {
 const signature=request.headers.get('X-Signature-Ed25519') || '';
 const timestamp=request.headers.get('X-Signature-Timestamp') || '';
 if(!/^[0-9a-f]{128}$/i.test(signature) || !/^\d+$/.test(timestamp) || Math.abs(Date.now()/1000-Number(timestamp))>300) return false;
 const bytes=s=>Uint8Array.from(s.match(/../g),h=>parseInt(h,16));
 try {
  const key=await crypto.subtle.importKey('raw',bytes(keyHex),{name:'Ed25519'},false,['verify']);
  return await crypto.subtle.verify('Ed25519',key,bytes(signature),new TextEncoder().encode(timestamp+raw));
 } catch { return false; }
}
async function processClaim(interaction,id) {
 let notice;
 try {
  // Fresh role membership supplements Discord's signed interaction snapshot.
  const member=await discord(`/guilds/${GUILD}/members/${interaction.member.user.id}`);
  if(!member.roles?.includes(ROLE)) throw new Error('The Technical Operations role is required.');
  const job=await rpc('tech_ops_claim_job',{p_job_id:id,p_discord_user_id:interaction.member.user.id,p_message_id:interaction.message.id});
  notice=`You have claimed ${job.departure} → ${job.destination} in ${job.support_registration}. Your flight number is **BMA${job.flight_number}T**. The grounded aircraft remains on hold until management releases it.`;
  try { await syncJob(id); }
  catch { notice+=' Your claim is saved, but the channel message could not be updated. Ask management to use Sync Discord.'; }
 } catch(error) { notice=error.message || 'Unable to claim this job. Contact management.'; }
 try {
  await request(`${API}/webhooks/${APP}/${interaction.token}/messages/@original`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:notice,allowed_mentions:{parse:[]}})});
 } catch { console.error('Unable to deliver private Tech Ops claim result. Check job state in management.'); }
}
async function manage(request) {
 const origin=request.headers.get('Origin');
 const cors=origin && origins.includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, content-type, apikey','Access-Control-Allow-Methods':'POST, OPTIONS'}:{};
 if(origin && !origins.includes(origin)) return json({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
 if(request.method!=='POST') return json({error:'POST required'},405,cors);
 try {
  const token=(request.headers.get('Authorization') || '').replace(/^Bearer /,'');
  if(!token) return json({error:'Sign in to management'},401,cors);
  await requestUser(token);
  await rpc('bmv_fleet_manager_identity',{},token);
  const body=await request.json();
  if(!UUID.test(body.job_id || '')) return json({error:'Invalid job ID'},400,cors);
  if(body.action==='publish') {
   const job=await rpc('tech_ops_begin_publish',{p_job_id:body.job_id});
   if(job.discord_message_id) { await syncJob(job.id);return json({ok:true},200,cors); }
   const message=await discord(`/channels/${CHANNEL}/messages`,'POST',{
    ...jobMessage(job,true),nonce:job.id.replaceAll('-','').slice(0,25),enforce_nonce:true
   });
   await rpc('tech_ops_finish_publish',{p_job_id:job.id,p_message_id:message.id});
   await syncJob(job.id); // Re-read in case management closed it during publish.
   return json({ok:true},200,cors);
  }
  if(body.action==='sync') {await syncJob(body.job_id);return json({ok:true},200,cors);}
  return json({error:'Unknown action'},400,cors);
 } catch(error) {return json({error:error.message || 'Unable to complete request'},400,cors);}
}
async function requestUser(token) {
 return await request(`${secret('SUPABASE_URL')}/auth/v1/user`,{headers:{apikey:secret('SUPABASE_SERVICE_ROLE_KEY'),Authorization:`Bearer ${token}`}});
}
export async function handler(request,verify=verifySignature) {
 if(new URL(request.url).pathname.endsWith('/manage')) return await manage(request);
 if(request.method!=='POST') return new Response('POST required',{status:405});
 const raw=await request.text();
 if(!await verify(request,raw)) return new Response('Invalid signature',{status:401});
 let interaction;try{interaction=JSON.parse(raw);}catch{return new Response('Invalid JSON',{status:400});}
 if(interaction.application_id!==APP) return new Response('Wrong application',{status:403});
 if(interaction.type===1) return json({type:1});
 if(isRegistrationInteraction(interaction)) {
  return registrationHandler(new Request(request.url,{method:'POST',headers:request.headers,body:raw}));
 }
 if(interaction.guild_id!==GUILD || interaction.channel_id!==CHANNEL) return ephemeral('Use the official Tech Ops dispatch channel.');
 if(interaction.type!==3 || interaction.data?.component_type!==2) return ephemeral('Unsupported interaction.');
 if(!interaction.member?.roles?.includes(ROLE) || !interaction.member?.user?.id) return ephemeral('Only pilots with the Technical Operations role can claim jobs.');
 const id=interaction.data?.custom_id?.replace(/^techops:claim:/,'');
 if(!interaction.data?.custom_id?.startsWith('techops:claim:') || !UUID.test(id || '') || !interaction.message?.id) return ephemeral('Invalid job button.');
 // Acknowledge within Discord's 3-second deadline, then perform network/DB work.
 EdgeRuntime.waitUntil(processClaim(interaction,id));
 return json({type:5,data:{flags:64}});
}
Deno.serve(request=>handler(request));
