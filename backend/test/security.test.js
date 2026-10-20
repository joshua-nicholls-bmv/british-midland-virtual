import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDiscord} from '../supabase/functions/_shared/security.js';
test('Discord signatures reject tampering, stale requests and malformed inputs',async()=>{
 const pair=await crypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']);
 const hex=buffer=>Buffer.from(buffer).toString('hex');
 const publicKey=hex(await crypto.subtle.exportKey('raw',pair.publicKey));
 const timestamp=String(Math.floor(Date.now()/1000)),body='{"type":1}';
 const signature=hex(await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(timestamp+body)));
 assert.equal(await verifyDiscord(body,signature,timestamp,publicKey),true);
 assert.equal(await verifyDiscord(body+' ',signature,timestamp,publicKey),false);
 assert.equal(await verifyDiscord(body,signature,timestamp,publicKey,Date.now()+600000),false);
 assert.equal(await verifyDiscord(body,null,timestamp,publicKey),false);
 assert.equal(await verifyDiscord(body,signature,'NaN',publicKey),false);
});
