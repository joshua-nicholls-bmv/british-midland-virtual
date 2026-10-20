import {standardPassword} from './core.js';
// Only applications approved after this release receive automatic messages.
export const welcomeStart='2026-10-15T12:59:42Z';
export function welcomeMessage(a){
 if(a.application_source==='website')return {allowed_mentions:{parse:[]},content:`✈️ **WELCOME TO BRITISH MIDLAND VIRTUAL!**\nYour application has been approved and your account is ready.\n\n**Username:** ${a.pilot_id}\n**Initial password:** ||${standardPassword(a.pilot_id)}||\n\nOpen British Midland ACARS and sign in with these details. Keep them private. Contact management if you need help. Welcome aboard!`};
 if(a.kind==='link')return {content:`✈️ Your British Midland Virtual account **${a.pilot_id}** is now linked to Discord.\nYour existing password, flight history and account details are unchanged. Welcome aboard!`,allowed_mentions:{parse:[]}};
 if(!/^BMA\d{4}$/.test(a.pilot_id))throw new Error('Invalid welcome pilot ID');
 return {allowed_mentions:{parse:[]},content:`✈️ **WELCOME TO BRITISH MIDLAND VIRTUAL!**\nYour application has been approved and your account is ready.\n\n🔐 **YOUR ACARS LOGIN**\n**Username:** ${a.pilot_id}\n**Initial password:** ||${standardPassword(a.pilot_id)}||\n\nOpen British Midland ACARS and sign in with these details. Keep them private.\nYou can also retrieve your initial details privately with /registration-status.`,embeds:[{title:'🖥️ BM ACARS — FEATURES',color:6714,description:'Our custom-built British Midland ACARS is in full service, connecting pilots, aircraft and operations.',fields:[
 {name:'✈️ Flight Planning & Dispatch',value:'Choose your route and an available fleet aircraft, with scheduled flight numbers populated automatically. Open SimBrief with the aircraft profile and registration prefilled, then import your plan.'},
 {name:'📋 Pilot Briefings',value:'Review routing, block time, planned weights and fuel, plus SimBrief airport weather, METARs, TAFs and original NOTAMs alongside management notices. Reopen your briefing during flight.'},
 {name:'📡 Live Tracking & Operations',value:'Connect to MSFS for automatic phase detection from preflight to parked. Follow altitude, ground speed, fuel and flight progress, and view Live Operations inside ACARS.'},
 {name:'🎧 ATC Provider Recording',value:'Record Offline, SayIntentions, VATSIM, BeyondATC, IVAO or another provider. Save your VATSIM ID in Settings for VATSIM flight reports.'},
 {name:'📊 Flight Reports & Statistics',value:'Review block and airborne time, landings, fuel and go-arounds, PIREPs, flight history, monthly activity and aircraft statistics, with local backups, flight recovery and pending-report retries.'},
 {name:'🔧 Fleet & Technical Operations',value:'Check aircraft availability, locations and maintenance status. Plan custom BMA Tech Ops and ECV flights using available fleet aircraft.'},
 {name:'👥 Pilot Identity & Community',value:'See your pilot ID, name and rank in the crew card. Explore the roster and weekly leaderboards, with gold, silver and bronze markers for leading places.'},
 {name:'📅 Events & Group Flights',value:'Browse BM, ECV and BMG events, register attendance, see who is joining and read pilot briefings.'},
 {name:'📚 BM & ECV Pilot Portals',value:'Access SOPs, checklists and aircraft-grouped liveries. The ECV portal includes cargo guidance, fleet information and progression advice.'},
 {name:'🔔 Notifications & Discord',value:'Receive announcements, event updates and rank-change notifications in your inbox. Connected Discord notifications share flight plans, tracking and completion updates.'},
 {name:'🛠️ Management Tools — authorised managers',value:'Manage events, ranks and roster titles; publish operations notices and announcements to BMA pilots, ECV pilots or everyone.'},
 {name:'SAYINTENTIONS — VA INTEGRATION',value:'10% discount code: **SIVAyT6nHEyL**\nOpen SayIntentions → Settings → Virtual Airline → British Midland for our custom announcements, branding and supported UI integrations.'},
 {name:'Plan. Brief. Fly. Track. Review.',value:'Any questions? Contact BMV management in Discord. Enjoy your flights and welcome aboard! ✈️'}
 ],footer:{text:'🇬🇧 British Midland Virtual • The Heart of Britain. Connected to the World'}}]};
}
export async function deliverWelcome(a,{tx,audit,discord}){
 // Commit the attempt before sending: a crash or ambiguous timeout must not resend credentials.
 const claimed=await tx(async db=>{
  await db.query('select pg_advisory_xact_lock(hashtextextended($1,3))',[a.id]);
  const {rows}=await db.query("select id from bmv_registration.applications a where id=$1 and state='complete' and reviewed_at>=$2 and not exists(select 1 from bmv_registration.audit e where e.application_id=a.id and e.event='welcome_dm_attempted')",[a.id,welcomeStart]);
  if(!rows.length)return false;
  await audit(db,a.id,'bot','welcome_dm_attempted');return true;
 });
 if(!claimed)return;
 try{
  const channel=await discord('users/@me/channels','POST',{recipient_id:a.discord_id});
  const message=await discord(`channels/${channel.id}/messages`,'POST',{...welcomeMessage(a),nonce:('w'+a.id.replaceAll('-','')).slice(0,25),enforce_nonce:true});
  await tx(db=>audit(db,a.id,'bot','welcome_dm_sent',{message_id:message.id}));
 }catch(e){
  // Never persist credentials or raw API error bodies. Status remains the private fallback.
  await tx(db=>audit(db,a.id,'bot','welcome_dm_unconfirmed',{status:Number.isInteger(e.status)?e.status:null,fallback:a.application_source==='website'?'website-management':'registration-status'}));
 }
}
