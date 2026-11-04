(() => {
 const svg=(path)=>{const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('aria-hidden','true');const p=document.createElementNS(n.namespaceURI,'path');p.setAttribute('d',path);n.append(p);return n;};
 const paths=['M3 4h18v16H3z M3 9h18 M9 9v11','M4 7h16v13H4z M8 7V4h8v3','M3 12h18 M12 3l4 9-4 9-4-9z','M8 7a4 4 0 108 0 4 4 0 00-8 0 M4 21v-3a8 8 0 0116 0v3','M12 3a9 9 0 100 18 9 9 0 000-18 M3 12h18 M12 3c5 5 5 13 0 18 M12 3c-5 5-5 13 0 18'];
 document.querySelectorAll('.management-navigation .nav-symbol').forEach((n,i)=>n.replaceChildren(svg(paths[i%paths.length])));
 document.querySelectorAll('.stat-card').forEach((card,i)=>{const label=card.querySelector('.stat-label');if(label){const icon=svg(paths[i%paths.length]);icon.classList.add('stat-icon');label.prepend(icon);}});
 const role=document.getElementById('pilotRole'),hero=document.querySelector('.pilot-profile-hero');
 if(role&&hero){const image=document.createElement('img');image.className='profile-rank-insignia';image.hidden=true;hero.append(image);const update=()=>{const rank=role.textContent.trim().toLowerCase().replaceAll(' ','-');if(['cadet','first-officer','senior-first-officer','captain','management'].includes(rank)){image.src='/assets/images/ranks/'+rank+'.png';image.alt=role.textContent.trim()+' rank';image.hidden=false;}};new MutationObserver(update).observe(role,{childList:true,subtree:true,characterData:true});update();}
})();
