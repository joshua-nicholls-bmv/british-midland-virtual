'use strict';
let network, map, layers;
const lines = new Map();
const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
function drawRoutes(filter='all') {
 map.closePopup(); layers.clearLayers(); lines.clear();
 const routes=network.routes.filter(r=>filter==='all'||r.class===filter), bounds=[], airports=new Map();
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
 routes.forEach(r=>{
  const h=network.hubs[r.origin],start=[h.lat,h.lon],end=[r.lat,r.lon],colour=network.classes[r.class].colour;
  const strength=r.class==='pioneer'?.16:.07,control=[(start[0]+end[0])/2+(end[1]-start[1])*strength,(start[1]+end[1])/2-(end[0]-start[0])*strength];
  const points=Array.from({length:41},(_,i)=>{const t=i/40;return [0,1].map(a=>(1-t)**2*start[a]+2*(1-t)*t*control[a]+t*t*end[a]);});
  const line=L.polyline(points,{color:colour,weight:3,opacity:.8,dashArray:r.class==='pioneer'?'10 8':null}).addTo(layers);
  line.bindPopup(`<strong>${h.name} ↔ ${r.city}</strong><br>${network.classes[r.class].name} Class<br>${r.flight} / ${r.returnFlight}<br>${r.aircraft}<br>${r.time} outbound · ${r.returnTime} return`);
  lines.set(r.flight,line);bounds.push(start,end);
  if(!airports.has(r.iata))airports.set(r.iata,[]);airports.get(r.iata).push(r);
 });
 airports.forEach(group=>{
  const r=group[0],content=document.createElement('div'),heading=document.createElement('strong');heading.textContent=r.city;content.appendChild(heading);
  group.forEach(route=>{const b=document.createElement('button');b.type='button';b.className='map-route-button';b.style.display='block';b.textContent=`${network.hubs[route.origin].name} · ${route.flight} / ${route.returnFlight}`;b.addEventListener('click',()=>{document.querySelectorAll('.selected').forEach(c=>c.classList.remove('selected'));const card=document.getElementById('card-'+route.flight);card.classList.add('selected');card.scrollIntoView({behavior:smooth(),block:'center'});});content.appendChild(b);});
  L.circleMarker([r.lat,r.lon],{radius:6,color:'#fff',weight:2,fillColor:network.classes[r.class].colour,fillOpacity:1}).addTo(layers).bindTooltip(`${r.city} (${r.iata})`).bindPopup(content);
 });
 [...new Set(routes.map(r=>r.origin))].forEach(code=>{const h=network.hubs[code];L.circleMarker([h.lat,h.lon],{radius:9,color:'#fff',weight:3,fillColor:'#001a3a',fillOpacity:1}).addTo(layers).bindTooltip(`${h.name} (${code})`,{permanent:filter==='foundry'||code==='BHX',direction:code==='EMA'?'top':'bottom',className:'hub-label'});});
 map.fitBounds(bounds,{padding:[35,35],maxZoom:7,animate:false});
 document.getElementById('map-status').textContent=`${routes.length} routes shown · One line per hub–destination pair. Select an airport to explore its routes.`;
}
function buildCards(){
 network.routes.forEach(r=>{
  const h=network.hubs[r.origin],c=network.classes[r.class],card=document.createElement('article');
  card.id='card-'+r.flight;card.className=`destination-card ${r.class}-card`;
  card.innerHTML=`<span class="destination-status class-badge">${c.name} Class</span><div class="route-card-flight">${r.flight} / ${r.returnFlight}</div><h3>${r.city}</h3><p class="airport">${r.origin} ↔ ${r.iata}</p><p class="destination-description">${h.name} to ${r.city}.${r.class==='foundry'?' Your choice of Fokker 100 or ATR 72.':''}</p><div class="destination-info"><div><span>Aircraft</span><strong>${r.aircraft}</strong></div><div><span>Estimated block time</span><strong>${r.time}${r.time===r.returnTime?' each way':' out / '+r.returnTime+' return'}</strong></div><div><span>Outbound · ${r.origin} → ${r.iata}</span><strong>${r.flight}</strong></div><div><span>Return · ${r.iata} → ${r.origin}</span><strong>${r.returnFlight}</strong></div></div><button type="button" class="map-route-button" aria-label="Show ${h.name} to ${r.city} on map">View on map</button>`;
  card.querySelector('button').addEventListener('click',()=>{if(!map)return;drawRoutes(r.class);map.fitBounds(lines.get(r.flight).getBounds(),{padding:[40,40],maxZoom:8,animate:false});lines.get(r.flight).openPopup();document.getElementById('network-map').scrollIntoView({behavior:smooth(),block:'center'});});
  document.getElementById(r.class==='foundry'?`foundry-${r.origin}-grid`:`${r.class}-grid`).appendChild(card);
 });
}
async function buildNetwork(){
 const status=document.getElementById('map-status');
 try{const response=await fetch('assets/data/network.json?v=11');if(!response.ok)throw Error('Route data unavailable');network=await response.json();buildCards();}
 catch(error){status.textContent='The route schedule could not be loaded. Please refresh to try again.';console.error(error);return;}
 if(typeof L==='undefined'){status.textContent='The interactive map is unavailable. All route details are listed below.';document.querySelectorAll('.map-route-button,[data-filter]').forEach(b=>b.disabled=true);return;}
 map=L.map('network-map',{scrollWheelZoom:false,minZoom:2,maxZoom:18});
 // Bundled public-domain outlines keep the route map independent of tile API keys.
 try {
  const response=await fetch('assets/data/network-land.geojson');
  if(!response.ok)throw Error('Map background unavailable');
  map.createPane('land');map.getPane('land').style.zIndex=200;
  L.geoJSON(await response.json(),{pane:'land',interactive:false,style:{color:'#c5d0d9',weight:1,fillColor:'#f4f5f3',fillOpacity:1}}).addTo(map);
  map.attributionControl.addAttribution('Made with <a href="https://www.naturalearthdata.com/">Natural Earth</a>');
 } catch(error) {console.warn(error.message);}
 layers=L.layerGroup().addTo(map);drawRoutes();
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>drawRoutes(b.dataset.filter)));
}
document.addEventListener('DOMContentLoaded',buildNetwork);
