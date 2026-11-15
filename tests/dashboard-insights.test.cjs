const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const elements = new Map();
const element = id => { if (!elements.has(id)) elements.set(id, {textContent:'',addEventListener(){}}); return elements.get(id); };
let pages = [], fail = false;
const reports = Array.from({length:1001}, (_,i)=>({id:String(i),status:'Submitted',departure:'EGBB',arrival:i<500?'LEBL':'EGPH',registration:'G-BMFB',pilot_id:'pilot-1',airborne_minutes:90}));
const client = {auth:{onAuthStateChange(){}},from(table){return {select(){return this;},gte(){return this;},lt(){return this;},order(){return this;},eq(){return this;},range(start,end){pages.push(start);return Promise.resolve(fail?{error:new Error('Unavailable')}:{data:reports.slice(start,end+1)});},maybeSingle(){assert.equal(table,'pilots');return Promise.resolve({data:{pilot_id:'BMA0001',nickname:'<script>Not HTML</script>'}});}};}};
const context = vm.createContext({console:{error(){}},window:{supabase:{createClient:()=>client}},document:{getElementById:element},Intl,Date,Map,Set});
const source = fs.readFileSync(path.join(__dirname,'../management/dashboard.js'),'utf8').replace('\ninitialiseDashboard();','\n');
vm.runInContext(source,context);
context.fixture = [
 {status:'Submitted',departure:' egbb ',arrival:'egph',registration:' g-bmfb ',pilot_id:'a',airborne_minutes:120},
 {status:'COMPLETED',departure:'EGBB',arrival:'EGPH',registration:'G-BMFB',pilot_id:'a',airborne_minutes:60},
 {status:'Submitted',departure:'EGPH',arrival:'EGBB',registration:'G-BMFX',pilot_id:'b',airborne_minutes:null},
 {status:'Aborted',departure:'EGBB',arrival:'LEBL',registration:'G-BMFX',pilot_id:'b',airborne_minutes:999},
 {status:'Submitted',departure:null,arrival:'EGPH',registration:null,pilot_id:null,airborne_minutes:0},
 {status:'Submitted',departure:'BAD',arrival:'EGBB',registration:'N/A',pilot_id:null,airborne_minutes:'bad'}
];
const result = vm.runInContext('summariseFlyingInsights(fixture)',context);
assert.equal(result.route.route,'EGBB → EGPH');assert.equal(result.route.flights,2);assert.equal(result.aircraft.key,'G-BMFB');assert.equal(result.pilot.key,'a');assert.equal(result.averageMinutes,90);assert.equal(result.timedFlights,2);
context.fixture = [{status:'Submitted',departure:'EGBB',arrival:'EGPH'},{status:'Submitted',departure:'EGBB',arrival:'LEBL'}];
assert.equal(vm.runInContext('summariseFlyingInsights(fixture).route.ties',context),2);
assert.equal(vm.runInContext('summariseFlyingInsights([]).averageMinutes',context),null);
assert.equal(vm.runInContext('summariseFlyingInsights([]).route',context),null);
(async()=>{
 await vm.runInContext('loadFlyingInsights()',context);
 assert.deepEqual(pages,[0,500,1000]);
 assert.equal(element('favouriteRoute').textContent,'EGBB → EGPH');assert(element('favouriteRouteDetail').textContent.startsWith('501 submitted flights'));
 assert.equal(element('busiestAircraft').textContent,'G-BMFB');assert.equal(element('mostActivePilot').textContent,'BMA0001');assert(element('mostActivePilotDetail').textContent.includes('<script>Not HTML</script>'));assert.equal(element('averageFlightDuration').textContent,'1h 30m');
 fail=true;await vm.runInContext('loadFlyingInsights()',context);for(const id of ['favouriteRoute','busiestAircraft','mostActivePilot','averageFlightDuration'])assert.equal(element(id).textContent,'Unavailable');
 console.log('PASS: four insights, status filtering, route direction and normalization, ties, missing durations, 1,001-row pagination, safe text rendering and error states.');
})().catch(error=>{console.error(error);process.exitCode=1;});
