from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]/'management'
groups=[('Fleet Management','⚙',[('fleet.html','Fleet / Tech Ops'),('dispatch.html','Dispatch')]),('Flight Operations','✈',[('live-operations.html','Live Operations'),('pireps.html','PIREPs'),('reviews.html','Reviews')]),('Pilots','◎',[('pilots.html','Pilot Directory'),('applications.html','Pilot Applications'),('badges.html','Special Badges')]),('VATSIM','◉',[('vaa.html','VAA Activity')])]
pages=['dashboard.html','fleet.html','dispatch.html','live-operations.html','pireps.html','pirep.html','report.html','reviews.html','pilots.html','pilot.html','applications.html','badges.html','vaa.html']
parents={'pilot.html':'pilots.html','pirep.html':'pireps.html','report.html':'pireps.html'}
def sidebar(page):
 current=parents.get(page,page)
 def link(target,label):
  selected=current==target
  return f'<a href="/management/{target}" class="nav-item'+(' active' if selected else '')+'"'+(' aria-current="'+('page' if page==target else 'location')+'"' if selected else '')+'>'+label+'</a>'
 nav=link('dashboard.html','Dashboard')
 for label,icon,items in groups:
  active=any(current==target for target,title in items)
  nav+=f'<details class="management-nav-group"'+(' open' if active else '')+f'><summary'+(' class="section-active"' if active else '')+f'><span class="nav-symbol" aria-hidden="true">{icon}</span><span>{label}</span><span class="management-chevron" aria-hidden="true">⌄</span></summary><div class="management-nav-links">'+''.join(link(*item) for item in items)+'</div></details>'
 return '<aside class="sidebar management-sidebar"><div><div class="sidebar-brand"><div class="brand-mark">BM</div><div><strong>BRITISH MIDLAND</strong><span>MANAGEMENT</span></div></div><details class="management-menu" open><summary>Management menu <span aria-hidden="true">⌄</span></summary><nav class="navigation management-navigation" aria-label="Management">'+nav+'</nav></details></div><div class="sidebar-footer"><span>BMV OPERATIONS</span><span>MANAGEMENT SYSTEM</span></div></aside>'
for page in pages:
 p=root/page;s=p.read_bytes().decode('utf-8')
 if re.search(r'<aside\b[^>]*class="[^"]*sidebar',s):
  s=re.sub(r'<aside\b[^>]*class="[^"]*sidebar[^>]*>[\s\S]*?</aside>',lambda m:sidebar(page),s,count=1)
 else:
  s=re.sub(r'<body([^>]*)>',lambda m:'<body'+m[1]+('' if 'management-standalone' in m[1] else ' class="management-standalone"')+'>'+sidebar(page),s,count=1)
 if '/management/navigation.css?v=1' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/management/navigation.css?v=1"><script src="/management/navigation.js?v=1" defer></script></head>')
 # Keep action controls in place while removing the old competing navigation.
 if page=='dispatch.html':s=re.sub(r'<nav class="dispatch-nav">[\s\S]*?</nav>','<div class="dispatch-nav"><button id="refresh">Refresh jobs</button></div>',s)
 if page=='applications.html':s=s.replace('<a href="dashboard.html">Operations Control</a> · <a href="/management/">Sign in</a> ','')
 p.write_bytes(s.encode('utf-8'))
 assert s.count('aria-label="Management"')==1,page
 assert len(re.findall(r'class="management-nav-group"',s))==4,page
 assert s.count('aria-current=')==1,page
print('Updated grouped navigation across',len(pages),'management pages.')
