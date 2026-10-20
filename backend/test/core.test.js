import test from 'node:test';
import assert from 'node:assert/strict';
import {canReview,pilotId,authEmail,standardPassword,newToken,hashToken,configuration} from '../supabase/functions/_shared/core.js';
const config={guild:'g',channel:'c',management:['coo','ceo']};
const request={guildId:'g',channelId:'c',roles:['coo'],actorId:'manager',applicantId:'pilot'};
test('all management members can review; unrelated roles and contexts cannot',()=>{
  assert.equal(canReview(request,config),true);
  assert.equal(canReview({...request,roles:['ceo']},config),true);
  assert.equal(canReview({...request,roles:['cadet']},config),false);
  for(const change of [{guildId:'other'},{channelId:'public'},{roles:['admin']},{actorId:'pilot'}])
    assert.equal(canReview({...request,...change},config),false);
});
test('BMAcars internal address contract',()=>{
  assert.equal(authEmail(pilotId(' bma0042 ')),'bma0042@auth.britishmidlandvirtual.internal');
  for(const value of ['BMA10000','BMA42','BMA0042@example.com','BMA0001\nBMA0002'])assert.throws(()=>pilotId(value));
});
test('setup secrets are high entropy and only digests are stored',()=>{
  const a=newToken(),b=newToken();assert.match(a,/^[A-Za-z0-9_-]{43}$/);assert.notEqual(a,b);
  assert.equal(hashToken(a).length,64);assert.notEqual(hashToken(a),a);assert.equal(hashToken(a),hashToken(a));
});
test('standard password follows the allocated uppercase BMA number',()=>{
  assert.equal(standardPassword('BMA0043'),'BMA0043!');
  assert.equal(standardPassword('bma0099'),'BMA0099!');
  assert.throws(()=>standardPassword('BMA43'));
});
test('configuration fails closed',()=>assert.throws(()=>configuration({}),/Missing/));

