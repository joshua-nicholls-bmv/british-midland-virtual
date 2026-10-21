import test from 'node:test';import assert from 'node:assert/strict';
import {validateApplication,verifyTurnstile,readBody,cors,HttpError} from '../supabase/functions/_shared/website-security.js';
const valid={nickname:'Test Pilot',discord_id:'123456789012345678',vatsim_cid:'1234567',simbrief_id:'12345',privacy_acknowledged:true,age_confirmed:true,turnstile_token:'token'};
test('validation requires no email, ignores submitted email and keeps optional fields optional and rejects invalid or missing acknowledgements',()=>{
 assert.equal('email' in validateApplication(valid),false);assert.equal('email' in validateApplication({...valid,email:'ignored@example.com'}),false);assert.equal(validateApplication({...valid,vatsim_cid:''}).vatsim_cid,null);
 for(const b of [null,[],{...valid,discord_id:'name'},{...valid,age_confirmed:'true'},{...valid,privacy_acknowledged:false},{...valid,nickname:'a\nadmin'},{...valid,turnstile_token:'x'.repeat(2049)},{...valid,simbrief_id:'username'}])assert.throws(()=>validateApplication(b),HttpError);
});
test('Turnstile requires success, exact hostname and action',async()=>{
 for(const v of [{success:false},{success:true,hostname:'evil.com',action:'pilot_join'},{success:true,hostname:'britishmidlandvirtual.co.uk',action:'other'}])await assert.rejects(()=>verifyTurnstile('token','secret',async()=>({ok:true,json:async()=>v})),HttpError);
 await verifyTurnstile('token','secret',async()=>({ok:true,json:async()=>({success:true,hostname:'britishmidlandvirtual.co.uk',action:'pilot_join'})}));
});
test('origin and body gates reject untrusted origin, missing origin, invalid JSON and oversized bodies',async()=>{
 for(const origin of ['https://evil.com','null'])assert.throws(()=>cors(new Request('https://example.com',{headers:{origin}})),HttpError);
 assert.throws(()=>cors(new Request('https://example.com')),HttpError);
 for(const body of ['{','x'.repeat(9000)])await assert.rejects(()=>readBody(new Request('https://example.com',{method:'POST',headers:{'Content-Type':'application/json'},body})),HttpError);
});
