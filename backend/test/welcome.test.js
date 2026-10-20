import test from 'node:test';
import assert from 'node:assert/strict';
import {welcomeMessage,deliverWelcome} from '../supabase/functions/_shared/welcome.js';
const applicant={id:'00000000-0000-0000-0000-000000000001',kind:'new',pilot_id:'BMA0043',discord_id:'123456789012345678'};
test('welcome fills credentials, respects Discord limits and keeps linked passwords private',()=>{
 const m=welcomeMessage(applicant);assert.match(m.content,/BMA0043!/);assert.ok(m.content.length<=2000);
 let total=0;for(const e of m.embeds){total+=(e.title||'').length+(e.description||'').length+(e.footer?.text||'').length;assert.ok(e.fields.length<=25);for(const f of e.fields){assert.ok(f.value.length<=1024);assert.ok(f.name.length<=256);total+=f.name.length+f.value.length;}}assert.ok(total<=6000);
 assert.deepEqual(m.allowed_mentions,{parse:[]});
 const linked=welcomeMessage({...applicant,kind:'link'});assert.ok(!JSON.stringify(linked).includes('BMA0043!'));
});
for(const blocked of [false,true])test(`welcome single attempt, blocked=${blocked}, audit contains no password`,async()=>{
 let claimed=false;const events=[],calls=[];
 const db={query:async sql=>({rows:sql.startsWith('select id')&&!claimed?[{id:applicant.id}]:[]})};
 const dependencies={tx:async fn=>fn(db),audit:async(_db,id,actor,event,detail)=>{events.push({event,detail});if(event==='welcome_dm_attempted')claimed=true;},discord:async(path,method,body)=>{calls.push({path,body});if(blocked)throw Object.assign(new Error('blocked'),{status:403});return {id:'dm-or-message'};}};
 await deliverWelcome(applicant,dependencies);await deliverWelcome(applicant,dependencies);
 assert.equal(calls.length,blocked?1:2);assert.equal(events[0].event,'welcome_dm_attempted');assert.equal(events[1].event,blocked?'welcome_dm_unconfirmed':'welcome_dm_sent');
 assert.ok(!JSON.stringify(events).includes('BMA0043!'));assert.equal(calls[0].body.recipient_id,applicant.discord_id);
});
