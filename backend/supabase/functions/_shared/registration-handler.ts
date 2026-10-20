import {verifyDiscord,json,ephemeral} from './security.js';
import {pool} from './db.js';
import {cfg,getStatus,processQueued,work} from './discord.js';
import {hasManagementRole} from './core.js';
import {setting} from './settings.js';
declare const EdgeRuntime: {waitUntil(promise:Promise<unknown>):void};
const field=(id:string,label:string,max=80)=>({type:1,components:[{type:4,custom_id:id,label,style:1,required:true,max_length:max}]});
export async function registrationHandler(req:Request){
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const body=await req.text();if(body.length>20000)return new Response('Too large',{status:413});
 if(!await verifyDiscord(body,req.headers.get('x-signature-ed25519'),req.headers.get('x-signature-timestamp'),setting('DISCORD_PUBLIC_KEY')))return new Response('Invalid signature',{status:401});
 try{
  const i=JSON.parse(body);
  if(i.type===1)return json({type:1});
  const c=cfg();
  if(i.application_id!==c.app || i.guild_id!==c.guild || !i.member?.user?.id)return json(ephemeral('Use this command in the BMV server.'));
  if(Deno.env.get('BMV_WEBSITE_ONLY')==='true')return json(ephemeral('Apply at https://britishmidlandvirtual.co.uk/join.html. Management reviews applications on the website. For an existing account, contact management.'));
  if(i.type===2 && ['register','link-pilot'].includes(i.data.name))return json({type:9,data:{custom_id:i.data.name,title:'BMV pilot registration',components:[field('nickname','Pilot display name'),...(i.data.name==='link-pilot'?[field('pilot','Existing BMA number',7)]:[])]}});
  if(i.type===3 && /^(approve|reject):[a-f0-9-]{36}$/.test(i.data.custom_id)){
   if(i.channel_id!==c.channel || !hasManagementRole(i.member.roles,c.management))return json(ephemeral('BMV Management permission required.'));
   return json({type:9,data:{custom_id:i.data.custom_id,title:'Management decision',components:[field('reason','Decision reason',300)]}});
  }
  let queued=false;
  if(i.type===5){
   const values=Object.fromEntries(i.data.components.flatMap((r:any)=>r.components).map((v:any)=>[v.custom_id,v.value]));
   const [action,application]=i.data.custom_id.split(':');
   if(!['register','link-pilot','approve','reject'].includes(action))return json(ephemeral('Unknown command.'));
   if(['approve','reject'].includes(action) && (i.channel_id!==c.channel || !hasManagementRole(i.member.roles,c.management)))return json(ephemeral('BMV Management permission required.'));
   // Durable before acknowledgment. No Discord webhook token or password is persisted.
   await pool.query({text:'insert into bmv_registration.interactions(id,payload) values($1,$2) on conflict(id) do nothing',values:[i.id,{actor:i.member.user.id,guild_id:i.guild_id,channel_id:i.channel_id,action,application,nickname:values.nickname,pilot:values.pilot,reason:values.reason}],query_timeout:1500});
   queued=true;
  }else if(!(i.type===2 && i.data.name==='registration-status'))return json(ephemeral('Unknown command.'));
  EdgeRuntime.waitUntil((async()=>{
   let content;
   try{content=queued?await processQueued(i.id):await getStatus(i.member.user.id);}catch{content='Request recorded or processing failed. Use /registration-status; contact management if it persists.';}
   try{await fetch(`https://discord.com/api/v10/webhooks/${c.app}/${i.token}/messages/@original`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({content,allowed_mentions:{parse:[]}}),signal:AbortSignal.timeout(8000)});}catch{console.error('Private reply unavailable');}
   if(queued)try{await work();}catch{console.error('Worker deferred to cron');}
  })());
  return json({type:5,data:{flags:64}});
 }catch{return json(ephemeral('Unable to record request. Please retry.'));}
}
