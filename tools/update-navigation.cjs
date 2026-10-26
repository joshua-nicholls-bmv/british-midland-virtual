// Generate the same static, no-JavaScript-compatible navigation on each public page.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const pages=['index.html','vision.html','midland-aero-club.html','group.html','fleet.html','network.html','operations.html','news.html','article.html','join.html','roster/index.html','events/index.html','privacy/index.html'];
for(const page of pages){
 const current='/'+page;
 const link=(href,title,extra='')=>{const active=href===current || href+'/index.html'===current || href==='/news.html'&&page==='article.html';return `<a href="${href}"${active?` class="active${extra?' '+extra:''}" aria-current="${page==='article.html'?'location':'page'}"`:extra?` class="${extra}"`:''}>${title}</a>`;};
 const group=(title,items)=>`<li><details class="bmv-dropdown"><summary${items.some(([href])=>href===current||href+'/index.html'===current)?' class="active"':''}>${title}</summary><ul class="bmv-submenu">${items.map(([href,label])=>`<li>${link(href,label)}</li>`).join('')}</ul></details></li>`;
 const header=`<header class="site-header bmv-header">
    <nav class="bmv-nav container" aria-label="Main navigation">
        <a class="bmv-brand" href="/" aria-label="British Midland Virtual home"${page==='index.html'?' aria-current="page"':''}><img src="/assets/images/logo.png" alt="British Midland Virtual"></a>
        <button class="bmv-menu-toggle" type="button" aria-expanded="false" aria-controls="bmv-primary-menu"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/></svg><span>Menu</span></button>
        <ul class="bmv-primary" id="bmv-primary-menu">
            ${group('Our Airline',[['/vision.html','Our Vision'],['/midland-aero-club.html','Midland Aero Club'],['/group.html','British Midland Group']])}
            ${group('Flight Operations',[['/fleet.html','Fleet'],['/network.html','Route Network'],['/operations.html','Live Operations']])}
            ${group('Community',[['/roster','Pilot Roster'],['/events','Events']])}
            <li>${link('/news.html','News')}</li>
            <li>${link('/join.html','Join British Midland','bmv-join')}</li>
        </ul>
    </nav>
</header>`;
 const file=path.join(root,page);let s=fs.readFileSync(file,'utf8');const nl=(s.match(/\r\n/g)||[]).length>(s.match(/(?<!\r)\n/g)||[]).length?'\r\n':'\n';
 const pattern=/<header class="site-header(?: bmv-header)?">[\s\S]*?<\/header>/;
 if(!pattern.test(s))throw new Error('Header missing: '+page);
 s=s.replace(pattern,header.replace(/\r?\n/g,nl));
 if(!s.includes('/assets/css/navigation.css'))s=s.replace('</head>',`<link rel="stylesheet" href="/assets/css/navigation.css?v=1">${nl}<script src="/assets/js/navigation.js?v=1" defer></script>${nl}</head>`);
 fs.writeFileSync(file,s);
}
console.log(`Updated navigation on ${pages.length} public pages.`);
