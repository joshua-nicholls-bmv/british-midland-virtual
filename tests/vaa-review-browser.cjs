const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Joshu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const bootstrap=`
const el=id=>document.getElementById(id),date=v=>new Date(v).toISOString(),esc=v=>String(v),table=()=>{};
let ready=true,busy=false,snapshot=Date.now(),selected=0,assessed=[];
const client={rpc:async(name,args)=>{window.saved={name,args};return {error:null};}};
async function refresh(){}
function fixture(reason){
 const row={id:'test-flight',pilot_id:'pilot',pilot_code:'BMA0006',nickname:'Steve J',cid:'1621484',atc_callsign:'BMR46AS',actual_callsign:'BMR46AS',flight_number:'BMR561',atc_provider:'VATSIM',departure:'EGBB',arrival:'EGPH',completed:Date.parse('2026-11-16T21:13:00Z'),created_at:'2026-11-16T21:16:00Z',reasons:[reason]};
 reviewCases.set(row.id,{row,issues:[reason],history:[],active:true,details:{issues:[reason]}});
 el('reviewFlight').replaceChildren(new Option('Steve J · BMR561',row.id));el('reviewFlight').value=row.id;openReview();
}
document.addEventListener('DOMContentLoaded',()=>{el('authGate').classList.add('hidden');el('dashboardApp').classList.remove('hidden');fixture('Invalid or incomplete flight timestamps');});
`;
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='bmv.test')return r.fulfill({body:'',contentType:'text/javascript'});if(u.pathname==='/management/vaa.js')return r.fulfill({body:bootstrap,contentType:'text/javascript'});const f=path.join(root,u.pathname);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html'});});
await page.goto('http://bmv.test/management/vaa.html');
for(const issue of ['Invalid or incomplete flight timestamps','Duplicate flight/session','Management review outstanding','Flight status not eligible','Missing ICAO route','Pilot record unavailable','Session belongs to a different pilot','Midland Aero Club operation excluded']){
 await page.evaluate(issue=>fixture(issue),issue);assert(await page.locator('#reviewVerify').isEnabled());assert(await page.locator('#reviewReject').isEnabled());
}
await page.evaluate(()=>fixture('Invalid or incomplete flight timestamps'));
await page.locator('#reviewNote').fill('Reviewed independent StatSim flight evidence; original ACARS timestamps conflict.');
await page.locator('#reviewVerify').click();assert((await page.locator('#reviewStatus').innerText()).includes('Enter independent evidence'));
await page.locator('#reviewSource').fill('https://statsim.net/flights/detail/31390957');
await page.locator('#reviewCompleted').fill('2026-11-16T21:13');
await page.locator('#reviewBlockMinutes').fill('76');
await page.locator('#reviewVerify').click();await page.waitForFunction(()=>window.saved?.args.action==='verified');
const saved=await page.evaluate(()=>saved);assert.equal(saved.name,'review_vaa_discrepancy');assert.equal(saved.args.completed_at,'2026-11-16T21:13:00.000Z');assert.equal(saved.args.block_minutes,76);assert.deepEqual(saved.args.discrepancies,['Invalid or incomplete flight timestamps']);
assert((await page.locator('#reviewStatus').innerText()).includes('approved'));
await page.locator('#reviewSource').fill('');await page.locator('#reviewCid').fill('');await page.locator('#reviewCall').fill('');await page.locator('#reviewCompleted').fill('');await page.locator('#reviewNote').fill('Evidence does not support this flight.');
await page.locator('#reviewReject').click();await page.waitForFunction(()=>window.saved?.args.action==='rejected');assert.equal((await page.evaluate(()=>saved)).args.completed_at,null);
assert.deepEqual(errors,[]);console.log('PASS: all discrepancy categories can be approved/rejected; approval validates evidence; UTC date and StatSim minutes sent correctly; rejection needs only notes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});


