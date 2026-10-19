const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Joshu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict'), http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://localhost').pathname);if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let mode='normal'; const rows=[{pilot_number:'BMA001',display_name:'Test <img src=x onerror=alert(1)>',rank:'Captain',status:'Active',completed_flights:2,flight_hours:2.5,last_flight:'2026-10-18',vatsim_flights:null},{pilot_number:'BMA002',display_name:'Second pilot',rank:null,status:'On leave',completed_flights:0,flight_hours:0,last_flight:null,vatsim_flights:0}];
 await page.route('**/rest/v1/public_pilot_roster?*',route=>{const u=new URL(route.request().url());assert.equal(route.request().method(),'GET');assert.equal(u.searchParams.get('select').split(',').length,8);return mode==='error'?route.fulfill({status:503,body:'Unavailable'}):route.fulfill({json:mode==='empty'?[]:rows.slice(Number(u.searchParams.get('offset')),Number(u.searchParams.get('offset'))+1)});});
 const url=`http://127.0.0.1:${server.address().port}/roster`;
 await page.goto(url);await page.getByText('2 pilots shown',{exact:true}).waitFor();
 assert.equal(await page.locator('#roster-body tr').count(),2);assert.equal(await page.locator('#roster-body img').count(),0);
 await page.locator('#roster-search').fill('bma002');assert.equal(await page.locator('#roster-body tr').count(),1);
 await page.locator('#roster-search').fill('missing');await page.getByText('No pilots match your search.').waitFor();
 await page.locator('#roster-search').fill('');await page.locator('#roster-status').selectOption('Active');assert.equal(await page.locator('#roster-body tr').count(),1);
 await page.locator('#roster-status').selectOption('');
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);const links=await page.locator('.nav-links a').first().boundingBox();assert(links);if(width===390||width===1440)await page.screenshot({path:path.resolve(__dirname,`../../roster-${width}.png`),fullPage:true});}
 mode='error';await page.reload();await page.getByText('The pilot roster is temporarily unavailable. Please try again.').waitFor();
 mode='empty';await page.getByRole('button',{name:'Try again'}).click();await page.getByText('No pilots are currently listed.').waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS: pagination, eight-field read-only requests, XSS escaping, search, statuses, empty/error/retry, 1440/768/390/320px layouts.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

